'use client'

import { supabase } from '../../../lib/supabase'
import { useEffect, useState } from 'react'

export default function ReviewQuestionsPage() {

  const [tree, setTree] = useState({})
  const [selected, setSelected] = useState({})
  const [questions, setQuestions] = useState([])
  const [selectedQuestions, setSelectedQuestions] = useState([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const limit = 25

  /* ================= LOAD TREE ================= */

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
      if (!structure[d.exam_category][d.subject][d.chapter]) structure[d.exam_category][d.subject][d.chapter] = []
      if (!structure[d.exam_category][d.subject][d.chapter].includes(d.subtopic)) {
        structure[d.exam_category][d.subject][d.chapter].push(d.subtopic)
      }
    })

    setTree(structure)
  }

  /* ================= FETCH QUESTIONS ================= */

  async function fetchQuestions(reset = true, filters = selected) {

    if (reset) {
      setQuestions([])
      setPage(1)
      setHasMore(true)
    }

    if (!hasMore && !reset) return

    setLoading(true)

    let query = supabase
      .from('question_bank')
      .select('*')
      .range((page - 1) * limit, page * limit - 1)

    if (filters.exam_category) query = query.eq('exam_category', filters.exam_category)
    if (filters.subject) query = query.eq('subject', filters.subject)
    if (filters.chapter) query = query.eq('chapter', filters.chapter)
    if (filters.subtopic) query = query.eq('subtopic', filters.subtopic)

    if (search) query = query.ilike('question', `%${search}%`)

    const { data } = await query

    if (data.length < limit) setHasMore(false)

    setQuestions(prev => reset ? data : [...prev, ...data])
    setPage(prev => prev + 1)

    setLoading(false)
  }

  /* ================= TREE SELECT ================= */

  function selectNode(level, value) {

    const updated = { ...selected, [level]: value }

    if (level === 'exam_category') {
      delete updated.subject
      delete updated.chapter
      delete updated.subtopic
    }

    if (level === 'subject') {
      delete updated.chapter
      delete updated.subtopic
    }

    if (level === 'chapter') {
      delete updated.subtopic
    }

    setSelected(updated)
    fetchQuestions(true, updated)
  }

  /* ================= ACTIONS ================= */

  function toggleSelect(id) {
    setSelectedQuestions(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  function selectAll() {
    setSelectedQuestions(questions.map(q => q.id))
  }

  function clearSelection() {
    setSelectedQuestions([])
  }

  async function deleteSelected() {
    await supabase
      .from('question_bank')
      .delete()
      .in('id', selectedQuestions)

    fetchQuestions(true)
    setSelectedQuestions([])
  }

  async function toggleActive(status) {
    await supabase
      .from('question_bank')
      .update({ is_active: status })
      .in('id', selectedQuestions)

    fetchQuestions(true)
    setSelectedQuestions([])
  }

  /* ================= ANALYTICS ================= */

  const analytics = {
    total: questions.length,
    active: questions.filter(q => q.is_active).length,
    inactive: questions.filter(q => !q.is_active).length
  }

  /* ================= UI ================= */

  return (
    <div style={styles.page}>

      <h1 style={styles.title}>📚 Question Bank Manager</h1>

      <div style={styles.container}>

        {/* LEFT TREE */}
        <div style={styles.sidebar}>

          {Object.keys(tree).map(exam => (
            <div key={exam}>
              <div style={styles.node} onClick={() => selectNode('exam_category', exam)}>
                {exam}
              </div>

              {selected.exam_category === exam &&
                Object.keys(tree[exam]).map(subject => (
                  <div key={subject} style={styles.child}>
                    <div style={styles.node} onClick={() => selectNode('subject', subject)}>
                      {subject}
                    </div>

                    {selected.subject === subject &&
                      Object.keys(tree[exam][subject]).map(ch => (
                        <div key={ch} style={styles.child}>
                          <div style={styles.node} onClick={() => selectNode('chapter', ch)}>
                            {ch}
                          </div>

                          {selected.chapter === ch &&
                            tree[exam][subject][ch].map(st => (
                              <div key={st} style={styles.child2}
                                onClick={() => selectNode('subtopic', st)}>
                                {st}
                              </div>
                            ))}
                        </div>
                      ))}
                  </div>
                ))}
            </div>
          ))}

        </div>

        {/* RIGHT CONTENT */}
        <div style={styles.content}>

          {/* SEARCH */}
          <input
            placeholder="🔍 Search questions..."
            value={search}
            onChange={e => {
              setSearch(e.target.value)
              fetchQuestions(true)
            }}
            style={styles.search}
          />

          {/* ANALYTICS */}
          <div style={styles.analytics}>
            <span>Total: {analytics.total}</span>
            <span>Active: {analytics.active}</span>
            <span>Inactive: {analytics.inactive}</span>
          </div>

          {/* ACTIONS */}
          <div style={styles.actions}>
            <button onClick={selectAll}>Select All</button>
            <button onClick={clearSelection}>Clear</button>
            <button onClick={() => toggleActive(true)}>Activate</button>
            <button onClick={() => toggleActive(false)}>Deactivate</button>
            <button style={styles.deleteBtn} onClick={deleteSelected}>Delete</button>
          </div>

          {/* QUESTIONS */}
          {questions.map(q => (
            <div key={q.id} style={styles.card}>

              <input
                type="checkbox"
                checked={selectedQuestions.includes(q.id)}
                onChange={() => toggleSelect(q.id)}
              />

              {/* IMAGE + TEXT */}
              <div dangerouslySetInnerHTML={{ __html: q.question }} />

              <div style={styles.options}>
                <div>A: {q.option_a}</div>
                <div>B: {q.option_b}</div>
                <div>C: {q.option_c}</div>
                <div>D: {q.option_d}</div>
              </div>

              <div><b>Answer:</b> {q.correct_answer}</div>

              {!q.is_active && <div style={styles.inactive}>Inactive</div>}

            </div>
          ))}

          {/* LOAD MORE */}
          {hasMore && !loading && (
            <button onClick={() => fetchQuestions(false)} style={styles.loadMore}>
              Load More
            </button>
          )}

          {loading && <p>Loading...</p>}

        </div>

      </div>
    </div>
  )
}

/* ================= STYLES ================= */

const styles = {

  page: {
    padding: 30,
    fontFamily: 'Inter, sans-serif',
    background: '#f1f5f9'
  },

  title: {
    marginBottom: 20
  },

  container: {
    display: 'flex',
    gap: 20
  },

  sidebar: {
    width: 260,
    background: '#fff',
    padding: 15,
    borderRadius: 12,
    height: '80vh',
    overflowY: 'auto'
  },

  node: {
    padding: 6,
    cursor: 'pointer',
    fontWeight: 500
  },

  child: {
    marginLeft: 10
  },

  child2: {
    marginLeft: 20,
    fontSize: 13,
    cursor: 'pointer'
  },

  content: {
    flex: 1
  },

  search: {
    width: '100%',
    padding: 10,
    borderRadius: 8,
    border: '1px solid #ccc',
    marginBottom: 10
  },

  analytics: {
    display: 'flex',
    gap: 20,
    marginBottom: 10,
    fontWeight: 500
  },

  actions: {
    display: 'flex',
    gap: 10,
    marginBottom: 15
  },

  deleteBtn: {
    background: '#dc2626',
    color: '#fff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: 6
  },

  card: {
    background: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 12,
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
  },

  options: {
    marginTop: 8,
    marginBottom: 8
  },

  inactive: {
    color: 'red',
    fontWeight: 'bold'
  },

  loadMore: {
    padding: 10,
    marginTop: 10
  }
}
