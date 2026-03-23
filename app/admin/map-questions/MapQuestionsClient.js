'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { getAdminCollege } from '../../../lib/getAdminCollege' // ✅ added

export default function MapQuestionsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const examId = searchParams.get('examId')

  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [exam, setExam] = useState(null)
  const [exams, setExams] = useState([])
  const [examStats, setExamStats] = useState({})
  const [questions, setQuestions] = useState([])
  const [subjects, setSubjects] = useState([])
  const [selectedQuestions, setSelectedQuestions] = useState([])
  const [duration, setDuration] = useState(60)

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [mode, setMode] = useState('SMART')

  const [sections, setSections] = useState([
    { subject: '', chapter: '', count: 10, easy: 30, medium: 40, hard: 30 }
  ])

  useEffect(() => {
    if (!examId) fetchExams()
    else initExam()
  }, [examId])

  async function fetchExams() {
    setLoading(true)

    const collegeId = await getAdminCollege() // ✅ added

    const { data: examData } = await supabase
      .from('exams')
      .select('*')
      .eq('college_id', collegeId) // ✅ added
      .order('created_at', { ascending: false })

    const stats = {}

    for (let e of examData || []) {

      const { data: mapped } = await supabase
        .from('exam_questions')
        .select(`
          question_id,
          question_bank (
            subject
          )
        `)
        .eq('exam_id', e.id)

      let subjectMap = {}
      let total = 0

      mapped?.forEach(row => {
        if (row.question_bank) {
          total++
          const sub = row.question_bank.subject
          subjectMap[sub] = (subjectMap[sub] || 0) + 1
        }
      })

      stats[e.id] = {
        total,
        subjects: subjectMap
      }
    }

    setExams(examData || [])
    setExamStats(stats)
    setLoading(false)
  }

  async function initExam() {

    const collegeId = await getAdminCollege() // ✅ added

    const { data } = await supabase
      .from('exams')
      .select('*')
      .eq('id', examId)
      .eq('college_id', collegeId) // ✅ added
      .single()

    setExam(data || null)
    setDuration(data?.duration_minutes || 60)

    const { data: qs } = await supabase
      .from('question_bank')
      .select('*')
      .eq('college_id', collegeId) // ✅ added

    setQuestions(qs || [])
    setSubjects([...new Set((qs || []).map(q => q.subject))])
    setLoading(false)
  }

  /* ===== REST OF FILE UNCHANGED ===== */

  function getChapters(subject) {
    return [...new Set(
      questions.filter(q => q.subject === subject).map(q => q.chapter)
    )]
  }

  function addSection() {
    setSections([
      ...sections,
      { subject: '', chapter: '', count: 10, easy: 30, medium: 40, hard: 30 }
    ])
  }

  function removeSection(index) {
    setSections(sections.filter((_, i) => i !== index))
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
      if (!sec.subject || !sec.chapter) {
        alert('Select subject and chapter')
        return
      }

      if (sec.easy + sec.medium + sec.hard !== 100) {
        alert('Difficulty % must equal 100')
        return
      }

      const pool = questions.filter(
        q => q.subject === sec.subject && q.chapter === sec.chapter
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

  function summaryByChapter() {
    const map = {}
    selectedQuestions.forEach(q => {
      const key = `${q.subject} → ${q.chapter}`
      map[key] = (map[key] || 0) + 1
    })
    return map
  }

  async function saveMapping() {

    if (!exam) return

    if (selectedQuestions.length === 0) {
      alert('Select questions first')
      return
    }

    const confirmReplace = confirm(
      "This will REPLACE existing mapped questions for this exam. Continue?"
    )

    if (!confirmReplace) return

    setSaving(true)

    try {

      await supabase
        .from('exam_questions')
        .delete()
        .eq('exam_id', exam.id)

      await supabase
        .from('exam_questions')
        .insert(
          selectedQuestions.map(q => ({
            exam_id: exam.id,
            question_id: q.id
          }))
        )

      await supabase
        .from('exams')
        .update({ duration_minutes: duration })
        .eq('id', exam.id)

      setSaving(false)

      alert('✅ Questions mapped successfully!')
      router.push('/admin/map-questions')

    } catch (err) {
      console.error(err)
      setSaving(false)
      alert('Something went wrong while saving.')
    }
  }

  /* UI PART REMAINS EXACTLY SAME */
}
  /* ================= UI ================= */

  if (loading) return <div style={styles.loading}>Loading...</div>

  if (!examId) {
    return (
      <div style={styles.container}>
        <h1 style={styles.heading}>Exam Mapping</h1>

        <input
          style={styles.input}
          placeholder="Search exam..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <table style={styles.table}>
          <tbody>
            {exams.map(e => (
              <tr key={e.id}>
                <td>{e.title}</td>
                <td>
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

  if (!exam) {
    return <div style={{ padding: 30 }}>Loading exam...</div>
  }

  return (
    <div style={styles.container}>

      <h2 style={styles.heading}>{exam.title}</h2>

      <div style={styles.card}>
        Duration (minutes)
        <input
          style={styles.input}
          type="number"
          value={duration}
          onChange={e => setDuration(Number(e.target.value))}
        />
      </div>

      <div style={styles.tabBar}>
        <button style={styles.tab} onClick={() => setMode('SMART')}>Smart</button>
        <button style={styles.tab} onClick={() => setMode('CUSTOM')}>Custom</button>
      </div>

      <div style={styles.summaryBox}>
        {Object.entries(summaryByChapter()).map(([k,v]) =>
          <div key={k}>{k} : {v}</div>
        )}
        <b>Total: {selectedQuestions.length}</b>
      </div>

      <button style={styles.saveBtn} onClick={saveMapping}>
        Map Questions
      </button>

    </div>
  )
}

/* ================= STYLES ================= */

const styles = {
  container: { padding: 30, background: '#f3f4f6', minHeight: '100vh' },
  heading: { fontSize: 22, marginBottom: 20 },
  loading: { padding: 30 },
  input: { padding: 10, marginBottom: 10 },
  table: { width: '100%', background: '#fff' },
  primaryBtn: { padding: 8, background: '#2563eb', color: '#fff' },
  card: { background: '#fff', padding: 20, marginBottom: 20 },
  tabBar: { display: 'flex', gap: 10 },
  tab: { padding: 8, background: '#ddd' },
  summaryBox: { background: '#fff', padding: 20, marginTop: 20 },
  saveBtn: { marginTop: 20, padding: 10, background: 'green', color: '#fff' }
}
