'use client'

import { supabase } from '../../lib/supabase'
import { getCurrentUser } from '../../lib/auth'
//import { fromWithCollege } from '../../lib/supabaseWithCollege'
import { useEffect, useState } from 'react'

 const CATEGORY_MAP = {
  JEE: ['JEE_MAINS', 'JEE_ADVANCED'],
  NEET: ['NEET']
}
export default function StudentDashboard() {
  const [user, setUser] = useState(null)
  const [category, setCategory] = useState(null)
  const [view, setView] = useState(null) // ✅ NEW
 

  const [availableExams, setAvailableExams] = useState([])
  const [completedExams, setCompletedExams] = useState([])
  const [practiceTests, setPracticeTests] = useState([])

  const [loading, setLoading] = useState(true)

// ✅ Run init ONLY once
useEffect(() => {
  init()
}, [])

// ✅ Handle focus separately
useEffect(() => {
  if (!user || !category) return

  const onFocus = () => {
    refreshData(user.id, category, user)
  }

  window.addEventListener('focus', onFocus)
  return () => window.removeEventListener('focus', onFocus)

}, [user?.id, category])
  
const [initDone, setInitDone] = useState(false)

async function init() {
  if (initDone) return
  setInitDone(true)
  const currentUser = await getCurrentUser(supabase)

  // ❌ Not logged in
  if (!currentUser) {
    window.location.href = '/'
    return
  }

  let userData = null

  // ✅ Google login
  if (currentUser.type === 'google') {
    const email = currentUser.email

    const { data: student } = await supabase
      .from('students')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (!student) {
      window.location.href = '/'
      return
    }

    userData = student
  }

  // ✅ Manual login
if (currentUser.type === 'manual') {

  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('id', currentUser.user.id)
    .maybeSingle()

  if (!student) {
    window.location.href = '/'
    return
  }

  userData = student
}
  

  const params = new URLSearchParams(window.location.search)
  const cat = params.get('category')
  const v = params.get('view')

  if (!cat) {
    window.location.href = '/select-category'
    return
  }

  setUser(userData)
  setCategory(cat)
  setView(v)

  await refreshData(userData.id, cat, userData)
  setLoading(false)
}
  async function refreshData(studentId, cat, userData) {

  const [adminRes, globalExams] = await Promise.all([
    loadAdminExams(studentId, cat, userData),
    loadGlobalAssignedExams(userData, cat),
    loadPracticeTests(studentId)
  ])

  const map = new Map()

;(adminRes?.available || []).forEach(e => {
  map.set(e.id, e)
})

globalExams.forEach(e => {
  map.set(e.id, e) // override if same
})

const mergedAvailable = Array.from(map.values())

  setAvailableExams(mergedAvailable)
  setCompletedExams(adminRes?.completed || [])
}

  async function ensureStudentProfile(user) {
    const { data: existing } = await supabase
      .from('students')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (!existing) {
      await supabase.from('students').insert({
        id: user.id,
        email: user.email
      })
    }
  }

 async function loadAdminExams(studentId, cat, userData) {

  if (!userData?.college_id) {
    
    return {
  available: [],
  completed: []
}
  }

const res = await fetch('/api/exam/list', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    collegeId: userData.college_id,
    category: cat,
    studyYear: userData.study_year
  })
})

const exams = await res.json()
const allowedCategories = CATEGORY_MAP[cat] || [cat]
 
if (!exams || exams.length === 0) {
  return {
    available: [],
    completed: []
  }
}

  
const examIds = exams.map(e => e.id)

const res2 = await fetch('/api/exam/question-count', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ examIds })
})

