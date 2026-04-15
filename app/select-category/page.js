'use client'

import { supabase } from '../../lib/supabase'
import { getCurrentUser } from '../../lib/auth'
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

  const currentUser = await getCurrentUser(supabase)

  // ❌ Not logged in
  if (!currentUser) {
    window.location.href = '/'
    return
  }

  // ✅ Google login
  if (currentUser.type === 'google') {
    const { data: student } = await supabase
      .from('students')
      .select('exam_preference, first_name')
      .eq('email', currentUser.email)
      .maybeSingle()

    setExamPref(student?.exam_preference)
    setStudentName(student?.first_name || 'Student')
  }

  // ✅ Manual login
  if (currentUser.type === 'manual') {
    const student = currentUser.user

    setExamPref(student.exam_preference)
    setStudentName(student.first_name || 'Student')
  }
}

  function go(cat) {
    window.location.href = `/student-home?category=${cat}`
  }

  async function logout() {
  await supabase.auth.signOut()
  localStorage.removeItem('student')
  window.location.href = '/'
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
