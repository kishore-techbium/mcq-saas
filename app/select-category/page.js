'use client'

import { supabase } from '../../lib/supabase'
import { useEffect, useState } from 'react'

export default function SelectCategory() {

  const [examPref, setExamPref] = useState('')
  const [studentName, setStudentName] = useState('') // ✅ NEW
  const [analytics, setAnalytics] = useState(null)

  useEffect(() => {
    checkUser()
  }, [])

const [called, setCalled] = useState(false)
async function checkUser() {
  if (called) return
setCalled(true)
    const { data } = await supabase.auth.getUser()

    if (!data.user) {
      window.location.href = '/'
      return
    }

    const email = data.user.email

    const { data: student } = await supabase
      .from('students')
      .select('exam_preference, first_name') // ✅ added first_name only
      .eq('email', email)
      .maybeSingle()

    if (student?.exam_preference) {
      setExamPref(student.exam_preference)
    }

    setStudentName(student?.first_name || 'Student') // ✅ NEW
// TEMP DISABLED
// if (student?.id) {
//   loadAnalytics(student.id)
// }
  }

  function go(cat) {
    window.location.href = `/student-home?category=${cat}`
  }

  async function logout() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }
async function loadAnalytics(studentId) {

  // 1. get sessions
  const { data: sessions } = await supabase
    .from('exam_sessions')
    .select('id, score, created_at')
    .eq('student_id', studentId)
    .eq('submitted', true)
    .order('created_at', { ascending: true })

  if (!sessions || sessions.length === 0) return

  const sessionIds = sessions.map(s => s.id)

  // 2. get answers
  const { data: answers } = await supabase
    .from('exam_answers')
    .select('question_id, is_correct, exam_session_id')
    .in('exam_session_id', sessionIds)

  if (!answers || answers.length === 0) return

  const questionIds = [...new Set(answers.map(a => a.question_id))]

  // 3. get question meta
  const { data: questions } = await supabase
    .from('question_bank')
    .select('id, subject, chapter, subtopic')
    .in('id', questionIds)

  const qMap = {}
  questions?.forEach(q => {
    qMap[q.id] = q
  })

  // 4. merge
  const merged = answers.map(a => ({
    ...a,
    ...(qMap[a.question_id] || {})
  }))

  // 5. subtopic stats
  let stats = {}

  merged.forEach(row => {
    const key = `${row.subject} → ${row.chapter} → ${row.subtopic}`

    if (!stats[key]) stats[key] = { total: 0, correct: 0 }

    stats[key].total++
    if (row.is_correct) stats[key].correct++
  })

  const list = Object.entries(stats).map(([k, v]) => ({
    name: k,
    accuracy: (v.correct / v.total) * 100,
    attempts: v.total
  })).filter(s => s.attempts >= 2)

  if (list.length === 0) return

  const strongest = list.reduce((a, b) =>
    a.accuracy > b.accuracy ? a : b
  )

  const weakest = list.reduce((a, b) =>
    a.accuracy < b.accuracy ? a : b
  )

  // trend
  const first = sessions[0]?.score || 0
  const last = sessions[sessions.length - 1]?.score || 0

  const trend =
    last > first ? 'Improving 📈'
    : last < first ? 'Declining 📉'
    : 'Stable ➖'

  setAnalytics({
    strongest,
    weakest,
    trend
  })
}
  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* TOP ACTIONS */}
        <div style={styles.topActions}>
          
          {/* ✅ REPLACED PROFILE BUTTON WITH NAME */}
          <span style={styles.welcomeText}>
            Welcome, {studentName}
          </span>

          <button onClick={logout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>

        <h1>Welcome to MCQ Platform 🚀</h1>
{analytics && (
  <div style={styles.analyticsCard}>
    <div style={{ fontWeight: 600, marginBottom: 6 }}>
      📊 Your Performance
    </div>

    <div>📈 {analytics.trend}</div>

    <div>
      🎯 Weak:{' '}
      {analytics.weakest.name} ({analytics.weakest.accuracy.toFixed(1)}%)
    </div>

    <div>
      💪 Strong:{' '}
      {analytics.strongest.name} ({analytics.strongest.accuracy.toFixed(1)}%)
    </div>
  </div>
)}
        <p style={{ color: '#555', marginBottom: 20 }}>
          Practice high-quality MCQs, track your performance, and improve your rank with real exam-level questions..
        </p>

        <p style={{ color: '#2563eb', fontWeight: 600, marginBottom: 30 }}>
          Showing exams for: {examPref === 'NEET' ? 'NEET UG' : 'JEE'}
        </p>

        {examPref === 'JEE' && (
          <>
            <button
              style={{ ...styles.btn, background: '#2563eb' }}
              onClick={() => go('JEE_MAINS')}
            >
              JEE Mains
            </button>

            <button
              style={{ ...styles.btn, background: '#7c3aed' }}
              onClick={() => go('JEE_ADVANCED')}
            >
              JEE Advanced
            </button>
          </>
        )}

        {examPref === 'NEET' && (
          <button
            style={{ ...styles.btn, background: '#16a34a' }}
            onClick={() => go('NEET')}
          >
            NEET UG
          </button>
        )}

      </div>
    </div>
  )
}

/* ================= STYLES ================= */

const styles = {
  page: {
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f8fafc',
    fontFamily: 'system-ui, sans-serif'
  },
  card: {
    width: 420,
    padding: 36,
    background: '#fff',
    borderRadius: 18,
    boxShadow: '0 15px 35px rgba(0,0,0,0.12)',
    textAlign: 'center',
    position: 'relative'
  },
  topActions: {
    position: 'absolute',
    top: 16,
    right: 16,
    display: 'flex',
    gap: 10,
    alignItems: 'center'
  },

  // ✅ NEW STYLE (minimal, matches theme)
  welcomeText: {
    fontSize: 13,
    fontWeight: 600,
    color: '#111827'
  },

  logoutBtn: {
    padding: '6px 10px',
    borderRadius: 8,
    border: 'none',
    background: '#dc2626',
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer'
  },
  analyticsCard: {
  marginTop: 15,
  marginBottom: 20,
  padding: 12,
  background: '#f1f5f9',
  borderRadius: 10,
  textAlign: 'left',
  fontSize: 14
},

  btn: {
    width: '100%',
    padding: '14px 16px',
    borderRadius: 10,
    border: 'none',
    color: '#fff',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    marginBottom: 14
  }
}
