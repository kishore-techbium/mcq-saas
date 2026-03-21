'use client'

import { supabase } from '../../lib/supabase'
import { useEffect, useState } from 'react'

export default function StudentHome() {
  const [category, setCategory] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        window.location.href = '/'
        return
      }

      const params = new URLSearchParams(window.location.search)
      const cat = params.get('category')

      if (!cat) {
        window.location.href = '/select-category'
        return
      }

      setCategory(cat)
      setLoading(false)
    }

    init()
  }, [])

  function goCreateTest() {
    window.location.href = `/student/create-test?category=${category}`
  }

  function goAvailableTests() {
    window.location.href = `/dashboard?category=${category}`
  }

  if (loading) {
    return <p style={{ padding: 40 }}>Loading…</p>
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>{pretty(category)}</h1>

      <p style={styles.subheading}>
        Choose how you want to practice
      </p>

      <div style={styles.grid}>
        {/* CREATE YOUR OWN TEST */}
        <div style={styles.card}>
          <h2>🧠 Create Your Own Test</h2>
          <p style={styles.desc}>
            Select subjects, chapters and number of questions.
            Perfect for daily practice and weak-area improvement.
          </p>

          <button style={styles.primaryBtn} onClick={goCreateTest}>
            Create Test
          </button>
        </div>

        {/* TAKE AVAILABLE TESTS */}
        <div style={{ ...styles.card, background: '#fefce8' }}>
          <h2>📘 Take Available Tests</h2>
          <p style={styles.desc}>
            Attempt full-length mock tests and grand tests
            created by our experts.
          </p>

          <button style={styles.secondaryBtn} onClick={goAvailableTests}>
            View Tests
          </button>
        </div>
      </div>
    </div>
  )
}

/* ================= HELPERS ================= */

function pretty(cat) {
  if (cat === 'JEE_MAINS') return 'JEE Mains'
  if (cat === 'JEE_ADVANCED') return 'JEE Advanced'
  if (cat === 'NEET') return 'NEET UG'
  return ''
}

/* ================= STYLES ================= */

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg,#f8fafc,#eef2ff)',
    padding: 40,
    fontFamily: 'system-ui, sans-serif'
  },
  heading: {
    fontSize: 32,
    marginBottom: 6
  },
  subheading: {
    color: '#555',
    marginBottom: 30
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: 30,
    maxWidth: 900
  },
  card: {
    background: '#fff',
    padding: 30,
    borderRadius: 18,
    boxShadow: '0 15px 30px rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  },
  desc: {
    color: '#444',
    margin: '14px 0 24px',
    lineHeight: 1.5
  },
  primaryBtn: {
    padding: '12px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer'
  },
  secondaryBtn: {
    padding: '12px',
    background: '#16a34a',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer'
  }
}
