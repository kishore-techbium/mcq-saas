'use client'

import { supabase } from '../../../../lib/supabase'
import { useEffect, useState } from 'react'

export default function CollegeInsights() {
  const [loading, setLoading] = useState(true)

  const [stats, setStats] = useState({})
  const [topStudents, setTopStudents] = useState([])
  const [subjects, setSubjects] = useState([])
  const [subtopics, setSubtopics] = useState([])

  useEffect(() => {
    init()
  }, [])

async function init() {
const { data: authData } = await supabase.auth.getUser()
const user = authData?.user

if (!user) {
  alert('Not logged in')
  return
}

const { data: userData } = await supabase
  .from('students')
  .select('college_id, role, name')
  .eq('email', user.email)   // 🔥 FIXED
  .single()

if (!userData) {
  alert('User not found in students table')
  return
}

const college_id = userData.college_id

  // 🔥 pass college_id here
  await loadAll(userData.college_id)

  setLoading(false)
}

async function loadAll(college_id) {
    

    // =========================
    // ✅ TOP CARDS
    // =========================
    const { count: totalStudents } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('college_id', college_id)
      .eq('role', 'student')

    const { data: overall } = await supabase
      .from('student_overall_stats')
      .select('total_attempts, total_score_sum')
      .eq('college_id', college_id)

    let totalAttempts = 0
    let totalScore = 0

    overall?.forEach(r => {
      totalAttempts += r.total_attempts || 0
      totalScore += r.total_score_sum || 0
    })

    const avgScore = totalAttempts ? (totalScore / totalAttempts).toFixed(2) : 0

    setStats({ totalStudents, totalAttempts, avgScore })

    // =========================
    // 🏆 TOP PERFORMERS
    // =========================
    const { data: toppers } = await supabase
      .from('student_overall_stats')
      .select('student_id, avg_score, best_score, total_attempts')
      .eq('college_id', college_id)
      .gte('total_attempts', 5)
      .order('avg_score', { ascending: false })
      .limit(10)

    const ids = toppers?.map(t => t.student_id)

    const { data: students } = await supabase
      .from('students')
      .select('id, name')
      .in('id', ids)

    const topList = toppers?.map(t => ({
      ...t,
      name: students?.find(s => s.id === t.student_id)?.name || 'Unknown'
    }))

    setTopStudents(topList || [])

    // =========================
    // 📉 SUBJECT ANALYSIS
    // =========================
    const { data: subjectStats } = await supabase
      .from('student_subject_stats')
      .select('subject, attempts, correct')
      .eq('college_id', college_id)

    const subjectMap = {}

    subjectStats?.forEach(s => {
      if (!subjectMap[s.subject]) {
        subjectMap[s.subject] = { attempts: 0, correct: 0 }
      }
      subjectMap[s.subject].attempts += s.attempts || 0
      subjectMap[s.subject].correct += s.correct || 0
    })

    const subjectArray = Object.keys(subjectMap).map(sub => ({
      subject: sub,
      accuracy: subjectMap[sub].correct / subjectMap[sub].attempts,
      attempts: subjectMap[sub].attempts
    }))

    subjectArray.sort((a,b)=>a.accuracy - b.accuracy)

    setSubjects(subjectArray)

    // =========================
    // 🔬 SUBTOPIC ANALYSIS (USP)
    // =========================
    const { data: subtopicStats } = await supabase
      .from('student_subtopic_stats')
      .select('subject, subtopic, attempts, correct')
      .eq('college_id', college_id)

    const subMap = {}

    subtopicStats?.forEach(s => {
      const key = s.subject + '|' + s.subtopic

      if (!subMap[key]) {
        subMap[key] = {
          subject: s.subject,
          subtopic: s.subtopic,
          attempts: 0,
          correct: 0
        }
      }

      subMap[key].attempts += s.attempts || 0
      subMap[key].correct += s.correct || 0
    })

    const subArray = Object.values(subMap).map(s => ({
      ...s,
      accuracy: s.correct / s.attempts
    }))

    subArray.sort((a,b)=>a.accuracy - b.accuracy)

    setSubtopics(subArray)
  }

  if (loading) return <p style={{ padding: 30 }}>Loading...</p>

  return (
    <div style={{ padding: 40, background:'#f1f5f9', minHeight:'100vh' }}>

      <h1>🎓 College Intelligence Dashboard</h1>

      {/* TOP CARDS */}
      <div style={{ display:'flex', gap:20, marginBottom:30 }}>
        <Card title="Students" value={stats.totalStudents} />
        <Card title="Attempts" value={stats.totalAttempts} />
        <Card title="Avg Score" value={stats.avgScore} />
      </div>

      {/* TOP PERFORMERS */}
      <Section title="🏆 Top Performers">
        {table(
          ['Name','Avg','Attempts','Best'],
          topStudents.map(s=>[
            s.name, s.avg_score, s.total_attempts, s.best_score
          ])
        )}
      </Section>

      {/* WEAK SUBJECTS */}
      <Section title="📉 Weak Subjects">
        {table(
          ['Subject','Accuracy','Attempts'],
          subjects.slice(0,5).map(s=>[
            s.subject,
            (s.accuracy*100).toFixed(1)+'%',
            s.attempts
          ])
        )}
      </Section>

      {/* STRONG SUBJECTS */}
      <Section title="📈 Strong Subjects">
        {table(
          ['Subject','Accuracy','Attempts'],
          subjects.slice(-5).reverse().map(s=>[
            s.subject,
            (s.accuracy*100).toFixed(1)+'%',
            s.attempts
          ])
        )}
      </Section>

      {/* WEAK SUBTOPICS */}
      <Section title="🔬 Weak Subtopics">
        {table(
          ['Subject','Subtopic','Accuracy','Attempts'],
          subtopics.slice(0,10).map(s=>[
            s.subject,
            s.subtopic,
            (s.accuracy*100).toFixed(1)+'%',
            s.attempts
          ])
        )}
      </Section>

    </div>
  )
}

// ================= UI HELPERS =================

function Card({title,value}) {
  return (
    <div style={{
      background:'#fff',
      padding:20,
      borderRadius:12,
      boxShadow:'0 5px 15px rgba(0,0,0,0.08)'
    }}>
      <div style={{ color:'#666' }}>{title}</div>
      <div style={{ fontSize:22, fontWeight:700 }}>{value}</div>
    </div>
  )
}

function Section({title, children}) {
  return (
    <div style={{
      background:'#fff',
      padding:20,
      borderRadius:16,
      marginBottom:20
    }}>
      <h2>{title}</h2>
      {children}
    </div>
  )
}

function table(headers, rows) {
  return (
    <table style={{ width:'100%', borderCollapse:'collapse' }}>
      <thead>
        <tr>
          {headers.map((h,i)=>(
            <th key={i} style={{ textAlign:'left', padding:10 }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r,i)=>(
          <tr key={i} style={{ borderTop:'1px solid #eee' }}>
            {r.map((c,j)=>(
              <td key={j} style={{ padding:10 }}>{c}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
