'use client'

import { supabase } from '../../../lib/supabase'
import { useEffect, useState } from 'react'

export default function ReviewQuestionsPage() {

  const [tree, setTree] = useState({})
  const [selected, setSelected] = useState({})
  const [questions, setQuestions] = useState([])
  const [selectedQuestions, setSelectedQuestions] = useState([])
  const [analytics, setAnalytics] = useState({})
  const [search, setSearch] = useState('')
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 })
  const [statusFilter, setStatusFilter] = useState(null)

  useEffect(() => {
    loadTree()
    loadAnalytics()
    fetchQuestions({})
    loadStats()
  }, [])

  /* ================= TREE ================= */

  async function loadTree() {
    const { data } = await supabase
      .from('question_bank')
      .select('exam_category,subject,chapter,subtopic')

    const structure = {}

    ;(data || []).forEach(d => {
      if (!structure[d.exam_category]) structure[d.exam_category] = {}
      if (!structure[d.exam_category][d.subject]) structure[d.exam_category][d.subject] = {}
      if (!structure[d.exam_category][d.subject][d.chapter]) {
        structure[d.exam_category][d.subject][d.chapter] = {}
      }
      if (!structure[d.exam_category][d.subject][d.chapter][d.subtopic]) {
        structure[d.exam_category][d.subject][d.chapter][d.subtopic] = 0
      }
      structure[d.exam_category][d.subject][d.chapter][d.subtopic]++
    })

    setTree(structure)
  }

  /* ================= STATS ================= */

  async function loadStats() {
    const { data } = await supabase.from('question_bank').select('is_active')

    const total = data?.length || 0
    const active = data?.filter(d => d.is_active).length || 0
    const inactive = total - active

    setStats({ total, active, inactive })
  }

  /* ================= FETCH ================= */

  async function fetchQuestions(filters) {

    let query = supabase.from('question_bank').select('*')

    if (filters.exam_category)
      query = query.eq('exam_category', filters.exam_category)

    if (filters.subject)
      query = query.eq('subject', filters.subject)

    if (filters.chapter)
      query = query.eq('chapter', filters.chapter)

    if (filters.subtopic)
      query = query.eq('subtopic', filters.subtopic)

    if (statusFilter !== null)
      query = query.eq('is_active', statusFilter)

    const { data } = await query

    let filtered = data || []

    // 🔍 search filter
    if (search) {
      filtered = filtered.filter(q =>
        q.question?.toLowerCase().includes(search.toLowerCase())
      )
    }

    setQuestions(filtered)
  }

  /* ================= HANDLE SELECT ================= */

  function handleSelect(level, value, context = {}) {

    let newSelection = {}

    if (level === 'exam_category') {
      newSelection = { exam_category: value }
    }

    if (level === 'subject') {
      newSelection = {
        exam_category: context.exam,
        subject: value
      }
    }

    if (level === 'chapter') {
      newSelection = {
        exam_category: context.exam,
        subject: context.subject,
        chapter: value
      }
    }

    if (level === 'subtopic') {
      newSelection = {
        exam_category: context.exam,
        subject: context.subject,
        chapter: context.chapter,
        subtopic: value
      }
    }

    setSelected(newSelection)
    fetchQuestions(newSelection)
  }

  /* ================= SELECT ================= */

  function toggleSelect(id) {
    setSelectedQuestions(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  async function selectAll() {
    const { data } = await supabase.from('question_bank').select('id')
    setSelectedQuestions((data || []).map(d => d.id))
  }

  function clearSelection() {
    setSelectedQuestions([])
  }

  /* ================= BULK ================= */

  async function deleteSelected() {
    if (!confirm('Delete selected?')) return

    await supabase
      .from('question_bank')
      .delete()
      .in('id', selectedQuestions)

    fetchQuestions(selected)
    loadStats()
    clearSelection()
  }

  async function toggleActiveBulk(status) {
    await supabase
      .from('question_bank')
      .update({ is_active: status })
      .in('id', selectedQuestions)

    fetchQuestions(selected)
    loadStats()
  }

  async function toggleSingle(q) {
    await supabase
      .from('question_bank')
      .update({ is_active: !q.is_active })
      .eq('id', q.id)

    fetchQuestions(selected)
    loadStats()
  }

  /* ================= DIFFICULTY ================= */

  async function updateDifficulty(id, value) {
    await supabase
      .from('question_bank')
      .update({ difficulty: value })
      .eq('id', id)

    alert(`Difficulty updated to ${value}`)
    fetchQuestions(selected)
  }

  /* ================= ANALYTICS ================= */

  async function loadAnalytics() {
    const { data } = await supabase
      .from('exam_answers')
      .select('question_id,is_correct')

    const map = {}

    ;(data || []).forEach(d => {
      if (!map[d.question_id]) map[d.question_id] = { wrong: 0, total: 0 }
      map[d.question_id].total++
      if (!d.is_correct) map[d.question_id].wrong++
    })

    setAnalytics(map)
  }

  function getWrongRate(qid) {
    const data = analytics[qid]
    if (!data) return null
    return Math.round((data.wrong / data.total) * 100)
  }

  function getColor(rate) {
    if (rate === null) return '#ccc'
    if (rate <= 20) return '#16a34a'
    if (rate <= 50) return '#eab308'
    if (rate <= 80) return '#f97316'
    return '#dc2626'
  }

  /* ================= UI ================= */

  return (
    <div style={{ display: 'flex', padding: 20 }}>

      {/* LEFT TREE */}
      <div style={styles.sidebar}>
        {Object.keys(tree).map(exam => (
          <div key={exam}>
            <div style={styles.node} onClick={() => handleSelect('exam_category', exam)}>
              {exam}
            </div>

            {Object.keys(tree[exam]).map(sub => (
              <div key={sub} style={styles.child}>
                <div
                  style={styles.node}
                  onClick={() => handleSelect('subject', sub, { exam })}
                >
                  {sub}
                </div>

                {Object.keys(tree[exam][sub]).map(ch => (
                  <div key={ch} style={styles.child}>
                    <div
                      style={styles.node}
                      onClick={() => handleSelect('chapter', ch, { exam, subject: sub })}
                    >
                      {ch}
                    </div>

                    {Object.keys(tree[exam][sub][ch]).map(st => (
  <div
    key={st}
    style={
      selected.subtopic === st
        ? { ...styles.child2, background: '#2563eb', borderRadius: 6 }
        : styles.child2
    }
    onClick={() =>
      handleSelect('subtopic', st, {
        exam,
        subject: sub,
        chapter: ch
      })
    }
  >
    📄 {st} ({tree[exam][sub][ch][st]})
  </div>
))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, marginLeft: 20 }}>

        {/* 🔥 STATS */}
        <div style={styles.stats}>
          <div>Total: {stats.total}</div>
          <div onClick={() => { setStatusFilter(true); fetchQuestions(selected) }}>
            Active: {stats.active}
          </div>
          <div onClick={() => { setStatusFilter(false); fetchQuestions(selected) }}>
            Inactive: {stats.inactive}
          </div>
        </div>

        {/* 🔍 SEARCH */}
        <input
          placeholder="Search questions..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            fetchQuestions(selected)
          }}
          style={styles.search}
        />

        {/* BULK ACTIONS */}
        <div style={{ marginBottom: 10 }}>
          <button onClick={selectAll}>Select All</button>
          <button onClick={clearSelection}>Clear</button>
          <button onClick={() => toggleActiveBulk(true)}>Activate</button>
          <button onClick={() => toggleActiveBulk(false)}>Deactivate</button>
          <button onClick={deleteSelected}>Delete</button>
        </div>

        {/* QUESTIONS */}
        {questions.map(q => {
          const rate = getWrongRate(q.id)

          return (
            <div key={q.id} style={styles.card}>

              {/* 🔥 CONTROL BAR */}
              <div style={styles.row}>
                <input
                  type="checkbox"
                  checked={selectedQuestions.includes(q.id)}
                  onChange={() => toggleSelect(q.id)}
                />

                <select
                  value={q.difficulty}
                  onChange={(e) => updateDifficulty(q.id, e.target.value)}
                >
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>

                <div style={{
                  background: getColor(rate),
                  color: '#fff',
                  padding: '2px 8px',
                  borderRadius: 6
                }}>
                  {rate !== null ? `${rate}%` : 'No Data'}
                </div>

                <button onClick={() => toggleSingle(q)}>
                  {q.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>

              {/* QUESTION */}
              <div dangerouslySetInnerHTML={{ __html: q.question }} />

              <div>A: <span dangerouslySetInnerHTML={{ __html: q.option_a }} /></div>
              <div>B: <span dangerouslySetInnerHTML={{ __html: q.option_b }} /></div>
              <div>C: <span dangerouslySetInnerHTML={{ __html: q.option_c }} /></div>
              <div>D: <span dangerouslySetInnerHTML={{ __html: q.option_d }} /></div>

              <div><b>Answer:</b> {q.correct_answer}</div>

            </div>
          )
        })}
      </div>
    </div>
  )
}

const styles = {
  sidebar: { width: 250, background: '#1e293b', color: '#fff', padding: 10 },
  node: { cursor: 'pointer', padding: 5 },
  child: { marginLeft: 10 },
  child2: { marginLeft: 20, cursor: 'pointer' },

  stats: {
    display: 'flex',
    gap: 20,
    marginBottom: 10,
    fontWeight: 'bold',
    cursor: 'pointer'
  },

  search: {
    width: '100%',
    padding: 8,
    marginBottom: 10
  },

  card: {
    background: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10
  },

  row: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
    marginBottom: 10
  }
}
