'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { getAdminCollege } from '../../../lib/getAdminCollege'

export default function MapQuestionsPage() {

  const router = useRouter()
  const searchParams = useSearchParams()
  const examId = searchParams.get('examId')

  const [saving, setSaving] = useState(false)
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

    setLoading(true)
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

    const confirmReplace = window.confirm(
      "This will REPLACE existing mapped questions for this exam. Continue?"
    )

    if (!confirmReplace) return

    setSaving(true)

    try {

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

  if (loading) {
    return <div style={styles.loading}>Loading...</div>
  }

  /* ================= EXAM LIST ================= */

  if (!examId) {

    const filtered = exams
      .filter(e => e.title.toLowerCase().includes(search.toLowerCase()))
      .filter(e => categoryFilter === 'ALL' || e.exam_category === categoryFilter)

    return (
      <div style={styles.container}>
        <h1 style={styles.heading}>Exam Mapping</h1>

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

        <table style={styles.table}>
          <thead>
            <tr style={styles.headerRow}>
              <th style={{...styles.th, textAlign:'left'}}>Exam Title</th>
              <th style={styles.th}>Category</th>
              <th style={styles.th}>Retake</th>
              <th style={styles.th}>Duration</th>
              <th style={{...styles.th, textAlign:'left'}}>Questions Mapped</th>
              <th style={{...styles.th, textAlign:'center'}}>Action</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map(e => {
              const stats = examStats[e.id] || { total: 0, subjects: {} }

              return (
                <tr key={e.id} style={styles.row}>
                  <td style={{...styles.td, textAlign:'left'}}>{e.title}</td>
                  <td style={styles.td}>{e.exam_category}</td>
                  <td style={styles.td}>{e.allow_retake ? 'Yes' : 'No'}</td>
                  <td style={styles.td}>{e.duration_minutes} min</td>

                  <td style={{...styles.td, textAlign:'left'}}>
                    <div style={{ fontWeight:600 }}>
                      {stats.total} Total
                    </div>
                    {Object.entries(stats.subjects).map(([sub,count]) => (
                      <div key={sub} style={{ fontSize:13, color:'#6b7280' }}>
                        • {sub} ({count})
                      </div>
                    ))}
                  </td>

                  <td style={{...styles.td, textAlign:'center'}}>
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
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  /* ================= MAPPING ================= */

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>{exam.title}</h2>

      <div style={styles.durationBox}>
        Duration (minutes)
        <input
          style={styles.input}
          type="number"
          value={duration}
          onChange={e => setDuration(Number(e.target.value))}
        />
      </div>

      <div style={styles.tabBar}>
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
        <>
          {sections.map((sec, i) => (
            <div key={i} style={styles.sectionCard}>

              <div style={styles.gridRow}>
                <select
                  style={styles.input}
                  value={sec.subject}
                  onChange={e => updateSection(i, 'subject', e.target.value)}
                >
                  <option value="">Select Subject</option>
                  {subjects.map(s => <option key={s}>{s}</option>)}
                </select>

                <select
                  style={styles.input}
                  value={sec.chapter}
                  onChange={e => updateSection(i, 'chapter', e.target.value)}
                >
                  <option value="">Select Chapter</option>
                  {getChapters(sec.subject).map(c => <option key={c}>{c}</option>)}
                </select>

                <input
                  style={styles.input}
                  type="number"
                  value={sec.count}
                  onChange={e => updateSection(i, 'count', Number(e.target.value))}
                />
              </div>

              <div style={styles.difficultyRow}>
                Easy %
                <input style={styles.smallInput} value={sec.easy} onChange={e => updateSection(i, 'easy', Number(e.target.value))} />
                Medium %
                <input style={styles.smallInput} value={sec.medium} onChange={e => updateSection(i, 'medium', Number(e.target.value))} />
                Hard %
                <input style={styles.smallInput} value={sec.hard} onChange={e => updateSection(i, 'hard', Number(e.target.value))} />
              </div>

            </div>
          ))}

          <button style={styles.secondaryBtn} onClick={addSection}>+ Add More Section</button>
          <button style={{...styles.primaryBtn, marginLeft: 15}} onClick={generateSmart}>Generate Questions</button>
        </>
      )}

      {mode === 'CUSTOM' && (
        <>
          {sections.map((sec, i) => {

            const filteredQuestions = questions.filter(q =>
              q.subject === sec.subject && q.chapter === sec.chapter
            )

            return (
              <div key={i} style={styles.sectionCard}>

                <div style={styles.gridRow}>
                  <select style={styles.input} value={sec.subject} onChange={e => updateSection(i, 'subject', e.target.value)}>
                    <option value="">Select Subject</option>
                    {subjects.map(s => <option key={s}>{s}</option>)}
                  </select>

                  <select style={styles.input} value={sec.chapter} onChange={e => updateSection(i, 'chapter', e.target.value)}>
                    <option value="">Select Chapter</option>
                    {getChapters(sec.subject).map(c => <option key={c}>{c}</option>)}
                  </select>

                  <div style={{ fontWeight:600 }}>
                    {filteredQuestions.length} Questions
                  </div>
                </div>

                <div style={styles.questionList}>
                  {filteredQuestions.map(q => {
                    const selected = selectedQuestions.some(x => x.id === q.id)

                    return (
                      <div key={q.id} style={styles.questionRow}>
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleCustom(q)}
                        />

                        <div style={{ flex: 1 }}>
                          <div style={styles.questionText}>{q.question}</div>
                        </div>

                        <span style={{
                          ...styles.badge,
                          background:
                            q.difficulty === 'Easy'
                              ? '#d1fae5'
                              : q.difficulty === 'Medium'
                              ? '#fef3c7'
                              : '#fee2e2'
                        }}>
                          {q.difficulty}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          <button style={styles.secondaryBtn} onClick={addSection}>
            + Add More Section
          </button>
        </>
      )}

      <div style={styles.summaryBox}>
        <h3>Selection Summary</h3>
        {Object.entries(summaryByChapter()).map(([k,v]) =>
          <div key={k}>{k} : {v}</div>
        )}
        <b>Total Selected: {selectedQuestions.length}</b>
      </div>

      <button style={styles.saveBtn} onClick={saveMapping} disabled={saving}>
        {saving ? 'Saving...' : 'Map Questions'}
      </button>
    </div>
  )
}
const styles = {

  container: {
    padding: 30,
    background: '#f3f4f6',
    minHeight: '100vh'
  },

  heading: {
    fontSize: 24,
    marginBottom: 20
  },

  loading: {
    padding: 30
  },

  filterBar: {
    display: 'flex',
    gap: 10,
    marginBottom: 20
  },

  input: {
    padding: 10,
    borderRadius: 6,
    border: '1px solid #ccc'
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse',
    background: '#fff'
  },

  headerRow: {
    background: '#f9fafb'
  },

  th: {
    padding: 12,
    fontWeight: 600
  },

  row: {
    borderBottom: '1px solid #eee'
  },

  td: {
    padding: 12
  },

  primaryBtn: {
    padding: '8px 14px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer'
  },

  secondaryBtn: {
    padding: '8px 14px',
    background: '#6b7280',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer'
  },

  durationBox: {
    marginBottom: 20
  },

  tabBar: {
    display: 'flex',
    gap: 10,
    marginBottom: 20
  },

  tab: {
    padding: '8px 16px',
    background: '#e5e7eb',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer'
  },

  activeTab: {
    padding: '8px 16px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer'
  },

  sectionCard: {
    background: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20
  },

  gridRow: {
    display: 'flex',
    gap: 10,
    marginBottom: 10
  },

  difficultyRow: {
    display: 'flex',
    gap: 10,
    alignItems: 'center'
  },

  smallInput: {
    width: 60,
    padding: 6
  },

  questionList: {
    maxHeight: 300,
    overflowY: 'auto',
    marginTop: 10
  },

  questionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: 8,
    borderBottom: '1px solid #eee'
  },

  questionText: {
    fontSize: 14
  },

  badge: {
    padding: '4px 10px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600
  },

  summaryBox: {
    background: '#fff',
    padding: 20,
    borderRadius: 10,
    marginTop: 20
  },

  saveBtn: {
    marginTop: 20,
    padding: '12px 20px',
    background: 'green',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer'
  }
}