const questionCountMap = await res2.json()

    const { data: attempts } = await supabase
      .from('exam_sessions')
      .select('id, exam_id, submitted, score, created_at')
      .eq('student_id', studentId)
      .not('exam_id', 'is', null)

    const latestAttemptMap = {}
    const attemptCountMap = {}

    ;(attempts || []).forEach(a => {
      if (!a.submitted) return

      attemptCountMap[a.exam_id] =
        (attemptCountMap[a.exam_id] || 0) + 1

      if (
        !latestAttemptMap[a.exam_id] ||
        new Date(a.created_at) >
          new Date(latestAttemptMap[a.exam_id].created_at)
      ) {
        latestAttemptMap[a.exam_id] = a
      }
    })

    const available = []
    const completed = []

    exams.forEach(exam => {

      if (!allowedCategories.includes(exam.exam_category)) {
        return
      }
      const enriched = {
        ...exam,
        question_count: questionCountMap[exam.id] || 0
      }

      const latest = latestAttemptMap[exam.id]
      const attemptCount = attemptCountMap[exam.id] || 0

          if (latest) {
          // already attempted → only completed
          completed.push({
            ...enriched,
            score: latest.score,
            attempted_at: latest.created_at,
            attempt_count: attemptCount,
            session_id: latest.id
          })
        } else {
          // not attempted → available
          available.push(enriched)
        }
    })

      return {
        available,
        completed
      }
  }

  async function loadGlobalAssignedExams(userData, cat) {

  const { data, error } = await supabase
  .from('exam_assignments')
  .select(`
    exam_id,
    exam_date,
    exam_time,
    duration_minutes,
    is_active,
    exams!exam_assignments_exam_id_fkey (
  id,
  title,
  exam_category,
  target_year
)
  `)
  .eq('college_id', userData.college_id)
  .eq('is_active', true)

// ✅ STEP 2 — ADD EXACTLY HERE
if (!data) {
  console.log("NO DATA RETURNED FROM exam_assignments", error)
  return []
}
console.log("ERROR:", error)
console.log("DATA:", data)

  // ✅ FIX: MOVE THIS HERE
  if (!data || data.length === 0) return []

  // ✅ NOW SAFE
  const examIds = data.map(a => a.exam_id)

  const res = await fetch('/api/exam/question-count', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ examIds })
  })

  const questionCountMap = await res.json()

  const allowedCategories = CATEGORY_MAP[cat] || [cat]

  console.log("STEP 2 - CATEGORY:", cat)
  console.log("STEP 2 - ALLOWED:", allowedCategories)
  console.log("STEP 2 - STUDENT YEAR:", userData.study_year)

  const result = data
  data.forEach(a => {
  console.log("DEBUG TARGET:", {
    exam_target: a.exams?.target_year,
    student_year: userData.study_year
  })
})
    .filter(a =>
      allowedCategories.includes(a.exams?.exam_category) &&
      Number(a.exams?.target_year) === Number(userData.study_year)
    )
    .map(a => ({
      ...a.exams,
      id: a.exam_id,
      exam_date: a.exam_date,
      exam_time: a.exam_time,
      duration_minutes: a.duration_minutes,
      question_count: questionCountMap[a.exam_id] || 0,
      is_global: true
    }))

  console.log("STEP 4 - FINAL GLOBAL EXAMS:", result)

  return result
}

  async function loadPracticeTests(studentId) {
    const { data } = await supabase
      .from('exam_sessions')
      .select('*')
      .eq('student_id', studentId)
      .is('exam_id', null)
      .order('created_at', { ascending: false })
      .limit(50)

    const filtered = (data || []).filter(
      s => s.answers?.__meta?.type === 'CUSTOM_TEST'
    )

    setPracticeTests(filtered)
  }

