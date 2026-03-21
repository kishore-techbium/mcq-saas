'use client'

import { useRouter, usePathname } from 'next/navigation'

export default function AdminLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()

  function NavButton({ label, path }) {
    const active = pathname === path

    return (
      <button
        onClick={() => router.push(path)}
        style={{
          ...styles.navBtn,
          background: active ? '#2563eb' : 'transparent',
          color: active ? '#fff' : '#e5e7eb'
        }}
      >
        {label}
      </button>
    )
  }

  return (
    <div>
      {/* Sticky Header */}
      <div style={styles.header}>
        <div style={styles.logo}>
          🎓 MCQ Admin
        </div>

        <div style={styles.nav}>
          <NavButton label="Dashboard" path="/admin" />
          <NavButton label="Proctoring" path="/admin/proctoring" />
          <NavButton label="Results" path="/admin/results" />

          <button
            onClick={() => router.push('/')}
            style={styles.logout}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Page Content */}
      <div style={styles.content}>
        {children}
      </div>
    </div>
  )
}

const styles = {
  header: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: 65,
    background: '#111827',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 30px',
    zIndex: 1000,
    boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
  },

  logo: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 700
  },

  nav: {
    display: 'flex',
    gap: 15,
    alignItems: 'center'
  },

  navBtn: {
    padding: '6px 14px',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 14
  },

  logout: {
    padding: '6px 14px',
    background: '#dc2626',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 600
  },

  content: {
    marginTop: 80,
    padding: 30,
    minHeight: '100vh',
    background: '#f3f4f6'
  }
}