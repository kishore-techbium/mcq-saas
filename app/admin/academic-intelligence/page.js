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
  const [examCategory, setExamCategory] = useState('ALL')

  const [summary, setSummary] = useState({})
  const [subjects, setSubjects] = useState([])
  const [subtopics, setSubtopics] = useState([])
  const [riskStudents, setRiskStudents] = useState([])
  const [subjectRecommendations, setSubjectRecommendations] = useState([])
  const [effortData, setEffortData] = useState([])
  const [efficiencyData, setEfficiencyData] = useState([])

  useEffect(() => {
    init()
  }, [examType, examCategory])

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

    // =========================
    // BASE QUERY
    // =========================
    let overallQuery = supabase
      .from('student_overall_stats')
      .select('*')
      .eq('college_id', college_id)

    let subjectQuery = supabase
      .from('student_subject_stats')
      .select('*')
      .eq('college_id', college_id)

    let subQuery = supabase
      .from('student_subtopic_stats')
      .select('*')
      .eq('college_id', college_id)

    if (examType !== 'ALL') {
      subjectQuery = subjectQuery.eq('exam_type', examType)
      subQuery = subQuery.eq('exam_type', examType)
    }

    if (examCategory !== 'ALL') {
      subjectQuery = subjectQuery.eq('exam_category', examCategory)
      subQuery = subQuery.eq('exam_category', examCategory)
    }

    const { data: overall } = await overallQuery
    const { data: subjectStats } = await subjectQuery
    const { data: subStats } = await subQuery

    // =========================
    // STUDENT MAP
    // =========================
    const ids = overall?.map(s => s.student_id) || []

    let studentMap = {}

    if (ids.length > 0) {
      const { data: students } = await supabase
        .from('students')
        .select('id, first_name, last_name')
        .in('id', ids)

      students?.forEach(s => {
        studentMap[s.id] = `${s.first_name || ''} ${s.last_name || ''}`
      })
    }

    // =========================
    // SUMMARY
    // =========================
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
    // RISK
    // =========================
    const risk = overall
      ?.filter(s => (s.avg_score || 0) < 40)
      .map(s => ({
        ...s,
        name: studentMap[s.student_id] || 'Unknown'
      }))

    // =========================
    // SUBJECT
    // =========================
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

    // =========================
    // SUBTOPICS
    // =========================
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
      score: Number(s.avg_score).toFixed(2)
    }))

    // =========================
    // EFFICIENCY
    // =========================
    const efficiency = overall?.map(s => ({
      name: studentMap[s.student_id] || 'Unknown',
      efficiency: s.avg_time_per_exam
        ? format2(s.avg_score / s.avg_time_per_exam)
        : '0.00'
    }))

    // =========================
    // RECOMMENDATIONS
    // =========================
    const recommendations = []

    subjectArray.forEach(subject => {
      const relatedSubs = subArray?.filter(
        s => s.subject === subject.subject
      )

      const weakSubs = relatedSubs
        ?.filter(s => s.accuracy < 0.5)
        .slice(0, 3)

      const acc = subject.accuracy

      let severity = ''
      let action = ''
      let priority = ''

      if (acc < 0.4) {
        severity = '🔴 Critical'
        priority = 'High'
        action = 'Immediate intervention + concept clarity sessions'
      } else if (acc < 0.6) {
        severity = '🟡 Moderate'
        priority = 'Medium'
        action = 'Increase problem-solving practice'
      } else {
        severity = '🟢 Strong'
        priority = 'Low'
        action = 'Maintain consistency'
      }

      recommendations.push({
        subject: subject.subject,
        accuracy: format2(acc * 100),
        severity,
        priority,
        action,
        hint: weakSubs.length
          ? `Focus on: ${weakSubs.map(s => s.subtopic).join(', ')}`
          : 'No major weak subtopics'
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
    setEfficiencyData(efficiency)
    setSubjectRecommendations(recommendations)
  }

  if (loading) return <p>Loading...</p>

  return (
    <div style={styles.page}>
      <h1>📈 Academic Intelligence</h1>

      <div style={styles.filters}>
        <select value={examType} onChange={e => setExamType(e.target.value)}>
          <option value="ALL">All Types</option>
          <option value="WEEKLY_TEST">Weekly</option>
          <option value="MONTHLY_TEST">Monthly</option>
          <option value="GRAND_TEST">Grand</option>
        </select>

        <select value={examCategory} onChange={e => setExamCategory(e.target.value)}>
          <option value="ALL">All Categories</option>
          <option value="JEE_MAINS">JEE Mains</option>
          <option value="JEE_ADVANCED">JEE Advanced</option>
          <option value="NEET">NEET</option>
        </select>
      </div>

      <div style={styles.cards}>
        <Card title="Students" value={summary.totalStudents} />
        <Card title="Avg Score" value={summary.avgScore + '%'} />
        <Card title="Attempts" value={summary.totalAttempts} />
        <Card title="At Risk" value={riskStudents.length} />
      </div>

      <Section title="⚡ Efficiency"
        desc="Shows how effectively students use time vs score.">
        {efficiencyData.slice(0, 10).map(e => (
          <p key={e.name}>{e.name} – {e.efficiency}</p>
        ))}
      </Section>

      <Section title="⚠️ At Risk Students"
        desc="Students below 40% accuracy.">
        {riskStudents.slice(0, 10).map(s => (
          <p key={s.student_id}>{s.name} – {format2(s.avg_score)}%</p>
        ))}
      </Section>

      <Section title="🧠 Subject Recommendations"
        desc="Action plan per subject based on analytics.">
        {subjectRecommendations.map((r, i) => (
          <div key={i} style={styles.recCard}>
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
  filters: { display: 'flex', gap: 10, marginBottom: 20 },
  cards: { display: 'flex', gap: 20 },
  card: { background: '#fff', padding: 20, borderRadius: 12 },
  section: { background: '#fff', padding: 20, marginTop: 20 },
  recCard: { background: '#f8fafc', padding: 15, marginTop: 10, borderRadius: 10 },
  desc: { color: '#555' }
}
