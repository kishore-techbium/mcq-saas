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
  const [subjectRecommendations, setSubjectRecommendations] = useState([])

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
    // RISK STUDENTS
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
    // SUBJECT + SUBTOPIC
    // =========================
    const { data: subjectStats } = await supabase
      .from('student_subject_stats')
      .select('subject, correct, total_questions')
      .eq('college_id', college_id)

    const { data: subStats } = await supabase
      .from('student_subtopic_stats')
      .select('subject, subtopic, correct, total_questions')
      .eq('college_id', college_id)

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
    })).sort((a, b) => a.accuracy - b.accuracy)

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
      score: Number(s.avg_score)
    }))

    // =========================
    // ENHANCED RECOMMENDATIONS
    // =========================
    const recommendations = []

    subjectArray.forEach(subject => {
      const relatedSubs = subArray?.filter(s => s.subject === subject.subject)

      const weakSubs = relatedSubs
        ?.filter(s => s.accuracy < 0.5)
        .slice(0, 3)

      const avgAccuracy = subject.accuracy
      let severity = ''
      let action = ''
      let priority = ''

      if (avgAccuracy < 0.4) {
        severity = '🔴 Critical'
        priority = 'High'
        action = 'Immediate intervention + concept clarity sessions'
      } else if (avgAccuracy < 0.6) {
        severity = '🟡 Moderate'
        priority = 'Medium'
        action = 'Increase practice and problem-solving'
      } else {
        severity = '🟢 Strong'
        priority = 'Low'
        action = 'Maintain consistency'
      }

      const hint = weakSubs?.length
        ? `Focus on: ${weakSubs.map(s => s.subtopic).join(', ')}`
        : 'No major weak subtopics'

      recommendations.push({
        subject: subject.subject,
        accuracy: format2(subject.accuracy * 100),
        severity,
        priority,
        action,
        hint
      })
    })

    setSummary({
      avgScore,
      totalAttempts,
      totalStudents: overall?.length || 0
    })

    setSubjects(subjectArray)
    setSubtopics(subArray || [])
    setRiskStudents(risk)
    setEffortData(effort)
    setSubjectRecommendations(recommendations)
  }

  if (loading) return <p style={{ padding: 30 }}>Loading...</p>

  return (
    <div style={styles.page}>
      <h1>📈 Academic Intelligence</h1>

      <div style={styles.cards}>
        <Card title="Students" value={summary.totalStudents} />
        <Card title="Avg Score" value={summary.avgScore + '%'} />
        <Card title="Attempts" value={summary.totalAttempts} />
        <Card title="At Risk" value={riskStudents.length} />
      </div>

      <Section title="🧠 Subject-wise Recommendations"
        desc="Detailed action plan for each subject based on performance.">
        {subjectRecommendations.map((r, idx) => (
          <div key={idx} style={styles.recCard}>
            <h3>{r.subject} ({r.accuracy}%) – {r.severity}</h3>
            <p><strong>Priority:</strong> {r.priority}</p>
            <p>• {r.action}</p>
            <p>• {r.hint}</p>
          </div>
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

/* STYLES */

const styles = {
  page: { padding: 40, background: '#f1f5f9' },
  desc: { color: '#555' },
  cards: { display: 'flex', gap: 20 },
  card: { background: '#fff', padding: 20, borderRadius: 12 },
  section: { background: '#fff', padding: 20, marginTop: 20 },
  recCard: {
    background: '#f8fafc',
    padding: 15,
    marginTop: 10,
    borderRadius: 10
  }
}
