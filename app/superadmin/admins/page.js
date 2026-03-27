'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

export default function Admins() {

  const [admins, setAdmins] = useState([])
  const [colleges, setColleges] = useState([])
  const [email, setEmail] = useState('')
  const [collegeId, setCollegeId] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {

    // ✅ JOIN college name
    const { data: admins } = await supabase
      .from('students')
      .select('*, colleges(name)')
      .eq('role', 'admin')

    const { data: colleges } = await supabase
      .from('colleges')
      .select('*')

    setAdmins(admins || [])
    setColleges(colleges || [])
  }

  async function createAdmin() {

    if (!email || !collegeId) {
      alert('Fill all fields')
      return
    }

    await supabase.from('students').insert({
      email,
      role: 'admin',
      college_id: collegeId
    })

    setEmail('')
    loadData()
  }

  async function deleteAdmin(id) {
    await supabase.from('students').delete().eq('id', id)
    loadData()
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>Admins</h1>

      <div style={styles.form}>
        <input
          placeholder="Admin Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />

        <select
          onChange={(e) => setCollegeId(e.target.value)}
          style={styles.input}
        >
          <option>Select College</option>
          {colleges.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <button onClick={createAdmin} style={styles.btn}>
          Create Admin
        </button>
      </div>

      {admins.map(a => (
        <div key={a.id} style={styles.row}>
          <div>
            <strong>{a.email}</strong>
            <div style={{ fontSize: 13, color: '#555' }}>
              {a.colleges?.name || 'No College'}
            </div>
          </div>

          <button onClick={() => deleteAdmin(a.id)} style={styles.deleteBtn}>
            Delete
          </button>
        </div>
      ))}
    </div>
  )
}

const styles = {
  page: { padding: 30 },
  heading: { fontSize: 26, marginBottom: 20 },

  form: {
    display: 'flex',
    gap: 10,
    marginBottom: 20
  },

  input: {
    padding: 10,
    borderRadius: 8,
    border: '1px solid #ccc'
  },

  btn: {
    padding: '10px 16px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 8
  },

  row: {
    marginTop: 10,
    padding: 12,
    background: '#f1f5f9',
    display: 'flex',
    justifyContent: 'space-between',
    borderRadius: 8
  },

  deleteBtn: {
    background: '#dc2626',
    color: '#fff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: 6
  }
}
