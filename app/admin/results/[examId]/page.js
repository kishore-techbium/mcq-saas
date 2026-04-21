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

export default function ExamAnalyticsPage() {
  const { examId } = useParams()
  const reportRef = useRef()

  const [exam, setExam] = useState(null)
  const [studentsMap, setStudentsMap] = useState({})
  const [submitted, setSubmitted] = useState([])
  const [weakSubjects, setWeakSubjects] = useState([])
  const [moderateAreas, setModerateAreas] = useState([])
  const [strongAreas, setStrongAreas] = useState([])
  const [weakChapters, setWeakChapters] = useState([])
  const [difficulty, setDifficulty] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (examId) fetchAll()
  }, [examId])

  async function fetchAll() {
    setLoading(true)

    const { data: examData } = await supabase
      .from('exams')
      .select('*')
      .eq('id', examId)
      .single()

    const { data: stats } = await supabase
      .from('student_exam_stats')
      .select('*')
      .eq('exam_id', examId)

    const studentIds = [...new Set(stats.map(s => s.student_id))]

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

    // SUBJECT INTELLIGENCE
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

    // CHAPTERS
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

    setWeakChapters(weakChap)

    // DIFFICULTY
    const avg =
      stats.reduce((sum, s) => sum + (s.avg_score || 0), 0) / stats.length

    if (avg < 40) setDifficulty('Hard')
    else if (avg < 70) setDifficulty('Medium')
    else setDifficulty('Easy')

    setLoading(false)
  }

  if (loading) return <p style={{ padding: 30 }}>Loading...</p>

  // KPI
  const totalStudents = submitted.length
  const avgScore =
    submitted.reduce((s, x) => s + (x.avg_score || 0), 0) / totalStudents

  const maxScore = Math.max(...submitted.map(s => s.best_score || 0))
  const minScore = Math.min(...submitted.map(s => s.best_score || 0))

  const passCount = submitted.filter(s => (s.avg_score || 0) >= 40).length

  // DISTRIBUTION
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

  // LEADERBOARD
  const leaderboard = submitted
    .map(s => ({
      student_id: s.student_id,
      score: s.best_score || 0,
      rejected: s.proctor_status === 'REJECTED'
    }))
    .sort((a, b) => b.score - a.score)

  async function downloadPDF() {
    const canvas = await html2canvas(reportRef.current, { scale: 2 })
    const pdf = new jsPDF()
    const img = canvas.toDataURL('image/png')
    pdf.addImage(img, 'PNG', 0, 0, 210, 295)
    pdf.save(`${exam.title}.pdf`)
  }

  return (
    <div style={{ padding: 40, background: '#f3f4f6' }}>

      <button onClick={downloadPDF} style={{ marginBottom: 20 }}>
        Download PDF
      </button>

      <div ref={reportRef}>

        {/* HEADER */}
        <h1>{exam.title}</h1>
        <p>{exam.exam_category} | {exam.exam_type} | {new Date(exam.created_at).toDateString()}</p>

        {/* KPI */}
        <div style={{ display: 'flex', gap: 20 }}>
          <Card title="Students Appeared" value={totalStudents} />
          <Card title="Average Score" value={avgScore.toFixed(1)} />
          <Card title="Highest Score" value={maxScore} />
          <Card title="Lowest Score" value={minScore} />
          <Card title="Pass %" value={(passCount / totalStudents * 100).toFixed(1)} />
        </div>

        {/* CHART */}
        <div style={{ marginTop: 30 }}>
          <h3>Score Distribution</h3>
          <Bar data={chartData} />
        </div>

        {/* INTELLIGENCE */}
        <div style={{ marginTop: 30 }}>
          <h3>🧠 Insights</h3>
          <p>Exam Difficulty: {difficulty}</p>

          <h4>Weak Subjects</h4>
          {weakSubjects.map(s => <p key={s.subject}>{s.subject} - {s.accuracy.toFixed(1)}%</p>)}

          <h4>Weak Chapters</h4>
          {weakChapters.map(c => <p key={c.chapter}>{c.chapter} - {c.accuracy.toFixed(1)}%</p>)}

          <h4>Recommendations</h4>
          <p>Focus on weak subjects and chapters. Conduct revision sessions.</p>
        </div>

        {/* LEADERBOARD */}
        <div style={{ marginTop: 40 }}>
          <h3>Leaderboard</h3>
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Student</th>
                <th>Email</th>
                <th>Score</th>
                <th>Proctor</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((l, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{studentsMap[l.student_id]?.name}</td>
                  <td>{studentsMap[l.student_id]?.email}</td>
                  <td>{l.score}</td>
                  <td>{l.rejected ? '⚠️' : 'OK'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}

function Card({ title, value }) {
  return (
    <div style={{ background: '#fff', padding: 20, borderRadius: 10 }}>
      <div>{title}</div>
      <div style={{ fontSize: 22 }}>{value}</div>
    </div>
  )
}
