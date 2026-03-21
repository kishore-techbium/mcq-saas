'use client'

import { supabase } from '../lib/supabase'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function StudentLogin() {

  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {

  console.log("🟡 LOGIN PAGE CHECK")

  await new Promise(r => setTimeout(r, 500))

  const { data } = await supabase.auth.getUser()

  console.log("🟡 LOGIN USER:", data)

  if (data?.user) {

    const email = data.user.email

    const { data: user } = await supabase
      .from('students')
      .select('role')
      .eq('email', email)
      .single()

    // ✅ stop loader BEFORE redirect
    setChecking(false)

    if (user?.role === 'student') {
      router.replace('/select-category')
    }
    else if (user?.role === 'admin') {
      router.replace('/admin')
    }
    else if (user?.role === 'superadmin') {
      router.replace('/superadmin')
    }

  } else {
    setChecking(false)
  }
}

  async function loginWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/auth/callback'
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

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1>Welcome 👋</h1>
        <p style={{ color: '#555', marginBottom: 30 }}>
          Sign in to continue to exams
        </p>

        <button onClick={loginWithGoogle} style={styles.googleBtn}>
          Continue with Google
        </button>

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
  }
}
