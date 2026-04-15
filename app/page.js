'use client'

import { supabase } from '../lib/supabase'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function StudentLogin() {

  const router = useRouter()
  const [checking, setChecking] = useState(true)
const [userId, setUserId] = useState('')
const [password, setPassword] = useState('')
const [error, setError] = useState('')

  useEffect(() => {
    checkUser()
  }, [])

async function checkUser() {

  console.log("🟡 LOGIN PAGE CHECK")

  const { data } = await supabase.auth.getUser()

  console.log("🟡 LOGIN USER:", data)

  // ✅ DO NOT redirect here
  // Only control loader

  setChecking(false)
}

  async function loginWithGoogle() {
    await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'https://examzcanvas.com/auth/callback'
  }
})
  }

  if (checking) {
    return (
      <div style={styles.page}>
        <div>Checking login...</div>
      </div>
    )
  }

async function loginWithCredentials() {

  setError('')

  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('login_id', userId)
    .eq('password', password)
    .maybeSingle()

  if (error || !data) {
    setError('Invalid User ID or Password')
    return
  }

  // ✅ Store session manually (optional but useful)
  localStorage.setItem('student', JSON.stringify(data))

  // ✅ Redirect (same flow as Google)
  router.push('/select-category')   // change if your route is different
}


  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1>Welcome 👋</h1>
        <p style={{ color: '#555', marginBottom: 30 }}>
          Sign in to continue to exams
        </p>

{/* Google Login */}
<button onClick={loginWithGoogle} style={styles.googleBtn}>
  Continue with Google
</button>

<div style={{ margin: '20px 0', fontSize: 12, color: '#999' }}>
  OR
</div>

{/* User ID Login */}
<input
  type="text"
  placeholder="Username"
  value={userId}
  onChange={(e) => setUserId(e.target.value)}
  style={styles.input}
/>

<input
  type="password"
  placeholder="Password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  style={styles.input}
/>

<button onClick={loginWithCredentials} style={styles.loginBtn}>
  Login
</button>

{error && (
  <p style={{ color: 'red', marginTop: 10 }}>{error}</p>
)}
<div style={{ marginTop: 25, textAlign: 'left' }}>
  <ul style={{ fontSize: 13, color: '#555', paddingLeft: 18 }}>
    <li>Track your performance across all exams</li>
    <li>Identify weak subjects and improve</li>
    <li>Analyze accuracy and attempt behavior</li>
    <li>Get personalized academic insights</li>
  </ul>
</div>
       <p style={styles.note}>
         Secure login using your Google account
       </p>
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
    width: 380,
    padding: 36,
    background: '#fff',
    borderRadius: 16,
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    textAlign: 'center'
    
  },
  googleBtn: {
    width: '100%',
    padding: '14px 16px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer'
  },
  note: {
    marginTop: 20,
    fontSize: 12,
    color: '#777'
  },
  input: {
  width: '100%',
  padding: '12px',
  marginBottom: '12px',
  borderRadius: 8,
  border: '1px solid #ddd',
  fontSize: 14
},
loginBtn: {
  width: '100%',
  padding: '14px',
  background: '#16a34a',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  fontSize: 16,
  fontWeight: 600,
  cursor: 'pointer'
}
}
