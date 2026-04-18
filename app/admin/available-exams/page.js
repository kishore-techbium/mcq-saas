'use client'

import { supabase } from '../../../lib/supabase'
import { getAdminCollege } from '../../../lib/getAdminCollege'
import { useEffect, useState } from 'react'

export default function AvailableExamsPage() {
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)

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
console.log('Admin College:', collegeId)
console.log('Exam Data:', examsData)
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
async function updateExamTime(id, value) {
  const collegeId = await getAdminCollege()

  // Step 1: value is IST from input
  const istDate = new Date(value)

  // Step 2: convert IST → UTC
  const utcDate = new Date(
    istDate.getTime() - (5.5 * 60 * 60 * 1000)
  )

  const { error } = await supabase
    .from('exams')
    .update({
      exam_start_time: utcDate
    })
    .eq('id', id)
    .eq('college_id', collegeId)

  if (error) {
    console.error(error)
    alert('Failed to update exam time')
    return
  }

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
              <th>Questions</th>
              <th>Status</th>
              <th>Actions</th>
              <th>Exam Time</th>
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
                <input
                  type="datetime-local"
value={
  exam.exam_start_time
    ? new Date(
        new Date(exam.exam_start_time).toLocaleString('en-US', {
          timeZone: 'Asia/Kolkata'
        })
      )
        .toISOString()
        .slice(0, 16)
    : ''
}
                  onChange={(e) => updateExamTime(exam.id, e.target.value)}
                  style={{
                    padding: '4px',
                    fontSize: 12
                  }}
                />
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
