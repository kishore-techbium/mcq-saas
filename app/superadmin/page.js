'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [globalExams, setGlobalExams] = useState([])
const [collegesList, setCollegesList] = useState([])
const [assignments, setAssignments] = useState([])
const [selectedExam, setSelectedExam] = useState('')
const [selectedCollege, setSelectedCollege] = useState('')
const [examDate, setExamDate] = useState('')
const [examTime, setExamTime] = useState('')

const [assignMsg, setAssignMsg] = useState('')

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
    await loadGlobalData()
    await loadAssignments()
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

  async function loadGlobalData() {

  // 🔹 Fetch global exams
  const { data: exams } = await supabase
    .from('exams')
    .select('id, title')
    .eq('is_global', true)

  // 🔹 Fetch colleges
  const { data: colleges } = await supabase
    .from('colleges')
    .select('id, name')

  setGlobalExams(exams || [])
  setCollegesList(colleges || [])
}
  
  function getInfraRecommendation(exams) {
  if (!exams || exams.length === 0) return null

  const maxStudents = Math.max(...exams.map(e => e.student_count || 0))

  if (maxStudents < 300) {
    return {
      level: 'safe',
      message: 'Current infrastructure is sufficient.',
      plan: '1 vCPU / 2GB',
      action: 'No upgrade needed'
    }
  }

  if (maxStudents < 600) {
    return {
      level: 'moderate',
      message: 'Increase workers during exam.',
      plan: '1 vCPU / 2GB',
      action: 'Scale workers to 3–4'
    }
  }

  if (maxStudents < 1000) {
    return {
      level: 'high',
      message: 'Upgrade recommended for smooth performance.',
      plan: '2 vCPU / 4GB',
      action: 'Upgrade 30 mins before exam'
    }
  }

  return {
    level: 'critical',
    message: 'Upgrade mandatory to avoid delays.',
    plan: '4 vCPU / 8GB',
    action: 'Upgrade 1 hour before exam'
  }
}

  function getRecommendedWorkers(count) {
    if (count < 50) return 1
    if (count < 120) return 2
    if (count < 250) return 3
    return 4
  }
async function assignExam() {

  if (!selectedExam || !selectedCollege || !examDate || !examTime) {
    setAssignMsg('❌ Fill all fields')
    return
  }

  const { data: exam } = await supabase
    .from('exams')
    .select('duration_minutes')
    .eq('id', selectedExam)
    .single()

  const { error } = await supabase
    .from('exam_assignments')
    .insert({
      exam_id: selectedExam,
      college_id: selectedCollege,
      exam_date: examDate,
      exam_time: examTime,
      duration_minutes: exam.duration_minutes
    })

  if (error) {
    setAssignMsg('❌ ' + error.message)
    return
  }

  setAssignMsg('✅ Assigned successfully')

  // reset
  setSelectedExam('')
  setSelectedCollege('')
  setExamDate('')
  setExamTime('')
}

