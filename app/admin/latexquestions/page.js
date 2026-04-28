'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { getAdminCollege } from '../../../lib/getAdminCollege'
import 'katex/dist/katex.min.css'
import { BlockMath, InlineMath } from 'react-katex'

export default function LatexQuestionsPage() {
  const [collegeId, setCollegeId] = useState(null)
  const [adminName, setAdminName] = useState('')

  const [question, setQuestion] = useState('')
  const [optionA, setOptionA] = useState('')
  const [optionB, setOptionB] = useState('')
  const [optionC, setOptionC] = useState('')
  const [optionD, setOptionD] = useState('')
  const [answer, setAnswer] = useState('A')

  const [loading, setLoading] = useState(true)

  /* ================= AUTH + COLLEGE ================= */

  useEffect(() => {
    async function init() {
      const data = await getAdminCollege()

      if (!data) {
        window.location.href = '/'
        return
      }

      setCollegeId(data.collegeId)
      setAdminName(data.adminName)
      setLoading(false)
    }

    init()
  }, [])

  /* ================= SAVE QUESTION ================= */

  async function saveQuestion() {
    if (!question) {
      alert('Question cannot be empty')
      return
    }

    const { error } = await supabase.from('question_bank').insert({
      college_id: collegeId,
      question,
      option_a: optionA,
      option_b: optionB,
      option_c: optionC,
      option_d: optionD,
      correct_answer: answer
    })

    if (!error) {
      alert('✅ Question saved successfully')

      // reset form
      setQuestion('')
      setOptionA('')
      setOptionB('')
      setOptionC('')
      setOptionD('')
      setAnswer('A')
    } else {
      alert('❌ Error saving question')
      console.error(error)
    }
  }

  if (loading) {
    return <p style={{ padding: 30 }}>Loading...</p>
  }

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h1>Add LaTeX Question</h1>
          <p>Welcome, {adminName}</p>
        </div>

        <button
          onClick={() => (window.location.href = '/admin')}
          style={styles.backBtn}
        >
          ← Back to Dashboard
        </button>
      </div>

      <div style={styles.container}>
        
        {/* INPUT */}
        <div style={styles.inputBox}>
          <h3>📝 Enter Question</h3>

          <textarea
            placeholder="Example: \frac{x^2}{y}"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            style={styles.textarea}
          />

          <h4>Options</h4>

          <input placeholder="Option A" value={optionA} onChange={(e)=>setOptionA(e.target.value)} style={styles.input}/>
          <input placeholder="Option B" value={optionB} onChange={(e)=>setOptionB(e.target.value)} style={styles.input}/>
          <input placeholder="Option C" value={optionC} onChange={(e)=>setOptionC(e.target.value)} style={styles.input}/>
          <input placeholder="Option D" value={optionD} onChange={(e)=>setOptionD(e.target.value)} style={styles.input}/>

          <select value={answer} onChange={(e)=>setAnswer(e.target.value)} style={styles.select}>
            <option>A</option>
            <option>B</option>
            <option>C</option>
            <option>D</option>
          </select>

          <button onClick={saveQuestion} style={styles.saveBtn}>
            💾 Save Question
          </button>
        </div>

        {/* PREVIEW */}
        <div style={styles.previewBox}>
          <h3>👁️ Live Preview</h3>

          <div style={styles.previewCard}>
            {question ? <BlockMath>{question}</BlockMath> : <p>Preview will appear here</p>}

            <div style={{ marginTop: 20 }}>
              <p>A: <InlineMath math={optionA || ''} /></p>
              <p>B: <InlineMath math={optionB || ''} /></p>
              <p>C: <InlineMath math={optionC || ''} /></p>
              <p>D: <InlineMath math={optionD || ''} /></p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

/* ================= STYLES ================= */

const styles = {
  page: {
    padding: 40,
    background: '#f8fafc',
    minHeight: '100vh'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  backBtn: {
    padding: '10px 16px',
    background: '#64748b',
    color: '#fff',
    border: 'none',
    borderRadius: 8
  },
  container: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 20
  },
  inputBox: {
    background: '#fff',
    padding: 20,
    borderRadius: 12
  },
  previewBox: {
    background: '#fff',
    padding: 20,
    borderRadius: 12
  },
  textarea: {
    width: '100%',
    height: 120,
    marginBottom: 15,
    padding: 10
  },
  input: {
    width: '100%',
    marginBottom: 10,
    padding: 10
  },
  select: {
    width: '100%',
    padding: 10
  },
  saveBtn: {
    marginTop: 10,
    padding: 12,
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 8
  },
  previewCard: {
    background: '#f1f5f9',
    padding: 20,
    borderRadius: 10
  }
}
