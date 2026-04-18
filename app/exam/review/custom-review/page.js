'use client'

import { useEffect, useState } from 'react'

export default function CustomReview() {
  const [data, setData] = useState(null)

  useEffect(() => {
    const raw = localStorage.getItem('custom_test_result')

    if (!raw) {
      alert('No data found')
      window.location.href = '/student-home'
      return
    }

    setData(JSON.parse(raw))
  }, [])

  if (!data) return <p style={{ padding: 40 }}>Loading...</p>

  const { questions, answers, config } = data

  let correct = 0
  let wrong = 0
  let attempted = 0
  let score = 0

  questions.forEach(q => {
    const ans = answers[q.id]
    if (!ans) return

    attempted++

    if (ans === q.correct_answer) {
      correct++
      score += 4
    } else {
      wrong++
      score -= 1
    }
  })

  const unattempted = questions.length - attempted

  const accuracy =
    attempted === 0
      ? 0
      : ((correct / attempted) * 100).toFixed(2)

  return (
    <div style={styles.page}>
      <h1>📘 Practice Test Review</h1>

      <div style={styles.metaBox}>
        <p><b>Subject:</b> {config.subject}</p>
        <p><b>Chapters:</b> {config.chapters?.join(', ')}</p>

        <hr />

        <p>🏆 Score: {score}</p>
        <p>✅ Correct: {correct}</p>
        <p>❌ Wrong: {wrong}</p>
        <p>⏭ Unattempted: {unattempted}</p>
        <p>🎯 Accuracy: {accuracy}%</p>
      </div>

      {questions.map((q, i) => {
        const your = answers[q.id]
        const correctAns = q.correct_answer

        return (
          <div key={q.id} style={styles.card}>
            <div dangerouslySetInnerHTML={{ __html: q.question }} />

            {['A','B','C','D'].map(opt => {
              let bg = '#fff'

              if (opt === correctAns) bg = '#dcfce7'
              if (opt === your && your !== correctAns) bg = '#fee2e2'

              return (
                <div key={opt} style={{ ...styles.option, background: bg }}>
                  {opt}. 
                  <span dangerouslySetInnerHTML={{
                    __html: q[`option_${opt.toLowerCase()}`]
                  }} />
                </div>
              )
            })}

            {q.explanation && (
              <div style={styles.explanation}>
                <b>Explanation:</b>
                <div dangerouslySetInnerHTML={{ __html: q.explanation }} />
              </div>
            )}
          </div>
        )
      })}

      <button
        style={styles.btn}
        onClick={() => {
          localStorage.removeItem('custom_test_result')
          window.location.href = '/student-home'
        }}
      >
        Back to Dashboard
      </button>
    </div>
  )
}

const styles = {
  page: { padding: 40, background: '#f8fafc' },
  metaBox: {
    background: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20
  },
  card: {
    background: '#fff',
    padding: 20,
    marginBottom: 15,
    borderRadius: 10
  },
  option: {
    padding: 6,
    marginTop: 5,
    borderRadius: 6
  },
  explanation: {
    marginTop: 10,
    background: '#f1f5f9',
    padding: 10,
    borderRadius: 6
  },
  btn: {
    marginTop: 20,
    padding: 10,
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 8
  }
}