async function loadAssignments() {

  const { data } = await supabase
    .from('exam_assignments')
    .select(`
      id,
      exam_date,
      exam_time,
      is_active,
      exams (title),
      colleges (name)
    `)
    .order('assigned_at', { ascending: false })

  setAssignments(data || [])
}
async function toggleActive(id, current) {

  const { error } = await supabase
    .from('exam_assignments')
    .update({ is_active: !current })
    .eq('id', id)

  if (!error) {
    loadAssignments()
  }
}
async function updateSchedule(id, newDate, newTime) {

  const { error } = await supabase
    .from('exam_assignments')
    .update({
      exam_date: newDate,
      exam_time: newTime
    })
    .eq('id', id)

  if (!error) {
    loadAssignments()
  }
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
const infra = getInfraRecommendation(upcomingExams)
  return (
    <div>
      <div style={styles.header}>
          <h1>Dashboard</h1>
        
          <button
            style={styles.primaryBtn}
            onClick={() => window.location.href = '/superadmin/globalexam'}
          >
            ➕ Create Global Exam
          </button>
        </div>

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

      <h2 style={{ marginTop: 40 }}>🎯 Assign Global Exam</h2>

<div style={styles.assignBox}>

  <select value={selectedExam} onChange={e => setSelectedExam(e.target.value)}>
    <option value="">Select Global Exam</option>
    {globalExams.map(e => (
      <option key={e.id} value={e.id}>{e.title}</option>
    ))}
  </select>

  <select value={selectedCollege} onChange={e => setSelectedCollege(e.target.value)}>
    <option value="">Select College</option>
    {collegesList.map(c => (
      <option key={c.id} value={c.id}>{c.name}</option>
    ))}
  </select>

  <input
    type="date"
    value={examDate}
    onChange={e => setExamDate(e.target.value)}
  />

  <input
    type="time"
    value={examTime}
    onChange={e => setExamTime(e.target.value)}
  />

  <button onClick={assignExam} style={styles.primaryBtn}>
    Assign
  </button>

  {assignMsg && <p>{assignMsg}</p>}
</div>
    <h2 style={{ marginTop: 40 }}>📊 Global Exam Assignments</h2>
    <p>Want to change date&time, first off the exam and change them and turn on the exam</p>

<table style={{ ...styles.table, tableLayout: 'fixed' }}>
  <thead>
  <tr>
    <th style={{ width: '25%' }}>Exam</th>
    <th style={{ width: '20%' }}>College</th>
    <th style={{ width: '20%' }}>Date</th>
    <th style={{ width: '15%' }}>Time</th>
    <th style={{ width: '10%' }}>Active</th>
    <th style={{ width: '10%' }}>Action</th>
  </tr>
</thead>
  <tbody>
    {assignments.map(a => (
      <tr key={a.id}>
        <td>{a.exams?.title}</td>
        <td>{a.colleges?.name}</td>

        <td>
          <input
            type="date"
            style={styles.dateInput}
            defaultValue={a.exam_date}
            onBlur={(e) =>
              updateSchedule(a.id, e.target.value, a.exam_time)
            }
          />
        </td>

        <td>
          <input
            type="time"
            style={styles.timeInput}
            defaultValue={a.exam_time}
            onBlur={(e) =>
              updateSchedule(a.id, a.exam_date, e.target.value)
            }
          />
        </td>

        <td style={{ textAlign: 'center' }}>
          <button
            onClick={() => toggleActive(a.id, a.is_active)}
            style={{
              background: a.is_active ? '#16a34a' : '#dc2626',
              color: '#fff',
              border: 'none',
              padding: '5px 10px',
              borderRadius: 6
            }}
          >
            {a.is_active ? 'ON' : 'OFF'}
          </button>
        </td>

        <td>
          —
        </td>
      </tr>
    ))}
  </tbody>
</table>

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
        
          {infra && (
  <div style={{
    marginTop: 30,
    padding: 15,
    borderRadius: 10,
    background:
      infra.level === 'safe' ? '#ecfdf5' :
      infra.level === 'moderate' ? '#fffbeb' :
      infra.level === 'high' ? '#fef2f2' :
      '#fee2e2'
  }}>
    <h3>⚙ Infrastructure Recommendation</h3>

    <p>📊 Max Students: {Math.max(...upcomingExams.map(e => e.student_count || 0))}</p>

    <p>💡 {infra.message}</p>

    <p>🖥 Recommended Plan: {infra.plan}</p>

    <p>⏰ Action: {infra.action}</p>
  </div>
)}
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
  },
  header: {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
},
  dateInput: {
  width: '100%',
  padding: '6px',
  boxSizing: 'border-box'
},
th: {
  textAlign: 'left',
  padding: 10,
  borderBottom: '1px solid #ddd'
},

td: {
  textAlign: 'left',
  padding: 10,
  borderBottom: '1px solid #eee',
  verticalAlign: 'middle'
},
timeInput: {
  width: '100%',
  padding: '6px',
  boxSizing: 'border-box'
},
  assignBox: {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
  marginTop: 10,
  padding: 15,
  background: '#f8fafc',
  borderRadius: 10
},
tableLayout: {
  tableLayout: 'fixed',
},

primaryBtn: {
  padding: '10px 16px',
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  fontWeight: 500
}
}
