'use client'

import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function SuperAdminLayout({ children }) {

  const router = useRouter()

  async function logout() {
    await supabase.auth.signOut()
    router.replace('/')
  }

  return (
    <div style={styles.container}>

      {/* SIDEBAR */}
      <div style={styles.sidebar}>
        <h2>👑 Superadmin</h2>

        <Link href="/superadmin">Dashboard</Link>
        <Link href="/superadmin/colleges">Colleges</Link>
        <Link href="/superadmin/admins">Admins</Link>
        <Link href="/superadmin/examcategories">Exam Categories</Link>
        <button onClick={logout} style={styles.logout}>
          Logout
        </button>
      </div>

      {/* CONTENT */}
      <div style={styles.content}>
        {children}
      </div>

    </div>
  )
}

const styles = {
  container: { display: 'flex', minHeight: '100vh' },
  sidebar: {
    width: 220,
    background: '#f3e5ab',
    color: '#fff',
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  },
  content: { flex: 1, padding: 30 },
  logout: {
    marginTop: 'auto',
    padding: 10,
    background: '#dc2626',
    color: '#fff',
    border: 'none',
    borderRadius: 6
  }
}
