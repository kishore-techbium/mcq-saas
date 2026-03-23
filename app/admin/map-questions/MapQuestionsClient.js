'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { getAdminCollege } from '../../../lib/getAdminCollege'

export default function MapQuestionsPage() {

  const router = useRouter()
  const searchParams = useSearchParams()
  const examId = searchParams.get('examId')
const [search, setSearch] = useState('')
const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [exam, setExam] = useState(null)
  const [exams, setExams] = useState([])
  const [questions, setQuestions] = useState([])
  const [subjects, setSubjects] = useState([])
  const [selectedQuestions, setSelectedQuestions] = useState([])
  const [duration, setDuration] = useState(60)

  const [mode, setMode] = useState('SMART')

  const [sections, setSections] = useState([
    { subject: '', chapter: '', count: 10, easy: 30, medium: 40, hard: 30 }
  ])

  useEffect(() => {
    if (!examId) fetchExams()
    else initExam()
  }, [examId])

  /* ================= FETCH EXAMS ================= */

  async function fetchExams() {

    const collegeId = await getAdminCollege()

    const { data } = await supabase
      .from('exams')
      .select('*')
      .eq('college_id', collegeId)

    setExams(data || [])
    setLoading(false)
  }

  /* ================= INIT ================= */

  async function initExam() {

    const collegeId = await getAdminCollege()

    const { data } = await supabase
      .from('exams')
      .select('*')
      .eq('id', examId)
      .eq('college_id', collegeId)
      .single()

    setExam(data)
    setDuration(data?.duration_minutes || 60)

    const { data: qs } = await supabase
      .from('question_bank')
      .select('*')
      .eq('college_id', collegeId)

    setQuestions(qs || [])
    setSubjects([...new Set((qs || []).map(q => q.subject))])
    setLoading(false)
  }

  /* ================= SMART ================= */

  function getChapters(subject) {
    return [...new Set(
      questions
        .filter(q => q.subject === subject)
        .map(q => q.chapter)
    )]
  }

  function addSection() {
    setSections([
      ...sections,
      { subject: '', chapter: '', count: 10, easy: 30, medium: 40, hard: 30 }
    ])
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

  /* ================= SAVE ================= */

  async function saveMapping() {

    const collegeId = await getAdminCollege()

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
          college_id: collegeId   // ✅ CRITICAL FIX
        }))
      )

    await supabase
      .from('exams')
      .update({ duration_minutes: duration })
      .eq('id', exam.id)

    alert('✅ Mapping saved')
    router.push('/admin/map-questions')
  }

  if (loading) return <div>Loading...</div>

  /* ================= EXAM LIST ================= */

if (!examId) {

  const filtered = exams
    .filter(e => e.title.toLowerCase().includes(search.toLowerCase()))
    .filter(e => categoryFilter === 'ALL' || e.exam_category === categoryFilter)

  return (
    <div style={styles.container}>

      <h1 style={styles.heading}>Exam Mapping</h1>

      {/* FILTER BAR */}
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
  /* ================= UI ================= */

  return (
    <div style={{ padding: 30 }}>

      <h2>{exam.title}</h2>

      <input
        type="number"
        value={duration}
        onChange={e => setDuration(Number(e.target.value))}
      />

      <button onClick={() => setMode('SMART')}>Smart</button>
      <button onClick={() => setMode('CUSTOM')}>Custom</button>

      {mode === 'SMART' && (
        <>
          {sections.map((sec, i) => (
            <div key={i}>
              <select onChange={e => updateSection(i, 'subject', e.target.value)}>
                {subjects.map(s => <option key={s}>{s}</option>)}
              </select>

              <select onChange={e => updateSection(i, 'chapter', e.target.value)}>
                {getChapters(sec.subject).map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          ))}

          <button onClick={generateSmart}>Generate</button>
        </>
      )}

      {mode === 'CUSTOM' && (
        questions.map(q => (
          <div key={q.id}>
            <input type="checkbox" onChange={() => toggleCustom(q)} />
            {q.question}
          </div>
        ))
      )}

      <button onClick={saveMapping}>
        Map Questions
      </button>

    </div>
  )
}
