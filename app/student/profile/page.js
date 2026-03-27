'use client'

import { supabase } from '../../../lib/supabase'
import { useEffect, useState } from 'react'

export default function StudentProfile() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [examPref, setExamPref] = useState('')
  const [joinCode, setJoinCode] = useState('')

  const [profile, setProfile] = useState({
    id: '',
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    college_name: '',
    address: ''
  })

  useEffect(() => {
    init()
  }, [])

  async function init() {
    setLoading(true)

    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) {
      window.location.href = '/'
      return
    }

    const userId = auth.user.id
    const email = auth.user.email

    // ✅ FIX 1: use user_id instead of id
    const { data: user, error } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('Fetch error:', error)
      setLoading(false)
      return
    }

    // ✅ If no profile → create
const { data: inserted, error: insertError } = await supabase
  .from('students')
  .upsert({
    id: userId,
    email,
    user_id: userId   // ✅ IMPORTANT
  }, { onConflict: 'email' })
  .select()
  .single()

      if (insertError) {
        alert('Failed to create profile')
        setLoading(false)
        return
      }

      setProfile(inserted)
    } else {
      setProfile({
        id: user.id,
        email: user.email,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        college_name: user.college_name || '',
        address: user.address || ''
      })

      setExamPref(user.exam_preference || '')
    }

    setLoading(false)
  }

  async function saveProfile() {
    setSaving(true)
    setMessage('')

    const { data: auth } = await supabase.auth.getUser()
    const userId = auth.user.id

    // 🔥 Validate Join Code
    const { data: codeData, error: codeError } = await supabase
      .from('college_codes')
      .select('college_id')
      .eq('code', joinCode)
      .maybeSingle()

    if (!codeData || codeError) {
      alert('Invalid Join Code')
      setSaving(false)
      return
    }

    const collegeId = codeData.college_id

    // ✅ FIX 2: include user_id in upsert
    const { error } = await supabase
      .from('students')
      .upsert(
        {
          email: profile.email,
          first_name: profile.first_name || null,
          last_name: profile.last_name || null,
          phone: profile.phone || null,
          college_name: profile.college_name || null,
          address: profile.address || null,
          college_id: collegeId,
          exam_preference: examPref,
          user_id: userId   // ✅ CRITICAL FIX
        },
        { onConflict: 'email' } // safer than id
      )

    if (error) {
      console.error('PROFILE SAVE ERROR:', error)
      alert(error.message)
      setMessage('❌ Failed to save profile')
    } else {
      setMessage('✅ Profile updated successfully')

      setTimeout(() => {
        window.location.href = '/select-category'
      }, 1000)
    }

    setSaving(false)
  }

  if (loading) {
    return <p style={{ padding: 40 }}>Loading profile…</p>
  }

  return (
    <div style={styles.page}>
      <h1>👤 My Profile</h1>

      <div style={styles.card}>
        <div style={styles.field}>
          <label>Email (login)</label>
          <input value={profile.email} disabled style={styles.inputDisabled} />
        </div>

        <div style={styles.field}>
          <label>First Name</label>
          <input
            value={profile.first_name}
            onChange={e =>
              setProfile({ ...profile, first_name: e.target.value })
            }
            style={styles.input}
          />
        </div>

        <div style={styles.field}>
          <label>Last Name</label>
          <input
            value={profile.last_name}
            onChange={e =>
              setProfile({ ...profile, last_name: e.target.value })
            }
            style={styles.input}
          />
        </div>

        <div style={styles.field}>
          <label>Phone Number</label>
          <input
            value={profile.phone}
            onChange={e =>
              setProfile({ ...profile, phone: e.target.value })
            }
            style={styles.input}
          />
        </div>

        <div style={styles.field}>
          <label>Exam Preference</label>
          <div style={{ display: 'flex', gap: 20, marginTop: 6 }}>
            <label>
              <input
                type="radio"
                value="JEE"
                checked={examPref === 'JEE'}
                onChange={(e) => setExamPref(e.target.value)}
              />
              JEE
            </label>

            <label>
              <input
                type="radio"
                value="NEET"
                checked={examPref === 'NEET'}
                onChange={(e) => setExamPref(e.target.value)}
              />
              NEET
            </label>
          </div>
        </div>

        <div style={styles.field}>
          <label>Join Code</label>
          <input
            placeholder="Enter join code provided by admin"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value)}
            style={styles.input}
          />
        </div>

        <div style={styles.field}>
          <label>College Name</label>
          <input
            value={profile.college_name}
            onChange={e =>
              setProfile({ ...profile, college_name: e.target.value })
            }
            style={styles.input}
          />
        </div>

        <div style={styles.field}>
          <label>Address</label>
          <textarea
            rows={3}
            value={profile.address}
            onChange={e =>
              setProfile({ ...profile, address: e.target.value })
            }
            style={styles.textarea}
          />
        </div>

        <button onClick={saveProfile} disabled={saving} style={styles.saveBtn}>
          {saving ? 'Saving…' : 'Save Profile'}
        </button>

        {message && <p style={{ marginTop: 10 }}>{message}</p>}
      </div>
    </div>
  )
}

const styles = {
  page: { padding: 40, fontFamily: 'system-ui, sans-serif', maxWidth: 600 },
  card: { marginTop: 20, padding: 24, background: '#f8fafc', borderRadius: 12 },
  field: { display: 'flex', flexDirection: 'column', marginBottom: 14 },
  input: { padding: 10, borderRadius: 6, border: '1px solid #ccc' },
  inputDisabled: { padding: 10, borderRadius: 6, border: '1px solid #ddd', background: '#eee' },
  textarea: { padding: 10, borderRadius: 6, border: '1px solid #ccc' },
  saveBtn: { marginTop: 10, padding: 12, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, cursor: 'pointer' }
}
