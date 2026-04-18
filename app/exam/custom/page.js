'use client'

import { supabase } from '../../../lib/supabase'
import { getCurrentUser } from '../../../lib/auth'
import { useEffect, useState } from 'react'

const LS_KEY = 'custom_exam_session'

export default function CustomExam() {
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [visited, setVisited] = useState(new Set())
  const [currentIndex, setCurrentIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [config, setConfig] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)

  /* ================= INIT ================= */

  useEffect(() => {
    init()
  }, [])

  async function init() {
   const currentUser = await getCurrentUser(supabase)

if (!currentUser) {
  window.location.href = '/'
  return
}
    const raw = localStorage.getItem('custom_test_config')
    if (!raw) {
      alert('Invalid test configuration')
      window.location.href = '/student-home'
      return
    }

    const cfg = JSON.parse(raw)
    setConfig(cfg)

    // Restore session if exists
    const saved = JSON.parse(localStorage.getItem(LS_KEY) || '{}')

    setAnswers(saved.answers || {})
    setVisited(new Set(saved.visited || []))
    setCurrentIndex(saved.currentIndex || 0)
    setTimeLeft(
      saved.timeLeft ?? Math.ceil(cfg.duration * 60)
    )

  let email = null

if (currentUser.type === 'google') email = currentUser.email
if (currentUser.type === 'manual') email = currentUser.user.email

const res = await fetch('/api/createowntest/owntestquestions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email,
    category: cfg.category,
    subject: cfg.subject,
    chapters: cfg.chapters,
    limit: cfg.questionCount
  })
})

const result = await res.json()

setQuestions(result.questions || [])
    setLoading(false)
  }

  /* ================= TIMER ================= */

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

  /* ================= PERSIST ================= */

  function persist(extra = {}) {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({
        answers,
        visited: Array.from(visited),
        currentIndex,
        timeLeft,
        ...extra
      })
    )
  }

  /* ================= ACTIONS ================= */

  function goToQuestion(i) {
    setCurrentIndex(i)
    setVisited(prev => {
      const u = new Set(prev)
      u.add(i)
      persist({ visited: Array.from(u), currentIndex: i })
      return u
    })
  }

  function selectAnswer(opt) {
    const qid = questions[currentIndex].id
    const updated = { ...answers, [qid]: opt }

    setAnswers(updated)
    setVisited(prev => {
      const u = new Set(prev)
      u.add(currentIndex)
      persist({ answers: updated, visited: Array.from(u) })
      return u
    })
  }

  /* ================= SUBMIT ================= */

  async function submitExam() {
    if (submitted) return
    setSubmitted(true)

    let score = 0
    questions.forEach(q => {
      if (answers[q.id] === q.correct_answer) score++
    })

    const meta = {
      type: 'CUSTOM_TEST',
      category: config.category,
      subject: config.subject,
      chapters: config.chapters,
      total_questions: questions.length,
      duration: config.duration
    }

    const currentUser = await getCurrentUser(supabase)

if (!currentUser) {
  window.location.href = '/'
  return
}

let studentId = null

// ✅ Google login
if (currentUser.type === 'google') {
  const { data } = await supabase.auth.getUser()
  studentId = data.user.id
}

// ✅ Manual login
if (currentUser.type === 'manual') {
  studentId = currentUser.user.id
}

  const payload = {
  questions,
  answers,
  config,
}

localStorage.setItem('custom_test_result', JSON.stringify(payload))

window.location.href = '/custom-review'
    localStorage.removeItem(LS_KEY)
    localStorage.removeItem('custom_test_config')

    window.location.href = `/select-category`
  }

  /* ================= UI ================= */

  if (loading) return <p style={{ padding: 40 }}>Loading test…</p>

  const q = questions[currentIndex] || {}

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.header}>
        <h2>Practice Test – {config.subject}</h2>
        <div style={styles.timer}>⏱ {formatTime(timeLeft)}</div>
      </div>

      <div style={styles.main}>
        {/* QUESTION */}
        <div style={styles.card}>
          <h3>
            Question {currentIndex + 1} of {questions.length}
          </h3>

<div
  style={{ marginTop: 12 }}
  dangerouslySetInnerHTML={{ __html: q?.question || '' }}
/>
          {['A', 'B', 'C', 'D'].map(opt => (
            <label
              key={opt}
              style={{
                ...styles.option,
                background:
                  answers[q.id] === opt ? '#dcfce7' : '#fff'
              }}
            >
              <input
                type="radio"
                checked={answers[q.id] === opt}
                onChange={() => selectAnswer(opt)}
              />
              {opt}. 
<span
  dangerouslySetInnerHTML={{
    __html: q?.[`option_${opt.toLowerCase()}`] || ''
  }}
/>
            </label>
          ))}

          <div style={styles.nav}>
            <button
              disabled={currentIndex === 0}
              onClick={() => goToQuestion(currentIndex - 1)}
            >
              Prev
            </button>

            <button
              disabled={currentIndex === questions.length - 1}
              onClick={() => goToQuestion(currentIndex + 1)}
            >
              Next
            </button>

            <button style={styles.submitBtn} onClick={submitExam}>
              Submit
            </button>
          </div>
        </div>

        {/* PALETTE */}
        <div style={styles.paletteWrapper}>
          <h4 style={styles.paletteTitle}>Questions</h4>

          <div style={styles.palette}>
            {questions.map((q, i) => {
              let bg = '#e5e7eb'
              if (i === currentIndex) bg = '#2563eb'
              else if (answers[q.id]) bg = '#22c55e'
              else if (visited.has(i)) bg = '#f59e0b'

              return (
                <button
                  key={i}
                  onClick={() => goToQuestion(i)}
                  style={{ ...styles.palBtn, background: bg }}
                >
                  {i + 1}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ================= HELPERS ================= */

function formatTime(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

/* ================= STYLES ================= */

const styles = {
  page: {
    padding: 30,
    minHeight: '100vh',
    background: '#f8fafc',
    fontFamily: 'system-ui, sans-serif'
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 20
  },

  timer: {
    background: '#111827',
    color: '#fff',
    padding: '8px 14px',
    borderRadius: 8,
    fontWeight: 700
  },

  main: {
    display: 'flex',
    gap: 20,
    alignItems: 'flex-start'
  },

  card: {
    flex: 1,
    background: '#fff',
    padding: 24,
    borderRadius: 14,
    boxShadow: '0 10px 25px rgba(0,0,0,0.08)'
  },

  option: {
    display: 'block',
    marginTop: 8,
    padding: 8,
    borderRadius: 6,
    cursor: 'pointer'
  },

  nav: {
    marginTop: 20,
    display: 'flex',
    gap: 10
  },

  submitBtn: {
    marginLeft: 'auto',
    background: '#dc2626',
    color: '#fff',
    border: 'none',
    padding: '8px 14px',
    borderRadius: 6
  },

  paletteWrapper: {
    width: 240,
    background: '#fff',
    padding: 16,
    borderRadius: 14,
    boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
    position: 'sticky',
    top: 20
  },

  paletteTitle: {
    textAlign: 'center',
    fontWeight: 700,
    marginBottom: 12
  },

  palette: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: 10
  },

  palBtn: {
    height: 42,
    border: 'none',
    borderRadius: 8,
    color: '#fff',
    fontWeight: 700,
    cursor: 'pointer'
  }
}
