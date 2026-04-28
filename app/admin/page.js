'use client'
import { supabase } from '../../lib/supabase'
import { useEffect, useState } from 'react'

export default function AdminDashboard() {
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [status, setStatus] = useState('')
  const [cleaning, setCleaning] = useState(false)
  const [progress, setProgress] = useState(0)

  // 🔥 NEW STATES
  const [collegeCode, setCollegeCode] = useState('')
  const [adminName, setAdminName] = useState('')
  const [collegeId, setCollegeId] = useState('')

  /* ================= CODE GENERATOR ================= */

  function generateCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)]
    }
    return code
  }

  /* ================= AUTH GUARD (UPDATED) ================= */

  useEffect(() => {
    async function checkAdmin() {
      const { data } = await supabase.auth.getUser()

      if (!data?.user) {
        window.location.href = '/'
        return
      }

      const email = data.user.email

      const { data: user } = await supabase
        .from('students')
        .select('role, first_name, college_id')
        .eq('email', email)
        .single()

      if (user?.role !== 'admin') {
        window.location.href = '/'
        return
      }

      setAdminName(user.first_name || 'Admin')
      setCollegeId(user.college_id)

      // 🔥 FETCH COLLEGE CODE
      const { data: codeData } = await supabase
        .from('college_codes')
        .select('code')
        .eq('college_id', user.college_id)
        .maybeSingle()

      setCollegeCode(codeData?.code || 'Not Generated')

      setCheckingAuth(false)
    }

    checkAdmin()
  }, [])

  /* ================= LOGOUT ================= */

  async function logoutAdmin() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  /* ================= REGENERATE CODE ================= */
async function regenerateCode() {
  const { data: auth } = await supabase.auth.getUser()
  const user = auth.user

  // 🔥 STEP 1: Get college name
  const { data: college } = await supabase
    .from('colleges')
    .select('name')
    .eq('id', collegeId)
    .single()

  // 🔥 STEP 2: Update user_id + college_name
  await supabase
    .from('students')
    .update({
      user_id: user.id,
      college_name: college?.name || null
    })
    .eq('email', user.email)

  // 🔥 STEP 3: Generate code
  const newCode = generateCode()

  const { error } = await supabase
    .from('college_codes')
    .upsert(
      {
        college_id: collegeId,
        code: newCode
      },
      { onConflict: 'college_id' }
    )

  if (!error) {
    setCollegeCode(newCode)
    alert('College code updated successfully')
  } else {
    alert('Failed to update code')
    console.error(error)
  }
}

  /* ================= DUPLICATE CLEANER ================= */

  async function cleanDuplicates() {
    const confirmText = prompt(
      'This will permanently delete duplicate questions.\nType CLEAN to continue.'
    )
    if (confirmText !== 'CLEAN') return

    setCleaning(true)
    setProgress(0)
    setStatus('Scanning for duplicate questions...')

    const { data: questions } = await supabase
.from('question_bank')
.select('*')
.eq('college_id', collegeId)
    if (!questions || questions.length === 0) {
      setStatus('No questions found')
      setCleaning(false)
      return
    }

    const seen = {}
    const duplicates = []

    for (const q of questions) {
      const key = [
  q.college_id,
  q.exam_category,
  q.subject,
  q.chapter,
  q.subtopic,
  (q.question || '').trim(),
  (q.option_a || '').trim(),
  (q.option_b || '').trim(),
  (q.option_c || '').trim(),
  (q.option_d || '').trim(),
  q.correct_answer
].join('|')

      if (seen[key]) {
        duplicates.push(q.id)
      } else {
        seen[key] = true
      }
    }

    if (duplicates.length === 0) {
      setStatus('✅ No duplicate questions found')
      setCleaning(false)
      return
    }

    setStatus(`Deleting ${duplicates.length} duplicate questions...`)

    const batchSize = 20
    let deleted = 0

    for (let i = 0; i < duplicates.length; i += batchSize) {
      const batch = duplicates.slice(i, i + batchSize)

      await supabase
        .from('question_bank')
        .delete()
        .in('id', batch)

      deleted += batch.length
      const percent = Math.round((deleted / duplicates.length) * 100)
      setProgress(percent)
    }

    setStatus(`🧹 Duplicate cleanup completed. Deleted ${duplicates.length} questions.`)
    setCleaning(false)
  }

  /* ================= UI ================= */

  if (checkingAuth) {
    return <p style={{ padding: 30 }}>Checking admin access…</p>
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.heading}>Admin Control Panel</h1>
          <p style={styles.subheading}>
            Manage questions, exams, and mappings from one place
          </p>
        </div>

        {/* 🔥 NEW RIGHT SECTION */}
        <div style={{ textAlign: 'right' }}>
          <p><strong>Welcome, {adminName}</strong></p>

          <p style={{ marginTop: 8 }}>
            College Code: <strong>{collegeCode}</strong>
          </p>

          <button
            onClick={regenerateCode}
            style={styles.regenBtn}
          >
            Regenerate
          </button>

          <br />
<button
  onClick={() => (window.location.href = '/admin/latexquestions')}
  style={styles.latexBtn}
>
  ➕ Add Question (LaTeX)
