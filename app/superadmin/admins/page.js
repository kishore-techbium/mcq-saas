'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

export default function Admins() {

  const [admins, setAdmins] = useState([])
  const [colleges, setColleges] = useState([])

  const [email, setEmail] = useState('')
  const [collegeId, setCollegeId] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState('admin')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: admins } = await supabase
      .from('students')
      .select('*')
      .in('role', ['admin', 'school_admin'])

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
      alert('Fill required fields')
      return
    }

const selectedCollege = colleges.find(c => c.id === collegeId)

if (!selectedCollege) {
  alert('Invalid college selected')
  return
}

const { error } = await supabase.from('students').insert({
  email,
  role,
  college_id: collegeId,
  college_name: selectedCollege.name,
  first_name: firstName || null,
  last_name: lastName || null,
  phone: phone || null
})

if (error) {
  alert(error.message)
  return
}

    setEmail('')
    setCollegeId('')
    setFirstName('')
    setLastName('')
    setPhone('')
    setRole('admin')
    loadData()
  }

  async function deleteAdmin(id) {
    if (!confirm('Delete this admin?')) return

    await supabase.from('students').delete().eq('id', id)
    loadData()
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>Admins</h1>

      <div style={styles.form}>
        <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={styles.input} />
        <input placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} style={styles.input} />
        <input placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} style={styles.input} />
        <input placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} style={styles.input} />
        <select
          value={role}
          onChange={e => setRole(e.target.value)}
          style={styles.input}
        >

          <option value="admin">
            College Admin
          </option>

          <option value="school_admin">
            School Admin
          </option>

        </select>
        <select value={collegeId} onChange={e => setCollegeId(e.target.value)} style={styles.input}>
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
            <th style={styles.th}>Name</th>
            <th style={styles.th}>Phone</th>
            <th style={styles.th}>Role</th>
            <th style={styles.th}>College</th>
            <th style={styles.th}>Action</th>
          </tr>
        </thead>

        <tbody>
          {admins.map(a => (
            <tr key={a.id}>
              <td style={styles.td}>{a.email}</td>
              <td style={styles.td}>{a.first_name} {a.last_name}</td>
              <td style={styles.td}>{a.phone}</td>
              <td style={styles.td}>{a.role}</td>
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
  page: { padding: 30, color: '#111' },  // ✅ text visible fix
  heading: { fontSize: 26, marginBottom: 20 },

  form: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
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
    borderCollapse: 'collapse'
  },

  th: {
    padding: 10,
    background: '#f1f5f9',
    border: '1px solid #ddd'
  },

  td: {
    padding: 10,
    border: '1px solid #ddd'
  },

  deleteBtn: {
    background: '#dc2626',
    color: '#fff',
    padding: '6px 10px',
    borderRadius: 6
  }
}
