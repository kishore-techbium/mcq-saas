'use client'
import { useState, useEffect } from 'react'

export default function CreateStudent() {
const [form, setForm] = useState({
  email: '',
  first_name: '',
  last_name: '',
  login_id: '',
  password: '',
  exam_preference: 'JEE',
  phone: '',
  address: ''
})

const [admin, setAdmin] = useState(null)

useEffect(() => {
  const user = JSON.parse(localStorage.getItem('user'))
  setAdmin(user)
}, [])
  

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
    <label>
  <input
    type="radio"
    name="exam"
    value="JEE"
    checked={form.exam_preference === 'JEE'}
    onChange={e => setForm({ ...form, exam_preference: e.target.value })}
  />
  JEE
</label>

<label>
  <input
    type="radio"
    name="exam"
    value="NEET"
    checked={form.exam_preference === 'NEET'}
    onChange={e => setForm({ ...form, exam_preference: e.target.value })}
  />
  NEET
</label>   
    <br/><br/>
        <input placeholder="First Name"
          onChange={e => setForm({ ...form, first_name: e.target.value })}
        /><br/><br/>

        <input placeholder="Last Name"
          onChange={e => setForm({ ...form, last_name: e.target.value })}
        /><br/><br/>

        <input placeholder="Email"
          onChange={e => setForm({ ...form, email: e.target.value })}
        /><br/><br/>
         <input
          placeholder="Username"
          onChange={e => setForm({ ...form, login_id: e.target.value })}
        />
        
        <input
          type="password"
          placeholder="Password"
          onChange={e => setForm({ ...form, password: e.target.value })}
        />
            
       
       
        <button type="submit">Create</button>
      </form>
    </div>
  )
}
