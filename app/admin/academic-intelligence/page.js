'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../../lib/supabase'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, BarChart, Bar
} from 'recharts'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

function format2(num) {
  return Number(num || 0).toFixed(2)
}

export default function AcademicIntelligence() {

  const reportRef = useRef(null)

  const [loading, setLoading] = useState(true)
  const [examType, setExamType] = useState('ALL')
  const [examCategory, setExamCategory] = useState('ALL')

  const [summary, setSummary] = useState({})
  const [subjects, setSubjects] = useState([])
  const [subtopics, setSubtopics] = useState([])
  const [riskStudents, setRiskStudents] = useState([])
  const [effortData, setEffortData] = useState([])
  const [efficiencyData, setEfficiencyData] = useState([])
  const [trendData, setTrendData] = useState([])
  const [recommendations, setRecommendations] = useState([])

  useEffect(() => { init() }, [examType, examCategory])

  async function init() {
    setLoading(true)

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

    // 🔥 exam_id mapping
    let examQuery = supabase.from('exams').select('id')

    if (examType !== 'ALL') examQuery.eq('exam_type', examType)
    if (examCategory !== 'ALL') examQuery.eq('exam_category', examCategory)

    const { data: exams } = await examQuery
    const examIds = exams?.map(e => e.id) || []

    let examStatsQuery = supabase
      .from('student_exam_stats')
      .select('*')
      .eq('college_id', college_id)

    if (examIds.length > 0) {
      examStatsQuery.in('exam_id', examIds)
    }

    const { data: examStats } = await examStatsQuery

    // student names
    const ids = examStats?.map(s => s.student_id) || []
    let studentMap = {}

    if (ids.length > 0) {
      const { data: students } = await supabase
        .from('students')
        .select('id, first_name, last_name')
        .in('id', ids)

      students?.forEach(s => {
        studentMap[s.id] = `${s.first_name} ${s.last_name}`
      })
    }

    // ================= SUMMARY =================
    let totalScore = 0
    let totalAttempts = 0

    examStats?.forEach(s => {
      totalScore += (s.avg_score || 0) * (s.attempts || 0)
      totalAttempts += s.attempts || 0
    })

    const avgScore = totalAttempts > 0 ? totalScore / totalAttempts : 0

    // ================= RISK =================
    const risk = examStats
      ?.map(s => ({
        name: studentMap[s.student_id] || 'Unknown',
        score: s.avg_score || 0,
        risk: (s.avg_score < 40 ? 2 : 0) + (s.avg_time_per_exam > 90 ? 1 : 0)
      }))
      .filter(s => s.risk >= 2)
      .sort((a, b) => a.score - b.score)

    // ================= EFFICIENCY =================
    const efficiency = examStats?.map(s => ({
      name: studentMap[s.student_id] || 'Unknown',
      efficiency: s.avg_time_per_exam
        ? s.avg_score / (s.avg_time_per_exam / 60)
        : 0
    }))

    // ================= TREND =================
    const trend = examStats?.slice(0, 10).map((s, i) => ({
      name: `T${i + 1}`,
      score: Number(format2(s.avg_score))
    }))

    // ================= EFFORT =================
    const effort = examStats?.map(s => ({
      effort: s.total_time_spent || 0,
      score: s.avg_score || 0
    }))

    // ================= SUBJECT =================
    const subjectAgg = {}
    examStats?.forEach(s => {
      if (!subjectAgg[s.subject]) subjectAgg[s.subject] = { score: 0, count: 0 }
      subjectAgg[s.subject].score += s.avg_score || 0
      subjectAgg[s.subject].count++
    })

    const subjectArray = Object.keys(subjectAgg).map(sub => ({
      subject: sub,
      score: subjectAgg[sub].score / subjectAgg[sub].count
    }))

    // ================= RECOMMENDATIONS =================
    const recs = subjectArray.map(s => ({
      subject: s.subject,
      msg:
        s.score < 40 ? '🔴 Focus heavily' :
          s.score < 60 ? '🟡 Improve practice' :
            '🟢 Maintain'
    }))

    setSummary({
      avgScore: format2(avgScore),
      totalStudents: examStats?.length || 0,
      risk: risk.length
    })

    setRiskStudents(risk)
    setEfficiencyData(efficiency)
    setTrendData(trend)
    setEffortData(effort)
    setSubjects(subjectArray)
    setRecommendations(recs)
  }

  async function downloadPDF() {
    const canvas = await html2canvas(reportRef.current)
    const pdf = new jsPDF()
    const img = canvas.toDataURL('image/png')

    pdf.addImage(img, 'PNG', 0, 0, 210, 295)
    pdf.save('academic-intelligence.pdf')
  }

  if (loading) return <p>Loading...</p>

  return (
    <div style={styles.page}>

      <div style={styles.header}>
        <h1>📊 Academic Intelligence</h1>
        <button style={styles.btn} onClick={downloadPDF}>Download PDF</button>
      </div>

      {/* FILTERS */}
      <div style={styles.filters}>
        <select value={examType} onChange={e => setExamType(e.target.value)}>
          <option value="ALL">All Types</option>
          <option value="WEEKLY_TEST">Weekly</option>
          <option value="MONTHLY_TEST">Monthly</option>
          <option value="GRAND_TEST">Grand</option>
        </select>

        <select value={examCategory} onChange={e => setExamCategory(e.target.value)}>
          <option value="ALL">All Categories</option>
          <option value="JEE_MAINS">JEE</option>
          <option value="NEET">NEET</option>
        </select>
      </div>

      <div ref={reportRef}>

        {/* SUMMARY CARDS */}
        <div style={styles.cards}>
          <Card title="Students" value={summary.totalStudents} />
          <Card title="Avg Score" value={summary.avgScore + '%'} />
          <Card title="At Risk" value={summary.risk} />
        </div>

        {/* TREND */}
        <Section title="📈 Score Trend">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line dataKey="score" stroke="#2563eb" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </Section>

        {/* SUBJECT BAR */}
        <Section title="📚 Subject Performance">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={subjects}>
              <XAxis dataKey="subject" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="score" fill="#16a34a" />
            </BarChart>
          </ResponsiveContainer>
        </Section>

        {/* EFFORT VS PERFORMANCE */}
        <Section title="🎯 Effort vs Performance">
          <ResponsiveContainer width="100%" height={250}>
            <ScatterChart>
              <XAxis dataKey="effort" />
              <YAxis dataKey="score" />
              <Tooltip />
              <Scatter data={effortData} fill="#f59e0b" />
            </ScatterChart>
          </ResponsiveContainer>
        </Section>

        {/* RISK */}
        <Section title="⚠️ At Risk Students">
          {riskStudents.map((r, i) => (
            <Row key={i} left={r.name} right={format2(r.score) + '%'} />
          ))}
        </Section>

        {/* EFFICIENCY */}
        <Section title="⚡ Efficiency">
          {efficiencyData.slice(0, 10).map(e => (
            <Row key={e.name} left={e.name} right={format2(e.efficiency)} />
          ))}
        </Section>

        {/* RECOMMENDATIONS */}
        <Section title="🧠 Recommendations">
          {recommendations.map((r, i) => (
            <Row key={i} left={r.subject} right={r.msg} />
          ))}
        </Section>

      </div>
    </div>
  )
}

/* UI */

function Card({ title, value }) {
  return (
    <div style={styles.card}>
      <div>{title}</div>
      <div style={{ fontSize: 24, fontWeight: 'bold' }}>{value}</div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={styles.section}>
      <h2>{title}</h2>
      {children}
    </div>
  )
}

function Row({ left, right }) {
  return (
    <div style={styles.row}>
      <span>{left}</span>
      <span>{right}</span>
    </div>
  )
}

const styles = {
  page: { padding: 40, background: '#f1f5f9' },
  header: { display: 'flex', justifyContent: 'space-between' },
  filters: { display: 'flex', gap: 10, margin: '20px 0' },
  btn: { padding: 10, background: '#2563eb', color: '#fff', borderRadius: 6 },
  cards: { display: 'flex', gap: 20 },
  card: { background: '#fff', padding: 20, borderRadius: 12, flex: 1 },
  section: { background: '#fff', padding: 20, marginTop: 20, borderRadius: 12 },
  row: { display: 'flex', justifyContent: 'space-between', padding: 6 }
}
