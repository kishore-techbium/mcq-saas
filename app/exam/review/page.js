'use client'

import { supabase } from '../../../lib/supabase'
import { useEffect, useState } from 'react'

export default function ExamReview() {

  const [session, setSession] = useState(null)
  const [questions, setQuestions] = useState([])
  const [exam, setExam] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    init()
  }, [])

  async function init() {
// 🔥 trigger processing before loading data
await fetch('/api/worker')
    try {

      const { data: { session: authSession } } =
        await supabase.auth.getSession()

      if (!authSession?.user) {
        alert("Not logged in")
        return
      }

      const params = new URLSearchParams(window.location.search)
      const sessionId = params.get('sessionId')

      if (!sessionId) {
        alert("Invalid review request")
        return
      }

      const { data: student } =
        await supabase
          .from('students')
          .select('id,email')
          .eq('email', authSession.user.email)
          .single()

      const { data: sess } =
        await supabase
          .from('exam_sessions')
          .select('*')
          .eq('id', sessionId)
          .single()

      if (!sess) {
        alert("Session not found")
        return
      }

      setSession(sess)

      if (sess.exam_id) {
        const { data: examData } =
          await supabase
            .from('exams')
            .select('*')
            .eq('id', sess.exam_id)
            .single()

        setExam(examData)
      }

      let answers = sess.answers || {}

      if (typeof answers === 'string') {
        try {
          answers = JSON.parse(answers)
        } catch {}
      }

      const answerQuestionIds =
        Object.keys(answers).filter(k => k !== '__meta')

      if (sess.exam_id) {

        const { data: mappings } =
          await supabase
            .from('exam_questions')
            .select('question_id')
            .eq('exam_id', sess.exam_id)

        const ids = mappings?.map(m => m.question_id) || []

        if (ids.length > 0) {

          const { data: qs } =
            await supabase
              .from('question_bank')
              .select('*')

              .in('id', ids)

          setQuestions(qs || [])
        }

      } else {

        if (answerQuestionIds.length > 0) {

          const { data: qs } =
            await supabase
              .from('question_bank')
              .select('*')
              .in('id', answerQuestionIds)

          const ordered =
            answerQuestionIds
              .map(id => qs?.find(q => q.id === id))
              .filter(Boolean)

          setQuestions(ordered)
        }
      }

      setLoading(false)

    } catch (err) {
      console.error(err)
      alert("Error loading review")
    }
  }

  if (loading)
    return <p style={{ padding: 40 }}>Loading review…</p>

  const meta = session.answers?.__meta || {}
  const isPractice = meta.type === 'CUSTOM_TEST'
const answersObj =
  typeof session.answers === 'string'
    ? JSON.parse(session.answers)
    : session.answers || {}

let correct = 0
let wrong = 0
let attempted = 0
let score = 0

questions.forEach(q => {
  const ans = answersObj[q.id]

  if (!ans) return

  attempted++

  const isCorrect = ans === q.correct_answer

  if (isCorrect) {
    score += exam?.correct_marks || 4
    correct++
  } else {
    score -= Math.abs(exam?.negative_marks || 1)
    wrong++
  }
})

const unattempted = questions.length - attempted

const accuracy =
  attempted === 0
    ? 0
    : ((correct / attempted) * 100).toFixed(2)
  return (
    <div style={styles.page}>

      <h1>📘 Exam Review</h1>

    <div style={styles.metaBox}>

  {isPractice ? (
    <>
      <p><b>Subject:</b> {meta.subject}</p>
      <p><b>Chapters:</b> {meta.chapters?.join(', ')}</p>
    </>
  ) : (
    <>
      <p><b>Exam:</b> {exam?.title}</p>
      <p><b>Category:</b> {exam?.exam_category}</p>
    </>
  )}

  <hr style={{ margin: '10px 0' }} />

  <p>🏆 <b>Score:</b> {score}</p>
  <p>✅ Correct: {correct}</p>
  <p>❌ Wrong: {wrong}</p>
  <p>⏭ Unattempted: {unattempted}</p>
  <p>🎯 Accuracy: {accuracy}%</p>

</div>

      {questions.map((q, index) => {

        const answersObj =
  typeof session.answers === 'string'
    ? JSON.parse(session.answers)
    : session.answers || {}

const your = answersObj[q.id]
const timeSpent = answersObj.timeSpent || {}
const time = timeSpent[q.id] || 0
        
        const correct = q.correct_answer
let timeLabel = ''
let insight = ''
let timeColor = '#333'

if (time > 30 && your !== correct) {
  insight = '❌ Weak concept'
  timeColor = '#dc2626'
} else if (time > 30 && your === correct) {
  insight = '⚠ Took long'
  timeColor = '#f97316'
} else if (time < 10 && your === correct) {
  insight = '💪 Strong'
  timeColor = '#16a34a'
} else if (time < 10 && your !== correct) {
  insight = '🎯 Guess'
  timeColor = '#9333ea'
} else {
  insight = '👍 Normal'
  timeColor = '#ca8a04'
}
        

        return (
          <div key={q.id} style={styles.card}>

           <div style={{ fontWeight: 600 }}>
  Q{index + 1}.
  <div dangerouslySetInnerHTML={{ __html: q.question }} />
    {/* ⏱ TIME INFO */}
{time > 0 && (
  <div style={{
    marginTop: 6,
    fontSize: 13,
    color: timeColor,
    fontWeight: 500
  }}>
    ⏱ {time} sec {insight}
  </div>
)}
</div>

            {['A','B','C','D'].map(opt => {

              const text = q[`option_${opt.toLowerCase()}`]

              let bg = '#fff'
              let color = '#333'

              if (opt === correct) {
                bg = '#dcfce7'
                color = '#166534'
              }

              if (opt === your && your !== correct) {
                bg = '#fee2e2'
                color = '#991b1b'
              }

              return (
                <div
                  key={opt}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 6,
                    marginTop: 6,
                    background: bg,
                    color
                  }}
                >
                  {opt}. 
<span
  dangerouslySetInnerHTML={{ __html: text }}
/>
                </div>
              )

            })}

            {/* ✅ NEW: EXPLANATION BLOCK */}
            {q.explanation && (
              <div style={styles.explanationBox}>
                <b>Explanation:</b>
                <div
  dangerouslySetInnerHTML={{ __html: q.explanation }}
/>
              </div>
            )}

          </div>
        )

      })}

      <button
        style={styles.backBtn}
        onClick={() => window.location.href = '/dashboard'}
      >
        Back to Dashboard
      </button>

    </div>
  )
}

const styles = {

  page: {
    padding: 40,
    minHeight: '100vh',
    background: '#f8fafc',
    fontFamily: 'system-ui, sans-serif'
  },

  metaBox: {
    background: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
    boxShadow: '0 6px 16px rgba(0,0,0,0.06)'
  },

  card: {
    background: '#fff',
    padding: 18,
    borderRadius: 12,
    marginBottom: 18,
    boxShadow: '0 6px 16px rgba(0,0,0,0.06)'
  },

  /* ✅ NEW STYLE */
  explanationBox: {
    marginTop: 12,
    padding: 12,
    background: '#f1f5f9',
    borderRadius: 8,
    fontSize: 14
  },

  backBtn: {
    marginTop: 30,
    padding: '12px 20px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer'
  }

}
