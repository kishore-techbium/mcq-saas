'use client'

import { supabase } from '../../../../lib/supabase'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'
import * as XLSX from 'xlsx'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend
)

export default function ExamAnalyticsPage() {
  const { examId } = useParams()

  const [exam, setExam] = useState(null)
  const [sessions, setSessions] = useState([])
  const [studentsMap, setStudentsMap] = useState({})
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [weakSubjects, setWeakSubjects] = useState([])
  const [weakChapters, setWeakChapters] = useState([])
  const [strongAreas, setStrongAreas] = useState([])
  const [difficulty, setDifficulty] = useState('')
const [submitted, setSubmitted] = useState([])
  useEffect(() => {
    if (examId) fetchAll()
  }, [examId])

  async function fetchAll() {
    setLoading(true)

    // Exam
    const { data: examData } = await supabase
      .from('exams')
      .select('*')
      .eq('id', examId)
      .single()
const { data: examStats } = await supabase
  .from('student_exam_stats')
  .select('*')
  .eq('exam_id', examId)

const submittedLocal = examStats || []
    // Sessions
    const { data: sessionData } = await supabase
      .from('exam_sessions')
      .select('*')
      .eq('exam_id', examId)


    // Students
    const studentIds = [
  ...new Set(
    submittedLocal
      .map(s => s.student_id)
      .filter(id => id && typeof id === 'string')
  )
]
    console.log('clean studentIds:', studentIds)
    const { data: students } = await supabase
      .from('students')
      .select('*')
      .in('id', studentIds)

    let studentMap = {}
    students?.forEach(s => {
      studentMap[s.id] = {
        name: `${s.first_name || ''} ${s.last_name || ''}`.trim(),
        email: s.email
      }
    })

    setSubmitted(submittedLocal)
    setExam(examData)
    setSessions(sessionData || [])
    setStudentsMap(studentMap)
// =========================
// 🔥 PERFORMANCE INTELLIGENCE
// =========================


// SUBJECT STATS
const { data: subjectStats } = await supabase
  .from('student_subject_stats')
  .select('*')
  .or(
    studentIds.map(id => `student_id.eq.${id}`).join(',')
  )
const subjectAgg = {}

subjectStats?.forEach(s => {
  if (!subjectAgg[s.subject]) {
    subjectAgg[s.subject] = { total: 0, count: 0 }
  }
  subjectAgg[s.subject].total += s.accuracy
  subjectAgg[s.subject].count++
})

const subjectArray = Object.entries(subjectAgg).map(([k, v]) => ({
  subject: k,
  accuracy: v.total / v.count
}))

subjectArray.sort((a, b) => a.accuracy - b.accuracy)

console.log('studentIds:', studentIds)
console.log('subjectStats:', subjectStats)


const total = subjectArray.length
const weakCount = Math.ceil(total / 2)
setWeakSubjects(subjectArray.slice(0, weakCount))
setStrongAreas(subjectArray.slice(weakCount).reverse())
// CHAPTER STATS 
  const { data: subtopicStats } = await supabase
  .from('student_subtopic_stats')
.select('*')
  .or(
    studentIds.map(id => `student_id.eq.${id}`).join(',')
  )
  
console.log('subtopicStats:', subtopicStats)
const chapterAgg = {}

subtopicStats?.forEach(s => {
  if (!chapterAgg[s.chapter]) {
    chapterAgg[s.chapter] = { total: 0, count: 0 }
  }
  chapterAgg[s.chapter].total += s.accuracy
  chapterAgg[s.chapter].count++
})

const chapterArray = Object.entries(chapterAgg).map(([k, v]) => ({
  chapter: k,
  accuracy: v.total / v.count
}))

chapterArray.sort((a, b) => a.accuracy - b.accuracy)

setWeakChapters(chapterArray.slice(0, Math.ceil(chapterArray.length / 2)))

const avgScore =
submittedLocal.length > 0
  ? (
      submittedLocal.reduce((total, s) => {
        return total + (s.avg_score || 0)
      }, 0) / submittedLocal.length
    ).toFixed(1)
  : 0

if (avgScore < 10) setDifficulty('Hard')
else if (avgScore < 25) setDifficulty('Medium')
else setDifficulty('Easy')
    
    setLoading(false)
  }

  if (loading) return <p style={{ padding: 30 }}>Loading...</p>

  // =========================
  // PROCTOR FLAG COUNT
  // =========================
  const rejectedSessions = submitted.filter(
    s => s.proctor_status === 'REJECTED'
  )

  // =========================
  // LEADERBOARD
  // =========================
  const leaderboard = Object.values(
    
    submitted.reduce((acc, s) => {
      if (!acc[s.student_id]) {
        acc[s.student_id] = {
          student_id: s.student_id,
          best: 0,
          attempts: s.total_exams || 0,
          rejected: false
        }
      }

      acc[s.student_id].attempts++
     acc[s.student_id].best = Math.max(
  acc[s.student_id].best,
  s.avg_score || 0
)

      if (s.proctor_status === 'REJECTED') {
        acc[s.student_id].rejected = true
      }

      return acc
    }, {})
  ).sort((a, b) => b.best - a.best)

  // =========================
  // SCORE DISTRIBUTION
  // =========================
  const buckets = { '0-25': 0, '26-50': 0, '51-75': 0, '76-100': 0 }

  submitted.forEach(s => {
  const totalQ = exam?.total_questions || 1
const maxScore = totalQ * (exam?.correct_marks || 4)

const percent = Math.max(0, s.avg_score || 0 * 100)
    if (percent <= 25) buckets['0-25']++
    else if (percent <= 50) buckets['26-50']++
    else if (percent <= 75) buckets['51-75']++
    else buckets['76-100']++
  })

  const distributionData = {
    labels: Object.keys(buckets),
    datasets: [
      {
        data: Object.values(buckets),
        backgroundColor: '#3b82f6'
      }
    ]
  }

  const trendData = {
    labels: submitted.map((_, i) => `A${i + 1}`),
    datasets: [
      {
        data: submitted.map(s => {
const totalQ = exam?.total_questions || 1
const maxScore = totalQ * (exam?.correct_marks || 4)

const percent = Math.max(0, return s.avg_score || 0 * 100)
  return Math.max(0, return s.avg_score || 0 * 100)
}),
        borderColor: '#10b981',
        fill: false
      }
    ]
  }

  function exportExcel() {
    const data = leaderboard.map((l, i) => ({
      Rank: i + 1,
      Student: studentsMap[l.student_id]?.name,
      Email: studentsMap[l.student_id]?.email,
      Best: l.best,
      Attempts: l.attempts,
      Proctor_Status: l.rejected ? 'REJECTED' : 'OK'
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Leaderboard')
    XLSX.writeFile(wb, `${exam.title}_Analytics.xlsx`)
  }

  const medal = rank => {
    if (rank === 0) return '🥇'
    if (rank === 1) return '🥈'
    if (rank === 2) return '🥉'
    return rank + 1
  }

  const kpiCard = {
    background: '#ffffff',
    padding: 25,
    borderRadius: 14,
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    textAlign: 'center'
  }

  const kpiNumber = {
    fontSize: 28,
    fontWeight: 600,
    marginBottom: 8
  }

  const kpiLabel = {
    color: '#6b7280',
    fontSize: 14
  }

  const th = {
    padding: 12,
    textAlign: 'left',
    borderBottom: '1px solid #e5e7eb'
  }

  const td = {
    padding: 12,
    borderBottom: '1px solid #f3f4f6'
  }

  const chartCard = {
    background: '#ffffff',
    padding: 20,
    borderRadius: 14,
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
  }

  return (
    <div
      style={{
        padding: 40,
        background: '#f3f4f6',
        minHeight: '100vh'
      }}
    >
      <h1
        style={{
          fontSize: 28,
          fontWeight: 600,
          marginBottom: 25
        }}
      >
        {exam.title} - Enterprise Analytics
      </h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 30 }}>
        {['overview', 'leaderboard', 'graphs', 'intelligence'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 18px',
              borderRadius: 20,
              border: 'none',
              cursor: 'pointer',
              fontWeight: 500,
              background:
                activeTab === tab ? '#2563eb' : '#e5e7eb',
              color:
                activeTab === tab ? '#fff' : '#111827'
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 20
          }}
        >
          <div style={kpiCard}>
            <div style={kpiNumber}>{sessions.length}</div>
            <div style={kpiLabel}>Total Attempts</div>
          </div>

          <div style={kpiCard}>
            <div style={kpiNumber}>{submitted.length}</div>
            <div style={kpiLabel}>Submitted</div>
          </div>

          <div style={kpiCard}>
            <div style={kpiNumber}>
              {submitted.length > 0
  ? (
      submitted.reduce((total, s) => {
        return total + (s.avg_score || 0)
      }, 0) / submitted.length
    ).toFixed(1)
  : 0}
            </div>
            <div style={kpiLabel}>Average Score</div>
          </div>

          <div style={kpiCard}>
            <div style={kpiNumber}>
              {rejectedSessions.length}
            </div>
            <div style={kpiLabel}>
              ⚠ Proctor Rejections
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      {activeTab === 'leaderboard' && (
        <div
          style={{
            background: '#fff',
            padding: 25,
            borderRadius: 12,
            boxShadow:
              '0 4px 10px rgba(0,0,0,0.05)'
          }}
        >
          <button
            onClick={exportExcel}
            style={{
              marginBottom: 20,
              padding: '8px 16px',
              background: '#10b981',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer'
            }}
          >
            Download Leaderboard
          </button>

          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}
          >
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={th}>Rank</th>
                <th style={th}>Student</th>
                <th style={th}>Email</th>
                <th style={th}>Best</th>
                <th style={th}>Attempts</th>
                <th style={th}>Proctor</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((l, i) => (
                <tr key={l.student_id}>
                  <td style={td}>{medal(i)}</td>
                  <td style={td}>
                    {studentsMap[l.student_id]?.name}
                  </td>
                  <td
                    style={{
                      ...td,
                      color: '#6b7280'
                    }}
                  >
                    {
                      studentsMap[l.student_id]
                        ?.email
                    }
                  </td>
                  <td style={td}>{l.best}</td>
                  <td style={td}>{l.attempts}</td>
                  <td style={td}>
                    {l.rejected ? (
                      <span
                        style={{
                          background: '#dc2626',
                          color: '#fff',
                          padding:
                            '4px 10px',
                          borderRadius: 20,
                          fontSize: 12
                        }}
                      >
                        REJECTED
                      </span>
                    ) : (
                      <span
                        style={{
                          background: '#16a34a',
                          color: '#fff',
                          padding:
                            '4px 10px',
                          borderRadius: 20,
                          fontSize: 12
                        }}
                      >
                        OK
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Graphs */}
      {activeTab === 'graphs' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit,minmax(300px,1fr))',
            gap: 20
          }}
        >
      
          <div style={chartCard}>
            <h4>Score Distribution</h4>
            <Bar data={distributionData} height={150} />
          </div>

          <div style={chartCard}>
            <h4>Score Trend</h4>
            <Line data={trendData} height={150} />
          </div>
        </div>
      )}

      {/* 🔥 INTELLIGENCE TAB */}
{activeTab === 'intelligence' && (
  <div
    style={{
      background: '#ffffff',
      padding: 25,
      borderRadius: 12,
      boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
    }}
  >
    <h2>🧠 Performance Intelligence</h2>

    <p><strong>Exam Difficulty:</strong> {difficulty}</p>

    <h4 style={{ marginTop: 20 }}>🔴 Weak Subjects</h4>
    {weakSubjects.length === 0 && <p>-</p>}
    {weakSubjects.map((s, i) => (
      <p key={i}>
        {s.subject} → {s.accuracy.toFixed(1)}%
      </p>
    ))}

    <h4 style={{ marginTop: 20 }}>🟠 Weak Chapters</h4>
    {weakChapters.length === 0 && <p>-</p>}
    {weakChapters.map((c, i) => (
      <p key={i}>
        {c.chapter} → {c.accuracy.toFixed(1)}%
      </p>
    ))}

    <h4 style={{ marginTop: 20 }}>🟢 Strong Areas</h4>
    {strongAreas.length === 0 && <p>-</p>}
    {strongAreas.map((s, i) => (
      <p key={i}>
        {s.subject} → {s.accuracy.toFixed(1)}%
      </p>
    ))}
  </div>
)}
        
    </div>
  )
}
