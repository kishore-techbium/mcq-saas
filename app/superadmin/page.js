'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function Dashboard() {
const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    colleges: 0,
    students: 0,
    exams: 0
  })
const [upcomingExams, setUpcomingExams] = useState([])
  
useEffect(() => {
  checkAccess()
}, [])
async function checkAccess() {
  const { data: auth } = await supabase.auth.getUser()

  if (!auth.user) {
    window.location.href = '/'
    return
  }

  const { data: user } = await supabase
    .from('students')
    .select('role')
    .eq('user_id', auth.user.id)
    .maybeSingle()

  if (!user || user.role !== 'superadmin') {
    window.location.href = '/dashboard'
    return
  }

  setAuthorized(true)

  await loadStats()
  await loadUpcomingExams()
  setLoading(false)   // ✅ important
}
  async function loadStats() {

    const { count: colleges } = await supabase
      .from('colleges')
      .select('*', { count: 'exact', head: true })

    const { count: students } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })

    const { count: exams } = await supabase
      .from('exams')
      .select('*', { count: 'exact', head: true })

    setStats({ colleges, students, exams })
  }
if (loading) {
  return <p style={{ padding: 40 }}>Checking access...</p>
}
  return (
    <div>
      <h1>Dashboard</h1>

      <div style={styles.grid}>
        <Card title="Colleges" value={stats.colleges} />
        <Card title="Students" value={stats.students} />
        <Card title="Exams" value={stats.exams} />
      </div>
    </div>
  )
}

async function loadUpcomingExams() {
  const today = new Date().toISOString().split('T')[0]

  // ✅ get exams
  const { data: exams } = await supabase
    .from('exams')
    .select('*')
    .gte('exam_date', today)
    .order('exam_date', { ascending: true })

  if (!exams) return

  // ✅ get colleges
  const { data: colleges } = await supabase
    .from('colleges')
    .select('id, name')

  const collegeMap = {}
  ;(colleges || []).forEach(c => {
    collegeMap[c.id] = c.name
  })

  // ✅ get student count per college
  const { data: students } = await supabase
    .from('students')
    .select('college_id')

  const collegeCount = {}
  ;(students || []).forEach(s => {
    collegeCount[s.college_id] =
      (collegeCount[s.college_id] || 0) + 1
  })

  // ✅ merge all
  const enriched = exams.map(e => ({
    ...e,
    college_name: collegeMap[e.college_id] || 'Unknown',
    student_count: collegeCount[e.college_id] || 0
  }))

  setUpcomingExams(enriched)
}

function Card({ title, value }) {
  return (
    <div style={styles.card}>
      <h3>{title}</h3>
      <h1>{value}</h1>
    </div>

  <h2 style={{ marginTop: 40 }}>📅 Upcoming Exams</h2>

{upcomingExams.length === 0 && (
  <p>No upcoming exams</p>
)}

<div style={{ marginTop: 10 }}>
  {upcomingExams.map(exam => (
    <div key={exam.id} style={styles.examCard}>
      <div>
        <strong>{exam.title}</strong>
        <p style={{ margin: 0 }}>
          🕒 {exam.exam_date} {exam.exam_time}
        </p>
<p style={{ margin: 0 }}>
  🏫 {exam.college_name}
</p>

<p style={{ margin: 0 }}>
  👥 Students: {exam.student_count}
</p>
      </div>
    </div>
  ))}
</div>

  )
}

const styles = {
  grid: { display: 'flex', gap: 20, marginTop: 20 },
  card: {
    padding: 20,
    background: '#f1f5f9',
    borderRadius: 10,
    minWidth: 150
  },
  examCard: {
  padding: 12,
  background: '#ffffff',
  borderRadius: 10,
  marginBottom: 10,
  boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
}
}
