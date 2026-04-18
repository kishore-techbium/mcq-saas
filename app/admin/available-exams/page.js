'use client'

import { supabase } from '../../../lib/supabase'
import { getAdminCollege } from '../../../lib/getAdminCollege'
import { useEffect, useState } from 'react'

export default function AvailableExamsPage() {
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState({})
  useEffect(() => {
    init()
  }, [])

  async function init() {
    try {
      const { data } = await supabase.auth.getUser()

      if (!data?.user) {
        window.location.href = '/'
        return
      }

      const email = data.user.email

      const { data: user, error } = await supabase
        .from('students')
        .select('role')
        .eq('email', email)
        .single()

      if (error) {
        console.error(error)
        return
      }

      if (user?.role !== 'admin') {
        window.location.href = '/'
        return
      }

      await loadExams()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function loadExams() {
    try {
      const collegeId = await getAdminCollege()

      const { data: examsData, error } = await supabase
        .from('exams')
        .select('*')
        .eq('college_id', collegeId) // ✅ FILTER ADDED
        .order('created_at', { ascending: false })

      if (error) {
        console.error(error)
        return
      }

      const examIds = (examsData || []).map(e => e.id)

      const { data: mappings } = await supabase
        .from('exam_questions')
        .select('exam_id')
        .in('exam_id', examIds)

      const countMap = {}

      ;(mappings || []).forEach(m => {
        countMap[m.exam_id] = (countMap[m.exam_id] || 0) + 1
      })

      const finalData = (examsData || []).map(e => ({
        ...e,
        question_count: countMap[e.id] || 0
      }))

      setExams(finalData)
    } catch (err) {
      console.error(err)
    }
  }

  function prettyCategory(cat) {
    if (!cat) return ''
    return cat.replaceAll('_', ' ').toUpperCase()
  }
async function toggleExam(id, active) {
  const collegeId = await getAdminCollege()
  const { data, error } = await supabase
    .from('exams')
    .update({ is_active: !active })
    .eq('id', id)
    .eq('college_id', collegeId)
    .select()

  if (error) {
    alert('Update failed: ' + error.message)
    return
  }

  if (!data || data.length === 0) {
    alert('No rows updated → check college_id or RLS')
    return
  }

  loadExams()
}
async function updateExamDateTime(id, date, time) {
  const collegeId = await getAdminCollege()

  if (!date || !time) {
    setSaveStatus(prev => ({ ...prev, [id]: 'error' }))
    return
  }

  const { error } = await supabase
    .from('exams')
    .update({
      exam_date: date,
      exam_time: time
    })
    .eq('id', id)
    .eq('college_id', collegeId)

  if (error) {
    setSaveStatus(prev => ({ ...prev, [id]: 'error' }))
    return
  }

  // ✅ success
  setSaveStatus(prev => ({ ...prev, [id]: 'success' }))

  // auto clear after 2 sec
  setTimeout(() => {
    setSaveStatus(prev => ({ ...prev, [id]: '' }))
  }, 2000)

  loadExams()
}
 
async function deleteExam(id) {
  const confirmText = prompt('Type DELETE to confirm')
  if (confirmText !== 'DELETE') return

  const collegeId = await getAdminCollege()

  const { data, error } = await supabase
    .from('exams')
    .delete()
    .eq('id', id)
    .eq('college_id', collegeId)
    .select()


  if (error) {
    alert('Delete failed: ' + error.message)
    return
  }

  if (!data || data.length === 0) {
    alert('No rows deleted → check college_id or RLS')
    return
  }

  loadExams()
}
  if (loading) return <p>Loading exams...</p>

  return (
    <div style={{ padding: 20 }}>
      <h1>Available Exams</h1>
      <p style={{ color: '#666' }}>View and manage all created exams</p>

      <div style={{
        marginTop: 20,
        background: '#fff',
        borderRadius: 10,
        padding: 15
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left' }}>
          <th>Title</th>
          <th>Category</th>
          <th>Type</th>
          <th>Duration</th>
          <th>Exam Time</th>
          <th>Questions</th>
          <th>Status</th>
          <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {exams.map(exam => (
              <tr key={exam.id}>
                <td>{exam.title}</td>

                <td>
                  <span style={{
                    background: '#d0e7ff',
                    padding: '5px 10px',
                    borderRadius: 10,
                    fontSize: 12
                  }}>
                    {prettyCategory(exam.exam_category)}
                  </span>
                </td>

                <td>{exam.exam_type || 'MOCK'}</td>

                <td>{exam.duration_minutes} min</td>
            <td>
  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
    <input
      type="date"
      value={exam.exam_date || ''}
      onChange={(e) => {
        const updated = [...exams]
        const idx = updated.findIndex(x => x.id === exam.id)
        updated[idx].exam_date = e.target.value
        setExams(updated)
      }}
    />

    <input
      type="time"
      value={exam.exam_time || ''}
      onChange={(e) => {
        const updated = [...exams]
        const idx = updated.findIndex(x => x.id === exam.id)
        updated[idx].exam_time = e.target.value
        setExams(updated)
      }}
    />

<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
  <button
    onClick={() => updateExamDateTime(exam.id, exam.exam_date, exam.exam_time)}
    style={{
      padding: '4px 8px',
      fontSize: 12,
      cursor: 'pointer'
    }}
  >
    Save
  </button>

  {saveStatus[exam.id] === 'success' && (
    <span style={{ color: 'green', fontSize: 12 }}>Saved ✅</span>
  )}

  {saveStatus[exam.id] === 'error' && (
    <span style={{ color: 'red', fontSize: 12 }}>Error ❌</span>
  )}
</div>
  </div>
</td>
                <td><b>{exam.question_count}</b></td>

                <td>
                  <span style={{
                    background: exam.is_active ? '#d4edda' : '#f8d7da',
                    color: exam.is_active ? 'green' : 'red',
                    padding: '5px 10px',
                    borderRadius: 10,
                    fontSize: 12
                  }}>
                    {exam.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </td>

                <td>
                  <button
                    onClick={() => toggleExam(exam.id, exam.is_active)}
                    style={{ marginRight: 10 }}
                  >
                    {exam.is_active ? 'Deactivate' : 'Activate'}
                  </button>

                  <button
                    onClick={() => deleteExam(exam.id)}
                    style={{ color: 'red' }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {exams.length === 0 && (
          <p style={{ marginTop: 20 }}>No exams found</p>
        )}
      </div>
    </div>
  )
}
