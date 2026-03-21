'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function SuperAdminPage() {

  const [user, setUser] = useState(null)

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {

    const { data } = await supabase.auth.getUser()

    if (!data?.user) {
      window.location.href = '/'
      return
    }

    const email = data.user.email

    const { data: dbUser } = await supabase
      .from('students')
      .select('role')
      .eq('email', email)
      .single()

    if (dbUser?.role !== 'superadmin') {
      window.location.href = '/'
      return
    }

    setUser(data.user)
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>👑 Superadmin Dashboard</h1>

      <p>Welcome: {user?.email}</p>

      <div style={{ marginTop: 30 }}>
        <h3>Actions</h3>

        <button style={styles.btn}>
          Create College
        </button>

        <button style={styles.btn}>
          View All Colleges
        </button>
      </div>
    </div>
  )
}

const styles = {
  btn: {
    display: 'block',
    marginTop: 10,
    padding: '10px 16px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer'
  }
}