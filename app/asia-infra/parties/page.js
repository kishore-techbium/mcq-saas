'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

export default function PartiesPage() {

  const [parties, setParties] = useState([])
  const [name, setName] = useState('')

  async function loadParties() {

    const { data } = await supabase
      .from('ai_party')
      .select('*')
      .order('party_name')

    setParties(data || [])
  }

  async function addParty() {

    if (!name.trim()) return

    await supabase
      .from('ai_party')
      .insert({
        party_name: name,
        party_type: 'vendor'
      })

    setName('')

    loadParties()
  }

  useEffect(() => {
    loadParties()
  }, [])

  return (
    <div>

      <h1>Parties</h1>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Party Name"
      />

      <button onClick={addParty}>
        Add
      </button>

      <hr />

      {parties.map(p => (
        <div key={p.id}>
          {p.party_name}
        </div>
      ))}

    </div>
  )
}
