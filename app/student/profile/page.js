'use client'

import { supabase } from '../../../lib/supabase'
import { useEffect, useState } from 'react'
import { loadExamCategories } from '../../../lib/loadExamCategories'

export default function StudentProfile() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [examPref, setExamPref] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [categories, setCategories] = useState([])
  const [studyYear, setStudyYear] = useState('')
  const [profile, setProfile] = useState({
    id: '',
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    address: ''
  })

  useEffect(() => {
  init()
  fetchCategories()
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

  // ✅ IF PROFILE EXISTS
  if (user) {

    // 🔥 AUTO LINK user_id if missing
    if (!user.user_id) {
      await supabase
        .from('students')
        .update({ user_id: userId })
        .eq('email', email)
    }

    // 🔥 REDIRECT IF PROFILE COMPLETE
    if (user.college_id) {
      window.location.href = '/select-category'
      return
    }

    // else → load profile form
    setProfile({
      id: user.id,
      email: user.email,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone: user.phone || '',
      address: user.address || ''
    })

    setExamPref(user.exam_preference || '')
    setStudyYear(user.study_year || '')
  }

  // ✅ IF NO PROFILE → CREATE BASIC ENTRY
  else {
    await supabase.from('students').insert({
      email,
      user_id: userId
    })
  }

  setLoading(false)
}
async function fetchCategories() {

  const data = await loadExamCategories()

  // ONLY PARENT CATEGORIES
  const parentCategories = data.filter(
    cat => cat.code === cat.parent_code
  )

  setCategories(parentCategories)
}
  async function saveProfile() {
    setSaving(true)
    setMessage('')

    const { data: auth } = await supabase.auth.getUser()
    const userId = auth.user.id

    // 🔥 STEP 1: Validate Join Code
    const { data: codeData, error: codeError } = await supabase
      .from('college_codes')
      .select('college_id')
      .eq('code', joinCode)
      .maybeSingle()
if (!studyYear) {
  alert('Please select study year/class')
  setSaving(false)
  return
}
    if (!codeData || codeError) {
      alert('Invalid Join Code')
      setSaving(false)
      return
    }

    const collegeId = codeData.college_id

    // 🔥 STEP 2: Get College Name from colleges table
    const { data: college } = await supabase
      .from('colleges')
      .select('name')
      .eq('id', collegeId)
      .single()

    // 🔥 STEP 3: Save profile (AUTO college_name)
    const { error } = await supabase
      .from('students')
      .upsert(
        {
          email: profile.email,
          first_name: profile.first_name || null,
          last_name: profile.last_name || null,
          phone: profile.phone || null,
          address: profile.address || null,
          college_id: collegeId,
          college_name: college?.name || null,   
          exam_preference: examPref,
          study_year: studyYear,
          user_id: userId
        },
        { onConflict: 'email' }
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
        {/* EMAIL */}
        <div style={styles.field}>
          <label>Email (login)</label>
          <input value={profile.email} disabled style={styles.inputDisabled} />
        </div>

        {/* FIRST NAME */}
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

        {/* LAST NAME */}
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

        {/* PHONE */}
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

        {/* EXAM PREF */}
        <div style={styles.field}>
          <label>Exam Preference</label>
          <div style={{ display: 'flex', gap: 20 }}>
          {categories.map(cat => (

            <label key={cat.code}>

              <input
                type="radio"
                value={cat.code}
                checked={examPref === cat.code}
                onChange={(e) =>
                  setExamPref(e.target.value)
                }
              />

              {' '}
              {cat.name}

            </label>

          ))} 
          </div>
        </div>

{/* STUDY YEAR */}

<div style={styles.field}>

  <label>Study Year / Class</label>

  {/* JEE / NEET */}

  {(examPref === 'JEE' ||
    examPref === 'NEET') && (

    <select
      value={studyYear}
      onChange={(e) =>
        setStudyYear(e.target.value)
      }
      style={styles.input}
    >
      <option value="">
        Select Year
      </option>

      <option value="1">
        1st Year
      </option>

      <option value="2">
        2nd Year
      </option>

    </select>
  )}

  {/* SCHOOL */}

  {examPref === 'SCHOOL' && (

    <select
      value={studyYear}
      onChange={(e) =>
        setStudyYear(e.target.value)
      }
      style={styles.input}
    >

      <option value="">
        Select Class
      </option>

      <option value="4">
        CLASS_4
      </option>

      <option value="5">
        CLASS_5
      </option>
              <option value="6">
        CLASS_6
      </option>
              <option value="7">
        CLASS_7
      </option>
      <option value="8">
        CLASS_8
      </option>
              <option value="9">
        CLASS_9
      </option>
              <option value="10">
        CLASS_10
      </option>
    </select>
  )}

</div>

        {/* JOIN CODE */}
        <div style={styles.field}>
          <label>Join Code</label>
          <input
            placeholder="Enter join code"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value)}
            style={styles.input}
          />
        </div>

        {/* ADDRESS */}
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
  page: { padding: 40, fontFamily: 'system-ui', maxWidth: 600 },
  card: { marginTop: 20, padding: 24, background: '#f8fafc', borderRadius: 12 },
  field: { display: 'flex', flexDirection: 'column', marginBottom: 14 },
  input: { padding: 10, borderRadius: 6, border: '1px solid #ccc' },
  inputDisabled: { padding: 10, borderRadius: 6, background: '#eee' },
  textarea: { padding: 10, borderRadius: 6 },
  saveBtn: { padding: 12, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8 }
}
