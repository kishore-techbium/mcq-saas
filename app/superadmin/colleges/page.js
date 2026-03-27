'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

export default function Colleges() {

  const [colleges, setColleges] = useState([])

  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [district, setDistrict] = useState('')
  const [state, setState] = useState('')

  useEffect(() => {
    loadColleges()
  }, [])

  async function loadColleges() {

    const { data: colleges } = await supabase.from('colleges').select('*')

    const enriched = await Promise.all((colleges || []).map(async (c) => {

      const { count: studentsCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('college_id', c.id)

      const { count: examsCount } = await supabase
        .from('exams')
        .select('*', { count: 'exact', head: true })
        .eq('college_id', c.id)

      return {
        ...c,
        studentsCount: studentsCount || 0,
        examsCount: examsCount || 0
      }
    }))

    setColleges(enriched)
  }

  async function createCollege() {

    if (!name) return alert('Enter college name')

    await supabase.from('colleges').insert({
      name,
      city,
      district,
      state
    })

    setName('')
    setCity('')
    setDistrict('')
    setState('')

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
        <input placeholder="College Name" value={name} onChange={e => setName(e.target.value)} style={styles.input} />
        <input placeholder="City" value={city} onChange={e => setCity(e.target.value)} style={styles.input} />
        <input placeholder="District" value={district} onChange={e => setDistrict(e.target.value)} style={styles.input} />
        <input placeholder="State" value={state} onChange={e => setState(e.target.value)} style={styles.input} />

        <button onClick={createCollege} style={styles.btn}>Create</button>
      </div>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>College</th>
            <th style={styles.th}>City</th>
            <th style={styles.th}>District</th>
            <th style={styles.th}>State</th>
            <th style={styles.th}>Students</th>
            <th style={styles.th}>Exams</th>
            <th style={styles.th}>Action</th>
          </tr>
        </thead>

        <tbody>
          {colleges.map(c => (
            <tr key={c.id}>
              <td style={styles.td}>{c.name}</td>
              <td style={styles.td}>{c.city}</td>
              <td style={styles.td}>{c.district}</td>
              <td style={styles.td}>{c.state}</td>
              <td style={styles.td}>{c.studentsCount}</td>
              <td style={styles.td}>{c.examsCount}</td>
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
  page: { padding: 30, color: '#111' }, // ✅ visibility fix
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
    background: '#16a34a',
    color: '#fff',
    borderRadius: 8
  },

  table: { width: '100%', borderCollapse: 'collapse' },

  th: { padding: 10, background: '#f1f5f9', border: '1px solid #ddd' },
  td: { padding: 10, border: '1px solid #ddd' },

  deleteBtn: {
    background: '#dc2626',
    color: '#fff',
    padding: '6px 10px',
    borderRadius: 6
  }
}
