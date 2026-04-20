'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts'

function format2(num) {
  if (num === null || num === undefined) return '0.00'
  return Number(num).toFixed(2)
}

export default function AcademicIntelligence() {
  const [loading, setLoading] = useState(true)
  const [examType, setExamType] = useState('ALL')

  const [summary, setSummary] = useState({})
  const [subjects, setSubjects] = useState([])
  const [subtopics, setSubtopics] = useState([])
  const [riskStudents, setRiskStudents] = useState([])
  const [insights, setInsights] = useState([])
  const [trendData, setTrendData] = useState([])
  const [examEffect, setExamEffect] = useState([])
  const [effortData, setEffortData] = useState([])
  const [efficiencyData, setEfficiencyData] = useState([])

  useEffect(() => {
    init()
  }, [examType])

  async function init() {
    const { data: auth } = await supabase.auth.getUser()
    const user = auth?.user

    const { data: userData } = await supabase
      .from('students')
      .select('college_id')
      .eq('email', user.email)
      .single()

    await loadData(userData.college_id)
    setLoading(false)
  }

  async function loadData(college_id) {
    const { data: overall } = await supabase
      .from('student_overall_stats')
      .select('*')
      .eq('college_id', college_id)

    let totalScore = 0
    let totalAttempts = 0

    overall?.forEach(s => {
      totalScore += (s.avg_score || 0) * (s.total_attempts || 0)
      totalAttempts += s.total_attempts || 0
    })

    const avgScore = totalAttempts > 0
      ? format2(totalScore / totalAttempts)
      : '0.00'

    // =========================
    // RISK STUDENTS (with names)
    // =========================
    const riskRaw = overall?.filter(s => (s.avg_score || 0) < 40) || []
    let risk = []

    if (riskRaw.length > 0) {
      const ids = riskRaw.map(r => r.student_id)

      const { data: students } = await supabase
        .from('students')
        .select('id, first_name, last_name')
        .in('id', ids)

      const map = {}
      students?.forEach(s => {
        map[s.id] = `${s.first_name || ''} ${s.last_name || ''}`
      })

      risk = riskRaw.map(r => ({
        ...r,
        name: map[r.student_id] || 'Unknown'
      }))
    }

    // =========================
    // TREND
    // =========================
    let trendQuery = supabase
      .from('student_exam_stats')
      .select('avg_score, created_at')
      .eq('college_id', college_id)

    if (examType !== 'ALL') {
      trendQuery = trendQuery.eq('exam_type', examType)
    }

    const { data: examStats } = await trendQuery

    const trend = examStats?.map((e, i) => ({
      name: `Test ${i + 1}`,
      score: Number(e.avg_score).toFixed(2)
    }))

    // =========================
    // EXAM EFFECTIVENESS
    // =========================
    const { data: examTypeStats } = await supabase
      .from('student_exam_stats')
      .select('exam_type, avg_score')
      .eq('college_id', college_id)

    const examMap = {}

    examTypeStats?.forEach(e => {
      if (!examMap[e.exam_type]) {
        examMap[e.exam_type] = { total: 0, count: 0 }
      }
      examMap[e.exam_type].total += e.avg_score || 0
      examMap[e.exam_type].count += 1
    })

    const examArray = Object.keys(examMap).map(type => ({
      type,
      avg: format2(examMap[type].total / examMap[type].count)
    }))

    // =========================
    // SUBJECTS
    // =========================
    let subjectQuery = supabase
      .from('student_subject_stats')
      .select('subject, correct, total_questions')
      .eq('college_id', college_id)

    if (examType !== 'ALL') {
      subjectQuery = subjectQuery.eq('exam_type', examType)
    }

    const { data: subjectStats } = await subjectQuery

    const subjectMap = {}

    subjectStats?.forEach(s => {
      if (!subjectMap[s.subject]) {
        subjectMap[s.subject] = { correct: 0, total: 0 }
      }
      subjectMap[s.subject].correct += s.correct || 0
      subjectMap[s.subject].total += s.total_questions || 0
    })

    const subjectArray = Object.keys(subjectMap).map(sub => ({
      subject: sub,
      accuracy: subjectMap[sub].total > 0
        ? subjectMap[sub].correct / subjectMap[sub].total
        : 0
    })).sort((a, b) => a.accuracy - b.accuracy)

    // =========================
    // SUBTOPICS
    // =========================
    const { data: subStats } = await supabase
      .from('student_subtopic_stats')
      .select('subject, subtopic, correct, total_questions')
      .eq('college_id', college_id)

    const subArray = subStats?.map(s => ({
      subject: s.subject,
      subtopic: s.subtopic,
      accuracy: s.total_questions > 0
        ? s.correct / s.total_questions
        : 0
    }))

    // =========================
    // EFFORT + EFFICIENCY
    // =========================
    const effort = overall?.map(s => ({
      effort: s.total_attempts,
      score: Number(s.avg_score).toFixed(2)
    }))

    const efficiency = overall?.map(s => ({
      name: s.student_id,
      efficiency: s.avg_time_per_exam
        ? format2(s.avg_score / s.avg_time_per_exam)
        : 0
    }))

    // =========================
    // INSIGHTS
    // =========================
    const insightsArr = []

    if (Number(avgScore) < 50)
      insightsArr.push('⚠️ Overall performance is below optimal levels.')

    if (risk.length > 0)
      insightsArr.push(`🚨 ${risk.length} students require immediate attention.`)

    if (subjectArray.length > 0) {
      insightsArr.push(`📉 Weakest subject: ${subjectArray[0].subject}`)
      insightsArr.push(`📈 Strongest subject: ${subjectArray.slice(-1)[0].subject}`)
    }

    setSummary({
      avgScore,
      totalAttempts,
      totalStudents: overall?.length || 0
    })

    setTrendData(trend || [])
    setExamEffect(examArray)
    setSubjects(subjectArray)
    setSubtopics(subArray || [])
    setRiskStudents(risk)
    setEffortData(effort)
    setEfficiencyData(efficiency)
    setInsights(insightsArr)
  }

  async function downloadPDF() {
    const html2pdf = (await import('html2pdf.js')).default
    const element = document.getElementById('ai-report')

    html2pdf().set({
      margin: 0.5,
      filename: `academic-intelligence-${examType}.pdf`,
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4' },
      pagebreak: { mode: ['css', 'legacy'] }
    }).from(element).save()
  }

  if (loading) return <p style={{ padding: 30 }}>Loading...</p>

  return (
    <div style={styles.page} id="ai-report">
      <h1>📈 Academic Intelligence Report</h1>
      <p style={styles.desc}>
        This dashboard provides deep insights into student performance, trends,
        learning behavior, and actionable recommendations.
      </p>

      <div style={styles.topBar}>
        <select value={examType} onChange={e => setExamType(e.target.value)}>
          <option value="ALL">All Exams</option>
          <option value="WEEKLY_TEST">Weekly</option>
          <option value="MONTHLY_TEST">Monthly</option>
          <option value="GRAND_TEST">Grand</option>
        </select>

        <button onClick={downloadPDF} style={styles.btn}>
          📄 Download Full Report
        </button>
      </div>

      <div style={styles.cards}>
        <Card title="Students" value={summary.totalStudents} />
        <Card title="Avg Score" value={summary.avgScore + '%'} />
        <Card title="Attempts" value={summary.totalAttempts} />
        <Card title="At Risk" value={riskStudents.length} />
      </div>

      <div style={styles.pageBreak}></div>

      <Section title="📈 Performance Trend"
        desc="Shows how student scores are evolving across tests over time.">
        <ChartLine data={trendData} />
      </Section>

      <Section title="🎯 Exam Effectiveness"
        desc="Indicates which exam types contribute most to performance improvement.">
        {examEffect.map(e => (
          <p key={e.type}>{e.type} – {e.avg}%</p>
        ))}
      </Section>

      <div style={styles.pageBreak}></div>

      <Section title="📉 Weak Subjects"
        desc="Subjects where students are struggling the most.">
        {subjects.slice(0, 5).map(s => (
          <p key={s.subject}>{s.subject} – {(s.accuracy * 100).toFixed(2)}%</p>
        ))}
      </Section>

      <Section title="🔥 Subtopic Heatmap"
        desc="Highlights weak areas at subtopic level for focused teaching.">
        {subtopics.slice(0, 20).map(s => (
          <div key={s.subtopic} style={{
            background: `rgba(255,0,0,${1 - s.accuracy})`,
            padding: 6, margin: 4
          }}>
            {s.subject} - {s.subtopic} ({(s.accuracy * 100).toFixed(2)}%)
          </div>
        ))}
      </Section>

      <div style={styles.pageBreak}></div>

      <Section title="⚙️ Effort vs Performance"
        desc="Compares student practice frequency vs their scores.">
        <ChartBar data={effortData} />
      </Section>

      <Section title="⚡ Efficiency (Score per Time)"
        desc="Measures how effectively students use their time during exams.">
        {efficiencyData.slice(0, 10).map(e => (
          <p key={e.name}>{e.name} – {e.efficiency}</p>
        ))}
      </Section>

      <Section title="⚠️ At Risk Students"
        desc="Students scoring below 40% and requiring immediate attention.">
        {riskStudents.slice(0, 10).map(s => (
          <p key={s.student_id}>{s.name} – {format2(s.avg_score)}%</p>
        ))}
      </Section>

      <Section title="🧠 AI Insights"
        desc="Automated insights derived from student performance patterns.">
        {insights.map((i, idx) => (
          <p key={idx}>{i}</p>
        ))}
      </Section>
    </div>
  )
}

/* COMPONENTS */

function Card({ title, value }) {
  return <div style={styles.card}><div>{title}</div><div>{value}</div></div>
}

function Section({ title, desc, children }) {
  return (
    <div style={styles.section}>
      <h2>{title}</h2>
      <p style={styles.desc}>{desc}</p>
      {children}
    </div>
  )
}

function ChartLine({ data }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Line dataKey="score" />
      </LineChart>
    </ResponsiveContainer>
  )
}

function ChartBar({ data }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <XAxis dataKey="effort" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="score" />
      </BarChart>
    </ResponsiveContainer>
  )
}

/* STYLES */

const styles = {
  page: { padding: 40, background: '#f1f5f9' },
  desc: { color: '#555', marginBottom: 10 },
  cards: { display: 'flex', gap: 20, marginBottom: 30 },
  card: { background: '#fff', padding: 20, borderRadius: 12 },
  section: { background: '#fff', padding: 20, marginBottom: 20 },
  btn: { padding: 10, background: '#16a34a', color: '#fff' },
  topBar: { display: 'flex', gap: 10, marginBottom: 20 },
  pageBreak: { pageBreakBefore: 'always' }
}
