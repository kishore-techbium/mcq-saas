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

    const { data: admins } = await supabase
      .from('students')
      .select('*')
      .eq('role', 'admin')   // ✅ no .single()

    const { data: colleges } = await supabase
      .from('colleges')
      .select('*')

    setAdmins(admins || [])
    setColleges(colleges || [])
  }

  function getCollegeName(id) {
    return colleges.find(c => c.id === id)?.name || '—'
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
          value={collegeId}
          onChange={(e) => setCollegeId(e.target.value)}
          style={styles.input}
        >
          <option value="">Select College</option>
          {colleges.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <button onClick={createAdmin} style={styles.btn}>
          Create Admin
        </button>
      </div>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Email</th>
            <th style={styles.th}>College</th>
            <th style={styles.th}>Action</th>
          </tr>
        </thead>

        <tbody>
          {admins.map(a => (
            <tr key={a.id}>
              <td style={styles.td}>{a.email}</td>
              <td style={styles.td}>{getCollegeName(a.college_id)}</td>
              <td style={styles.td}>
                <button onClick={() => deleteAdmin(a.id)} style={styles.deleteBtn}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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

  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: 10
  },

  th: {
    border: '1px solid #e5e7eb',
    padding: '10px',
    background: '#f9fafb',
    textAlign: 'left'
  },

  td: {
    border: '1px solid #e5e7eb',
    padding: '10px'
  },

  deleteBtn: {
    background: '#dc2626',
    color: '#fff',
    border: 'none',
    padding: '6px 10px',
    borderRadius: 6
  }
}
