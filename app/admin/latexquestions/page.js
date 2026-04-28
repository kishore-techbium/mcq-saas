'use client'

import { useEffect, useState, useRef } from 'react'
import { getAdminCollege } from '../../../lib/getAdminCollege'
import 'katex/dist/katex.min.css'
import renderMathInElement from 'katex/contrib/auto-render'

export default function LatexQuestionsPage() {

  const [adminName, setAdminName] = useState('')
  const [loading, setLoading] = useState(true)

  const [inputText, setInputText] = useState('')
  const [outputText, setOutputText] = useState('')

  const [activeTab, setActiveTab] = useState('math')

  const previewRef = useRef(null)

  /* ================= AUTH ================= */

  useEffect(() => {
    async function init() {
      const data = await getAdminCollege()
      if (!data) window.location.href = '/'
      setAdminName(data.adminName)
      setLoading(false)
    }
    init()
  }, [])

  /* ================= AUTO WRAP ================= */

  function autoWrap(text){
    if(!text) return ''

    let t = text

    t = t.replace(/(\w+)\/(\w+)/g, '\\frac{$1}{$2}')
    t = t.replace(/(\w)\^(\w+)/g, '$1^{$2}')
    t = t.replace(/([A-Za-z])(\d+)/g, '$1_{$2}')
    t = t.replace(/ρ/g, '\\rho')

    // wrap only math patterns
    t = t.replace(/(\\[a-zA-Z]+|\w+\^{\w+}|\w+_\{\w+\}|\\frac\{.*?\}\{.*?\})/g, m => `$${m}$`)

    return t
  }

  /* ================= VALIDATION ================= */

  function validateLatex(text){
    if(!text) return true
    const count = (text.match(/\$/g) || []).length
    return count % 2 === 0
  }

  /* ================= LIVE UPDATE ================= */

  useEffect(() => {
    setOutputText(autoWrap(inputText))
  }, [inputText])

  /* ================= PREVIEW RENDER ================= */

  useEffect(() => {
    if(previewRef.current){
      previewRef.current.innerHTML = outputText
      renderMathInElement(previewRef.current, {
        delimiters: [
          { left: '$', right: '$', display: false },
          { left: '$$', right: '$$', display: true }
        ]
      })
    }
  }, [outputText])

  /* ================= COPY ================= */

  function copyToClipboard(){
    navigator.clipboard.writeText(outputText)
    alert('✅ Copied')
  }

  /* ================= INSERT AT CURSOR ================= */

  function insertText(value){
    const textarea = document.getElementById('inputBox')

    const start = textarea.selectionStart
    const end = textarea.selectionEnd

    const newText =
      inputText.substring(0, start) +
      value +
      inputText.substring(end)

    setInputText(newText)

    setTimeout(()=>{
      textarea.focus()
      textarea.selectionStart = textarea.selectionEnd = start + value.length
    },0)
  }

  /* ================= TOOLBAR ================= */

  const TOOLBAR = {
    math: [
      { label: 'x²', latex: 'x^2' },
      { label: '√', latex: '\\sqrt{x}' },
      { label: 'frac', latex: 'a/b' },
      { label: 'log', latex: '\\log(x)' },
      { label: 'sin', latex: '\\sin(x)' },
      { label: '∫', latex: '\\int x dx' },
      { label: 'Σ', latex: '\\sum_{i=1}^{n} i' }
    ],
    chemistry: [
      { label: 'H₂O', latex: 'H2O' },
      { label: 'CO₂', latex: 'CO2' },
      { label: 'Na⁺', latex: 'Na^+' },
      { label: 'Cl⁻', latex: 'Cl^-' },
      { label: '→', latex: '\\rightarrow' },
      { label: '⇌', latex: '\\rightleftharpoons' }
    ],
    physics: [
      { label: 'F=ma', latex: 'F=ma' },
      { label: 'v=d/t', latex: 'v=d/t' },
      { label: 'E=mc²', latex: 'E=mc^2' },
      { label: 'ρ=m/V', latex: 'ρ=m/V' }
    ]
  }

  if (loading) return <p>Loading...</p>

  const isValid = validateLatex(outputText)

  return (
    <div style={styles.page}>

      <h1>🧠 LaTeX Helper Tool</h1>
      <p>Welcome, {adminName}</p>

      <div style={{color:isValid?'green':'red'}}>
        {isValid ? '✅ Valid LaTeX' : '❌ Check formatting'}
      </div>

      {/* TABS */}
      <div style={{marginBottom:10}}>
        <button onClick={()=>setActiveTab('math')} style={styles.tab}>Math</button>
        <button onClick={()=>setActiveTab('chemistry')} style={styles.tab}>Chem</button>
        <button onClick={()=>setActiveTab('physics')} style={styles.tab}>Physics</button>
      </div>

      {/* TOOLBAR */}
      <div>
        {TOOLBAR[activeTab].map((t,i)=>(
          <button key={i} onClick={()=>insertText(t.latex)} style={styles.btn}>
            {t.label}
          </button>
        ))}
      </div>

      {/* INPUT */}
      <textarea
        id="inputBox"
        value={inputText}
        onChange={(e)=>setInputText(e.target.value)}
        style={styles.textarea}
      />

      {/* OUTPUT */}
      <h3>📋 Copy this to Excel</h3>
      <button onClick={copyToClipboard} style={styles.copyBtn}>Copy</button>

      <textarea value={outputText} readOnly style={styles.output}/>

      {/* PREVIEW */}
      <h3>👁️ Preview</h3>
      <div ref={previewRef} style={styles.preview}></div>

    </div>
  )
}

/* ================= STYLES ================= */

const styles = {
  page:{padding:30,maxWidth:900,margin:'auto'},
  textarea:{width:'100%',height:120,marginBottom:10},
  output:{width:'100%',height:120,background:'#f1f5f9'},
  preview:{background:'#fff',padding:20,border:'1px solid #ddd'},
  btn:{margin:5,padding:'6px 10px'},
  tab:{marginRight:10,padding:'6px 12px'},
  copyBtn:{marginBottom:10,padding:'6px 10px',background:'green',color:'#fff'}
}
