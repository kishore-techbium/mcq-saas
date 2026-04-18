'use client'

import { supabase } from '../../../lib/supabase'
import { getCurrentUser } from '../../../lib/auth'
import { useEffect, useState } from 'react'

export default function CreateTest() {
  const [category, setCategory] = useState(null)
  const [subjects, setSubjects] = useState([])
  const [chapters, setChapters] = useState([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedChapters, setSelectedChapters] = useState([])
  const [questionCount, setQuestionCount] = useState(10)
  const [maxQuestions, setMaxQuestions] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    init()
  }, [])

  async function init() {
   const currentUser = await getCurrentUser(supabase)

if (!currentUser) {
  window.location.href = '/'
  return
}

let email = null

// ✅ Google login
if (currentUser.type === 'google') {
  email = currentUser.email
}

// ✅ Manual login
if (currentUser.type === 'manual') {
  email = currentUser.user.email
}

    // 🔥 GET STUDENT PREFERENCE
    const { data: student } = await supabase
      .from('students')
      .select('exam_preference')
      .eq('email', email)
      .single()

let cat = 'JEE_MAINS'

if (student?.exam_preference === 'NEET') {
  cat = 'NEET'
} else if (student?.exam_preference === 'JEE') {
  cat = 'JEE_MAINS'
}

// 🔥 TRY MULTIPLE CATEGORY FORMATS (fallback handling)
let { data, error } = await supabase.rpc('get_subjects', {
  p_category: cat
})

// 🚨 fallback if empty
if (!data || data.length === 0) {
  console.log('Fallback triggered for category')

  const fallbackMap = {
    JEE_MAINS: 'JEE',
    JEE: 'JEE_MAINS'
  }

  const fallbackCat = fallbackMap[cat]

  if (fallbackCat) {
    const res = await supabase.rpc('get_subjects', {
      p_category: fallbackCat
    })

    data = res.data
    cat = fallbackCat // ✅ update category for rest flow
  }
}

setCategory(cat)

const uniqueSubjects = (data || []).map(d => d.subject || d)
setSubjects(uniqueSubjects)

setLoading(false)
    setCategory(cat)

    console.log('Resolved Category:', cat)

    // 🔥 LOAD SUBJECTS
    const { data } = await supabase.rpc('get_subjects', {
      p_category: cat
    })

    const uniqueSubjects = (data || []).map(d => d.subject || d)
    setSubjects(uniqueSubjects)

    setLoading(false)
  }

  async function loadChapters(subject) {
    setSelectedSubject(subject)
    setSelectedChapters([])
    setChapters([])
    setMaxQuestions(0)

    const { data } = await supabase.rpc('get_chapters', {
      p_category: category,
      p_subject: subject
    })

    const uniqueChapters = (data || []).map(d => d.chapter)
    setChapters(uniqueChapters)
  }

  async function toggleChapter(ch) {
    const updated = selectedChapters.includes(ch)
      ? selectedChapters.filter(c => c !== ch)
      : [...selectedChapters, ch]

    setSelectedChapters(updated)

    if (updated.length > 0) {
      const { data } = await supabase.rpc('get_question_count', {
        p_category: category,
        p_subject: selectedSubject,
        p_chapters: updated
      })

      const count = data || 0
      setMaxQuestions(count)

      if (questionCount > count) setQuestionCount(count)
    }
  }

  function startTest() {
    const payload = {
      category,
      subject: selectedSubject,
      chapters: selectedChapters,
      questionCount,
      duration: Math.ceil(questionCount * 1.5)
    }

    localStorage.setItem('custom_test_config', JSON.stringify(payload))
    window.location.href = '/exam/custom'
  }

  if (loading) return <p style={{ padding: 40 }}>Loading…</p>

  return (
    <div style={styles.page}>
      <h1>Create Your Own Test</h1>
      <p style={{ color: '#555' }}>{pretty(category)}</p>

      {/* SUBJECTS */}
      <div style={styles.section}>
        <h3>1️⃣ Select Subject</h3>

        {subjects.length === 0 && (
          <p style={{ color: '#dc2626' }}>
            No subjects found for this category
          </p>
        )}

        <div style={styles.chipRow}>
          {subjects.map(s => (
            <button
              key={s}
              style={{
                ...styles.chip,
                background: s === selectedSubject ? '#2563eb' : '#e5e7eb',
                color: s === selectedSubject ? '#fff' : '#111'
              }}
              onClick={() => loadChapters(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* CHAPTERS */}
      {selectedSubject && (
        <div style={styles.section}>
          <h3>2️⃣ Select Chapters</h3>

          <div style={styles.chipRow}>
            {chapters.map(ch => (
              <button
                key={ch}
                style={{
                  ...styles.chip,
                  background: selectedChapters.includes(ch)
                    ? '#16a34a'
                    : '#e5e7eb',
                  color: selectedChapters.includes(ch)
                    ? '#fff'
                    : '#111'
                }}
                onClick={() => toggleChapter(ch)}
              >
                {ch}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* QUESTION COUNT */}
      {selectedChapters.length > 0 && (
        <div style={styles.section}>
          <h3>3️⃣ Number of Questions</h3>

          <input
            type="range"
            min="10"
            max={Math.min(300, maxQuestions)}
            value={questionCount}
            onChange={e => setQuestionCount(Number(e.target.value))}
          />

          <p>
            {questionCount} questions (Available: {maxQuestions})
          </p>

          <p style={{ marginTop: 10 }}>
            ⏱ Duration: <b>{Math.ceil(questionCount * 1.5)} minutes</b>
          </p>

          <button style={styles.startBtn} onClick={startTest}>
            Start Test
          </button>
        </div>
      )}
    </div>
  )
}

/* ================= HELPERS ================= */

function pretty(cat) {
  if (cat === 'JEE_MAINS') return 'JEE Mains'
  if (cat === 'NEET') return 'NEET'
  return ''
}

/* ================= STYLES ================= */

const styles = {
  page: {
    padding: 40,
    minHeight: '100vh',
    background: '#f8fafc',
    fontFamily: 'system-ui, sans-serif'
  },
  section: { marginTop: 30 },
  chipRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10
  },
  chip: {
    padding: '8px 16px',
    borderRadius: 20,
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600
  },
  startBtn: {
    marginTop: 20,
    padding: '12px 20px',
    background: '#dc2626',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer'
  }
}
