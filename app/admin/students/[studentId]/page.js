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

    const { data: overall } = await supabase
      .from('student_overall_stats')
      .select('*')
      .eq('student_id', studentId)
      .single()

    setOverallStats(overall)

    const { data: studentData } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single()

    const { data: sessionData } = await supabase
      .from('exam_sessions')
      .select('*')
      .eq('student_id', studentId)
      .eq('submitted', true)
      .order('created_at', { ascending: false })

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
          exam_type: exam.exam_type,
          exam_category: exam.exam_category,
          percent: Number(percent.toFixed(1))
        }
      })

      enriched = enriched.filter(Boolean)
    }

    // 🔥 GROUP BY EXAM TYPE
    const groupedData = {}

    enriched.forEach((s) => {
      if (!groupedData[s.exam_type]) {
        groupedData[s.exam_type] = []
      }
      groupedData[s.exam_type].push(s)
    })

    // sort latest first
    Object.keys(groupedData).forEach((type) => {
      groupedData[type].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      )
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
      Date: new Date(s.created_at).toLocaleString()
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'History')
    XLSX.writeFile(wb, `${student.email}_History.xlsx`)
  }

  if (loading) return <p style={{ padding: 30 }}>Loading...</p>

  const totalExams = overallStats?.total_exams || 0
  const averageScore = overallStats?.avg_score?.toFixed(1) || 0
  const bestScore = overallStats?.best_score || 0
  const latestScore = overallStats?.last_score || 0
  
  const typeCounts = (() => {
  const counts = {}

  sessions.forEach((s) => {
    if (!counts[s.exam_type]) counts[s.exam_type] = 0
    counts[s.exam_type]++
  })

  return counts
})()
  // 🔥 TYPE-WISE STATS
  const typeStats = (() => {
    const map = {}

    sessions.forEach((s) => {
      if (!map[s.exam_type]) map[s.exam_type] = []
      map[s.exam_type].push(s.percent || 0)
    })

    const result = {}

    Object.keys(map).forEach((type) => {
      const arr = map[type]

      const avg =
        arr.reduce((a, b) => a + b, 0) / (arr.length || 1)

      const latest = arr[0] || 0
      const prev = arr[1] || 0

      let trend = '→'
      if (latest > prev) trend = '↑'
      if (latest < prev) trend = '↓'

      result[type] = {
        avg: avg.toFixed(1),
        latest,
        trend
      }
    })

    return result
  })()

  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>Student Intelligence Dashboard</h1>

      {/* 🔥 TOP INTELLIGENCE */}
      <div style={styles.analyticsBox}>
     <div>
  <strong>Exam Distribution:</strong>{' '}
  {Object.entries(typeCounts).map(([type, count]) => (
    <span key={type} style={{ marginRight: 15 }}>
      {type.replace('_TEST', '')}: {count}
    </span>
  ))}
</div>

        <div style={styles.compareBox}>
          <strong>📊 Performance by Type:</strong>
          {Object.entries(typeStats).map(([type, val]) => (
            <div key={type}>
              {type} → Avg: {val.avg}% | Trend: {val.trend}
            </div>
          ))}
        </div>

        <div style={styles.intelBox}>
          <strong>🧠 Intelligence:</strong>

          {(() => {
            const entries = Object.entries(typeStats)
            if (!entries.length) return <div>-</div>

            let weak = entries[0]
            let strong = entries[0]

            entries.forEach((e) => {
              if (Number(e[1].avg) < Number(weak[1].avg)) weak = e
              if (Number(e[1].avg) > Number(strong[1].avg)) strong = e
            })

            return (
              <>
                <div>🔴 Weakest: {weak[0]}</div>
                <div>🟢 Strongest: {strong[0]}</div>
                {entries.map(([type, val]) => (
                  <div key={type}>
                    {val.trend === '↑' && `🟢 Improving in ${type}`}
                    {val.trend === '↓' && `🔴 Declining in ${type}`}
                  </div>
                ))}
              </>
            )
          })()}
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

      {/* 🔥 GRID */}
      <div style={styles.grid}>
        {Object.entries(grouped).map(([type, exams]) => {
          const avg =
            exams.reduce((a, b) => a + b.percent, 0) /
            (exams.length || 1)

          const best = Math.max(...exams.map((e) => e.percent))

          const latest = exams[0]?.percent || 0
          const prev = exams[1]?.percent || 0

          let trend = '→'
          if (latest > prev) trend = '↑'
          if (latest < prev) trend = '↓'

          return (
            <div key={type} style={styles.column}>
              <h2 style={styles.columnTitle}>{type}</h2>

              <div style={styles.summary}>
                Avg: {avg.toFixed(1)}% <br />
                Best: {best.toFixed(1)}% <br />
                Trend: {trend}
              </div>

              {exams.map((e) => (
                <div key={e.id} style={styles.card}>
                  <div style={styles.cardHeader}>
                    {e.exam_title}
                  </div>
                  <div style={styles.score}>{e.percent}%</div>
                  <div style={styles.date}>
                    {new Date(e.created_at).toLocaleDateString('en-IN')}
                  </div>
                </div>
              ))}
            </div>
          )
        })}
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

  heading: {
    fontSize: 26,
    fontWeight: 700,
    marginBottom: 20
  },

  analyticsBox: {
    background: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 25,
    border: '1px solid #e5e7eb'
  },

  compareBox: {
    marginTop: 10,
    padding: 10,
    background: '#eef2ff',
    borderRadius: 8
  },

  intelBox: {
    marginTop: 10,
    padding: 10,
    background: '#fef9c3',
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

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: 20
  },

  column: {
    background: '#ffffff',
    borderRadius: 10,
    padding: 15,
    border: '2px solid #e5e7eb'
  },

  columnTitle: {
    fontSize: 18,
    fontWeight: 600,
    marginBottom: 10,
    borderBottom: '1px solid #ddd',
    paddingBottom: 5
  },

  summary: {
    fontSize: 13,
    marginBottom: 10,
    color: '#444'
  },

  card: {
    padding: 10,
    marginBottom: 10,
    background: '#f9fafb',
    borderRadius: 8,
    border: '1px solid #e5e7eb'
  },

  cardHeader: {
    fontSize: 13,
    fontWeight: 600
  },

  score: {
    fontSize: 18,
    fontWeight: 700
  },

  date: {
    fontSize: 12,
    color: '#666'
  }
}