function startExam(examId) {
  window.location.href = `/exam/${examId}/instructions`
}

  function reviewPractice(sessionId) {
    window.location.href = `/exam/review?sessionId=${sessionId}`
  }

  async function logout() {
    await supabase.auth.signOut()
    localStorage.removeItem('student')
    window.location.href = '/'
    
  }

  if (loading) return <p style={{ padding: 30 }}>Loading dashboard…</p>

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1>{pretty(category)} Dashboard</h1>
          <p style={{ color: '#555' }}>{user.email}</p>
        </div>

        <div style={styles.headerActions}>
          <button onClick={logout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </div>

      {/* ❌ HIDE AVAILABLE EXAMS IN REVIEW MODE */}
{view !== 'review' && (
        <Section title="🟢 Available Exams">
          {availableExams.length === 0 && (
            <p style={styles.empty}>No available exams.</p>
          )}
          <div style={styles.grid}>
          {availableExams.map(exam => {
  const started = isExamStarted(exam)

  return (
    <ExamCard
      key={exam.id}
      title={exam.title}
      subtitle={`${exam.exam_type} • ${exam.duration_minutes} mins`}
      footer={
        exam.exam_date && exam.exam_time
          ? `🕒 Starts: ${formatExamDateTime(exam)} | Questions: ${exam.question_count}`
          : `Questions: ${exam.question_count}`
      }
      action={started ? "Start Exam" : "Not Started"}
      color={started ? "#16a34a" : "#9ca3af"}
      onClick={() => {
          if (started) startExam(exam.id)
        }}
    />
  )
})}
          </div>
        </Section>
      )}

      {/* ✅ ALWAYS SHOW REVIEW CONTENT */}
{view === 'review' && (
  <Section title="📘 Review Taken Exams">
      
       {completedExams.length === 0 && practiceTests.length === 0 && (
  <div style={{ textAlign: 'center', padding: 20 }}>
    <p style={{ fontSize: 16, color: '#666' }}>
      📭 No exams taken yet to review.
    </p>
    <p style={{ fontSize: 14, color: '#999' }}>
      Start an exam and come back here to analyze your performance.
    </p>
  </div>
)}

        <div style={styles.grid}>
          {/* COMPLETED */}
          {completedExams.map(exam => (
            <ExamCard
              key={exam.id}
              title={exam.title}
              subtitle={`Score: ${exam.score}`}
              footer={`Attempts: ${exam.attempt_count} • ${formatDate(exam.attempted_at)}`}
              action="Review"
              color="#2563eb"
              onClick={() =>
                window.location.href = `/exam/review?sessionId=${exam.session_id}`
              }
            />
          ))}

          {/* PRACTICE */}
          {practiceTests.map(s => {
            const meta = s.answers.__meta
            return (
              <ExamCard
                key={s.id}
                title={`${meta.subject} Practice`}
                subtitle={`Score: ${s.score} / ${meta.total_questions}`}
                footer={meta.chapters.slice(0, 2).join(', ')}
                action="Review"
                color="#2563eb"
                onClick={() => reviewPractice(s.id)}
              />
            )
          })}
        </div>
        </Section>
)}
    </div>
  )
}

/* HELPERS + UI SAME AS BEFORE */

function pretty(cat) {
  if (cat === 'JEE_MAINS') return 'JEE Mains'
  if (cat === 'JEE_ADVANCED') return 'JEE Advanced'
  if (cat === 'NEET') return 'NEET UG'
  return ''
}

function isExamStarted(exam) {
  if (!exam.exam_date || !exam.exam_time) return true

  const now = new Date()
  const examDateTime = new Date(`${exam.exam_date}T${exam.exam_time}`)

  return now >= examDateTime
}

function formatExamDateTime(exam) {
  if (!exam.exam_date || !exam.exam_time) return ''

  const dt = new Date(`${exam.exam_date}T${exam.exam_time}`)

  return dt.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-IN')
}

function Section({ title, children }) {
  return (
    <div style={{ marginTop: 40 }}>
      <h2 style={{ marginBottom: 16 }}>{title}</h2>
      {children}
    </div>
  )
}

function ExamCard({ title, subtitle, footer, action, onClick, color }) {
  return (
    <div style={styles.card}>
      <div>
        <h3>{title}</h3>
        <p style={styles.meta}>{subtitle}</p>
        <p style={styles.meta}>{footer}</p>
      </div>

      <button
        onClick={onClick}
        style={{ ...styles.actionBtn, background: color }}
      >
        {action}
      </button>
    </div>
  )
}

const styles = {
  page: { padding: 40, background: '#f8fafc' },
  header: {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center' // ✅ ADD THIS
},
  headerActions: { display: 'flex', gap: 12 },
logoutBtn: {
  padding: '10px 16px',
  background: '#dc2626',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  fontWeight: 600,
  cursor: 'pointer',
  height: 'fit-content'
},
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 24
  },
  card: {
    background: '#fff',
    padding: 20,
    borderRadius: 14,
    boxShadow: '0 10px 25px rgba(0,0,0,0.08)'
  },
  meta: { fontSize: 14, color: '#555' },
  actionBtn: {
    marginTop: 12,
    padding: '10px',
    border: 'none',
    borderRadius: 8,
    color: '#fff',
    fontWeight: 700
  },
  empty: { color: '#666' }
}
