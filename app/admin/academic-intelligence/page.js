'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts'

function format2(n){ return Number(n||0).toFixed(2) }

export default function AcademicIntelligence(){

  const [loading,setLoading]=useState(true)

  const [examCategory,setExamCategory]=useState('JEE_MAINS') // ✅ DEFAULT
  const [targetYear,setTargetYear]=useState('1') // ✅ DEFAULT

  const [summary,setSummary]=useState({})
  const [examTypeStats,setExamTypeStats]=useState([])
  const [subjects,setSubjects]=useState([])
  const [weakSubtopics,setWeakSubtopics]=useState({})
  const [trend,setTrend]=useState([])
  const [risk,setRisk]=useState([])
  const [performers,setPerformers]=useState({})
  const [insights,setInsights]=useState([])

  useEffect(()=>{ init() },[examCategory,targetYear])

  async function init(){
    setLoading(true)

    const { data: auth } = await supabase.auth.getUser()
    const user = auth.user

    const { data: u } = await supabase
      .from('students')
      .select('college_id')
      .eq('email', user.email)
      .single()

    await loadData(u.college_id)
    setLoading(false)
  }

  async function loadData(college_id){

    // ================= STUDENTS =================
    let studentQuery = supabase
      .from('students')
      .select('id, study_year, exam_preference')
      .eq('college_id', college_id)

    if(examCategory !== 'ALL'){
      studentQuery = studentQuery.eq('exam_preference',
        examCategory === 'JEE_MAINS' ? 'JEE' : 'NEET')
    }

    if(targetYear !== 'ALL'){
      studentQuery = studentQuery.eq('study_year', String(targetYear))
    }

    const { data: students=[] } = await studentQuery

    const totalStudents = students.length
    const studentIds = students.map(s=>s.id)

    // ================= EXAM STATS =================
    let examStatsQuery = supabase
      .from('student_exam_stats')
      .select('*')
      .eq('college_id', college_id)

    const { data: examStats=[] } = await examStatsQuery

    const filtered = examStats.filter(s=> studentIds.includes(s.student_id))

    const activeStudentIds = [...new Set(filtered.map(s=>s.student_id))]
    const activeStudents = activeStudentIds.length

    // ================= SUMMARY =================
    let totalScore=0,totalAttempts=0

    filtered.forEach(s=>{
      totalScore += (s.avg_score||0)*(s.attempts||0)
      totalAttempts += s.attempts||0
    })

    const avgScore = totalAttempts? totalScore/totalAttempts : 0

    // ================= EXAM TYPE =================
    const typeAgg={}

    filtered.forEach(s=>{
      const t=s.exam_type
      if(!typeAgg[t]) typeAgg[t]={score:0,count:0}

      typeAgg[t].score += s.avg_score||0
      typeAgg[t].count++
    })

    const examTypeArray = Object.keys(typeAgg).map(t=>({
      type:t,
      avg: typeAgg[t].count ? typeAgg[t].score/typeAgg[t].count : 0,
      count:typeAgg[t].count
    }))

    // ================= SUBJECT =================
    const { data: subStats=[] } = await supabase
      .from('student_subtopic_stats')
      .select('*')
      .eq('college_id', college_id)

    const subFiltered = subStats.filter(s=> studentIds.includes(s.student_id))

    const subjectAgg={}
    const subMap={}

    subFiltered.forEach(s=>{
      // subject
      if(!subjectAgg[s.subject]){
        subjectAgg[s.subject]={correct:0,total:0}
      }
      subjectAgg[s.subject].correct+=s.correct||0
      subjectAgg[s.subject].total+=s.total_questions||0

      // subtopic
      const key=s.subject+'_'+s.subtopic
      if(!subMap[key]){
        subMap[key]={...s,correct:0,total:0}
      }
      subMap[key].correct+=s.correct||0
      subMap[key].total+=s.total_questions||0
    })

    const subjectArray = Object.keys(subjectAgg).map(sub=>{
      const d=subjectAgg[sub]
      return{
        subject:sub,
        accuracy: d.total? (d.correct/d.total)*100:0
      }
    }).sort((a,b)=>a.accuracy-b.accuracy)

    // ================= WEAK SUBTOPICS =================
    const weakMap={}

    Object.values(subMap).forEach(s=>{
      const acc=s.total? (s.correct/s.total)*100:0

      if(!weakMap[s.subject]) weakMap[s.subject]=[]

      weakMap[s.subject].push({
        subtopic:s.subtopic,
        accuracy:acc
      })
    })

    Object.keys(weakMap).forEach(k=>{
      weakMap[k]=weakMap[k]
        .sort((a,b)=>a.accuracy-b.accuracy)
        .slice(0,5)
    })

    // ================= TREND =================
    const trendData = [...filtered]
      .sort((a,b)=> new Date(a.created_at)-new Date(b.created_at))
      .slice(-10)
      .map((s,i)=>({
        name:`T${i+1}`,
        score:s.avg_score
      }))

    // ================= RISK =================
    const riskMap={}

    filtered.forEach(s=>{
      if(!riskMap[s.student_id]){
        riskMap[s.student_id]={scores:[],attempts:0}
      }
      riskMap[s.student_id].scores.push(s.avg_score||0)
      riskMap[s.student_id].attempts++
    })

    const riskList = Object.values(riskMap)
      .map(s=>{
        const avg = s.scores.reduce((a,b)=>a+b,0)/s.scores.length
        return {avg, attempts:s.attempts}
      })
      .filter(s=> s.avg<40 || s.attempts<2)

    // ================= PERFORMERS =================
    const perfMap={}

    filtered.forEach(s=>{
      const t=s.exam_type
      if(!perfMap[t]) perfMap[t]=[]

      perfMap[t].push({id:s.student_id,score:s.avg_score})
    })

    Object.keys(perfMap).forEach(t=>{
      const map={}
      perfMap[t].forEach(s=>{
        if(!map[s.id]) map[s.id]=[]
        map[s.id].push(s.score)
      })

      perfMap[t]=Object.values(map)
        .map(arr=> arr.reduce((a,b)=>a+b,0)/arr.length)
        .sort((a,b)=>b-a)
        .slice(0,5)
    })

    // ================= INSIGHTS =================
    const ins=[]

    if(activeStudents < totalStudents*0.5){
      ins.push('🔴 Low participation detected')
    }

    if(subjectArray[0]?.accuracy < 50){
      ins.push(`🔴 Weak subject: ${subjectArray[0].subject}`)
    }

    if(examTypeArray.find(t=>t.type==='GRAND_TEST')?.avg < 50){
      ins.push('🔴 Grand test performance is low')
    }

    // ================= FINAL =================
    setSummary({
      totalStudents,
      activeStudents,
      participation: totalStudents? (activeStudents/totalStudents)*100:0,
      avgScore
    })

    setExamTypeStats(examTypeArray)
    setSubjects(subjectArray)
    setWeakSubtopics(weakMap)
    setTrend(trendData)
    setRisk(riskList)
    setPerformers(perfMap)
    setInsights(ins)
  }

  if(loading) return <p>Loading...</p>

  return (
    <div style={{padding:30}}>

      {/* FILTERS */}
      <div style={{display:'flex',gap:10}}>
        <select value={examCategory} onChange={e=>setExamCategory(e.target.value)}>
          <option value="JEE_MAINS">JEE</option>
          <option value="NEET">NEET</option>
        </select>

        <select value={targetYear} onChange={e=>setTargetYear(e.target.value)}>
          <option value="1">1st Year</option>
          <option value="2">2nd Year</option>
        </select>
      </div>

      {/* SUMMARY */}
      <h2>Summary</h2>
      <p>Total: {summary.totalStudents}</p>
      <p>Active: {summary.activeStudents}</p>
      <p>Participation: {format2(summary.participation)}%</p>
      <p>Avg Score: {format2(summary.avgScore)}%</p>

      {/* EXAM TYPE */}
      <h2>Exam Type Performance</h2>
      {examTypeStats.map(t=>(
        <p key={t.type}>{t.type}: {format2(t.avg)}%</p>
      ))}

      {/* SUBJECT */}
      <h2>Subjects (Weak First)</h2>
      {subjects.map(s=>(
        <p key={s.subject}>{s.subject}: {format2(s.accuracy)}%</p>
      ))}

      {/* WEAK SUBTOPICS */}
      <h2>Weak Subtopics</h2>
      {Object.entries(weakSubtopics).map(([sub,arr])=>(
        <div key={sub}>
          <strong>{sub}</strong>
          {arr.map((a,i)=>(
            <p key={i}>{a.subtopic} - {format2(a.accuracy)}%</p>
          ))}
        </div>
      ))}

      {/* TREND */}
      <h2>Trend</h2>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={trend}>
          <XAxis dataKey="name"/>
          <YAxis/>
          <Tooltip/>
          <Line dataKey="score"/>
        </LineChart>
      </ResponsiveContainer>

      {/* RISK */}
      <h2>At Risk</h2>
      {risk.map((r,i)=>(
        <p key={i}>{format2(r.avg)}%</p>
      ))}

      {/* PERFORMERS */}
      <h2>Top Performers</h2>
      {Object.entries(performers).map(([type,list])=>(
        <div key={type}>
          <strong>{type}</strong>
          {list.map((s,i)=>(
            <p key={i}>{format2(s)}%</p>
          ))}
        </div>
      ))}

      {/* INSIGHTS */}
      <h2>AI Insights</h2>
      {insights.map((i,idx)=>(
        <p key={idx}>{i}</p>
      ))}

    </div>
  )
}
