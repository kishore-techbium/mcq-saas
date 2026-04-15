'use client'

import { useState } from 'react'

export default function CreateStudent() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: ''
  })

  async function handleSubmit(e) {
    e.preventDefault()

    const res = await fetch('/api/admin/create-student', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })

    const data = await res.json()

    if (!res.ok) {
      alert(data.error || 'Failed')
      return
    }

    alert('Student created successfully')
    window.location.href = '/admin/students'
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Create Student Login</h1>

      <form onSubmit={handleSubmit}>
        <input placeholder="First Name"
          onChange={e => setForm({ ...form, first_name: e.target.value })}
        /><br/><br/>

        <input placeholder="Last Name"
          onChange={e => setForm({ ...form, last_name: e.target.value })}
        /><br/><br/>

        <input placeholder="Email"
          onChange={e => setForm({ ...form, email: e.target.value })}
        /><br/><br/>

        <input type="password" placeholder="Password"
          onChange={e => setForm({ ...form, password: e.target.value })}
        /><br/><br/>

        <button type="submit">Create</button>
      </form>
    </div>
  )
}
