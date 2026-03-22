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

  useEffect(() => {
    if (!examId) fetchExams()
    else initExam()
  }, [examId])

  /* ================= FETCH EXAMS ================= */

  async function fetchExams() {

    const collegeId = await getAdminCollege()

    const { data: examData } = await supabase
      .from('exams')
      .select('*')
      .eq('college_id', collegeId) // ✅ FILTER
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

  /* ================= INIT EXAM ================= */

  async function initExam() {

    const collegeId = await getAdminCollege()

    const { data } = await supabase
      .from('exams')
      .select('*')
      .eq('id', examId)
      .eq('college_id', collegeId) // ✅ FILTER
      .single()

    setExam(data || null)
    setDuration(data?.duration_minutes || 60)

    const { data: qs } = await supabase
      .from('question_bank')
      .select('*')
      .eq('college_id', collegeId) // ✅ FILTER

    setQuestions(qs || [])
    setSubjects([...new Set((qs || []).map(q => q.subject))])
    setLoading(false)
  }

  /* ================= LOGIC ================= */

  function getChapters(subject) {
    return [...new Set(
      questions
        .filter(q => q.subject === subject)
        .map(q => q.chapter)
    )]
  }

  function toggleCustom(q) {
    const exists = selectedQuestions.find(x => x.id === q.id)
    if (exists)
      setSelectedQuestions(selectedQuestions.filter(x => x.id !== q.id))
    else
      setSelectedQuestions([...selectedQuestions, q])
  }

  async function saveMapping() {

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

  if (loading) return <div>Loading...</div>

  /* ================= UI ================= */

  if (!examId) {
    return (
      <div style={{ padding: 30 }}>
        <h2>Exam Mapping</h2>

        {exams.map(e => (
          <div key={e.id} style={{ marginBottom: 10 }}>
            {e.title}
            <button
              onClick={() => router.push(`/admin/map-questions?examId=${e.id}`)}
            >
              Map
            </button>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ padding: 30 }}>

      <h2>{exam.title}</h2>

      <h3>Select Questions</h3>

      {questions.map(q => (
        <div key={q.id}>
          <input
            type="checkbox"
            onChange={() => toggleCustom(q)}
          />
          {q.question}
        </div>
      ))}

      <button onClick={saveMapping}>
        Save Mapping
      </button>

    </div>
  )
}
