'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { getAdminCollege } from '../../../lib/getAdminCollege'
import 'katex/dist/katex.min.css'
import { BlockMath, InlineMath } from 'react-katex'

export default function LatexQuestionsPage() {
  const [collegeId, setCollegeId] = useState(null)
  const [adminName, setAdminName] = useState('')
  const [loading, setLoading] = useState(true)

  const [question, setQuestion] = useState('')
  const [optionA, setOptionA] = useState('')
  const [optionB, setOptionB] = useState('')
  const [optionC, setOptionC] = useState('')
  const [optionD, setOptionD] = useState('')
  const [answer, setAnswer] = useState('A')

  /* ================= AUTH ================= */

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

  /* ================= TOOLBAR DATA ================= */

  const TOOLBAR = {
    math: [
      { label: 'x²', latex: 'x^{2}' },
      { label: 'xⁿ', latex: 'x^{n}' },
      { label: '√x', latex: '\\sqrt{x}' },
      { label: 'Fraction', latex: '\\frac{a}{b}' },
      { label: '(a+b)²', latex: '(a+b)^{2}' },
      { label: 'log', latex: '\\log(x)' },
      { label: 'sin', latex: '\\sin(x)' },
      { label: 'cos', latex: '\\cos(x)' },
      { label: 'tan', latex: '\\tan(x)' },
      { label: 'limit', latex: '\\lim_{x \\to a}' },
      { label: '∫', latex: '\\int x \\, dx' },
      { label: 'Σ', latex: '\\sum_{i=1}^{n} i' }
    ],

    chemistry: [
      { label: 'H₂O', latex: 'H_{2}O' },
      { label: 'CO₂', latex: 'CO_{2}' },
      { label: 'H₂SO₄', latex: 'H_{2}SO_{4}' },
      { label: 'Reaction', latex: 'A + B \\rightarrow C' },
      { label: 'Equilibrium', latex: 'A \\rightleftharpoons B' },
      { label: 'ΔH', latex: '\\Delta H' },
      { label: 'State', latex: 'H_{2}O_{(l)}' },
      { label: 'Electron', latex: 'e^{-}' },
      { label: 'Na⁺', latex: 'Na^{+}' }
    ],

    physics: [
      { label: 'v=d/t', latex: 'v = \\frac{d}{t}' },
      { label: 'a=(v-u)/t', latex: 'a = \\frac{v-u}{t}' },
      { label: 'F=ma', latex: 'F = ma' },
      { label: 'E=mc²', latex: 'E = mc^{2}' },
      { label: 'V=IR', latex: 'V = IR' },
      { label: 'P=W/t', latex: 'P = \\frac{W}{t}' },
      { label: 'p=mv', latex: 'p = mv' },
      { label: 'ρ=m/V', latex: '\\rho = \\frac{m}{V}' },
      { label: 'W=Fd', latex: 'W = Fd' }
    ]
  }

  /* ================= INSERT FUNCTION ================= */

  function insertLatex(value) {
    const textarea = document.getElementById('questionBox')

    const start = textarea.selectionStart
    const end = textarea.selectionEnd

    const newText =
      question.substring(0, start) +
      value +
      question.substring(end)

    setQuestion(newText)

    setTimeout(() => {
      textarea.focus()

      const pos = value.includes('{')
        ? start + value.indexOf('{') + 1
        : start + value.length

      textarea.selectionStart = textarea.selectionEnd = pos
    }, 0)
  }

  /* ================= SAVE ================= */

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
      alert('✅ Question saved')

      setQuestion('')
      setOptionA('')
      setOptionB('')
      setOptionC('')
      setOptionD('')
      setAnswer('A')
    } else {
      alert('❌ Error saving')
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
          ← Back
        </button>
      </div>

      <div style={styles.container}>

        {/* INPUT */}
        <div style={styles.inputBox}>
          <h3>📝 Enter Question</h3>

          <Toolbar title="🧮 Math" items={TOOLBAR.math} onInsert={insertLatex} />
          <Toolbar title="⚗️ Chemistry" items={TOOLBAR.chemistry} onInsert={insertLatex} />
          <Toolbar title="⚛️ Physics" items={TOOLBAR.physics} onInsert={insertLatex} />

          <textarea
            id="questionBox"
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
            {question ? <BlockMath>{question}</BlockMath> : <p>Preview here</p>}

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

/* ================= TOOLBAR COMPONENT ================= */

function Toolbar({ title, items, onInsert }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <strong>{title}</strong>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 5 }}>
        {items.map((item, i) => (
          <button
            key={i}
            style={styles.toolbarBtn}
            onClick={() => onInsert(item.latex)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ================= STYLES ================= */

const styles = {
  page: { padding: 40, background: '#f8fafc', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: 20 },

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

  inputBox: { background: '#fff', padding: 20, borderRadius: 12 },
  previewBox: { background: '#fff', padding: 20, borderRadius: 12 },

  textarea: {
    width: '100%',
    height: 120,
    marginTop: 10,
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
  },

  toolbarBtn: {
    padding: '6px 10px',
    border: '1px solid #ccc',
    borderRadius: 6,
    background: '#f8fafc',
    cursor: 'pointer'
  }
}
