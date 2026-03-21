'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import Link from 'next/link'

export default function ProctoringExams() {
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    // Get sessions with images
    const { data: imageSessions } = await supabase
      .from('proctoring_images')
      .select('exam_session_id')

    if (!imageSessions || imageSessions.length === 0) {
      setExams([])
      setLoading(false)
      return
    }

    const sessionIds = [
      ...new Set(imageSessions.map(i => i.exam_session_id))
    ]

    const { data: sessions } = await supabase
      .from('exam_sessions')
      .select('*')
      .in('id', sessionIds)

    const examIds = [...new Set(sessions.map(s => s.exam_id))]

    const { data: examsData } = await supabase
      .from('exams')
      .select('*')
      .in('id', examIds)

    const summary = examsData.map(exam => {
      const related = sessions.filter(s => s.exam_id === exam.id)

      return {
        ...exam,
        total: related.length,
        pending: related.filter(s => s.proctor_status === 'PENDING').length,
        approved: related.filter(s => s.proctor_status === 'APPROVED').length,
        rejected: related.filter(s => s.proctor_status === 'REJECTED').length
      }
    })

    setExams(summary)
    setLoading(false)
  }

  if (loading) return <p style={{ padding: 40 }}>Loading...</p>

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>🎥 Proctored Exams</h1>

      <div style={styles.wrapper}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.headRow}>
              <th style={styles.th}>S.No</th>
              <th style={styles.th}>Exam Title</th>
              <th style={styles.th}>Total Attempts</th>
              <th style={styles.th}>Pending</th>
              <th style={styles.th}>Approved</th>
              <th style={styles.th}>Rejected</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {exams.map((e, i) => (
              <tr key={e.id}>
                <td style={styles.td}>{i + 1}</td>
                <td style={styles.td}>{e.title}</td>
                <td style={styles.td}>{e.total}</td>
                <td style={{ ...styles.td, color: '#f59e0b' }}>{e.pending}</td>
                <td style={{ ...styles.td, color: '#16a34a' }}>{e.approved}</td>
                <td style={{ ...styles.td, color: '#dc2626' }}>{e.rejected}</td>
                <td style={styles.td}>
                  <Link href={`/admin/proctoring/${e.id}`}>
                    <button style={styles.btn}>View Students</button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const styles = {
  page: {
    padding: 40,
    background: '#f3f4f6',
    minHeight: '100vh'
  },
  title: {
    marginBottom: 25,
    fontSize: 24,
    fontWeight: 600
  },
  wrapper: {
    background: '#fff',
    borderRadius: 14,
    boxShadow: '0 6px 20px rgba(0,0,0,0.06)',
    overflow: 'hidden'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  headRow: {
    background: '#f9fafb'
  },
  th: {
    padding: 14,
    textAlign: 'left',
    fontWeight: 600,
    borderBottom: '1px solid #e5e7eb'
  },
  td: {
    padding: 14,
    borderBottom: '1px solid #f3f4f6'
  },
  btn: {
    padding: '6px 14px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer'
  }
}