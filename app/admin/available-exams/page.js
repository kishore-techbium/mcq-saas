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

  // ✅ NEW ROLE CHECK
  if (user?.role !== 'admin') {
    window.location.href = '/'
    return
  }

  await loadExams()
  setLoading(false)
}

  async function loadExams() {
    /* ===== FETCH EXAMS ===== */
const collegeId = await getAdminCollege()

const { data: examsData } = await supabase
  .from('exams')
  .select('*')
  .eq('college_id', collegeId)   // 🔥 IMPORTANT
  .order('created_at', { ascending: false })
    if (error) {
      console.error('Exam fetch error:', error)
      return
    }

    /* ===== FETCH QUESTION COUNTS ===== */
    const examIds = examsData.map(e => e.id)
    const questionCountMap = {}

    if (examIds.length > 0) {
      const { data: mappings } = await supabase
        .from('exam_questions')
        .select('exam_id')
        .in('exam_id', examIds)

      ;(mappings || []).forEach(row => {
        questionCountMap[row.exam_id] =
          (questionCountMap[row.exam_id] || 0) + 1
      })
    }

    const enriched = examsData.map(exam => ({
      ...exam,
      question_count: questionCountMap[exam.id] || 0
    }))

    setExams(enriched)
  }

  async function toggleExam(id, active) {
    await supabase
      .from('exams')
      .update({ is_active: !active })
      .eq('id', id)

    loadExams()
  }

  async function deleteExam(id) {
    const confirmText = prompt('Type DELETE to confirm')
    if (confirmText !== 'DELETE') return

    await supabase.from('exams').delete().eq('id', id)
    loadExams()
  }

  if (loading) {
    return <p style={{ padding: 30 }}>Loading exams…</p>
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>📚 Available Exams</h1>
      <p style={styles.subheading}>
        View and manage all created exams
      </p>

      <div style={styles.card}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Type</th>
              <th>Duration</th>
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
                  <span style={styles.categoryBadge}>
                    {prettyCategory(exam.exam_category)}
                  </span>
                </td>
                <td>{exam.exam_type}</td>
                <td>{exam.duration_minutes} min</td>
                <td>
                  <strong>{exam.question_count}</strong>
                </td>
                <td>
                  <span
                    style={{
                      ...styles.statusBadge,
                      background: exam.is_active ? '#dcfce7' : '#fee2e2',
                      color: exam.is_active ? '#166534' : '#991b1b'
                    }}
                  >
                    {exam.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </td>
                <td>
                  <button
                    style={styles.secondaryBtn}
                    onClick={() => toggleExam(exam.id, exam.is_active)}
                  >
                    {exam.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    style={styles.dangerBtn}
                    onClick={() => deleteExam(exam.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {exams.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: 20 }}>
                  No exams found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ================= HELPERS ================= */

function prettyCategory(cat) {
  if (cat === 'JEE_MAINS') return 'JEE Mains'
  if (cat === 'JEE_ADVANCED') return 'JEE Advanced'
  if (cat === 'NEET') return 'NEET UG'
  return '-'
}

/* ================= STYLES ================= */

const styles = {
  page: {
    padding: 40,
    minHeight: '100vh',
    background: '#f8fafc',
    fontFamily: 'system-ui, sans-serif'
  },
  heading: {
    fontSize: 30,
    marginBottom: 6
  },
  subheading: {
    color: '#555',
    marginBottom: 24
  },
  card: {
    background: '#fff',
    borderRadius: 14,
    boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  categoryBadge: {
    padding: '4px 10px',
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 600,
    background: '#e0f2fe',
    color: '#0369a1'
  },
  statusBadge: {
    padding: '4px 10px',
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 700
  },
  secondaryBtn: {
    padding: '6px 10px',
    background: '#e5e7eb',
    border: 'none',
    borderRadius: 6,
    marginRight: 6,
    cursor: 'pointer'
  },
  dangerBtn: {
    padding: '6px 10px',
    background: '#fee2e2',
    color: '#991b1b',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer'
  }
}
