'use client'

import { supabase } from '../../../lib/supabase'
import { useEffect, useRef, useState } from 'react'

export default function ExamPage({ params }) {
  const examId = params.id
  const sessionId =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('sessionId')
      : null

  if (!sessionId && typeof window !== 'undefined') {
    alert('Invalid exam session')
    window.location.href = '/dashboard'
  }

  const LS_KEY = `exam_session_${sessionId}`
  const [finalScore, setFinalScore] = useState(null)
  const [exam, setExam] = useState(null)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [visited, setVisited] = useState(new Set())
  const [timeLeft, setTimeLeft] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [review, setReview] = useState(false)
  const [loading, setLoading] = useState(true)

  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const snapshotTimerRef = useRef(null)
  const captureIndexRef = useRef(0)

  useEffect(() => {
    init()
    return () => stopProctoring()
  }, [])

  async function init() {
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) {
      window.location.href = '/'
      return
    }

    const { data: examData } = await supabase
      .from('exams')
      .select('*')
      .eq('id', examId)
      .maybeSingle()

    setExam(examData)

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

    if (examData.camera_required && isMobile) {
      alert('Proctored exams must be taken on a desktop or laptop.')
      window.location.href = '/dashboard'
      return
    }

    const saved = JSON.parse(localStorage.getItem(LS_KEY) || '{}')
    setAnswers(saved.answers || {})
    setCurrentIndex(saved.currentIndex || 0)
    setVisited(new Set(saved.visited || []))
    setTimeLeft(saved.timeLeft ?? examData.duration_minutes * 60)
    setSubmitted(saved.submitted || false)

    const { data: qs, error } = await supabase.rpc(
      'get_exam_questions',
      { p_exam_id: examId }
    )

    if (error) {
      alert('Unable to load exam.')
      window.location.href = '/dashboard'
      return
    }

    setQuestions(qs || [])
    setLoading(false)
  }

  useEffect(() => {
    if (loading || submitted || timeLeft <= 0) return

    const t = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1
        persist({ timeLeft: next })
        if (next <= 0) submitExam()
        return next
      })
    }, 1000)

    return () => clearInterval(t)
  }, [timeLeft, submitted, loading])

  function persist(extra = {}) {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({
        answers,
        currentIndex,
        timeLeft,
        submitted,
        visited: Array.from(visited),
        ...extra
      })
    )
  }

  function markVisited(index) {
    setVisited(prev => {
      const u = new Set(prev)
      u.add(index)
      persist({ visited: Array.from(u) })
      return u
    })
  }

  function selectAnswer(opt) {
    const qid = questions[currentIndex].id
    const updated = { ...answers, [qid]: opt }
    setAnswers(updated)
    persist({ answers: updated })
  }

  function goToQuestion(i) {
    setCurrentIndex(i)
    markVisited(i)
    persist({ currentIndex: i })
  }

  function stopProctoring() {
    clearTimeout(snapshotTimerRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
    }
  }

  /* ================= SUBMIT (WITH ANALYTICS) ================= */

  async function submitExam() {
    if (submitted) return

    setSubmitted(true)
    persist({ submitted: true })
    stopProctoring()

    let score = 0
    let correct = 0
    let wrong = 0

    const answerRows = []

    questions.forEach(q => {
      const studentAnswer = answers[q.id]
      if (!studentAnswer) return

      const isCorrect = studentAnswer === q.correct_answer

      if (isCorrect) {
        score += exam.correct_marks || 4
        correct++
      } else {
        score -= exam.negative_marks || 1
        wrong++
      }

      answerRows.push({
        exam_session_id: sessionId,
        question_id: q.id,
        selected_answer: studentAnswer,
        correct_answer: q.correct_answer,
        is_correct: isCorrect
      })
    })

    const unattempted = questions.length - correct - wrong

    const accuracy =
      correct + wrong === 0
        ? 0
        : ((correct / (correct + wrong)) * 100).toFixed(2)

    setFinalScore({
      score,
      correct,
      wrong,
      unattempted,
      accuracy
    })

    await supabase
      .from('exam_sessions')
      .update({
        answers,
        score,
        submitted: true,
        time_left: 0
      })
      .eq('id', sessionId)

    if (answerRows.length > 0) {
      await supabase.from('exam_answers').insert(answerRows)
    }
  }

  /* ================= UI ================= */

  if (loading) return <p style={{ padding: 40 }}>Loading exam…</p>

  if (submitted) {
    return (
      <div style={styles.page}>
        <h1>✅ Exam Submitted</h1>

        {finalScore && (
          <>
            <p>Score: {finalScore.score}</p>
            <p>Correct: {finalScore.correct}</p>
            <p>Wrong: {finalScore.wrong}</p>
          </>
        )}
      </div>
    )
  }

  const q = questions[currentIndex]

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2>{exam.title}</h2>
        <div style={styles.timer}>⏱ {formatTime(timeLeft)}</div>
      </div>

      <div style={styles.card}>
        <h3>Question {currentIndex + 1}</h3>

        {/* ✅ HTML render (images supported) */}
        <div
          dangerouslySetInnerHTML={{ __html: q.question }}
        />

        {['A','B','C','D'].map(opt => (
          <label key={opt} style={styles.option}>
            <input
              type="radio"
              checked={answers[q.id] === opt}
              onChange={() => selectAnswer(opt)}
            />
            <span
              dangerouslySetInnerHTML={{
                __html:
                  q.options
                    ? q.options[opt.charCodeAt(0) - 65]
                    : q[`option_${opt.toLowerCase()}`]
              }}
            />
          </label>
        ))}

        <button onClick={submitExam}>Submit</button>
      </div>
    </div>
  )
}

function formatTime(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

const styles = {
  page: { padding: 30 },
  card: { background: '#fff', padding: 20 },
  option: { display: 'block', marginTop: 10 }
}
