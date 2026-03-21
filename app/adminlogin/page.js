'use client'

import { supabase } from '../../lib/supabase'
import { isAdmin } from '../../lib/isAdmin'

export default function AdminLogin() {
  async function loginWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/adminlogin/callback'
      }
    })
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1>Admin Login</h1>
        <p style={{ color: '#555', marginBottom: 30 }}>
          Sign in with your admin Google account
        </p>

        <button onClick={loginWithGoogle} style={styles.googleBtn}>
          Continue with Google
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
    background: '#f8fafc'
  },
  card: {
    width: 360,
    padding: 32,
    background: '#fff',
    borderRadius: 14,
    textAlign: 'center',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
  },
  googleBtn: {
    width: '100%',
    padding: 14,
    background: '#dc2626',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontWeight: 700
  }
}
