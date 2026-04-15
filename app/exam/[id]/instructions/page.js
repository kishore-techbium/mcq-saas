'use client'

import { supabase } from '../../../../lib/supabase'
import { getCurrentUser } from '../../../../lib/auth'
import { useEffect, useState } from 'react'

export default function ExamInstructions({ params }) {
  const examId = params.id

  const [exam, setExam] = useState(null)
  const [checked, setChecked] = useState(false)
  const [loading, setLoading] = useState(true)

  const [cameraAllowed, setCameraAllowed] = useState(true)
  const [checkingCamera, setCheckingCamera] = useState(false)

  useEffect(() => {
    init()
  }, [])

  async function init() {
const currentUser = await getCurrentUser(supabase)

if (!currentUser) {
  window.location.href = '/'
  return
}
   const res = await fetch('/api/exam/get', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ examId })
})

const examData = await res.json()

if (!examData || examData.error) {
  alert('Exam not found')
  window.location.href = '/dashboard'
  return
}

    setExam(examData)

    if (examData.camera_required) {
      await checkCameraPermission()
    }

    setLoading(false)
  }

  /* ================= CAMERA CHECK ================= */

  async function checkCameraPermission() {
    setCheckingCamera(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true
      })
      stream.getTracks().forEach(t => t.stop())
      setCameraAllowed(true)
    } catch {
      setCameraAllowed(false)
    } finally {
      setCheckingCamera(false)
    }
  }

  function canStartExam() {
    if (!checked) return false
    if (exam.camera_required && !cameraAllowed) return false
    return true
  }

  /* ================= START EXAM (RESTORED) ================= */

  async function startExam()
  {const currentUser = await getCurrentUser(supabase)

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

    /* Find last attempt */
    const { data: attempts } = await supabase
      .from('exam_sessions')
      .select('attempt_number')
      .eq('student_id', studentId)
      .eq('exam_id', examId)
      .order('attempt_number', { ascending: false })
      .limit(1)

    const nextAttempt =
      attempts && attempts.length > 0
        ? (attempts[0].attempt_number || 1) + 1
        : 1

    /* Create NEW session */
    const { data: session, error } = await supabase
      .from('exam_sessions')
      .insert({
        student_id: studentId,
        exam_id: examId,
        attempt_number: nextAttempt,
        submitted: false
      })
      .select()
      .single()

    if (error || !session) {
      alert('Failed to start exam. Please try again.')
      return
    }

    /* Redirect with sessionId */
    window.location.href = `/exam/${examId}?sessionId=${session.id}`
  }

  if (loading) {
    return <p style={{ padding: 40 }}>Loading instructions…</p>
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>{exam.title}</h1>

        <div style={styles.infoGrid}>
          <Info label="Exam Type" value={exam.exam_type} />
          <Info
            label="Duration"
            value={`${exam.duration_minutes} minutes`}
          />
        </div>

        <hr style={styles.divider} />

        <h3>📌 Instructions</h3>
        <ul style={styles.list}>
          <li>The exam will auto-submit when the timer ends.</li>
          <li>Timer will not reset on refresh.</li>
          <li>Do not close the browser during the exam.</li>
          <li>Each question has only one correct answer.</li>
          <li>Marking Scheme as follows</li>
            <li>✔ Correct Answer: +4 marks  </li>
<li>✖ Wrong Answer: -1 mark  </li>
<li>➖ Unattempted Question: 0 marks  </li>

<li>Total Score = (Correct × 4) − (Wrong × 1)</li>
        </ul>

        {exam.camera_required && (
          <div style={styles.cameraBox}>
            <b>📷 Camera Proctoring Enabled</b>

            {!cameraAllowed && (
              <p style={{ color: '#dc2626', marginTop: 8 }}>
                Camera access is mandatory. Please allow camera access.
              </p>
            )}

            {!cameraAllowed && (
              <button
                style={styles.retryBtn}
                onClick={checkCameraPermission}
              >
                Retry Camera Permission
              </button>
            )}
          </div>
        )}

        <div style={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={checked}
            onChange={e => setChecked(e.target.checked)}
          />
          <span>I have read and understood all instructions</span>
        </div>

        <button
          style={{
            ...styles.startBtn,
            opacity: canStartExam() ? 1 : 0.5,
            cursor: canStartExam() ? 'pointer' : 'not-allowed'
          }}
          disabled={!canStartExam()}
          onClick={startExam}
        >
          Start Exam
        </button>
      </div>
    </div>
  )
}

/* ================= COMPONENTS ================= */

function Info({ label, value }) {
  return (
    <div>
      <p style={{ fontSize: 13, color: '#666' }}>{label}</p>
      <p style={{ fontWeight: 600 }}>{value}</p>
    </div>
  )
}

/* ================= STYLES ================= */

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f8fafc',
    display: 'flex',
    justifyContent: 'center',
    paddingTop: 40,
    fontFamily: 'system-ui, sans-serif'
  },
  card: {
    width: '100%',
    maxWidth: 640,
    background: '#fff',
    padding: 32,
    borderRadius: 16,
    boxShadow: '0 10px 25px rgba(0,0,0,0.08)'
  },
  title: {
    marginBottom: 20
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 16
  },
  divider: {
    margin: '24px 0'
  },
  list: {
    paddingLeft: 18,
    color: '#444',
    lineHeight: 1.6
  },
  checkboxRow: {
    display: 'flex',
    gap: 10,
    marginTop: 20,
    alignItems: 'center'
  },
  startBtn: {
    width: '100%',
    marginTop: 24,
    padding: 14,
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 600
  },
  cameraBox: {
    marginTop: 16,
    padding: 14,
    borderRadius: 10,
    background: '#fef3c7',
    border: '1px solid #fde68a'
  },
  retryBtn: {
    marginTop: 10,
    padding: '6px 10px',
    background: '#111827',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: 13
  }
}
