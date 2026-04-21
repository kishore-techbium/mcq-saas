'use client'

import { supabase } from '../../../lib/supabase'
import { useEffect, useState } from 'react'
import { getAdminCollege } from '../../../lib/getAdminCollege'

export default function CreateExamPage() {

  const [title, setTitle] = useState('')
  const [examType, setExamType] = useState('WEEKLY_TEST')
  const [examCategory, setExamCategory] = useState('JEE_MAINS')
  const [duration, setDuration] = useState('')
  
  const [cameraRequired, setCameraRequired] = useState(false)
  const [status, setStatus] = useState('')
  const [examDate, setExamDate] = useState('')
  const [examTime, setExamTime] = useState('')
  const [saving, setSaving] = useState(false)
  const [targetYear, setTargetYear] = useState('ALL')

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

  async function createExam() {

    setStatus('')

    if (!title || !duration || !examCategory || !examDate || !examTime) {
      setStatus('❌ Please fill all required fields')
      return
    }

    setSaving(true)

    try {

      const collegeId = await getAdminCollege()
const { data: auth } = await supabase.auth.getUser()
const user = auth.user
      const { error } = await supabase
        .from('exams')
        .insert({
          title: title.trim(),
          exam_type: examType,
          target_year: targetYear,
          exam_category: examCategory,
          duration_minutes: Number(duration),
          exam_date: examDate,
          exam_time: examTime,
          
          camera_required: cameraRequired,
          created_by: user.id,
          is_active: true,
          college_id: collegeId
        })

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

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.card}>

          <h1 style={styles.heading}>📝 Create New Exam</h1>

          <div style={styles.field}>
            <label style={styles.label}>Exam Title *</label>
            <input
              style={styles.input}
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Exam Category *</label>
            <select
              style={styles.input}
              value={examCategory}
              onChange={e => setExamCategory(e.target.value)}
            >
              <option value="JEE_MAINS">JEE Mains</option>
              <option value="JEE_ADVANCED">JEE Advanced</option>
              <option value="NEET">NEET</option>
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Exam Type</label>
            <select
              style={styles.input}
              value={examType}
              onChange={e => setExamType(e.target.value)}
            >
<option value="WEEKLY_TEST">Weekly Test</option>
<option value="MONTHLY_TEST">Monthly Test</option>
<option value="GRAND_TEST">Grand Test</option>
            </select>
          </div>
<div style={styles.field}>
  <label style={styles.label}>Target Students</label>
  <select
    style={styles.input}
    value={targetYear}
    onChange={e => setTargetYear(e.target.value)}
  >
    <option value="ALL">Both Years</option>
    <option value="1">1st Year Only</option>
    <option value="2">2nd Year Only</option>
  </select>
</div>
          <div style={styles.field}>
            <label style={styles.label}>Duration (minutes) *</label>
            <input
              type="number"
              style={styles.input}
              value={duration}
              onChange={e => setDuration(e.target.value)}
            />
          </div>
<div style={styles.field}>
  <label style={styles.label}>Exam Date *</label>
  <input
    type="date"
    style={styles.input}
    value={examDate}
    onChange={e => setExamDate(e.target.value)}
  />
</div>

<div style={styles.field}>
  <label style={styles.label}>Exam Time (24hr) *</label>
  <input
    type="time"
    style={styles.input}
    value={examTime}
    onChange={e => setExamTime(e.target.value)}
  />
</div>

          <div style={styles.checkboxRow}>
            <label>
              <input
                type="checkbox"
                checked={cameraRequired}
                onChange={() => setCameraRequired(!cameraRequired)}
              /> Camera Required
            </label>
          </div>

          <button
            style={styles.btn}
            onClick={createExam}
            disabled={saving}
          >
            {saving ? 'Creating...' : 'Create Exam'}
          </button>

          {status && <p style={styles.status}>{status}</p>}

        </div>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f3f4f6',
    padding: 20
  },
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  card: {
    width: '100%',
    maxWidth: 600,
    background: '#ffffff',
    padding: 30,
    borderRadius: 12,
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
  },
  heading: {
    fontSize: 22,
    fontWeight: 600,
    marginBottom: 20
  },
  field: {
    marginBottom: 16
  },
  label: {
    display: 'block',
    marginBottom: 6,
    fontWeight: 500
  },
  input: {
    width: '100%',
    padding: 10,
    borderRadius: 6,
    border: '1px solid #d1d5db'
  },
  checkboxRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 20
  },
  btn: {
    width: '100%',
    padding: 12,
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontWeight: 600,
    cursor: 'pointer'
  },
  status: {
    marginTop: 15
  }
}
