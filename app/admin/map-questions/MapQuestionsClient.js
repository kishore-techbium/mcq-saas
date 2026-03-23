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
  const [selectedQuestions, setSelectedQuestions] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!examId) fetchExams()
    else initExam()
  }, [examId])

  async function fetchExams() {
    const collegeId = await getAdminCollege()

    const { data } = await supabase
      .from('exams')
      .select('*')
      .eq('college_id', collegeId)

    setExams(data || [])
    setLoading(false)
  }

  async function initExam() {

    const collegeId = await getAdminCollege()

    const { data: examData } = await supabase
      .from('exams')
      .select('*')
      .eq('id', examId)
      .eq('college_id', collegeId)
      .single()

    const { data: qs } = await supabase
      .from('question_bank')
      .select('*')
      .eq('college_id', collegeId)

    const { data: mapped } = await supabase
      .from('exam_questions')
      .select('question_id')
      .eq('exam_id', examId)

    const mappedIds = mapped?.map(m => m.question_id) || []

    setExam(examData)
    setQuestions(qs || [])
    setSelectedQuestions(
      (qs || []).filter(q => mappedIds.includes(q.id))
    )

    setLoading(false)
  }

  function toggleQuestion(q) {
    const exists = selectedQuestions.find(x => x.id === q.id)

    if (exists) {
      setSelectedQuestions(selectedQuestions.filter(x => x.id !== q.id))
    } else {
      setSelectedQuestions([...selectedQuestions, q])
    }
  }

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
          college_id: collegeId
        }))
      )

    alert('✅ Mapping saved')
    router.push('/admin/map-questions')
  }

  if (loading) return <div>Loading...</div>

  /* ================= EXAM LIST ================= */

  if (!examId) {
    return (
      <div style={styles.page}>
        <h2>Exam Mapping</h2>

        {exams.map(e => (
          <div key={e.id} style={styles.examRow}>
            <span>{e.title}</span>
            <button onClick={() =>
              router.push(`/admin/map-questions?examId=${e.id}`)
            }>
              Map
            </button>
          </div>
        ))}
      </div>
    )
  }

  /* ================= FILTER ================= */

  const filtered = questions.filter(q =>
    q.question.toLowerCase().includes(search.toLowerCase())
  )

  /* ================= UI ================= */

  return (
    <div style={styles.page}>

      <h2>{exam.title}</h2>

      {/* SEARCH */}
      <input
        placeholder="Search questions..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={styles.search}
      />

      <div style={styles.container}>

        {/* LEFT */}
        <div style={styles.box}>
          <h3>Question Bank</h3>

          {filtered.map(q => (
            <div key={q.id} style={styles.qRow}>
              <input
                type="checkbox"
                checked={selectedQuestions.some(x => x.id === q.id)}
                onChange={() => toggleQuestion(q)}
              />
              <span>{q.question}</span>
            </div>
          ))}
        </div>

        {/* RIGHT */}
        <div style={styles.box}>
          <h3>Selected ({selectedQuestions.length})</h3>

          {selectedQuestions.map(q => (
            <div key={q.id} style={styles.qRow}>
              {q.question}
            </div>
          ))}
        </div>

      </div>

      <button style={styles.saveBtn} onClick={saveMapping}>
        Save Mapping
      </button>

    </div>
  )
}

const styles = {
  page: { padding: 30 },
  search: {
    width: '100%',
    padding: 10,
    marginBottom: 20
  },
  container: {
    display: 'flex',
    gap: 20
  },
  box: {
    flex: 1,
    border: '1px solid #ddd',
    padding: 10,
    height: 400,
    overflowY: 'auto'
  },
  qRow: {
    marginBottom: 8
  },
  saveBtn: {
    marginTop: 20,
    padding: 10,
    background: 'green',
    color: '#fff'
  },
  examRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 10
  }
}
