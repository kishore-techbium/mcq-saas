'use client'
import { useState } from 'react'
import 'katex/dist/katex.min.css'
import { BlockMath, InlineMath } from 'react-katex'

export default function AddQuestion() {
  const [question, setQuestion] = useState('')
  const [optionA, setOptionA] = useState('')
  const [optionB, setOptionB] = useState('')
  const [optionC, setOptionC] = useState('')
  const [optionD, setOptionD] = useState('')
  const [answer, setAnswer] = useState('A')

  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>➕ Add Question (LaTeX Supported)</h1>

      <div style={styles.container}>
        
        {/* LEFT SIDE INPUT */}
        <div style={styles.inputBox}>
          <h3>📝 Enter Question</h3>

          <textarea
            placeholder="Type LaTeX here: e.g. \frac{x^2}{y}"
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

          <button style={styles.saveBtn}>💾 Save Question</button>
        </div>

        {/* RIGHT SIDE PREVIEW */}
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

const styles = {
  page: {
    padding: 40,
    background: '#f8fafc',
    minHeight: '100vh'
  },
  heading: {
    fontSize: 28,
    marginBottom: 20
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
    padding: 10,
    marginTop: 10
  },
  saveBtn: {
    marginTop: 15,
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
