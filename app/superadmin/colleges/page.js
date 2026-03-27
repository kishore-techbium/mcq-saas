'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

export default function Colleges() {

  const [colleges, setColleges] = useState([])
  const [name, setName] = useState('')

  useEffect(() => {
    loadColleges()
  }, [])

  async function loadColleges() {

    const { data: colleges } = await supabase
      .from('colleges')
      .select('*')

    const enriched = await Promise.all((colleges || []).map(async (c) => {

      const { count: studentsCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('college_id', c.id)

      const { count: examsCount } = await supabase
        .from('exams')
        .select('*', { count: 'exact', head: true })
        .eq('college_id', c.id)

      let proctoredCount = 0
      try {
        const { count } = await supabase
          .from('exams')
          .select('*', { count: 'exact', head: true })
          .eq('college_id', c.id)

        proctoredCount = count || 0
      } catch {}

      return {
        ...c,
        studentsCount: studentsCount || 0,
        examsCount: examsCount || 0,
        proctoredCount
      }
    }))

    setColleges(enriched)
  }

  async function createCollege() {

    if (!name) return alert('Enter name')

    await supabase.from('colleges').insert({ name })

    setName('')
    loadColleges()
  }

  async function deleteCollege(id) {

    const { count } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('college_id', id)

    if (count > 0) {
      alert('Cannot delete college with students')
      return
    }

    await supabase.from('colleges').delete().eq('id', id)
    loadColleges()
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>Colleges</h1>

      <div style={styles.form}>
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

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>College</th>
            <th style={styles.th}>Students</th>
            <th style={styles.th}>Exams</th>
            <th style={styles.th}>Proctored</th>
            <th style={styles.th}>Action</th>
          </tr>
        </thead>

        <tbody>
          {colleges.map(c => (
            <tr key={c.id}>
              <td style={styles.td}>{c.name}</td>
              <td style={styles.td}>{c.studentsCount}</td>
              <td style={styles.td}>{c.examsCount}</td>
              <td style={styles.td}>{c.proctoredCount}</td>
              <td style={styles.td}>
                <button onClick={() => deleteCollege(c.id)} style={styles.deleteBtn}>
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
    background: '#16a34a',
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
