'use client'

import { supabase } from '../../../lib/supabase'
import { useEffect, useState } from 'react'

export default function ReviewQuestionsPage() {
  const [subjects, setSubjects] = useState([])
  const [chapters, setChapters] = useState([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedChapter, setSelectedChapter] = useState('')
  const [questions, setQuestions] = useState([])
  const [selectedQuestions, setSelectedQuestions] = useState([])
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  /* ================= LOAD SUBJECTS ================= */

  useEffect(() => {
    fetchSubjects()
  }, [])

  async function fetchSubjects() {
    const { data } = await supabase
      .from('question_bank')
      .select('subject')

    if (!data) return

    const unique = [...new Set(data.map(d => d.subject))]
    setSubjects(unique)
  }

  /* ================= LOAD CHAPTERS ================= */

  async function fetchChapters(subject) {
    setSelectedSubject(subject)
    setSelectedChapter('')
    setQuestions([])

    const { data } = await supabase
      .from('question_bank')
      .select('chapter')
      .eq('subject', subject)

    if (!data) return

    const unique = [...new Set(data.map(d => d.chapter))]
    setChapters(unique)
  }

  /* ================= LOAD QUESTIONS ================= */

  async function fetchQuestions(subject, chapter) {
    setSelectedChapter(chapter)
    setLoading(true)
    setSelectedQuestions([])
    setStatus('Loading questions...')

    const { data } = await supabase
      .from('question_bank')
      .select('*')
      .eq('subject', subject)
      .eq('chapter', chapter)

    setQuestions(data || [])
    setStatus(`${data?.length || 0} questions loaded`)
    setLoading(false)
  }

  /* ================= SELECT ================= */

  function toggleSelect(id) {
    setSelectedQuestions(prev =>
      prev.includes(id)
        ? prev.filter(q => q !== id)
        : [...prev, id]
    )
  }

  function selectAll() {
    const allIds = questions.map(q => q.id)
    setSelectedQuestions(allIds)
  }

  function clearSelection() {
    setSelectedQuestions([])
  }

  /* ================= DELETE ================= */

  async function deleteSelected() {
    if (selectedQuestions.length === 0) {
      setStatus('No questions selected')
      return
    }

    const confirmDelete = confirm(
      `Delete ${selectedQuestions.length} selected questions?`
    )
    if (!confirmDelete) return

    setStatus('Deleting selected questions...')

    await supabase
      .from('question_bank')
      .delete()
      .in('id', selectedQuestions)

    setStatus(`Deleted ${selectedQuestions.length} questions`)
    setSelectedQuestions([])
    fetchQuestions(selectedSubject, selectedChapter)
  }

  /* ================= UI ================= */

  return (
    <div style={styles.page}>
      <h1>🗂 Review Question Bank</h1>

      <div style={styles.filterBox}>
        <select
          value={selectedSubject}
          onChange={e => fetchChapters(e.target.value)}
        >
          <option value="">Select Subject</option>
          {subjects.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          value={selectedChapter}
          onChange={e => fetchQuestions(selectedSubject, e.target.value)}
          disabled={!selectedSubject}
        >
          <option value="">Select Chapter</option>
          {chapters.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {loading && <p>Loading...</p>}

      {questions.length > 0 && (
        <>
          <div style={styles.actions}>
            <button onClick={selectAll}>Select All</button>
            <button onClick={clearSelection}>Clear</button>
            <button style={styles.deleteBtn} onClick={deleteSelected}>
              Delete Selected
            </button>
          </div>

          <div style={styles.tableWrapper}>
  <table style={styles.table}>
    <thead>
      <tr>
        <th style={styles.thSelect}>Select</th>
        <th style={styles.thQuestion}>Question</th>
        <th style={styles.thAnswer}>Correct Answer</th>
      </tr>
    </thead>

    <tbody>
      {questions.map(q => (
        <tr key={q.id} style={styles.row}>
          <td style={styles.tdCenter}>
            <input
              type="checkbox"
              checked={selectedQuestions.includes(q.id)}
              onChange={() => toggleSelect(q.id)}
            />
          </td>

          <td style={styles.tdQuestion}>
            {q.question}
          </td>

          <td style={styles.tdCenter}>
            {q.correct_answer}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
        </>
      )}

      {status && <p style={styles.status}>{status}</p>}
    </div>
  )
}

/* ================= STYLES ================= */

const styles = {
  page: {
    padding: 40,
    fontFamily: 'system-ui',
    minHeight: '100vh',
    background: '#f8fafc'
  },

  filterBox: {
    display: 'flex',
    gap: 15,
    marginBottom: 20
  },

  actions: {
    display: 'flex',
    gap: 10,
    marginBottom: 15
  },

  deleteBtn: {
    background: '#dc2626',
    color: '#fff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: 6
  },
tableWrapper: {
  marginTop: 15,
  overflowX: 'auto',
  background: '#ffffff',
  borderRadius: 12,
  boxShadow: '0 6px 16px rgba(0,0,0,0.05)'
},

table: {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 14
},

thSelect: {
  width: 90,
  padding: 12,
  textAlign: 'center',
  borderBottom: '2px solid #e5e7eb',
  background: '#f9fafb'
},

thQuestion: {
  padding: 12,
  textAlign: 'left',
  borderBottom: '2px solid #e5e7eb',
  background: '#f9fafb'
},

thAnswer: {
  width: 150,
  padding: 12,
  textAlign: 'center',
  borderBottom: '2px solid #e5e7eb',
  background: '#f9fafb'
},

row: {
  borderBottom: '1px solid #f1f5f9'
},

tdCenter: {
  textAlign: 'center',
  padding: 10
},

tdQuestion: {
  padding: 10,
  lineHeight: 1.5
},
  status: {
    marginTop: 20,
    fontWeight: 600
  }
}