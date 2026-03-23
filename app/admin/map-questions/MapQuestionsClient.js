'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { getAdminCollege } from '../../../lib/getAdminCollege'

export default function MapQuestionsPage() {

  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [examId, setExamId] = useState(null)
  const [exam, setExam] = useState(null)
  const [exams, setExams] = useState([])
  const [search, setSearch] = useState('')

  const [questions, setQuestions] = useState([])
  const [subjects, setSubjects] = useState([])
  const [selectedQuestions, setSelectedQuestions] = useState([])
  const [duration, setDuration] = useState(60)

  const [mode, setMode] = useState('SMART')

  const [sections, setSections] = useState([
    { subject: '', chapter: '', count: 10, easy: 30, medium: 40, hard: 30 }
  ])

  /* ================= INIT ================= */

  useEffect(() => {
    const run = async () => {

      if (typeof window === 'undefined') return

      const params = new URLSearchParams(window.location.search)

      const id =
        params.get('examId') ||
        params.get('examid') ||
        params.get('id')

      const collegeId = await getAdminCollege()

      if (!id) {
        const { data } = await supabase
          .from('exams')
          .select('*')
          .eq('college_id', collegeId)
          .order('created_at', { ascending: false })

        setExams(data || [])
        setLoading(false)
        return
      }

      setExamId(id)
      await initExam(id)
    }

    run()
  }, [])

  async function initExam(id) {

    try {

      const collegeId = await getAdminCollege()

      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('id', id)
        .eq('college_id', collegeId)
        .single()

      if (error || !data) {
        alert('❌ Exam not found')
        router.push('/admin/map-questions')
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

    } catch (err) {
      console.error("Init error:", err)
    }

    setLoading(false)
  }

  /* ================= HELPERS ================= */

  function getChapters(subject) {
    return [...new Set(
      questions.filter(q => q.subject === subject).map(q => q.chapter)
    )]
  }

  function addSection() {
    setSections([...sections, { subject: '', chapter: '', count: 10, easy: 30, medium: 40, hard: 30 }])
  }

  function updateSection(index, field, value) {
    const updated = [...sections]
    updated[index][field] = value
    setSections(updated)
  }

  function shuffle(arr) {
    return arr.sort(() => Math.random() - 0.5)
  }

  function generateSmart() {

    let final = []

    for (let sec of sections) {

      const pool = questions.filter(
        q => q.subject === sec.subject &&
             q.chapter === sec.chapter
      )

      const easyCount = Math.round((sec.easy / 100) * sec.count)
      const medCount = Math.round((sec.medium / 100) * sec.count)
      const hardCount = sec.count - easyCount - medCount

      final = [
        ...final,
        ...shuffle(pool.filter(q => q.difficulty === 'Easy')).slice(0, easyCount),
        ...shuffle(pool.filter(q => q.difficulty === 'Medium')).slice(0, medCount),
        ...shuffle(pool.filter(q => q.difficulty === 'Hard')).slice(0, hardCount)
      ]
    }

    setSelectedQuestions(final)
  }

  function toggleCustom(q) {
    const exists = selectedQuestions.find(x => x.id === q.id)
    if (exists)
      setSelectedQuestions(selectedQuestions.filter(x => x.id !== q.id))
    else
      setSelectedQuestions([...selectedQuestions, q])
  }

  async function saveMapping() {

    const collegeId = await getAdminCollege()

    if (selectedQuestions.length === 0) {
      alert('Select questions first')
      return
    }

    await supabase.from('exam_questions').delete().eq('exam_id', exam.id)

    await supabase.from('exam_questions').insert(
      selectedQuestions.map(q => ({
        exam_id: exam.id,
        question_id: q.id,
        college_id: collegeId
      }))
    )

    alert('✅ Questions mapped successfully!')
    router.push('/admin/map-questions')
  }

  /* ================= UI ================= */

  if (loading) return <div style={{ padding: 30 }}>Loading...</div>

  /* ===== EXAM LIST ===== */

  if (!examId) {
    const filtered = exams.filter(e =>
      (e.title || '').toLowerCase().includes(search.toLowerCase())
    )

    return (
      <div style={styles.container}>
        <h1 style={styles.heading}>Exam Mapping</h1>

        <input
          style={styles.search}
          placeholder="Search exam..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <table style={styles.table}>
          <thead>
            <tr>
              <th>Exam</th>
              <th>Category</th>
              <th>Duration</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {filtered.map(e => (
              <tr key={e.id}>
                <td>{e.title}</td>
                <td>{e.exam_category}</td>
                <td>{e.duration_minutes} min</td>
                <td>
                  <button
                    style={styles.btn}
                    onClick={() =>
                      window.location.href = `/admin/map-questions?examId=${e.id}`
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

  /* ===== MAPPING UI ===== */

  return (
    <div style={styles.container}>

      <h2 style={styles.heading}>{exam?.title}</h2>

      <div style={styles.card}>
        <label>Duration (minutes)</label>
        <input
          style={styles.input}
          type="number"
          value={duration}
          onChange={e => setDuration(Number(e.target.value))}
        />
      </div>

      <div style={styles.tabs}>
        <button
          style={mode === 'SMART' ? styles.activeTab : styles.tab}
          onClick={() => setMode('SMART')}
        >
          Smart Mapping
        </button>

        <button
          style={mode === 'CUSTOM' ? styles.activeTab : styles.tab}
          onClick={() => setMode('CUSTOM')}
        >
          Custom Mapping
        </button>
      </div>

      {mode === 'SMART' && (
        <div style={styles.card}>
          {sections.map((sec, i) => (
            <div key={i} style={styles.row}>
              <select onChange={e => updateSection(i, 'subject', e.target.value)}>
                <option>Select Subject</option>
                {subjects.map(s => <option key={s}>{s}</option>)}
              </select>

              <select onChange={e => updateSection(i, 'chapter', e.target.value)}>
                <option>Select Chapter</option>
                {getChapters(sec.subject).map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          ))}

          <button onClick={addSection}>+ Add Section</button>
          <button onClick={generateSmart}>Generate Questions</button>
        </div>
      )}

      <div style={styles.summary}>
        Total Selected: {selectedQuestions.length}
      </div>

      <button style={styles.submit} onClick={saveMapping}>
        Map Questions
      </button>

    </div>
  )
}

const styles = {
  container: { padding: 30, background: '#f3f4f6', minHeight: '100vh' },
  heading: { fontSize: 22, marginBottom: 20 },
  card: { background: '#fff', padding: 20, borderRadius: 8, marginBottom: 20 },
  input: { width: '100%', padding: 10, marginTop: 10 },
  tabs: { display: 'flex', gap: 10, marginBottom: 20 },
  tab: { padding: 8, background: '#ddd' },
  activeTab: { padding: 8, background: '#2563eb', color: '#fff' },
  row: { marginBottom: 10 },
  summary: { marginTop: 20 },
  submit: { marginTop: 20, padding: 10, background: 'green', color: '#fff' },
  table: { width: '100%', background: '#fff' },
  search: { width: '100%', padding: 10, marginBottom: 20 },
  btn: { padding: 8, background: '#2563eb', color: '#fff' }
}