</button>
          <button onClick={logoutAdmin} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </div>

      <div style={styles.grid}>
        <Card
          title="📤 Upload Question Bank"
          desc="Upload Excel, validate data, and view upload summary"
          color="#e0f2fe"
          action="Upload Questions"
          onClick="/admin/upload-questions"
        />

        <Card
          title="📝 Create Exam"
          desc="Create mock, grand, or regular exams with rules"
          color="#ede9fe"
          action="Create Exam"
          onClick="/admin/create-exam"
          purple
        />

        <Card
          title="🔗 Map Questions to Exam"
          desc="Attach questions to exams using filters"
          color="#ecfeff"
          action="Map Questions"
          onClick="/admin/map-questions"
        />

        <Card
          title="📚 Available Exams"
          desc="View exams, activate/deactivate, and delete"
          color="#fef3c7"
          action="View Exams"
          onClick="/admin/available-exams"
        />

        <Card
          title="📈 Academic Intelligence"
          desc="Advanced insights, trends, and student risk analysis"
          color="#dbeafe"
          action="Open Intelligence"
          onClick="/admin/academic-intelligence"
        />
        <Card
          title="📊 Exam Results"
          desc="View performance analytics and student scores"
          color="#dcfce7"
          action="View Results"
          onClick="/admin/results"
        />

        <Card
          title="👨‍🎓 Student List"
          desc="View all registered students and their complete exam history"
          color="#ffe4e6"
          action="View Students"
          onClick="/admin/students"
        />

        <Card
          title="🎥 Proctoring Review"
          desc="Review and approve/reject proctored exam attempts"
          color="#fef3c7"
          action="Open Review"
          onClick="/admin/proctoring"
        />

        <Card
          title="🗂 Review Question Bank"
          desc="Filter by subject/chapter and delete specific questions"
          color="#e9d5ff"
          action="Open Question Review"
          onClick="/admin/review-questions"
          purple
        />
      </div>

      <div style={styles.maintenance}>
        <h2>🧹 Maintenance</h2>
        <p style={{ color: '#555' }}>
          Remove duplicate questions from the question bank
        </p>

        <button
          style={{
            ...styles.dangerBtn,
            opacity: cleaning ? 0.6 : 1
          }}
          onClick={cleanDuplicates}
          disabled={cleaning}
        >
          {cleaning ? 'Cleaning…' : 'Clean Duplicate Questions'}
        </button>

        {cleaning && (
          <div style={styles.progressWrapper}>
            <div
              style={{
                ...styles.progressBar,
                width: `${progress}%`
              }}
            />
            <p style={{ marginTop: 8 }}>Deleting... {progress}%</p>
          </div>
        )}

        {status && <pre style={styles.statusBox}>{status}</pre>}
      </div>
    </div>
  )
}

/* ================= CARD ================= */

function Card({ title, desc, color, action, onClick, purple }) {
  return (
    <div style={{ ...styles.card, background: color }}>
      <div>
        <h2 style={styles.cardTitle}>{title}</h2>
        <p style={styles.cardDesc}>{desc}</p>
      </div>
      <button
        style={purple ? styles.purpleBtn : styles.primaryBtn}
        onClick={() => (window.location.href = onClick)}
      >
        {action}
      </button>
    </div>
  )
}

/* ================= STYLES ================= */

const styles = {
  page: {
    padding: 40,
    minHeight: '100vh',
    background: 'linear-gradient(135deg,#f8fafc,#eef2ff)',
    fontFamily: 'system-ui, sans-serif'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30
  },
  heading: { fontSize: 32, marginBottom: 6 },
  subheading: { color: '#555' },

  logoutBtn: {
    marginTop: 10,
    padding: '10px 18px',
    background: '#dc2626',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontWeight: 700,
    cursor: 'pointer'
  },

  regenBtn: {
    marginTop: 6,
    padding: '6px 12px',
    borderRadius: 6,
    border: 'none',
    background: '#2563eb',
    color: '#fff',
    cursor: 'pointer'
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 18
  },

  card: {
    minHeight: 170,
    padding: 20,
    borderRadius: 16,
    boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  },

  cardTitle: { margin: 0, fontSize: 20 },
  cardDesc: { marginTop: 10, color: '#444', fontSize: 14 },

  primaryBtn: {
    padding: '10px 18px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 8
  },

  purpleBtn: {
    padding: '10px 18px',
    background: '#7c3aed',
    color: '#fff',
    border: 'none',
    borderRadius: 8
  },
  latexBtn: {
  marginTop: 10,
  padding: '10px 18px',
  background: '#059669',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  fontWeight: 700,
  cursor: 'pointer'
},

  maintenance: {
    marginTop: 50,
    paddingTop: 30,
    borderTop: '1px solid #e5e7eb'
  },

  dangerBtn: {
    marginTop: 10,
    padding: '12px 20px',
    background: '#dc2626',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontWeight: 700
  },

  progressWrapper: {
    marginTop: 15,
    background: '#e5e7eb',
    borderRadius: 8,
    height: 10,
    overflow: 'hidden'
  },

  progressBar: {
    height: 10,
    background: '#dc2626',
    transition: 'width 0.3s ease'
  },

  statusBox: {
    marginTop: 20,
    background: '#f1f5f9',
    padding: 15,
    borderRadius: 8,
    whiteSpace: 'pre-wrap',
    fontSize: 14
  }
}
