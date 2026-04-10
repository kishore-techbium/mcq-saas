'use client'

import { supabase } from '../../lib/supabase'
import { fromWithCollege } from '../../lib/supabaseWithCollege'
import { useEffect, useState } from 'react'

export default function StudentDashboard() {
  const [user, setUser] = useState(null)
  const [category, setCategory] = useState(null)
  const [view, setView] = useState(null) // ✅ NEW

  const [availableExams, setAvailableExams] = useState([])
  const [completedExams, setCompletedExams] = useState([])
  const [practiceTests, setPracticeTests] = useState([])

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    init()

    const onFocus = () => {
      if (user && category) {
        refreshData(user.id, category)
      }
    }

    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [user, category])

  async function init() {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      window.location.href = '/'
      return
    }

    const user = session.user

    await ensureStudentProfile(user)

    const params = new URLSearchParams(window.location.search)
    const cat = params.get('category')
    const v = params.get('view') // ✅ NEW

    if (!cat) {
      window.location.href = '/select-category'
      return
    }

    setUser(user)
    setCategory(cat)
    setView(v) // ✅ NEW

    await refreshData(user.id, cat)

    setLoading(false)
  }

  async function refreshData(studentId, cat) {
    await Promise.all([
      loadAdminExams(studentId, cat),
      loadPracticeTests(studentId)
    ])
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

  async function loadAdminExams(studentId, cat) {
    const { data: exams } = await (await fromWithCollege('exams'))
      .select('*')
      .eq('is_active', true)
      .eq('exam_category', cat)
      .order('created_at', { ascending: false })

    if (!exams || exams.length === 0) {
      setAvailableExams([])
      setCompletedExams([])
      return
    }

    const examIds = exams.map(e => e.id)
    const questionCountMap = {}

    const { data: mappings } = await supabase
      .from('exam_questions')
      .select('exam_id')
      .in('exam_id', examIds)

    ;(mappings || []).forEach(m => {
      questionCountMap[m.exam_id] =
        (questionCountMap[m.exam_id] || 0) + 1
    })

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
      const enriched = {
        ...exam,
        question_count: questionCountMap[exam.id] || 0
      }

      const latest = latestAttemptMap[exam.id]
      const attemptCount = attemptCountMap[exam.id] || 0

      if (latest) {
        completed.push({
          ...enriched,
          score: latest.score,
          attempted_at: latest.created_at,
          attempt_count: attemptCount,
          session_id: latest.id
        })

        if (exam.allow_retake) {
          available.push(enriched)
        }
      } else {
        available.push(enriched)
      }
    })

    setAvailableExams(available)
    setCompletedExams(completed)
  }

  async function loadPracticeTests(studentId) {
    const { data } = await supabase
      .from('exam_sessions')
      .select('*')
      .eq('student_id', studentId)
      .is('exam_id', null)
      .order('created_at', { ascending: false })

    const filtered = (data || []).filter(
      s => s.answers?.__meta?.type === 'CUSTOM_TEST'
    )

    setPracticeTests(filtered)
  }

  function startExam(examId, isRetake = false) {
    const url = isRetake
      ? `/exam/${examId}/instructions?retake=1`
      : `/exam/${examId}/instructions`

    window.location.href = url
  }

  function reviewPractice(sessionId) {
    window.location.href = `/exam/review?sessionId=${sessionId}`
  }

  async function logout() {
    await supabase.auth.signOut()
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
            {availableExams.map(exam => (
              <ExamCard
                key={exam.id}
                title={exam.title}
                subtitle={`${exam.exam_type} • ${exam.duration_minutes} mins`}
                footer={`Questions: ${exam.question_count}`}
                action="Start Exam"
                color="#16a34a"
                onClick={() => startExam(exam.id, true)}
              />
            ))}
          </div>
        </Section>
      )}

      {/* ✅ ALWAYS SHOW REVIEW CONTENT */}
      <Section title="📘 Review Taken Exams">
        {completedExams.length === 0 && practiceTests.length === 0 && (
          <p style={styles.empty}>No exams taken yet.</p>
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
  header: { display: 'flex', justifyContent: 'space-between' },
  headerActions: { display: 'flex', gap: 12 },
  logoutBtn: {
    padding: '8px 14px',
    background: '#dc2626',
    color: '#fff',
    border: 'none',
    borderRadius: 8
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
