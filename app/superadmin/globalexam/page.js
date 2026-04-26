'use client'

import { useState } from 'react'
import { supabase } from '../../../lib/supabase'

export default function CreateGlobalExam() {

  const [title, setTitle] = useState('')
  const [examType, setExamType] = useState('WEEKLY_TEST')
  const [examCategory, setExamCategory] = useState('JEE_MAINS')
  const [duration, setDuration] = useState('')
  const [targetYear, setTargetYear] = useState('1')
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)

  async function createExam() {

    if (!title || !duration) {
      setStatus('❌ Fill required fields')
      return
    }

    setSaving(true)

    try {
      const { data: auth } = await supabase.auth.getUser()
      const user = auth.user

      const { error } = await supabase
        .from('exams')
        .insert({
          title: title.trim(),
          exam_type: examType,
          exam_category: examCategory,
          duration_minutes: Number(duration),
          target_year: targetYear,

          // 🔥 KEY PART
          is_global: true,
          college_id: null,

          created_by: user.id,
          is_active: true
        })

      if (error) throw error

      setStatus('✅ Global exam created')

      setTimeout(() => {
        window.location.href = '/superadmin'
      }, 1200)

    } catch (err) {
      console.error(err)
      setStatus('❌ Failed')
    }

    setSaving(false)
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Create Global Exam (PYQ)</h1>

      <input placeholder="Title"
        onChange={e => setTitle(e.target.value)}
      /><br/><br/>

      <select onChange={e => setExamCategory(e.target.value)}>
        <option value="JEE_MAINS">JEE Mains</option>
        <option value="JEE_ADVANCED">JEE Advanced</option>
        <option value="NEET">NEET</option>
      </select><br/><br/>

      <select onChange={e => setExamType(e.target.value)}>
        <option value="WEEKLY_TEST">Weekly</option>
        <option value="MONTHLY_TEST">Monthly</option>
        <option value="GRAND_TEST">Grand</option>
      </select><br/><br/>

      <select onChange={e => setTargetYear(e.target.value)}>
        <option value="1">1st Year</option>
        <option value="2">2nd Year</option>
      </select><br/><br/>

      <input
        type="number"
        placeholder="Duration"
        onChange={e => setDuration(e.target.value)}
      /><br/><br/>

      <button onClick={createExam} disabled={saving}>
        {saving ? 'Creating...' : 'Create'}
      </button>

      {status && <p>{status}</p>}
    </div>
  )
}
