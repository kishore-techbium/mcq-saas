'use client'

import { supabase } from '../../../lib/supabase'
import { useEffect, useState } from 'react'
import { getAdminCollege } from '../../../lib/getAdminCollege'

export default function CreateExamPage() {

  const [title, setTitle] = useState('')
  const [examType, setExamType] = useState('MOCK')
  const [examCategory, setExamCategory] = useState('JEE_MAINS')
  const [duration, setDuration] = useState('')
  const [allowRetake, setAllowRetake] = useState(false)
  const [cameraRequired, setCameraRequired] = useState(false)
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    checkAdmin()
  }, [])

  async function checkAdmin() {
    const { data } = await supabase.auth.getUser()

    if (!data?.user) {
      window.location.href = '/'
      return
    }

    const email = data.user.email

    const { data: user } = await supabase
      .from('students')
      .select('role')
      .eq('email', email)
      .single()

    if (user?.role !== 'admin') {
      window.location.href = '/'
    }
  }

  /* ================= FIXED FUNCTION ================= */

  async function createExam() {

    setStatus('')

    if (!title || !duration || !examCategory) {
      setStatus('❌ Please fill all required fields')
      return
    }

    setSaving(true)

    try {

      const collegeId = await getAdminCollege()

      const { error } = await supabase
        .from('exams')
        .insert({
          title: title.trim(),
          exam_type: examType,
          exam_category: examCategory,
          duration_minutes: Number(duration),
          allow_retake: allowRetake,
          camera_required: cameraRequired,
          created_by: 'ADMIN',
          is_active: true,
          college_id: collegeId
        })
const collegeId = await getAdminCollege()
console.log("COLLEGE ID:", collegeId)
      if (error) {
        console.error(error)
        setStatus('❌ Failed to create exam')
        setSaving(false)
        return
      }

      setStatus('✅ Exam created successfully')

      setTimeout(() => {
        window.location.href = '/admin'
      }, 1200)

    } catch (err) {
      console.error(err)
      setStatus('❌ Something went wrong')
    }

    setSaving(false)
  }

  /* ================= UI ================= */

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.heading}>📝 Create New Exam</h1>

        <div style={styles.field}>
          <label>Exam Title *</label>
          <input
            style={styles.input}
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>

        <div style={styles.field}>
          <label>Exam Category *</label>
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

        <div style={styles.field}>
          <label>Exam Type</label>
          <select
            style={styles.input}
            value={examType}
            onChange={e => setExamType(e.target.value)}
          >
            <option value="REGULAR">Regular</option>
            <option value="MOCK">Mock</option>
            <option value="GRAND">Grand</option>
          </select>
        </div>

        <div style={styles.field}>
          <label>Duration *</label>
          <input
            type="number"
            style={styles.input}
            value={duration}
            onChange={e => setDuration(e.target.value)}
          />
        </div>

        <button
          style={styles.btn}
          onClick={createExam}
          disabled={saving}
        >
          {saving ? 'Creating...' : 'Create Exam'}
        </button>

        {status && <p>{status}</p>}
      </div>
    </div>
  )
}

const styles = {
  page: { padding: 40 },
  card: { maxWidth: 500, margin: 'auto' },
  input: { width: '100%', padding: 10, marginTop: 10 },
  btn: { marginTop: 20, padding: 12, background: '#2563eb', color: '#fff' },
  field: { marginBottom: 15 }
}
