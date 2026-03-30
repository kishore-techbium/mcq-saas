'use client'

import { supabase } from '../../../lib/supabase'
import { useEffect, useState } from 'react'

export default function ReviewQuestionsPage() {

  const [tree, setTree] = useState({})
  const [selected, setSelected] = useState({})
  const [questions, setQuestions] = useState([])
  const [selectedQuestions, setSelectedQuestions] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const limit = 25

  /* ================= TREE ================= */

  useEffect(() => {
    loadTree()
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

  /* ================= FETCH ================= */

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

    if (filters.exam_category)
      query = query.ilike('exam_category', filters.exam_category)

    if (filters.subject)
      query = query.eq('subject', filters.subject)

    if (filters.chapter)
      query = query.eq('chapter', filters.chapter)

    if (filters.subtopic)
      query = query.eq('subtopic', filters.subtopic)

    const { data } = await query

    if (!data || data.length < limit) setHasMore(false)

    setQuestions(prev => reset ? data : [...prev, ...data])
    setPage(prev => prev + 1)
  }

  /* ================= SELECT NODE ================= */

  function handleSelect(level, value) {

    let newSelection = {}

    if (level === 'exam_category') {
      newSelection = { exam_category: value }
    }

    if (level === 'subject') {
      newSelection = { ...selected, subject: value }
      delete newSelection.chapter
      delete newSelection.subtopic
    }

    if (level === 'chapter') {
      newSelection = { ...selected, chapter: value }
      delete newSelection.subtopic
    }

    if (level === 'subtopic') {
      newSelection = { ...selected, subtopic: value }
    }

    setSelected(newSelection)
    fetchQuestions(true, newSelection)
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

  /* ================= DELETE ================= */

  async function deleteSelected() {
    if (!confirm('Delete selected questions?')) return

    await supabase
      .from('question_bank')
      .delete()
      .in('id', selectedQuestions)

    fetchQuestions(true)
    clearSelection()
  }

  /* ================= UI ================= */

  return (
    <div style={{ display: 'flex', padding: 20 }}>

      {/* TREE */}
      <div style={styles.sidebar}>

        {Object.keys(tree).map(exam => (
          <div key={exam}>
            <div style={styles.node}
              onClick={() => handleSelect('exam_category', exam)}>
              📘 {exam}
            </div>

            {Object.keys(tree[exam]).map(sub => (
              <div key={sub} style={styles.child}>
                <div style={styles.node}
                  onClick={() => handleSelect('subject', sub)}>
                  📗 {sub}
                </div>

                {Object.keys(tree[exam][sub]).map(ch => (
                  <div key={ch} style={styles.child}>
                    <div style={styles.node}
                      onClick={() => handleSelect('chapter', ch)}>
                      📂 {ch}
                    </div>

                    {Object.keys(tree[exam][sub][ch]).map(st => (
                      <div key={st}
                        style={styles.child2}
                        onClick={() => handleSelect('subtopic', st)}>
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

        <div style={{ marginBottom: 10 }}>
          <button onClick={selectAll}>Select All</button>
          <button onClick={clearSelection}>Clear</button>
          <button onClick={deleteSelected} style={{ background: 'red', color: '#fff' }}>
            Delete
          </button>
        </div>

        {questions.map(q => (
          <div key={q.id} style={styles.card}>
            <input
              type="checkbox"
              checked={selectedQuestions.includes(q.id)}
              onChange={() => toggleSelect(q.id)}
            />

            <div dangerouslySetInnerHTML={{ __html: q.question }} />

            <div>A: {q.option_a}</div>
            <div>B: {q.option_b}</div>
            <div>C: {q.option_c}</div>
            <div>D: {q.option_d}</div>

          </div>
        ))}

        {hasMore && (
          <button onClick={() => fetchQuestions(false)}>Load More</button>
        )}

      </div>

    </div>
  )
}

/* ================= STYLES ================= */

const styles = {

  sidebar: {
    width: 260,
    background: '#1e293b',
    color: '#fff',
    padding: 15,
    borderRadius: 12,
    height: '80vh',
    overflowY: 'auto'
  },

  node: {
    padding: 6,
    cursor: 'pointer',   // ✅ FIX
    marginBottom: 4
  },

  child: {
    marginLeft: 12
  },

  child2: {
    marginLeft: 20,
    fontSize: 13,
    cursor: 'pointer'   // ✅ FIX
  },

  card: {
    background: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10
  }
}
