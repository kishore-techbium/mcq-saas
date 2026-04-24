'use client'

import { supabase } from '../../../../lib/supabase'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'

export default function StudentDetailsPage() {
  const { studentId } = useParams()
  const router = useRouter()

  const [student, setStudent] = useState(null)
  const [sessions, setSessions] = useState([])
  const [grouped, setGrouped] = useState({})
  const [loading, setLoading] = useState(true)
  const [insights, setInsights] = useState([])
  const [overallStats, setOverallStats] = useState(null)

  useEffect(() => {
    if (studentId) fetchData()
  }, [studentId])

  async function fetchData() {
    setLoading(true)

    // 🔹 overall stats
    const { data: overall } = await supabase
      .from('student_overall_stats')
      .select('*')
      .eq('student_id', studentId)
      .single()

    setOverallStats(overall)

    // 🔹 student
    const { data: studentData } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single()

    // 🔹 sessions (ONLY submitted)
    const { data: sessionData } = await supabase
      .from('exam_sessions')
      .select('*')
      .eq('student_id', studentId)
      .eq('submitted', true)
      .order('created_at', { ascending: false })

    // 🔹 insights
    const { data: insightsData } = await supabase
      .from('student_insights')
      .select('*')
      .eq('student_id', studentId)
      .order('score', { ascending: false })

    setInsights(insightsData || [])

    let enriched = []

    if (sessionData?.length > 0) {
      const examIds = [
        ...new Set(sessionData.map((s) => s.exam_id).filter(Boolean))
      ]

      let examsMap = {}

      if (examIds.length > 0) {
        const { data: examsData } = await supabase
          .from('exams')
          .select('id, title, created_at, exam_type, exam_category')
          .in('id', examIds)

        examsData?.forEach((exam) => {
          examsMap[exam.id] = exam
        })
      }

      enriched = sessionData.map((session) => {
        if (!session.exam_id || !examsMap[session.exam_id]) return null

        const exam = examsMap[session.exam_id]

        const totalQ = session.total_questions || 1
        const maxScore = totalQ * 4
        const percent = ((session.score || 0) / maxScore) * 100

        return {
          ...session,
          exam_title: exam.title,
          exam_created_at: exam.created_at,
          exam_type: exam.exam_type,
          exam_category: exam.exam_category,
          percent: Number(percent.toFixed(1))
        }
      })

      enriched = enriched.filter(Boolean)
    }

    // 🔹 group by exam_title (temporary, will change in next step)
    const groupedData = {}
    enriched.forEach((s) => {
      if (!groupedData[s.exam_title]) {
        groupedData[s.exam_title] = []
      }
      groupedData[s.exam_title].push(s)
    })

    setStudent(studentData)
    setSessions(enriched)
    setGrouped(groupedData)

    setLoading(false)
  }

  function exportExcel() {
    if (!sessions.length) return

    const exportData = sessions.map((s) => ({
      Exam: s.exam_title,
      Type: s.exam_type,
      Category: s.exam_category,
      Score: s.percent + '%',
      Attempt_Date: new Date(s.created_at).toLocaleString()
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'History')
    XLSX.writeFile(wb, `${student.email}_History.xlsx`)
  }

  if (loading) return <p style={{ padding: 30 }}>Loading...</p>

  const totalAttempts = overallStats?.total_attempts || 0
  const totalExams = overallStats?.total_exams || 0
  const averageScore = overallStats?.avg_score?.toFixed(1) || 0
  const bestScore = overallStats?.best_score || 0
  const latestScore = overallStats?.last_score || 0

  const avgPercent = (() => {
    if (!sessions.length) return 0
    const values = sessions.map((s) => s.percent || 0)
    return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)
  })()

  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>Student Performance</h1>

      {/* 🔹 SUMMARY */}
      <div style={styles.analyticsBox}>
        <div>
          <strong>Total Exams:</strong> {totalExams} |{' '}
          <strong>Average Score:</strong> {averageScore}% |{' '}
          <strong>Avg % (calculated):</strong> {avgPercent}% |{' '}
          <strong>Best Score:</strong> {bestScore} |{' '}
          <strong>Latest Score:</strong> {latestScore}
        </div>

        {/* 🔹 AI INSIGHTS */}
        <div style={styles.insightBox}>
          <strong>🧠 Student Intelligence Report:</strong>

          {insights.length === 0 && <div>-</div>}

          {insights.slice(0, 3).map((i, index) => (
            <div key={index} style={{ fontSize: 13, marginTop: 5 }}>
              {i.severity === 'high' && '🔴 '}
              {i.severity === 'medium' && '🟠 '}
              {i.severity === 'low' && '🟢 '}
              {i.message}
            </div>
          ))}
        </div>

        <button
          style={{ marginTop: 10 }}
          onClick={() =>
            router.push(`/admin/students/${studentId}/analysis`)
          }
        >
          View Detailed Analysis →
        </button>

        <button style={styles.exportBtn} onClick={exportExcel}>
          Download Excel
        </button>
      </div>

      {/* 🔹 EXAMS */}
      {Object.entries(grouped).map(([examTitle, attempts]) => {
        const best = Math.max(...attempts.map((a) => a.percent || 0))
        const examInfo = attempts[0]

        return (
          <div key={examTitle} style={styles.examBlock}>
            <h2>{examTitle}</h2>

            <p style={styles.meta}>
              Type: {examInfo.exam_type} | Category:{' '}
              {examInfo.exam_category}
            </p>

            <p style={styles.meta}>
              Exams: {attempts.length} | Best %: {best.toFixed(1)}%
            </p>

            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Score</th>
                    <th style={styles.th}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map((a) => {
                    const getStatus = (count) => {
                      if (count === 0) return '✅'
                      if (count <= 2) return '⚠️'
                      return '🚨'
                    }

                    return (
                      <>
                        <tr key={a.id}>
                          <td style={styles.td}>{a.percent}%</td>
                          <td style={styles.td}>
                            {new Date(a.created_at).toLocaleDateString(
                              'en-IN'
                            )}
                          </td>
                        </tr>

                        <tr>
                          <td colSpan="2" style={styles.integrity}>
                            🔐 Tab switch: {a.tab_switch_count || 0}{' '}
                            {getStatus(a.tab_switch_count || 0)} | Blur:{' '}
                            {a.blur_count || 0}{' '}
                            {getStatus(a.blur_count || 0)} | Exit:{' '}
                            {a.fullscreen_exit_count || 0}{' '}
                            {getStatus(a.fullscreen_exit_count || 0)} |
                            Copy: {a.copy_attempts || 0}{' '}
                            {getStatus(a.copy_attempts || 0)}
                          </td>
                        </tr>
                      </>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )
}

const styles = {
  page: {
    padding: 40,
    background: '#f5f7fb',
    minHeight: '100vh'
  },
  heading: { fontSize: 26, fontWeight: 700, marginBottom: 25 },

  analyticsBox: {
    background: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 30,
    border: '1px solid #e5e7eb'
  },

  insightBox: {
    marginTop: 15,
    padding: 10,
    background: '#f9fafb',
    borderRadius: 8
  },

  exportBtn: {
    marginTop: 10,
    padding: '8px 14px',
    background: '#16a34a',
    color: '#fff',
    border: 'none',
    borderRadius: 6
  },

  examBlock: {
    background: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 25,
    border: '1px solid #e5e7eb'
  },

  meta: { fontSize: 13, color: '#555' },

  tableWrapper: { marginTop: 15 },

  table: { width: '100%', borderCollapse: 'collapse' },

  th: { padding: 10, background: '#f9fafb' },

  td: { padding: 10, borderBottom: '1px solid #f1f5f9' },

  integrity: {
    padding: '6px 10px',
    fontSize: 13,
    color: '#444'
  }
}
