'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { getAdminCollege } from '../../../lib/getAdminCollege'

export default function MapQuestionsPage() {

  const router = useRouter()
  const searchParams = useSearchParams()
  const examId = searchParams.get('examId')

  const [loading, setLoading] = useState(true)
  const [exam, setExam] = useState(null)
  const [exams, setExams] = useState([])
  const [questions, setQuestions] = useState([])
  const [subjects, setSubjects] = useState([])
  const [selectedQuestions, setSelectedQuestions] = useState([])
  const [duration, setDuration] = useState(60)

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')

  /* ================= INIT ================= */

  useEffect(() => {
    if (!examId) {
      fetchExams()
    } else {
      initExam()
    }
  }, [examId])

  /* ================= FETCH EXAMS ================= */

  async function fetchExams() {
    setLoading(true)

    const collegeId = await getAdminCollege()

    const { data } = await supabase
      .from('exams')
      .select('*')
      .eq('college_id', collegeId)
      .order('created_at', { ascending: false })

    setExams(data || [])
    setLoading(false)
  }

  /* ================= INIT EXAM ================= */

  async function initExam() {

    if (!examId) return   // ✅ critical fix

    setLoading(true)

    const collegeId = await getAdminCollege()

    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .eq('id', examId)
      .eq('college_id', collegeId)
      .single()

    if (error || !data) {
      console.error("Exam fetch failed:", error)
      setLoading(false)
      return
    }

    setExam(data)
    setDuration(data.duration_minutes || 60)

    const { data: qs } = await supabase
      .from('question_bank')
      .select('*')
      .eq('college_id', collegeId)

    setQuestions(qs || [])
    setSubjects([...new Set((qs || []).map(q => q.subject))])

    setLoading(false)
  }

  /* ================= SAVE ================= */

  async function saveMapping() {

    const collegeId = await getAdminCollege()

    if (!exam || selectedQuestions.length === 0) {
      alert('Select questions first')
      return
    }

    await supabase
      .from('exam_questions')
      .delete()
      .eq('exam_id', exam.id)

    await supabase
      .from('exam_questions')
      .insert(
        selectedQuestions.map(q => ({
          exam_id: exam.id,
          question_id: q.id,
          college_id: collegeId
        }))
      )

    await supabase
      .from('exams')
      .update({ duration_minutes: duration })
      .eq('id', exam.id)

    alert('✅ Questions mapped successfully!')
    router.push('/admin/map-questions')
  }

  if (loading) {
    return <div style={{ padding: 30 }}>Loading...</div>
  }

  /* ================= EXAM LIST ================= */

  if (!examId) {

    const filtered = (exams || [])
      .filter(e =>
        (e.title || '').toLowerCase().includes((search || '').toLowerCase())
      )
      .filter(e =>
        categoryFilter === 'ALL' || (e.exam_category || '') === categoryFilter
      )

    return (
      <div style={styles.container}>

        <h1 style={styles.heading}>Exam Mapping</h1>

        {/* FILTER */}
        <div style={styles.filterBar}>
          <input
            style={styles.input}
            placeholder="Search exam..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          <select
            style={styles.input}
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
          >
            <option value="ALL">All Categories</option>
            {[...new Set(exams.map(e => e.exam_category))].map(c =>
              <option key={c}>{c}</option>
            )}
          </select>
        </div>

        {/* TABLE */}
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Exam</th>
              <th style={styles.th}>Category</th>
              <th style={styles.th}>Duration</th>
              <th style={styles.th}>Mapped</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map(e => (
              <tr key={e.id}>
                <td style={styles.td}>{e.title}</td>
                <td style={styles.td}>{e.exam_category}</td>
                <td style={styles.td}>{e.duration_minutes} min</td>
                <td style={styles.td}>--</td>

                <td style={styles.td}>
                  <button
                    style={styles.primaryBtn}
                    onClick={() =>
                      router.push(`/admin/map-questions?examId=${e.id}`)
                    }
                  >
                    Map Questions
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

      </div>
    )
  }

  /* ================= MAPPING PAGE ================= */

  if (!exam) {
    return <div style={{ padding: 30 }}>Loading exam...</div>
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>{exam.title}</h2>

      <div>
        Duration (minutes)
        <input
          style={styles.input}
          type="number"
          value={duration}
          onChange={e => setDuration(Number(e.target.value))}
        />
      </div>

      <button style={styles.primaryBtn} onClick={saveMapping}>
        Map Questions
      </button>
    </div>
  )
}

/* ================= STYLES ================= */

const styles = {
  container: {
    padding: 40,
    background: '#f3f4f6',
    minHeight: '100vh'
  },

  heading: {
    fontSize: 24,
    fontWeight: 600,
    marginBottom: 25
  },

  filterBar: {
    display: 'flex',
    gap: 15,
    marginBottom: 25,
    alignItems: 'center'
  },

  input: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: 8,
    border: '1px solid #d1d5db',
    height: 38
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse',
    background: '#fff',
    borderRadius: 10,
    overflow: 'hidden'
  },

  th: {
    padding: 14,
    textAlign: 'left',
    background: '#f9fafb',
    fontWeight: 600,
    borderBottom: '1px solid #e5e7eb'
  },

  td: {
    padding: 14,
    borderBottom: '1px solid #f1f5f9'
  },

  primaryBtn: {
    padding: '8px 16px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer'
  }
}
