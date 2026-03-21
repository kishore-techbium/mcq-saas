'use client'

import { supabase } from '../../../lib/supabase'
import { isAdmin } from '../../../lib/isAdmin'
import { useEffect, useState } from 'react'

export default function CreateExamPage() {
  const [title, setTitle] = useState('')
  const [examType, setExamType] = useState('MOCK')
  const [examCategory, setExamCategory] = useState('JEE_MAINS') // ✅ FIX
  const [duration, setDuration] = useState('')
  const [allowRetake, setAllowRetake] = useState(false)
  const [cameraRequired, setCameraRequired] = useState(false)
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user || !isAdmin(data.user)) {
        window.location.href = '/adminlogin'
      }
    })
  }, [])

  async function createExam() {
    setStatus('')

    if (!title || !duration || !examCategory) {
      setStatus('❌ Please fill all required fields')
      return
    }

    setSaving(true)

    const { error } = await supabase.from('exams').insert({
      title: title.trim(),
      exam_type: examType,
      exam_category: examCategory, // ✅ GUARANTEED VALUE
      duration_minutes: Number(duration),
      allow_retake: allowRetake,
      camera_required: cameraRequired,
      created_by: 'ADMIN',
      is_active: true
    })

    setSaving(false)

    if (error) {
      console.error(error)
      setStatus('❌ Failed to create exam')
      return
    }

    setStatus('✅ Exam created successfully')

    setTimeout(() => {
      window.location.href = '/admin'
    }, 1200)
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.heading}>📝 Create New Exam</h1>
        <p style={styles.subheading}>
          Configure exam details and rules
        </p>

        {/* ===== TITLE ===== */}
        <div style={styles.field}>
          <label style={styles.label}>
            Exam Title <span style={styles.required}>*</span>
          </label>
          <input
            style={styles.input}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Eg: JEE Main Mock Test – 1"
          />
        </div>

        {/* ===== CATEGORY ===== */}
        <div style={styles.field}>
          <label style={styles.label}>
            Exam Category <span style={styles.required}>*</span>
          </label>
          <select
            style={styles.input}
            value={examCategory}
            onChange={e => setExamCategory(e.target.value)}
          >
            <option value="JEE_MAINS">JEE Mains</option>
            <option value="JEE_ADVANCED">JEE Advanced</option>
            <option value="NEET">NEET UG</option>
          </select>
        </div>

        {/* ===== TYPE ===== */}
        <div style={styles.field}>
          <label style={styles.label}>Exam Type</label>
          <select
            style={styles.input}
            value={examType}
            onChange={e => setExamType(e.target.value)}
          >
            <option value="REGULAR">Regular Exam</option>
            <option value="MOCK">Mock Test</option>
            <option value="GRAND">Grand Test</option>
          </select>
        </div>

        {/* ===== DURATION ===== */}
        <div style={styles.field}>
          <label style={styles.label}>
            Duration (minutes) <span style={styles.required}>*</span>
          </label>
          <input
            type="number"
            style={styles.input}
            value={duration}
            onChange={e => setDuration(e.target.value)}
            placeholder="Eg: 180"
          />
        </div>

        {/* ===== OPTIONS ===== */}
        <div style={styles.switchGroup}>
          <label style={styles.switch}>
            <input
              type="checkbox"
              checked={allowRetake}
              onChange={e => setAllowRetake(e.target.checked)}
            />
            <span>Allow Retake</span>
          </label>

          <label style={styles.switch}>
            <input
              type="checkbox"
              checked={cameraRequired}
              onChange={e => setCameraRequired(e.target.checked)}
            />
            <span>Camera Proctoring Required</span>
          </label>
        </div>

        <button
          style={{
            ...styles.primaryBtn,
            opacity: saving ? 0.6 : 1
          }}
          onClick={createExam}
          disabled={saving}
        >
          {saving ? 'Creating Exam…' : 'Create Exam'}
        </button>

        {status && <p style={styles.status}>{status}</p>}
      </div>
    </div>
  )
}

/* ================= STYLES ================= */

const styles = {
  page: {
    minHeight: '100vh',
    padding: 40,
    background: 'linear-gradient(135deg, #f8fafc, #eef2ff)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    fontFamily: 'system-ui, sans-serif'
  },
  card: {
    width: '100%',
    maxWidth: 520,
    background: '#fff',
    padding: 30,
    borderRadius: 16,
    boxShadow: '0 10px 25px rgba(0,0,0,0.08)'
  },
  heading: {
    marginBottom: 6
  },
  subheading: {
    color: '#555',
    marginBottom: 24
  },
  field: {
    marginBottom: 18
  },
  label: {
    display: 'block',
    marginBottom: 6,
    fontWeight: 600
  },
  required: {
    color: '#dc2626'
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #d1d5db',
    fontSize: 14
  },
  switchGroup: {
    display: 'flex',
    gap: 20,
    margin: '20px 0'
  },
  switch: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14
  },
  primaryBtn: {
    width: '100%',
    padding: '12px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer'
  },
  status: {
    marginTop: 16,
    textAlign: 'center'
  }
}
