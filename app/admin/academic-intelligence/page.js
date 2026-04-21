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
  const [targetYear, setTargetYear] = useState('ALL')
  const [summary, setSummary] = useState({})
  const [topPerformers, setTopPerformers] = useState([])
  const [subjects, setSubjects] = useState([])
  const [subtopics, setSubtopics] = useState([])
  const [riskStudents, setRiskStudents] = useState([])
  const [effortData, setEffortData] = useState([])
  const [efficiencyData, setEfficiencyData] = useState([])
  const [trendData, setTrendData] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [aiInsights, setAiInsights] = useState([])

  useEffect(() => { init() }, [examType, examCategory, targetYear])

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

    // 🔹 exam filter → exam_ids
    let examQuery = supabase.from('exams').select('id')

    if (examType !== 'ALL') examQuery.eq('exam_type', examType)
    if (examCategory !== 'ALL') examQuery.eq('exam_category', examCategory)

    const { data: exams } = await examQuery
    const examIds = exams?.map(e => e.id) || []

    // 🔹 queries
    let examStatsQuery = supabase
      .from('student_exam_stats')
      .select('*')
      .eq('college_id', college_id)

    let subQuery = supabase
      .from('student_subtopic_stats')
      .select('*')
      .eq('college_id', college_id)

    if (examIds.length > 0) {
      examStatsQuery = examStatsQuery.in('exam_id', examIds)
      subQuery = subQuery.in('exam_id', examIds)
    }

    const { data: examStats } = await examStatsQuery
    const { data: subStats } = await subQuery

    // 🎯 FILTER BY TARGET YEAR (student level)
      let filteredExamStats = examStats
      
      if (targetYear !== 'ALL') {
        const { data: yearStudents } = await supabase
          .from('students')
          .select('id')
          .eq('target_year', Number(targetYear))
      
        const ids = yearStudents?.map(s => s.id) || []
      
        filteredExamStats = examStats.filter(s => ids.includes(s.student_id))
      }
    // 🔹 student names
    const ids = filteredExamStats?.map(s => s.student_id) || []
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

    filteredExamStats?.forEach(s => {
      totalScore += (s.avg_score || 0) * (s.attempts || 0)
      totalAttempts += s.attempts || 0
    })

    const avgScore = totalAttempts > 0 ? totalScore / totalAttempts : 0

    // ================= SUBJECT =================
    const subjectAgg = {}

    subStats?.forEach(s => {
      if (!subjectAgg[s.subject]) {
        subjectAgg[s.subject] = { correct: 0, total: 0, time: 0 }
      }
      subjectAgg[s.subject].correct += s.correct || 0
      subjectAgg[s.subject].total += s.total_questions || 0
      subjectAgg[s.subject].time += s.total_time_spent || 0
    })

    const subjectArray = Object.keys(subjectAgg).map(sub => {
      const d = subjectAgg[sub]
      return {
        subject: sub,
        accuracy: d.total > 0 ? (d.correct / d.total) * 100 : 0,
        avgTime: d.total > 0 ? d.time / d.total : 0
      }
    })

    // ================= SUBTOPICS =================
    const subArray = subStats?.map(s => ({
      subject: s.subject,
      subtopic: s.subtopic,
      accuracy: s.total_questions > 0
        ? (s.correct / s.total_questions) * 100
        : 0
    })) || []

    // ================= RISK =================
    const risk = examStats
      ?.map(s => ({
        name: studentMap[s.student_id] || 'Unknown',
        score: s.avg_score || 0,
        risk: (s.avg_score < 40 ? 2 : 0) + (s.avg_time_per_exam > 90 ? 1 : 0)
      }))
      .filter(s => s.risk >= 2)

    // ================= EFFICIENCY =================
    const efficiency = filteredExamStats?.map(s => ({
      name: studentMap[s.student_id] || 'Unknown',
      efficiency: s.avg_time_per_exam
        ? s.avg_score / (s.avg_time_per_exam / 60)
        : 0
    }))

    // ================= TREND =================
    const trend = filteredExamStats?.slice(0, 10).map((s, i) => ({
      name: `Test ${i + 1}`,
      score: Number(format2(s.avg_score))
    }))

    // ================= EFFORT =================
    const effort = filteredExamStats?.map(s => ({
      effort: s.total_time_spent || 0,
      score: s.avg_score || 0
    }))
    // 🏆 TOP PERFORMERS (COLLEGE INSIGHTS MERGE)
    const performers = filteredExamStats
      ?.map(s => ({
        name: studentMap[s.student_id] || 'Unknown',
        score: s.avg_score || 0
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
    
    setTopPerformers(performers)
    // ================= RECOMMENDATIONS =================
    const recs = subjectArray.map(s => ({
      subject: s.subject,
      msg:
        s.accuracy < 40 ? '🔴 Strong intervention needed' :
        s.accuracy < 60 ? '🟡 Improve practice' :
        '🟢 Good performance'
    }))

    // ================= AI INSIGHTS =================
    const insights = []

    if (subjectArray.some(s => s.accuracy < 40)) {
      insights.push('🔴 Some subjects have very low accuracy — immediate focus required')
    }

    if (risk.length > 0) {
      insights.push(`⚠️ ${risk.length} students are at risk`)
    }

    if (efficiency.some(e => e.efficiency < 1)) {
      insights.push('⚡ Students spending more time but scoring low')
    }

    setSummary({
      avgScore: format2(avgScore),
      totalStudents: filteredExamStats?.length || 0,
      risk: risk.length
    })

    setSubjects(subjectArray)
    setSubtopics(subArray)
    setRiskStudents(risk)
    setEffortData(effort)
    setEfficiencyData(efficiency)
    setTrendData(trend)
    setRecommendations(recs)
    setAiInsights(insights)
  }

  async function downloadPDF() {
    const canvas = await html2canvas(reportRef.current, { scale: 2 })
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
        <button style={styles.btn} onClick={downloadPDF}>PDF</button>
      </div>

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

        <select value={targetYear} onChange={e => setTargetYear(e.target.value)}>
          <option value="ALL">All Years</option>
          <option value="1">1st Year</option>
          <option value="2">2nd Year</option>
        </select>
      </div>

      <div ref={reportRef}>

        <Section title="Summary" desc="Overall performance snapshot">
          <CardRow>
            <Card title="Students" value={summary.totalStudents} />
            <Card title="Avg Score" value={summary.avgScore + '%'} />
            <Card title="At Risk" value={summary.risk} />
          </CardRow>
        </Section>

        <Section title="AI Insights" desc="Automatically generated key findings">
          {aiInsights.map((i, idx) => <Insight key={idx} text={i} />)}
        </Section>

        <Section title="Trend" desc="Performance over recent tests">
          <Chart><LineChart data={trendData}><XAxis dataKey="name"/><YAxis/><Tooltip/><Line dataKey="score"/></LineChart></Chart>
        </Section>

        <Section title="Subjects" desc="Accuracy = Correct answers / Total questions. Also shows avg time per question.">
          {subjects.map(s => <Row key={s.subject} left={s.subject} right={`${format2(s.accuracy)}% | ${format2(s.avgTime)}s`} />)}
        </Section>

        <Section title="Subtopics" desc="Concept-level performance heatmap">
          {subtopics.slice(0,20).map((s,i)=>(
            <Row key={i}
              left={`${s.subject} - ${s.subtopic}`}
              right={`${format2(s.accuracy)}%`}
            />
          ))}
        </Section>

        <Section title="At Risk" desc="Students needing attention">
          {riskStudents.map((r,i)=>(
            <Row key={i} left={r.name} right={`${format2(r.score)}%`} />
          ))}
        </Section>

        <Section title="Efficiency" desc="Score per minute">
          {efficiencyData.slice(0,10).map(e=>(
            <Row key={e.name} left={e.name} right={format2(e.efficiency)} />
          ))}
        </Section>

        <Section title="Effort vs Performance" desc="Time vs score comparison">
          <Chart><ScatterChart><XAxis dataKey="effort"/><YAxis dataKey="score"/><Tooltip/><Scatter data={effortData}/></ScatterChart></Chart>
        </Section>
        <Section title="🏆 Top Performers" desc="Top students based on performance">
          {topPerformers.map((s, i) => (
            <Row
              key={i}
              left={`${i + 1}. ${s.name}`}
              right={`${format2(s.score)}%`}
            />
          ))}
        </Section>
      </div>
    </div>
  )
}

/* UI */

const Section = ({title, desc, children}) => (
  <div style={styles.section}>
    <h2>{title}</h2>
    <p style={styles.desc}>{desc}</p>
    {children}
  </div>
)

const CardRow = ({children}) => (
  <div style={{display:'flex', gap:20}}>{children}</div>
)

const Card = ({title,value}) => (
  <div style={styles.card}>
    <div>{title}</div>
    <div style={{fontSize:22,fontWeight:'bold'}}>{value}</div>
  </div>
)

const Row = ({left,right}) => (
  <div style={styles.row}><span>{left}</span><span>{right}</span></div>
)

const Insight = ({text}) => (
  <div style={styles.insight}>{text}</div>
)

const Chart = ({children}) => (
  <ResponsiveContainer width="100%" height={250}>{children}</ResponsiveContainer>
)

const styles = {
  page:{padding:40, background:'#f1f5f9'},
  header:{display:'flex',justifyContent:'space-between'},
  btn:{padding:'6px 12px', fontSize:12, background:'#2563eb', color:'#fff', borderRadius:6},
  filters:{display:'flex', gap:10, margin:'20px 0'},
  section:{background:'#fff', padding:20, marginTop:20, borderRadius:12},
  desc:{color:'#64748b', fontSize:13},
  card:{background:'#fff', padding:20, borderRadius:12, flex:1},
  row:{display:'flex',justifyContent:'space-between',padding:6},
  insight:{background:'#f8fafc',padding:10,borderLeft:'4px solid #2563eb',marginTop:6}
}
