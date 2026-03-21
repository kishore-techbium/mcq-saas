'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'
import Link from 'next/link'

export default function ProctorExamSessions() {
  const { examId } = useParams()

  const [sessions, setSessions] = useState([])
  const [exam, setExam] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (examId) fetchData()
  }, [examId])

  async function fetchData() {
    setLoading(true)

    try {
      // 1️⃣ Get exam info
      const { data: examData } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single()

      setExam(examData)

      // 2️⃣ Get sessions for this exam
      const { data: sessionData } = await supabase
        .from('exam_sessions')
        .select('*')
        .eq('exam_id', examId)

      if (!sessionData || sessionData.length === 0) {
        setSessions([])
        setLoading(false)
        return
      }

      // 3️⃣ Only sessions that have proctor images
      const sessionIds = sessionData.map(s => s.id)

      const { data: images } = await supabase
        .from('proctoring_images')
        .select('exam_session_id')
        .in('exam_session_id', sessionIds)

      const imageSessionIds = [
        ...new Set(images?.map(i => i.exam_session_id))
      ]

      const filteredSessions = sessionData.filter(s =>
        imageSessionIds.includes(s.id)
      )

      // 4️⃣ Fetch students
      const studentIds = filteredSessions.map(s => s.student_id)

      const { data: students } = await supabase
        .from('students')
        .select('*')
        .in('id', studentIds)

      // 5️⃣ Enrich
      const enriched = filteredSessions.map(s => ({
        ...s,
        student: students?.find(st => st.id === s.student_id),
        capture_count:
          images.filter(img => img.exam_session_id === s.id).length
      }))

      setSessions(enriched)
    } catch (err) {
      console.error(err)
    }

    setLoading(false)
  }

  if (loading)
    return <p style={{ padding: 40 }}>Loading...</p>

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>
        🎥 {exam?.title} – Proctor Sessions
      </h1>

      <div style={styles.wrapper}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.headRow}>
              <th style={styles.th}>S.No</th>
              <th style={styles.th}>Student</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Attempt</th>
              <th style={styles.th}>Captures</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s, i) => (
              <tr key={s.id}>
                <td style={styles.td}>{i + 1}</td>

                <td style={styles.td}>
                  {s.student?.first_name} {s.student?.last_name}
                </td>

                <td style={{ ...styles.td, color: '#6b7280' }}>
                  {s.student?.email}
                </td>

                <td style={styles.td}>{s.attempt_number}</td>

                <td style={styles.td}>{s.capture_count}</td>

                <td style={styles.td}>
                  <span
                    style={{
                      ...styles.badge,
                      background:
                        s.proctor_status === 'REJECTED'
                          ? '#dc2626'
                          : s.proctor_status === 'APPROVED'
                          ? '#16a34a'
                          : '#facc15',
                      color:
                        s.proctor_status === 'PENDING'
                          ? '#111827'
                          : '#fff'
                    }}
                  >
                    {s.proctor_status || 'PENDING'}
                  </span>
                </td>

                <td style={styles.td}>
                  <Link href={`/admin/proctoring/session/${s.id}`}>
                    <button style={styles.btn}>
                      Review
                    </button>
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
    fontSize: 22,
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
    cursor: 'pointer',
    fontWeight: 600
  },

  badge: {
    padding: '6px 12px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600
  }
}