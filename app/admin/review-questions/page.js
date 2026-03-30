'use client'

import { supabase } from '../../../lib/supabase'
import { useEffect, useState } from 'react'

export default function ReviewQuestionsPage() {

  const [tree, setTree] = useState({})
  const [selected, setSelected] = useState({})
  const [questions, setQuestions] = useState([])
  const [selectedQuestions, setSelectedQuestions] = useState([])
  const [search, setSearch] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [analytics, setAnalytics] = useState({})
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const limit = 25

  /* ================= TREE ================= */

  useEffect(() => {
    loadTree()
    loadAnalytics()
  }, [])

  async function loadTree() {
    const { data } = await supabase
      .from('question_bank')
      .select('exam_category,subject,chapter,subtopic')

    const structure = {}

    data.forEach(d => {
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

  /* ================= QUESTIONS ================= */

  async function fetchQuestions(reset = true, filters = selected) {

    if (reset) {
      setQuestions([])
      setPage(1)
      setHasMore(true)
    }

    let query = supabase
      .from('question_bank')
      .select('*')
      .range((page - 1) * limit, page * limit - 1)

    if (filters.exam_category) query = query.ilike('exam_category', filters.exam_category)
    if (filters.subject) query = query.eq('subject', filters.subject)
    if (filters.chapter) query = query.eq('chapter', filters.chapter)
    if (filters.subtopic) query = query.eq('subtopic', filters.subtopic)

    if (search) query = query.ilike('question', `%${search}%`)
    if (difficulty) query = query.eq('difficulty', difficulty)
    if (statusFilter === 'active') query = query.eq('is_active', true)
    if (statusFilter === 'inactive') query = query.eq('is_active', false)

    const { data } = await query

    if (data.length < limit) setHasMore(false)

    setQuestions(prev => reset ? data : [...prev, ...data])
    setPage(prev => prev + 1)
  }

  /* ================= SELECT ================= */

  function toggleSelect(id) {
    setSelectedQuestions(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  async function selectAll() {
    let query = supabase.from('question_bank').select('id')

    if (selected.exam_category) query = query.ilike('exam_category', selected.exam_category)
    if (selected.subject) query = query.eq('subject', selected.subject)
    if (selected.chapter) query = query.eq('chapter', selected.chapter)
    if (selected.subtopic) query = query.eq('subtopic', selected.subtopic)

    const { data } = await query
    setSelectedQuestions(data.map(d => d.id))
  }

  function clearSelection() {
    setSelectedQuestions([])
  }

  /* ================= ACTIONS ================= */

  async function deleteSelected() {
    if (!confirm('Are you sure you want to delete selected questions?')) return

    await supabase
      .from('question_bank')
      .delete()
      .in('id', selectedQuestions)

    fetchQuestions(true)
    clearSelection()
  }

  async function toggleActiveBulk(status) {
    await supabase
      .from('question_bank')
      .update({ is_active: status })
      .in('id', selectedQuestions)

    fetchQuestions(true)
  }

  async function toggleSingle(q) {
    await supabase
      .from('question_bank')
      .update({ is_active: !q.is_active })
      .eq('id', q.id)

    fetchQuestions(true)
  }

  async function updateDifficulty(id, value) {
    await supabase
      .from('question_bank')
      .update({ difficulty: value })
      .eq('id', id)

    fetchQuestions(true)
  }

  /* ================= ANALYTICS ================= */

  async function loadAnalytics() {

    const { data } = await supabase
      .from('exam_sessions')
      .select('question_id,is_correct')

    const map = {}

    data.forEach(d => {
      if (!map[d.question_id]) map[d.question_id] = { wrong: 0, total: 0 }
      map[d.question_id].total++
      if (!d.is_correct) map[d.question_id].wrong++
    })

    setAnalytics(map)
  }

  /* ================= UI ================= */

  return (
    <div style={{ display: 'flex', padding: 20, fontFamily: 'Inter' }}>

      {/* TREE */}
      <div style={{
        width: 280,
        background: 'linear-gradient(#1e293b,#0f172a)',
        color: '#fff',
        padding: 15,
        borderRadius: 12
      }}>

        {Object.keys(tree).map(exam => (
          <div key={exam}>
            <div style={{ fontWeight: 'bold', marginTop: 10 }}
              onClick={() => {
                setSelected({ exam_category: exam })
                fetchQuestions(true, { exam_category: exam })
              }}>
              📘 {exam}
            </div>

            {Object.keys(tree[exam]).map(sub => (
              <div key={sub} style={{ marginLeft: 10 }}>
                <div onClick={() => {
                  setSelected({ exam_category: exam, subject: sub })
                  fetchQuestions(true, { exam_category: exam, subject: sub })
                }}>
                  📗 {sub}
                </div>

                {Object.keys(tree[exam][sub]).map(ch => (
                  <div key={ch} style={{ marginLeft: 10 }}>
                    <div onClick={() => {
                      setSelected({ exam_category: exam, subject: sub, chapter: ch })
                      fetchQuestions(true, { exam_category: exam, subject: sub, chapter: ch })
                    }}>
                      📂 {ch}
                    </div>

                    {Object.keys(tree[exam][sub][ch]).map(st => (
                      <div key={st} style={{ marginLeft: 10, fontSize: 12 }}
                        onClick={() => {
                          setSelected({ exam_category: exam, subject: sub, chapter: ch, subtopic: st })
                          fetchQuestions(true, { exam_category: exam, subject: sub, chapter: ch, subtopic: st })
                        }}>
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

      {/* CONTENT */}
      <div style={{ flex: 1, marginLeft: 20 }}>

        {/* FILTERS */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          <input placeholder="Search..." onChange={e => setSearch(e.target.value)} />
          <select onChange={e => setDifficulty(e.target.value)}>
            <option value="">All</option>
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>
          <select onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button onClick={() => fetchQuestions(true)}>Apply</button>
        </div>

        {/* ACTIONS */}
        <div style={{ marginBottom: 10 }}>
          <button onClick={selectAll}>Select All</button>
          <button onClick={clearSelection}>Clear</button>
          <button onClick={() => toggleActiveBulk(true)}>Activate</button>
          <button onClick={() => toggleActiveBulk(false)}>Deactivate</button>
          <button style={{ background: 'red', color: '#fff' }} onClick={deleteSelected}>Delete</button>
        </div>

        {/* QUESTIONS */}
        {questions.map(q => (
          <div key={q.id} style={{
            background: '#fff',
            padding: 15,
            marginBottom: 10,
            borderRadius: 12
          }}>

            <input type="checkbox"
              checked={selectedQuestions.includes(q.id)}
              onChange={() => toggleSelect(q.id)}
            />

            <div dangerouslySetInnerHTML={{ __html: q.question }} />

            <div>A: {q.option_a}</div>
            <div>B: {q.option_b}</div>
            <div>C: {q.option_c}</div>
            <div>D: {q.option_d}</div>

            <div>
              <b>Answer:</b> {q.correct_answer}
            </div>

            <div>
              Difficulty:
              <select value={q.difficulty}
                onChange={(e) => updateDifficulty(q.id, e.target.value)}>
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </div>

            <div>
              Wrong Rate:
              {analytics[q.id]
                ? Math.round((analytics[q.id].wrong / analytics[q.id].total) * 100) + '%'
                : 'No Data'}
            </div>

            <button onClick={() => toggleSingle(q)}>
              {q.is_active ? 'Deactivate' : 'Activate'}
            </button>

          </div>
        ))}

        {hasMore && (
          <button onClick={() => fetchQuestions(false)}>Load More</button>
        )}

      </div>

    </div>
  )
}
