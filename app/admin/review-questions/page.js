'use client'

import { supabase } from '../../../lib/supabase'
import { useEffect, useState } from 'react'

export default function ReviewQuestionsPage() {

  const [tree, setTree] = useState({})
  const [selected, setSelected] = useState({})
  const [questions, setQuestions] = useState([])
  const [selectedQuestions, setSelectedQuestions] = useState([])
  const [analytics, setAnalytics] = useState({})

  useEffect(() => {
    loadTree()
    loadAnalytics()
    fetchQuestions({})
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

  const { data } = await query

  setQuestions(data || [])
}


  /* ================= SELECTION ================= */
function handleSelect(level, value, context = {}) {

  let newSelection = {}

  if (level === 'exam_category') {
    newSelection = {
      exam_category: value
    }
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

    let query = supabase.from('question_bank').select('id')

    if (selected.exam_category)
      query = query.eq('exam_category', selected.exam_category)

    if (selected.subject)
      query = query.eq('subject', selected.subject)

    if (selected.chapter)
      query = query.eq('chapter', selected.chapter)

    if (selected.subtopic)
      query = query.eq('subtopic', selected.subtopic)

    const { data } = await query

    setSelectedQuestions((data || []).map(d => d.id))
  }

  function clearSelection() {
    setSelectedQuestions([])
  }

  /* ================= DELETE ================= */

  async function deleteSelected() {

    if (!confirm('Are you sure to delete?')) return

    await supabase
      .from('question_bank')
      .delete()
      .in('id', selectedQuestions)

    fetchQuestions(selected)
    clearSelection()
  }

  /* ================= ACTIVATE ================= */

  async function toggleActiveBulk(status) {

    await supabase
      .from('question_bank')
      .update({ is_active: status })
      .in('id', selectedQuestions)

    fetchQuestions(selected)
  }

  async function toggleSingle(q) {

    await supabase
      .from('question_bank')
      .update({ is_active: !q.is_active })
      .eq('id', q.id)

    fetchQuestions(selected)
  }

  /* ================= DIFFICULTY ================= */

  async function updateDifficulty(id, value) {

    await supabase
      .from('question_bank')
      .update({ difficulty: value })
      .eq('id', id)

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

  /* ================= UI ================= */

  return (
    <div style={{ display: 'flex', padding: 20 }}>

      {/* TREE */}
      <div style={styles.sidebar}>

        {Object.keys(tree).map(exam => (
          <div key={exam}>

            <div
              style={selected.exam_category === exam ? styles.activeNode : styles.node}
              onClick={() => handleSelect('exam_category', exam)}
            >
              📘 {exam}
            </div>

            {Object.keys(tree[exam]).map(sub => (
              <div key={sub} style={styles.child}>

                <div
                  style={selected.subject === sub ? styles.activeNode : styles.node}
                  onClick={() => handleSelect('subject', sub, { exam })}
                >
                  📗 {sub}
                </div>

                {Object.keys(tree[exam][sub]).map(ch => (
                  <div key={ch} style={styles.child}>

                    <div
                      style={selected.chapter === ch ? styles.activeNode : styles.node}
                      onClick={() => handleSelect('chapter', ch, { exam, subject: sub })}
                    >
                      📂 {ch}
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

      {/* QUESTIONS */}
      <div style={{ flex: 1, marginLeft: 20 }}>

        <div style={{ marginBottom: 10 }}>
          <button onClick={selectAll}>Select All</button>
          <button onClick={clearSelection}>Clear</button>
          <button onClick={() => toggleActiveBulk(true)}>Activate</button>
          <button onClick={() => toggleActiveBulk(false)}>Deactivate</button>
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

            <div>A: <span dangerouslySetInnerHTML={{ __html: q.option_a }} /></div>
            <div>B: <span dangerouslySetInnerHTML={{ __html: q.option_b }} /></div>
            <div>C: <span dangerouslySetInnerHTML={{ __html: q.option_c }} /></div>
            <div>D: <span dangerouslySetInnerHTML={{ __html: q.option_d }} /></div>

            <div><b>Answer:</b> {q.correct_answer}</div>

            <div>
              Difficulty:
              <select
                value={q.difficulty}
                onChange={(e) => updateDifficulty(q.id, e.target.value)}
              >
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

      </div>

    </div>
  )
}

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
    cursor: 'pointer'
  },
  activeNode: {
    padding: 6,
    cursor: 'pointer',
    background: '#2563eb',
    borderRadius: 6
  },
  child: {
    marginLeft: 12
  },
  child2: {
    marginLeft: 20,
    fontSize: 13,
    cursor: 'pointer'
  },
  card: {
    background: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10
  }
}
