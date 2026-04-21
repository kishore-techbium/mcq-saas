'use client'

import { supabase } from '../../../../lib/supabase'
import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

function format2(n){ return Number(n || 0).toFixed(2) }

export default function ExamAnalyticsPage() {
  const { examId } = useParams()

  const reportRef = useRef()
  const leaderboardRef = useRef()

  const [exam, setExam] = useState(null)
  const [studentsMap, setStudentsMap] = useState({})
  const [submitted, setSubmitted] = useState([])
  const [weakSubjects, setWeakSubjects] = useState([])
  const [moderateAreas, setModerateAreas] = useState([])
  const [strongAreas, setStrongAreas] = useState([])
  const [weakChapters, setWeakChapters] = useState([])
  const [aiInsights, setAiInsights] = useState([])
  const [difficulty, setDifficulty] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (examId) fetchAll()
  }, [examId])

  async function fetchAll() {
    setLoading(true)

    // 🔹 exam
    const { data: examData } = await supabase
      .from('exams')
      .select('*')
      .eq('id', examId)
      .single()

    // 🔹 exam stats
    const { data: stats } = await supabase
      .from('student_exam_stats')
      .select('*')
      .eq('exam_id', examId)

    const studentIds = [...new Set(stats.map(s => s.student_id))]

    // 🔹 students
    const { data: students } = await supabase
      .from('students')
      .select('*')
      .in('id', studentIds)

    const map = {}
    students?.forEach(s => {
      map[s.id] = {
        name: `${s.first_name || ''} ${s.last_name || ''}`,
        email: s.email
      }
    })

    setStudentsMap(map)
    setSubmitted(stats || [])
    setExam(examData)

    // ================= SUBJECT ANALYSIS =================
    const { data: subjectStats } = await supabase
      .from('student_subject_stats')
      .select('*')
      .in('student_id', studentIds)

    const subjectAgg = {}

    subjectStats?.forEach(s => {
      if (!subjectAgg[s.subject]) {
        subjectAgg[s.subject] = { correct: 0, total: 0 }
      }
      subjectAgg[s.subject].correct += s.correct || 0
      subjectAgg[s.subject].total += s.total_questions || 0
    })

    const subjectArray = Object.entries(subjectAgg).map(([k, v]) => ({
      subject: k,
      accuracy: v.total > 0 ? (v.correct / v.total) * 100 : 0
    }))

    const weak = [], moderate = [], strong = []

    subjectArray.forEach(s => {
      if (s.accuracy < 40) weak.push(s)
      else if (s.accuracy < 70) moderate.push(s)
      else strong.push(s)
    })

    setWeakSubjects(weak)
    setModerateAreas(moderate)
    setStrongAreas(strong)

    // ================= CHAPTER ANALYSIS =================
    const { data: subStats } = await supabase
      .from('student_subtopic_stats')
      .select('*')
      .in('student_id', studentIds)

    const chapterAgg = {}

    subStats?.forEach(s => {
      if (!chapterAgg[s.chapter]) {
        chapterAgg[s.chapter] = { correct: 0, total: 0 }
      }
      chapterAgg[s.chapter].correct += s.correct || 0
      chapterAgg[s.chapter].total += s.total_questions || 0
    })

    const weakChap = Object.entries(chapterAgg)
      .map(([k, v]) => ({
        chapter: k,
        accuracy: v.total > 0 ? (v.correct / v.total) * 100 : 0
      }))
      .filter(c => c.accuracy < 40)
      .sort((a,b)=>a.accuracy-b.accuracy)
      .slice(0,5)

    setWeakChapters(weakChap)

    // ================= DIFFICULTY =================
    const avg =
      stats.reduce((sum, s) => sum + (s.avg_score || 0), 0) / stats.length

    if (avg < 40) setDifficulty('Hard')
    else if (avg < 70) setDifficulty('Medium')
    else setDifficulty('Easy')

    // ================= AI INSIGHTS =================
    const insights = []

    if (weak.length > 0) {
      insights.push(`🔴 Weak Subjects: ${weak.map(s => s.subject).join(', ')}`)
    }

    if (moderate.length > 0) {
      insights.push(`🟡 Moderate: ${moderate.map(s => s.subject).join(', ')}`)
    }

    if (strong.length > 0) {
      insights.push(`🟢 Strong: ${strong.map(s => s.subject).join(', ')}`)
    }

    if (weakChap.length > 0) {
      insights.push(`⚠️ Weak Chapters: ${weakChap.map(c => c.chapter).join(', ')}`)
    }

    insights.push(`📊 Difficulty: ${difficulty}`)
    insights.push(`🎯 Action: Focus revision on weak areas & conduct practice tests`)

    setAiInsights(insights)

    setLoading(false)
  }

  if (loading) return <p style={{ padding: 30 }}>Loading...</p>

  // ================= KPI =================
  const totalStudents = submitted.length

  const avgScore =
    submitted.reduce((s, x) => s + (x.avg_score || 0), 0) / totalStudents

  const maxScore = Math.max(...submitted.map(s => s.best_score || 0))
  const minScore = Math.min(...submitted.map(s => s.best_score || 0))
  const passCount = submitted.filter(s => (s.avg_score || 0) >= 40).length

  // ================= DISTRIBUTION =================
  const buckets = { '0-25': 0, '26-50': 0, '51-75': 0, '76-100': 0 }

  submitted.forEach(s => {
    const percent = s.avg_score || 0
    if (percent <= 25) buckets['0-25']++
    else if (percent <= 50) buckets['26-50']++
    else if (percent <= 75) buckets['51-75']++
    else buckets['76-100']++
  })

  const chartData = {
    labels: Object.keys(buckets),
    datasets: [{ data: Object.values(buckets), backgroundColor: '#3b82f6' }]
  }

  // ================= LEADERBOARD =================
  const leaderboard = submitted
    .map(s => ({
      student_id: s.student_id,
      score: s.best_score || 0,
      rejected: s.proctor_status === 'REJECTED'
    }))
    .sort((a, b) => b.score - a.score)

  // ================= PDF =================
  async function downloadPDF() {

    const pdf = new jsPDF('p','mm','a4')

    // PAGE 1 (analytics)
    const canvas1 = await html2canvas(reportRef.current, { scale: 2 })
    const img1 = canvas1.toDataURL('image/png')
    pdf.addImage(img1, 'PNG', 0, 0, 210, 297)

    // PAGE 2 (leaderboard clean)
    pdf.addPage()

    const canvas2 = await html2canvas(leaderboardRef.current, { scale: 2 })
    const img2 = canvas2.toDataURL('image/png')
    pdf.addImage(img2, 'PNG', 0, 0, 210, 297)

    pdf.save(`${exam.title}.pdf`)
  }

  return (
    <div style={{ padding: 30, background: '#f3f4f6' }}>

      <button onClick={downloadPDF} style={styles.pdfBtn}>
        Download PDF
      </button>

      {/* ================= MAIN ANALYTICS ================= */}
      <div ref={reportRef}>

        {/* HEADER */}
        <h1>{exam.title}</h1>
        <p>{exam.exam_category} | {exam.exam_type} | {new Date(exam.created_at).toDateString()}</p>

        {/* KPI */}
        <div style={styles.kpiRow}>
          <KPI title="Students" value={totalStudents} color="#3b82f6" />
          <KPI title="Avg Score" value={format2(avgScore)} color="#10b981" />
          <KPI title="Highest" value={maxScore} color="#f59e0b" />
          <KPI title="Lowest" value={minScore} color="#ef4444" />
          <KPI title="Pass %" value={format2(passCount/totalStudents*100)} color="#6366f1" />
        </div>

        {/* CHART */}
        <div style={styles.card}>
          <h3>Score Distribution</h3>
          <Bar data={chartData} />
        </div>

        {/* SUBJECT INTELLIGENCE */}
        <div style={styles.card}>
          <h3>📚 Subject Intelligence</h3>

          <p>🔴 Weak: {weakSubjects.map(s=>`${s.subject} (${format2(s.accuracy)}%)`).join(', ') || '-'}</p>
          <p>🟡 Moderate: {moderateAreas.map(s=>`${s.subject} (${format2(s.accuracy)}%)`).join(', ') || '-'}</p>
          <p>🟢 Strong: {strongAreas.map(s=>`${s.subject} (${format2(s.accuracy)}%)`).join(', ') || '-'}</p>

          <p>⚠️ Weak Chapters: {weakChapters.map(c=>`${c.chapter} (${format2(c.accuracy)}%)`).join(', ') || '-'}</p>
        </div>

        {/* AI INSIGHTS */}
        <div style={styles.card}>
          <h3>🧠 AI Insights</h3>
          {aiInsights.map((i, idx) => (
            <div key={idx} style={styles.insight}>{i}</div>
          ))}
        </div>

      </div>

      {/* ================= TRUE SEPARATE LEADERBOARD ================= */}
      <div ref={leaderboardRef} style={styles.leaderboardPage}>

        <h1 style={{ textAlign:'center' }}>🏆 OFFICIAL LEADERBOARD</h1>

        <div style={styles.lbHeader}>
          <p><b>Exam:</b> {exam.title}</p>
          <p><b>Category:</b> {exam.exam_category}</p>
          <p><b>Type:</b> {exam.exam_type}</p>
          <p><b>Date:</b> {new Date(exam.created_at).toDateString()}</p>
        </div>

        <table style={styles.table}>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Name</th>
              <th>Score</th>
              <th>Proctor</th>
            </tr>
          </thead>

          <tbody>
            {leaderboard.map((l, i) => (
              <tr key={i}>
                <td style={{ fontWeight:'bold' }}>{i+1}</td>
                <td>{studentsMap[l.student_id]?.name}</td>
                <td>{l.score}</td>
                <td>{l.rejected ? '⚠️' : 'OK'}</td>
              </tr>
            ))}
          </tbody>
        </table>

      </div>

    </div>
  )
}

/* ================= UI ================= */

const KPI = ({ title, value, color }) => (
  <div style={{ ...styles.kpi, borderTop:`4px solid ${color}` }}>
    <div>{title}</div>
    <div style={{ fontSize:22 }}>{value}</div>
  </div>
)

const styles = {
  pdfBtn:{ padding:'8px 14px', background:'#2563eb', color:'#fff', borderRadius:6, marginBottom:20 },
  kpiRow:{ display:'flex', gap:15, marginBottom:20 },
  kpi:{ background:'#fff', padding:20, borderRadius:10, flex:1 },
  card:{ background:'#fff', padding:20, borderRadius:12, marginTop:20 },
  insight:{ background:'#f8fafc', padding:10, marginTop:8, borderLeft:'4px solid #2563eb' },

  leaderboardPage:{
    background:'#fff',
    width:'210mm',
    minHeight:'297mm',
    padding:'20mm',
    margin:'40px auto'
  },

  lbHeader:{ textAlign:'center', marginBottom:20 },

  table:{
    width:'100%',
    borderCollapse:'collapse'
  }
}
