'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function Dashboard() {

  const [stats, setStats] = useState({
    colleges: 0,
    students: 0,
    exams: 0
  })

  useEffect(() => {
    loadStats()
  }, [])

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
