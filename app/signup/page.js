'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { loadExamCategories } from '../../lib/loadExamCategories'
export default function SignupPage() {

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [exam, setExam] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState([])

useEffect(() => {
  getUser()
  fetchCategories()
}, [])

  async function getUser() {
    const { data } = await supabase.auth.getUser()

    if (!data?.user) {
      window.location.href = '/'
      return
    }

    setEmail(data.user.email)
    setLoading(false)
  }

 async function fetchCategories() {

  const data = await loadExamCategories()

  setCategories(data)
}
  
  async function handleSignup() {

    setError('')

    const phoneRegex = /^[6-9]\d{9}$/

    if (!firstName || !phone || !exam) {
      setError('Please fill all required fields')
      return
    }

    if (!phoneRegex.test(phone)) {
      setError('Enter valid 10-digit phone number')
      return
    }

    // ✅ FIXED UPSERT WITH onConflict
    const { error } = await supabase
      .from('students')
      .upsert({
        email,
        first_name: firstName,
        last_name: lastName,
        phone,
        exam_preference: exam
      }, {
        onConflict: 'email'
      })

    if (error) {
      console.error(error)
      setError('Error saving data')
      return
    }

    alert('Signup successful')

    window.location.href = '/select-category'
  }

  if (loading) {
    return <div style={{ padding: 40 }}>Loading...</div>
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        <h1>Complete Signup ✍️</h1>

        <p style={{ color: '#555', marginBottom: 20 }}>
          Fill details to continue
        </p>

        <div style={styles.field}>
          <label>First Name *</label>
          <input
            style={styles.input}
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
          />
        </div>

        <div style={styles.field}>
          <label>Last Name</label>
          <input
            style={styles.input}
            value={lastName}
            onChange={e => setLastName(e.target.value)}
          />
        </div>

        <div style={styles.field}>
          <label>Email</label>
          <input style={styles.input} value={email} disabled />
        </div>

        <div style={styles.field}>
          <label>Phone *</label>
          <input
            style={styles.input}
            value={phone}
            onChange={e => setPhone(e.target.value)}
          />
        </div>

        <div style={styles.field}>
          <label>Exam Preference *</label>

          <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
            {categories.map(cat => (

            <label key={cat.code}>
          
              <input
                type="radio"
                value={cat.code}
                checked={exam === cat.code}
                onChange={(e) => setExam(e.target.value)}
              />
          
              {' '}
              {cat.name}
          
            </label>
          
          ))}
          </div>
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <button onClick={handleSignup} style={styles.btn}>
          Continue
        </button>

      </div>
    </div>
  )
}

const styles = {
  page: {
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg,#f8fafc,#eef2ff)',
    fontFamily: 'system-ui, sans-serif'
  },
  card: {
    width: 400,
    padding: 36,
    background: '#fff',
    borderRadius: 16,
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
  },
  field: {
    marginBottom: 15,
    display: 'flex',
    flexDirection: 'column'
  },
  input: {
    padding: '10px',
    borderRadius: 8,
    border: '1px solid #ccc',
    marginTop: 5
  },
  btn: {
    width: '100%',
    padding: 14,
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 15
  },
  error: {
    color: 'red',
    fontSize: 13,
    marginTop: 10
  }
}
