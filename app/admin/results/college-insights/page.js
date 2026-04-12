'use client'

import { supabase } from '../../../../lib/supabase'
import { useEffect, useState } from 'react'

export default function CollegeInsights() {
  const [loading, setLoading] = useState(true)

  const [stats, setStats] = useState({})
  const [topStudents, setTopStudents] = useState([])
  const [subjects, setSubjects] = useState([])
  const [subtopics, setSubtopics] = useState([])

  const [selectedSubject, setSelectedSubject] = useState(null)
  const [adminName, setAdminName] = useState('')

  useEffect(() => {
    init()
  }, [])

  async function init() {
    // 🔐 AUTH (MATCHING YOUR ADMIN DASHBOARD)
    const { data: authData } = await supabase.auth.getUser()
    const user = authData?.user

    if (!user) {
      alert('Not logged in')
      window.location.href = '/'
      return
    }

    const { data: userData } = await supabase
      .from('students')
      .select('college_id, role, first_name')
      .eq('email', user.email) // ✅ IMPORTANT FIX
      .maybeSingle()

    if (!userData) {
      alert('User not found in students table')
      return
    }

    if (userData.role !== 'admin' && userData.role !== 'superadmin') {
      alert('Access denied')
      window.location.href = '/'
      return
    }

    setAdminName(userData.first_name || 'Admin')

    await loadAll(userData.college_id)

    setLoading(false)
  }

  async function loadAll(college_id) {
    // =========================
    // TOP CARDS
    // =========================
    const { count: totalStudents } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('college_id', college_id)
      .eq('role', 'student')

const { data: overall } = await supabase
  .from('student_overall_stats')
  .select('*')
  
  const avgScore =
  overall && overall.length > 0
    ? Number(overall[0]?.avg_score || 0).toFixed(1)
    : '0.0'


let totalAttempts = 0
overall?.forEach(r => {
  totalAttempts += r.total_attempts || 0
})
    setStats({ totalStudents, totalAttempts, avgScore })

    // =========================
    // TOP PERFORMERS
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
      .select('id, first_name')
      .in('id', ids)

    const topList = toppers?.map(t => ({
      ...t,
      name:
        students?.find(s => s.id === t.student_id)?.first_name ||
        'Unknown'
    }))

    setTopStudents(topList || [])

    // =========================
    // SUBJECT ANALYSIS
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
      accuracy:
        subjectMap[sub].attempts > 0
          ? subjectMap[sub].correct / subjectMap[sub].attempts
          : 0,
      attempts: subjectMap[sub].attempts
    }))

    subjectArray.sort((a, b) => a.accuracy - b.accuracy)

    setSubjects(subjectArray)

    // =========================
    // SUBTOPIC ANALYSIS
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
      accuracy:
        s.attempts > 0 ? s.correct / s.attempts : 0
    }))

    subArray.sort((a, b) => a.accuracy - b.accuracy)

    setSubtopics(subArray)
  }

  if (loading) return <p style={{ padding: 30 }}>Loading...</p>

  return (
    <div style={styles.page}>
      <h1>🎓 College Intelligence Dashboard</h1>
      <p style={{ marginBottom: 20 }}>
        Welcome, <strong>{adminName}</strong>
      </p>

      {/* TOP CARDS */}
      <div style={styles.cards}>
        <Card title="Students" value={stats.totalStudents} />
        <Card title="Exams Taken" value={stats.totalAttempts} />
        <Card title="Average Score" value={avgScore + '%'} />
      </div>

      {/* TOP PERFORMERS */}
      <Section title="🏆 Top Performers">
        {renderTable(
          ['Name', 'Avg', 'Attempts', 'Best'],
topStudents.map(s => [
  s.name,
  (s.avg_score || 0).toFixed(1) + '%',
  s.total_attempts,
  Math.round(s.best_score)
])
        )}
      </Section>

      {/* SUBJECTS */}
      <Section title="📉 Weak Subjects (Click to Drill Down)">
        {renderTable(
          ['Subject', 'Accuracy', 'Attempts'],
          subjects
  .filter(s => s.accuracy < 0.5)
  .slice(0, 5).map(s => [
            <span
              style={styles.link}
              onClick={() => setSelectedSubject(s.subject)}
            >
              {s.subject}
            </span>,
            (s.accuracy * 100).toFixed(1) + '%',
            s.attempts
          ])
        )}
      </Section>

      {/* STRONG SUBJECTS */}
      <Section title="📈 Strong Subjects">
        {renderTable(
          ['Subject', 'Accuracy', 'Attempts'],
          subjects
  .filter(s => s.accuracy >= 0.7)
  .slice(0, 5).reverse().map(s => [
            s.subject,
            (s.accuracy * 100).toFixed(1) + '%',
            s.attempts
          ])
        )}
      </Section>

      {/* SUBTOPICS */}
      <Section
        title={`🔬 Weak Subtopics ${
          selectedSubject ? `- ${selectedSubject}` : ''
        }`}
      >
        {selectedSubject && (
          <button
            onClick={() => setSelectedSubject(null)}
            style={styles.resetBtn}
          >
            Reset
          </button>
        )}

        {renderTable(
          ['Subject', 'Subtopic', 'Accuracy', 'Attempts'],
          (selectedSubject
            ? subtopics.filter(s => s.subject === selectedSubject)
            : subtopics
          )
            .slice(0, 10)
            .map(s => [
              s.subject,
              s.subtopic,
              (s.accuracy * 100).toFixed(1) + '%',
              s.attempts
            ])
        )}
      </Section>
    </div>
  )
}

/* UI COMPONENTS */

function Card({ title, value }) {
  return (
    <div style={styles.card}>
      <div>{title}</div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
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

function renderTable(headers, rows) {
  return (
    <table style={styles.table}>
      <thead>
        <tr>
          {headers.map((h, i) => (
           <th
  key={i}
  style={{
    textAlign: i === 0 ? 'left' : 'right',  // 🔥 FIX
    padding: '10px',
    fontSize: 13,
    color: '#64748b'
  }}
>
  {h}
</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr
  key={i}
  style={{
    background: '#f8fafc',
    borderRadius: 10
  }}
>
            {r.map((c, j) => (
 <td
  key={j}
  style={{
    padding: '12px',
    fontSize: 14,
    fontWeight: 500,
    textAlign: j === 0 ? 'left' : 'right'
  }}
>
  {c}
</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/* STYLES */

const styles = {
  page: { padding: 40, background: '#f1f5f9', minHeight: '100vh' },
  cards: { display: 'flex', gap: 20, marginBottom: 30 },
  
  card: {
  background: '#fff',
  padding: 20,
  borderRadius: 12,
  minWidth: 180,
  textAlign: 'center',
      boxShadow: '0 5px 15px rgba(0,0,0,0.08)'
},
  section: {
    background: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20
  },
  table: {
  width: '100%',
  borderCollapse: 'separate',
  borderSpacing: '0 8px'
},
  link: { color: '#2563eb', cursor: 'pointer', fontWeight: 600 },
  resetBtn: {
    marginBottom: 10,
    padding: '6px 10px',
    borderRadius: 6,
    border: 'none',
    background: '#ef4444',
    color: '#fff',
    cursor: 'pointer'
  }
}
