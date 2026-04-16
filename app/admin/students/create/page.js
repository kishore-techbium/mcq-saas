'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../../lib/supabase'
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
  fetchAdmin()
}, [])

async function fetchAdmin() {
  try {
    const { data } = await supabase.auth.getUser()

    if (!data?.user) {
      alert('Not logged in')
      return
    }

    const email = data.user.email

    const { data: user, error } = await supabase
      .from('students')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !user) {
      alert('Admin not found')
      return
    }

    if (user.role !== 'admin') {
      alert('Access denied')
      return
    }

    setAdmin(user)

  } catch (err) {
    console.error(err)
    alert('Error loading admin')
  }
}

async function handleSubmit(e) {
  e.preventDefault()

  if (!admin) {
    alert("Admin not loaded. Please refresh.")
    return
  }

  console.log("ADMIN:", admin) // debug

  const res = await fetch('/api/admin/create-student', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...form,
      adminCollegeId: admin?.college_id,
      adminCollegeName: admin?.college_name
    })
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
          placeholder="Phone"
          onChange={e => setForm({ ...form, phone: e.target.value })}
        />
        <br/><br/>

         <input
          placeholder="Username"
          onChange={e => setForm({ ...form, login_id: e.target.value })}
        />
        <br/><br/>
        <input
          type="password"
          placeholder="Password"
          onChange={e => setForm({ ...form, password: e.target.value })}
        />
            
       <br/><br/>
       
        <button type="submit">Create</button>
      </form>
    </div>
  )
}
