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
  const [questions, setQuestions] = useState([])
  const [subjects, setSubjects] = useState([])
  const [selectedQuestions, setSelectedQuestions] = useState([])
  const [duration, setDuration] = useState(60)

  const [mode, setMode] = useState('SMART')

  const [sections, setSections] = useState([
    { subject: '', chapter: '', count: 10, easy: 30, medium: 40, hard: 30 }
  ])

  useEffect(() => {
    if (!examId) return
    initExam()
  }, [examId])

  async function initExam() {

    if (!examId) return

    const collegeId = await getAdminCollege()

    const { data } = await supabase
      .from('exams')
      .select('*')
      .eq('id', examId)
      .eq('college_id', collegeId)
      .single()

    if (!data) {
      alert('Exam not found')
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

    setLoading(false)
  }

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

  async function saveMapping() {

    const collegeId = await getAdminCollege()

    if (selectedQuestions.length === 0) {
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

    alert('✅ Questions mapped successfully!')
    router.push('/admin/map-questions')
  }

  if (loading) return <div style={{ padding: 30 }}>Loading...</div>

  return (
    <div style={{ padding: 30 }}>

      <h2>{exam?.title}</h2>

      <div>
        Duration (minutes)
        <input
          type="number"
          value={duration}
          onChange={e => setDuration(Number(e.target.value))}
        />
      </div>

      <div>
        <button onClick={() => setMode('SMART')}>Smart Mapping</button>
        <button onClick={() => setMode('CUSTOM')}>Custom Mapping</button>
      </div>

      {mode === 'SMART' && (
        <>
          {sections.map((sec, i) => (
            <div key={i}>
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

      <div>
        Total Selected: {selectedQuestions.length}
      </div>

      <button onClick={saveMapping}>
        Map Questions
      </button>

    </div>
  )
}
