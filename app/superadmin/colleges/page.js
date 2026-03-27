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

    // 🔥 ENRICH DATA WITH STATS
    const enriched = await Promise.all((colleges || []).map(async (c) => {

      // Students count
      const { count: studentsCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('college_id', c.id)

      // Exams count
      const { count: examsCount } = await supabase
        .from('exams')
        .select('*', { count: 'exact', head: true })
        .eq('college_id', c.id)

      // Proctored exams (safe fallback)
      let proctoredCount = 0
      try {
        const { count } = await supabase
          .from('exams')
          .select('*', { count: 'exact', head: true })
          .eq('college_id', c.id)
          .eq('is_proctored', true)

        proctoredCount = count || 0
      } catch {
        proctoredCount = 0
      }

      // Top student (latest best score)
      let topStudent = '-'
      try {
        const { data } = await supabase
          .from('exam_sessions')
          .select('score, students(first_name)')
          .eq('college_id', c.id)
          .order('score', { ascending: false })
          .limit(1)

        if (data?.[0]) {
          topStudent = `${data[0].students?.first_name || ''} (${data[0].score})`
        }
      } catch {}

      return {
        ...c,
        studentsCount: studentsCount || 0,
        examsCount: examsCount || 0,
        proctoredCount,
        topStudent
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

    if (!confirm('Delete college?')) return

    // 🔒 Prevent delete if students exist
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

      {colleges.map(c => (
        <div key={c.id} style={styles.card}>
          <h3>{c.name}</h3>

          <p>👨‍🎓 Students: {c.studentsCount}</p>
          <p>📝 Exams: {c.examsCount}</p>
          <p>🎥 Proctored: {c.proctoredCount}</p>
          <p>👑 Top Student: {c.topStudent}</p>

          <button onClick={() => deleteCollege(c.id)} style={styles.deleteBtn}>
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
    background: '#16a34a',
    color: '#fff',
    border: 'none',
    borderRadius: 8
  },

  card: {
    marginTop: 12,
    padding: 16,
    background: '#f8fafc',
    borderRadius: 10,
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
  },

  deleteBtn: {
    marginTop: 10,
    background: '#dc2626',
    color: '#fff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: 6
  }
}
