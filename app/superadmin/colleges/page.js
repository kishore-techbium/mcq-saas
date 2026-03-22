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
    const { data } = await supabase.from('colleges').select('*')
    setColleges(data || [])
  }

  async function createCollege() {

    if (!name) return alert('Enter name')

    await supabase.from('colleges').insert({ name })

    setName('')
    loadColleges()
  }

  async function deleteCollege(id) {

    if (!confirm('Delete college?')) return

    await supabase.from('colleges').delete().eq('id', id)
    loadColleges()
  }

  return (
    <div>
      <h1>Colleges</h1>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="College Name"
      />

      <button onClick={createCollege}>Create</button>

      {colleges.map(c => (
        <div key={c.id} style={styles.row}>
          {c.name}
          <button onClick={() => deleteCollege(c.id)}>Delete</button>
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