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
  address: '',
  study_year: '1'
})

const [admin, setAdmin] = useState(null)
const [role, setRole] = useState('')
const [categories, setCategories] = useState([])

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

    if (
  user.role !== 'admin' &&
  user.role !== 'school_admin'
    ) {
      alert('Access denied')
      return
    }

    setAdmin(user)
    setRole(user.role)
    loadCategories(user.role)
  } catch (err) {
    console.error(err)
    alert('Error loading admin')
  }
}
async function loadCategories(currentRole) {

  const { data, error } = await supabase
    .from('exam_categories')
    .select('*')
    .eq('active', true)

  if (error || !data) return

  let parents = data.filter(
    c => c.code === c.parent_code
  )

  // COLLEGE
  if (currentRole === 'admin') {

    parents = parents.filter(
      p =>
        p.code === 'JEE' ||
        p.code === 'NEET'
    )
  }

  // SCHOOL
  if (currentRole === 'school_admin') {

    parents = parents.filter(
      p => p.code === 'SCHOOL'
    )
  }

  setCategories(parents)

  if (parents.length > 0) {
    setForm(prev => ({
      ...prev,
      exam_preference: parents[0].code
    }))
  }
}
async function handleSubmit(e) {
  e.preventDefault()

  if (!admin) {
    alert("Admin not loaded. Please refresh.")
    return
  }

  

const { data } = await supabase.auth.getSession()

const res = await fetch('/api/admin/create-student', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.session.access_token}`
  },
  body: JSON.stringify({
    email: form.email,
    first_name: form.first_name,
    last_name: form.last_name,
    login_id: form.login_id,
    password: form.password,
    exam_preference: form.exam_preference,
    phone: form.phone,
    address: form.address,
    study_year: form.study_year
  })
})

const result = await res.json()

if (!res.ok) {
  alert(result.error || 'Failed')
  return
}
  alert('Student created successfully')
  window.location.href = '/admin/students'
}
  return (
    <div style={{ padding: 40 }}>
      <h1>Create Student Login</h1>

      <form onSubmit={handleSubmit}>
 <select
  value={form.exam_preference}
  onChange={e =>
    setForm({
      ...form,
      exam_preference: e.target.value
    })
  }
>

  {categories.map(cat => (

    <option
      key={cat.code}
      value={cat.code}
    >
      {cat.name}
    </option>

  ))}

</select>
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

<select
  value={form.study_year}
  onChange={e =>
    setForm({
      ...form,
      study_year: e.target.value
    })
  }
>

  {role === 'school_admin'

    ? [4,5,6,7,8,9,10].map(c => (
        <option key={c} value={c}>
          Class {c}
        </option>
      ))

    : [1,2,3].map(y => (
        <option key={y} value={y}>
          {y === 1
          ? '1st Year'
          : y === 2
          ? '2nd Year'
          : '3rd Year'}
        </option>
      ))
  }

</select>
       
        <button type="submit">Create</button>
      </form>
    </div>
  )
}
