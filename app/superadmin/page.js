'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)

  const [stats, setStats] = useState({
    colleges: 0,
    students: 0,
    exams: 0
  })

  const [upcomingExams, setUpcomingExams] = useState([])

  const [workers, setWorkers] = useState(1)
  const [saveMsg, setSaveMsg] = useState('')

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

    await loadStats()
    await loadUpcomingExams()

    setLoading(false)
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

  async function loadUpcomingExams() {
    const today = new Date().toISOString().split('T')[0]

    const { data: exams } = await supabase
      .from('exams')
      .select('*')
      .gte('exam_date', today)
      .order('exam_date', { ascending: true })

    if (!exams) return

    const { data: colleges } = await supabase
      .from('colleges')
      .select('id, name')

    const collegeMap = {}
    ;(colleges || []).forEach(c => {
      collegeMap[c.id] = c.name
    })

    const { data: students } = await supabase
      .from('students')
      .select('college_id')

    const collegeCount = {}
    ;(students || []).forEach(s => {
      collegeCount[s.college_id] =
        (collegeCount[s.college_id] || 0) + 1
    })

    const enriched = exams.map(e => ({
      ...e,
      college_name: collegeMap[e.college_id] || 'Unknown',
      student_count: collegeCount[e.college_id] || 0
    }))

    setUpcomingExams(enriched)
  }

  function getRecommendedWorkers(count) {
    if (count < 50) return 1
    if (count < 120) return 2
    if (count < 250) return 3
    return 4
  }

 async function handleScaleWorkers() {
  try {
    const { data: session } = await supabase.auth.getSession()

    const res = await fetch('/api/scale-workers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.session.access_token}`
      },
      body: JSON.stringify({ workers })
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error || 'Failed')
    }

    setSaveMsg('Workers scaled successfully ✅')
  } catch (err) {
    setSaveMsg('Scaling failed ❌')
  }

  setTimeout(() => setSaveMsg(''), 2000)
}

  if (loading) {
    return <p style={{ padding: 40 }}>Checking access...</p>
  }

  return (
    <div>
      <h1>Dashboard</h1>

      {/* 🔥 TOP RIGHT WORKER CONTROL */}
      <div style={styles.topBar}>
        <div>
          <label>Workers: </label>
          <select
            value={workers}
            onChange={(e) => setWorkers(Number(e.target.value))}
          >
            {[1,2,3,4].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>

          <button onClick={handleScaleWorkers} style={styles.button}>
            Save
          </button>

          {saveMsg && <span style={{ marginLeft: 10 }}>{saveMsg}</span>}
        </div>
      </div>

      <div style={styles.grid}>
        <Card title="Colleges" value={stats.colleges} />
        <Card title="Students" value={stats.students} />
        <Card title="Exams" value={stats.exams} />
      </div>

      <h2 style={{ marginTop: 40 }}>📅 Upcoming Exams</h2>

      {upcomingExams.length === 0 && <p>No upcoming exams</p>}

      {/* 🔥 TABLE VIEW */}
      <table style={styles.table}>
        <thead>
          <tr>
            <th>Exam</th>
            <th>Date</th>
            <th>Time</th>
            <th>College</th>
            <th>Students</th>
            <th>Workers</th>
          </tr>
        </thead>
        <tbody>
          {upcomingExams.map(exam => (
            <tr key={exam.id}>
              <td>{exam.title}</td>
              <td>{exam.exam_date}</td>
              <td>{exam.exam_time}</td>
              <td>{exam.college_name}</td>
              <td>{exam.student_count}</td>
              <td>{getRecommendedWorkers(exam.student_count)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Card({ title, value }) {
  return (
    <div style={styles.card}>
      <h3>{title}</h3>
      <h1>{value}</h1>
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

  topBar: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: 20
  },

  button: {
    marginLeft: 10,
    padding: '5px 10px',
    cursor: 'pointer'
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: 10
  }
}
