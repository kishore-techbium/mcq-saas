'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  LineChart, Line, CartesianGrid
} from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function CompareStudentsPage() {

  const params = useSearchParams()
  const ids = params.get('ids')?.split(',') || []

  const [students, setStudents] = useState([])
  const [examCategory, setExamCategory] = useState('ALL')
  const [targetYear, setTargetYear] = useState('ALL')

  const [examTakenData, setExamTakenData] = useState([])
  const [avgScoreData, setAvgScoreData] = useState([])
  const [trendData, setTrendData] = useState([])
  const [subjectData, setSubjectData] = useState([])
  const [efficiencyData, setEfficiencyData] = useState([])
  const [weakTopics, setWeakTopics] = useState([])

  useEffect(() => {
    if (ids.length >= 2) loadData()
  }, [examCategory, targetYear])

  async function loadData() {

    // 🔹 fetch students
    const { data: studentData } = await supabase
      .from('students')
      .select('*')
      .in('id', ids)

    const nameMap = {}
studentData.forEach(s => {
  nameMap[s.id] = `${s.first_name}`
})
    // 🔹 exam filter
    let examQuery = supabase.from('exams').select('id, exam_type')

    if (examCategory !== 'ALL') {
      examQuery.eq('exam_category', examCategory)
    }

    const { data: exams } = await examQuery
    const examIds = exams.map(e => e.id)

    // 🔹 exam stats
    let statsQuery = supabase
      .from('student_exam_stats')
      .select('*')
      .in('student_id', ids)

    if (examIds.length > 0) {
      statsQuery = statsQuery.in('exam_id', examIds)
    }

    const { data: stats } = await statsQuery

    // 🔹 target year filter
    let filteredStats = stats

    if (targetYear !== 'ALL') {
      const { data: yearStudents } = await supabase
        .from('students')
        .select('id')
        .eq('target_year', Number(targetYear))

      const yearIds = yearStudents.map(s => s.id)
      filteredStats = stats.filter(s => yearIds.includes(s.student_id))
    }

    // ================= EXAMS TAKEN =================
    const examCount = {}

    filteredStats.forEach(s => {
      if (!examCount[s.student_id]) examCount[s.student_id] = 0
      examCount[s.student_id] += 1
    })

    const examTaken = studentData.map(s => ({
      name: `${s.first_name}`,
      exams: examCount[s.id] || 0
    }))

    setExamTakenData(examTaken)

    // ================= AVG SCORE =================
    const avgMap = {}

    filteredStats.forEach(s => {
      if (!avgMap[s.student_id]) avgMap[s.student_id] = []
      avgMap[s.student_id].push(s.avg_score || 0)
    })

    const avgData = studentData.map(s => {
      const arr = avgMap[s.id] || []
      const avg = arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0
      return { name: s.first_name, score: Number(avg.toFixed(2)) }
    })

    setAvgScoreData(avgData)

    // ================= TREND =================
    const trend = filteredStats.slice(0, 20).map((s,i)=>({
      name: `Test ${i+1}`,
      [nameMap[s.student_id]]: Number((s.avg_score || 0).toFixed(2))
    }))

    setTrendData(trend)

    // ================= SUBJECT =================
    const { data: subStats } = await supabase
      .from('student_subject_stats')
      .select('*')
      .in('student_id', ids)

    const subjectAgg = {}

    subStats.forEach(s => {
      const key = `${s.subject}-${s.student_id}`
      if (!subjectAgg[key]) subjectAgg[key] = { correct:0, total:0 }

      subjectAgg[key].correct += s.correct
      subjectAgg[key].total += s.total_questions
    })

    const subjects = {}

    Object.keys(subjectAgg).forEach(k => {
      const [subject, sid] = k.split('-')
      if (!subjects[subject]) subjects[subject] = { subject }

      const acc = subjectAgg[k].total
        ? (subjectAgg[k].correct / subjectAgg[k].total) * 100
        : 0

      subjects[subject][nameMap[sid]] = Number(acc.toFixed(2))
    })

    setSubjectData(Object.values(subjects))

    // ================= EFFICIENCY =================
    const efficiency = studentData.map(s => {
      const userStats = filteredStats.filter(x => x.student_id === s.id)

      const totalScore = userStats.reduce((a,b)=>a+(b.avg_score||0),0)
      const totalTime = userStats.reduce((a,b)=>a+(b.total_time_spent||0),0)

      const eff = totalTime ? totalScore / (totalTime/60) : 0

       return {
        name: s.first_name,
        efficiency: Number(eff.toFixed(2))
      }
    })

    setEfficiencyData(efficiency)

    // ================= WEAK TOPICS =================
    const { data: subtopicStats } = await supabase
      .from('student_subtopic_stats')
      .select('*')
      .in('student_id', ids)

    const weak = subtopicStats
      .map(s => ({
        student: s.student_id,
        topic: s.subtopic,
        acc: Number(((s.correct / s.total_questions) * 100).toFixed(2)) : 0
      }))
      .filter(s => s.acc < 40)
      .slice(0,10)

    setWeakTopics(weak)
  }

  if (ids.length < 2) {
    return <p>Select at least 2 students</p>
  }

  return (
    <div style={{ padding: 30 }}>

      <h1>📊 Student Comparison</h1>

      {/* FILTERS */}
      <div style={{ display:'flex', gap:10, marginBottom:20 }}>
        <select value={examCategory} onChange={e=>setExamCategory(e.target.value)}>
          <option value="ALL">All Categories</option>
          <option value="JEE">JEE</option>
          <option value="NEET">NEET</option>
        </select>

        <select value={targetYear} onChange={e=>setTargetYear(e.target.value)}>
          <option value="ALL">All Years</option>
          <option value="1">1st Year</option>
          <option value="2">2nd Year</option>
        </select>
      </div>

      {/* EXAMS TAKEN */}
      <h3>Exams Taken</h3>
      <BarChart width={600} height={250} data={examTakenData}>
        <XAxis dataKey="name"/>
        <YAxis/>
        <Tooltip formatter={(value) => `${value}%`} />
        <Bar dataKey="exams" fill="#3b82f6"/>
      </BarChart>

      {/* AVG SCORE */}
      <h3>Average Score</h3>
      <BarChart width={600} height={250} data={avgScoreData}>
        <XAxis dataKey="name"/>
        <YAxis/>
        <Tooltip formatter={(value) => `${value}%`} />
        <Bar dataKey="score" fill="#10b981"/>
      </BarChart>

      {/* TREND */}
      <h3>Score Trend</h3>
      <LineChart width={700} height={300} data={trendData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name"/>
        <YAxis/>
        <Tooltip formatter={(value) => `${value}%`} />
        {ids.map((id,i)=>(
          <Line
            key={id}
            dataKey={nameMap[id]}
            name={nameMap[id]}
            stroke={COLORS[i]}
          />
        ))}
      </LineChart>

      {/* SUBJECT */}
      <h3>Subject Comparison</h3>
      <BarChart width={700} height={300} data={subjectData}>
        <XAxis dataKey="subject"/>
        <YAxis/>
        <Tooltip formatter={(value) => `${value}%`} />
        <Legend/>
                {ids.map((id,i)=>(
              <Bar
                key={id}
                dataKey={nameMap[id]}
                name={nameMap[id]}
                fill={COLORS[i]}
              />
            ))}
      </BarChart>

      {/* EFFICIENCY */}
      <h3>Efficiency</h3>
      <BarChart width={600} height={250} data={efficiencyData}>
        <XAxis dataKey="name"/>
        <YAxis/>
        <Tooltip formatter={(value) => `${value}%`} />
        <Bar dataKey="efficiency" fill="#8b5cf6"/>
      </BarChart>

      {/* WEAK TOPICS */}
      <h3>Weak Topics</h3>
      {weakTopics.map((w,i)=>(
        <p key={i}>{w.topic} ({w.acc.toFixed(1)}%)</p>
      ))}

    </div>
  )
}
