'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../../lib/supabase'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts'

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

  useEffect(() => {
    init()
  }, [examType])

  async function init() {
    const { data: auth } = await supabase.auth.getUser()
    const user = auth?.user

    const { data: userData } = await supabase
      .from('students')
      .select('college_id, role')
      .eq('email', user.email)
      .single()

    await loadData(userData.college_id)
    setLoading(false)
  }

  async function loadData(college_id) {
    // =========================
    // OVERALL
    // =========================
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

    const avgScore =
      totalAttempts > 0
        ? (totalScore / totalAttempts).toFixed(1)
        : '0.0'

    const risk = overall?.filter(s => (s.avg_score || 0) < 40) || []

    // =========================
    // TREND
    // =========================
    let trendQuery = supabase
      .from('student_exam_stats')
      .select('avg_score, created_at')
      .eq('college_id', college_id)
      .order('created_at', { ascending: true })

    if (examType !== 'ALL') {
      trendQuery = trendQuery.eq('exam_type', examType)
    }

    const { data: examStats } = await trendQuery

    const trend = examStats?.map((e, i) => ({
      name: `E${i + 1}`,
      score: e.avg_score
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
      avg: (examMap[type].total / examMap[type].count).toFixed(1)
    }))

    // =========================
    // SUBJECT
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
      accuracy:
        subjectMap[sub].total > 0
          ? subjectMap[sub].correct / subjectMap[sub].total
          : 0
    }))

    subjectArray.sort((a, b) => a.accuracy - b.accuracy)

    // =========================
    // SUBTOPIC HEATMAP
    // =========================
    let subQuery = supabase
      .from('student_subtopic_stats')
      .select('subject, subtopic, correct, total_questions')
      .eq('college_id', college_id)

    if (examType !== 'ALL') {
      subQuery = subQuery.eq('exam_type', examType)
    }

    const { data: subStats } = await subQuery

    const subArray = subStats?.map(s => ({
      subject: s.subject,
      subtopic: s.subtopic,
      accuracy:
        s.total_questions > 0
          ? s.correct / s.total_questions
          : 0
    }))

    // =========================
    // EFFORT
    // =========================
    const effort = overall?.map(s => ({
      effort: s.total_attempts,
      score: s.avg_score
    }))

    // =========================
    // SMART INSIGHTS
    // =========================
    const insightsArr = []

    if (Number(avgScore) < 50) {
      insightsArr.push('⚠️ Overall performance is low. Consider intervention.')
    }

    if (risk.length > 0) {
      insightsArr.push(`🚨 ${risk.length} students at risk (<40%).`)
    }

    if (subjectArray.length > 0) {
      insightsArr.push(`📉 Weakest subject: ${subjectArray[0].subject}`)
      insightsArr.push(
        `📈 Strongest subject: ${
          subjectArray[subjectArray.length - 1].subject
        }`
      )
    }

    if (trend?.length > 2) {
      const last = trend[trend.length - 1]?.score || 0
      const first = trend[0]?.score || 0

      if (last > first) {
        insightsArr.push('📈 Performance improving over time')
      } else {
        insightsArr.push('📉 Performance declining — needs attention')
      }
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
    setInsights(insightsArr)
  }

  async function downloadPDF() {
    const html2pdf = (await import('html2pdf.js')).default
    const element = document.getElementById('ai-report')

    html2pdf()
      .set({
        margin: 0.5,
        filename: `academic-intelligence-${examType}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a4' },
        pagebreak: { mode: ['css', 'legacy'] }
      })
      .from(element)
      .save()
  }

  if (loading) return <p style={{ padding: 30 }}>Loading...</p>

  return (
    <div style={styles.page} id="ai-report">
      <h1>📈 Academic Intelligence</h1>

      <select
        value={examType}
        onChange={e => setExamType(e.target.value)}
      >
        <option value="ALL">All Exams</option>
        <option value="WEEKLY_TEST">Weekly</option>
        <option value="MONTHLY_TEST">Monthly</option>
        <option value="GRAND_TEST">Grand</option>
      </select>

      <button onClick={downloadPDF} style={styles.btn}>
        Download PDF
      </button>

      <div style={styles.cards}>
        <Card title="Students" value={summary.totalStudents} />
        <Card title="Avg Score" value={summary.avgScore + '%'} />
        <Card title="Attempts" value={summary.totalAttempts} />
        <Card title="At Risk" value={riskStudents.length} />
      </div>

      <div style={styles.pageBreak}></div>

      <Section title="📈 Trend">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={trendData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line dataKey="score" />
          </LineChart>
        </ResponsiveContainer>
      </Section>

      <Section title="🎯 Exam Effectiveness">
        {examEffect.map(e => (
          <p key={e.type}>{e.type} – {e.avg}%</p>
        ))}
      </Section>

      <div style={styles.pageBreak}></div>

      <Section title="📉 Weak Subjects">
        {subjects.slice(0, 5).map(s => (
          <p key={s.subject}>{s.subject} – {(s.accuracy*100).toFixed(1)}%</p>
        ))}
      </Section>

      <Section title="🔥 Subtopic Heatmap">
        {subtopics.slice(0, 20).map(s => (
          <div
            key={s.subtopic}
            style={{
              background: `rgba(255,0,0,${1 - s.accuracy})`,
              margin: 4,
              padding: 6
            }}
          >
            {s.subject} - {s.subtopic} ({(s.accuracy*100).toFixed(0)}%)
          </div>
        ))}
      </Section>

      <div style={styles.pageBreak}></div>

      <Section title="⚙️ Effort vs Performance">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={effortData}>
            <XAxis dataKey="effort" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="score" />
          </BarChart>
        </ResponsiveContainer>
      </Section>

      <Section title="⚠️ At Risk">
        {riskStudents.slice(0, 10).map(s => (
          <p key={s.student_id}>{s.student_id} – {s.avg_score}%</p>
        ))}
      </Section>

      <Section title="🧠 AI Insights">
        {insights.map((i, idx) => (
          <p key={idx}>{i}</p>
        ))}
      </Section>
    </div>
  )
}

function Card({ title, value }) {
  return <div style={styles.card}><div>{title}</div><div>{value}</div></div>
}

function Section({ title, children }) {
  return <div style={styles.section}><h2>{title}</h2>{children}</div>
}

const styles = {
  page: { padding: 40, background: '#f1f5f9' },
  cards: { display: 'flex', gap: 20, marginBottom: 30 },
  card: { background: '#fff', padding: 20, borderRadius: 12 },
  section: { background: '#fff', padding: 20, marginBottom: 20 },
  btn: { margin: 10, padding: 10, background: '#16a34a', color: '#fff' },
  pageBreak: { pageBreakBefore: 'always' }
}
