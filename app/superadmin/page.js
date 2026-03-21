'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function SuperAdminPage() {

  const [colleges, setColleges] = useState([])
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadColleges()
  }, [])

  async function loadColleges() {
    const { data } = await supabase
      .from('colleges')
      .select('*')
      .order('created_at', { ascending: false })

    setColleges(data || [])
    setLoading(false)
  }

  async function createCollege() {

    if (!name) {
      alert('Enter college name')
      return
    }

    const { error } = await supabase
      .from('colleges')
      .insert({ name })

    if (error) {
      alert('Error creating college')
      return
    }

    setName('')
    loadColleges()
  }

  if (loading) {
    return <p style={{ padding: 30 }}>Loading...</p>
  }

  return (
    <div style={{ padding: 40 }}>

      <h1>👑 Superadmin Dashboard</h1>

      {/* CREATE COLLEGE */}
      <div style={{ marginTop: 20 }}>
        <h3>Create College</h3>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="College Name"
          style={styles.input}
        />

        <button onClick={createCollege} style={styles.btn}>
          Create
        </button>
      </div>

      {/* LIST COLLEGES */}
      <div style={{ marginTop: 40 }}>
        <h3>All Colleges</h3>

        {colleges.map(c => (
          <div key={c.id} style={styles.card}>
            {c.name}
          </div>
        ))}

        {colleges.length === 0 && <p>No colleges yet</p>}
      </div>

    </div>
  )
}

const styles = {
  input: {
    padding: 10,
    marginRight: 10,
    borderRadius: 6,
    border: '1px solid #ccc'
  },
  btn: {
    padding: '10px 16px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 6
  },
  card: {
    padding: 12,
    background: '#f1f5f9',
    marginTop: 10,
    borderRadius: 6
  }
}
