'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { getAdminCollege } from '../../../lib/getAdminCollege'

export default function MapQuestionsPage() {

  const router = useRouter()

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

  /* ================= INIT ================= */

useEffect(() => {
  const run = async () => {

    if (typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)

    const examId =
      params.get('examId') ||
      params.get('examid') ||
      params.get('id')

    console.log("URL:", window.location.href)
    console.log("Final examId:", examId)

    if (!examId) {
      console.warn("❌ No examId found in URL")
      setLoading(false)
      return
    }

    await initExam(examId)
  }

  run()
}, [])

  /* ================= INIT EXAM ================= */

  async function initExam(examId) {

    try {

      const collegeId = await getAdminCollege()

    // ✅ LOG BEFORE QUERY
    console.log("URL:", window.location.href)
    console.log("Extracted examId:", examId)
    console.log("CollegeId:", collegeId)
      
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
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

      if (!sec.subject || !sec.chapter) {
        alert('Select subject and chapter')
        return
      }

      if (sec.easy + sec.medium + sec.hard !== 100) {
        alert('Difficulty % must equal 100')
        return
      }

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

    await supabase
      .from('exams')
      .update({ duration_minutes: duration })
      .eq('id', exam.id)

    alert('✅ Questions mapped successfully!')
    router.push('/admin/map-questions')
  }

  /* ================= UI ================= */

  if (loading) return <div style={{ padding: 30 }}>Loading...</div>

  if (!exam) return <div style={{ padding: 30 }}>No exam found</div>

  return (
    <div style={{ padding: 30 }}>

      <h2>{exam.title}</h2>

      <div>
        Duration (minutes)
        <input
          type="number"
          value={duration}
          onChange={e => setDuration(Number(e.target.value))}
        />
      </div>

      <div style={{ marginTop: 20 }}>
        <button onClick={() => setMode('SMART')}>Smart Mapping</button>
        <button onClick={() => setMode('CUSTOM')}>Custom Mapping</button>
      </div>

      {/* SMART */}
      {mode === 'SMART' && (
        <>
          {sections.map((sec, i) => (
            <div key={i} style={{ marginTop: 20 }}>

              <select onChange={e => updateSection(i, 'subject', e.target.value)}>
                <option value="">Select Subject</option>
                {subjects.map(s => <option key={s}>{s}</option>)}
              </select>

              <select onChange={e => updateSection(i, 'chapter', e.target.value)}>
                <option value="">Select Chapter</option>
                {getChapters(sec.subject).map(c => <option key={c}>{c}</option>)}
              </select>

            </div>
          ))}

          <button onClick={addSection}>+ Add Section</button>
          <button onClick={generateSmart}>Generate Questions</button>
        </>
      )}

      {/* CUSTOM */}
      {mode === 'CUSTOM' && (
        questions.map(q => (
          <div key={q.id}>
            <input
              type="checkbox"
              checked={selectedQuestions.some(x => x.id === q.id)}
              onChange={() => toggleCustom(q)}
            />
            {q.question}
          </div>
        ))
      )}

      <div style={{ marginTop: 20 }}>
        Total Selected: {selectedQuestions.length}
      </div>

      <button onClick={saveMapping} style={{ marginTop: 20 }}>
        Map Questions
      </button>

    </div>
  )
}
