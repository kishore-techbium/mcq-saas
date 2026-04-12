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
  }
}
