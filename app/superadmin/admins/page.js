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
    <div>
      <h1>Admins</h1>

      <input
        placeholder="Admin Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <select onChange={(e) => setCollegeId(e.target.value)}>
        <option>Select College</option>
        {colleges.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      <button onClick={createAdmin}>Create Admin</button>

      {admins.map(a => (
        <div key={a.id} style={styles.row}>
          {a.email}
          <button onClick={() => deleteAdmin(a.id)}>Delete</button>
        </div>
      ))}
    </div>
  )
}

const styles = {
  row: {
    marginTop: 10,
    padding: 10,
    background: '#f1f5f9',
    display: 'flex',
    justifyContent: 'space-between'
  }
}