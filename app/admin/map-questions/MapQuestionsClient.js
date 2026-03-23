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

  /* ================= INIT ================= */

  useEffect(() => {
    if (!examId) fetchExams()
    else initExam()
  }, [examId])

  async function fetchExams() {

    const collegeId = await getAdminCollege()

    const { data: examData } = await supabase
      .from('exams')
      .select('*')
      .eq('college_id', collegeId)
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

      stats[e.id] = { total, subjects: subjectMap }
    }

    setExams(examData || [])
    setExamStats(stats)
    setLoading(false)
  }

  async function initExam() {

    const collegeId = await getAdminCollege()

    const { data } = await supabase
      .from('exams')
      .select('*')
      .eq('id', examId)
      .eq('college_id', collegeId)
      .single()

    setExam(data || null)
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

    const confirmReplace = window.confirm(
      "This will REPLACE existing mapped questions. Continue?"
    )

    if (!confirmReplace) return

    await supabase.from('exam_questions').delete().eq('exam_id', exam.id)

    await supabase.from('exam_questions').insert(
      selectedQuestions.map(q => ({
        exam_id: exam.id,
        question_id: q.id
      }))
    )

    await supabase
      .from('exams')
      .update({ duration_minutes: duration })
      .eq('id', exam.id)

    alert('✅ Questions mapped successfully!')
    router.push('/admin/map-questions')
  }

  if (loading) return <div style={{ padding: 30 }}>Loading...</div>

  /* ================= EXAM LIST ================= */

  if (!examId) {
    const filtered = exams
      .filter(e => e.title.toLowerCase().includes(search.toLowerCase()))

    return (
      <div style={{ padding: 30 }}>
        <h1>Exam Mapping</h1>

        <input
          placeholder="Search exam..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <table>
          <tbody>
            {filtered.map(e => (
              <tr key={e.id}>
                <td>{e.title}</td>
                <td>{examStats[e.id]?.total || 0} questions</td>
                <td>
                  <button onClick={() =>
                    router.push(`/admin/map-questions?examId=${e.id}`)
                  }>
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

  /* ================= MAPPING ================= */

  return (
    <div style={{ padding: 30 }}>

      <h2>{exam?.title}</h2>

      <input
        type="number"
        value={duration}
        onChange={e => setDuration(Number(e.target.value))}
      />

      <button onClick={() => setMode('SMART')}>Smart</button>
      <button onClick={() => setMode('CUSTOM')}>Custom</button>

      {mode === 'CUSTOM' && questions.map(q => (
        <div key={q.id}>
          <input
            type="checkbox"
            checked={selectedQuestions.some(x => x.id === q.id)}
            onChange={() => toggleCustom(q)}
          />
          {q.question}
        </div>
      ))}

      <div>
        {Object.entries(summaryByChapter()).map(([k,v]) =>
          <div key={k}>{k} : {v}</div>
        )}
      </div>

      <button onClick={saveMapping}>Map Questions</button>
    </div>
  )
}
