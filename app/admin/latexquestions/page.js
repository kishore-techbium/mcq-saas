'use client'

import { useEffect, useState } from 'react'
import { getAdminCollege } from '../../../lib/getAdminCollege'
import 'katex/dist/katex.min.css'
import renderMathInElement from 'katex/contrib/auto-render'

export default function LatexQuestionsPage() {

  const [adminName, setAdminName] = useState('')
  const [loading, setLoading] = useState(true)

  const [inputText, setInputText] = useState('')
  const [outputText, setOutputText] = useState('')

  const [activeTab, setActiveTab] = useState('math')

  /* ================= AUTH ================= */

  useEffect(() => {
    async function init() {
      const data = await getAdminCollege()

      if (!data) {
        window.location.href = '/'
        return
      }

      setAdminName(data.adminName)
      setLoading(false)
    }

    init()
  }, [])

  /* ================= AUTO WRAP ================= */

  function autoWrap(text){

    if(!text) return ''

    let t = text

    // fractions
    t = t.replace(/(\w+)\/(\w+)/g, '\\frac{$1}{$2}')

    // powers
    t = t.replace(/(\w)\^(\w+)/g, '$1^{$2}')

    // subscripts (H2 -> H_{2})
    t = t.replace(/([A-Za-z])(\d+)/g, '$1_{$2}')

    // rho
    t = t.replace(/ρ/g, '\\rho')

    // wrap math parts
    t = t.replace(/(\\[a-zA-Z]+|\w+\^{\w+}|\w+_\{\w+\}|\\frac\{.*?\}\{.*?\}|=)/g, (m) => `$${m}$`)

    return t
  }

  /* ================= LIVE UPDATE ================= */

  useEffect(() => {
    const wrapped = autoWrap(inputText)
    setOutputText(wrapped)
  }, [inputText])

  /* ================= RENDER ================= */

  useEffect(() => {
    renderMathInElement(document.body, {
      delimiters: [
        { left: '$', right: '$', display: false },
        { left: '$$', right: '$$', display: true }
      ]
    })
  }, [outputText])

  /* ================= TOOLBAR ================= */

  const TOOLBAR = {
    math: [
      { label: 'x²', latex: 'x^2' },
      { label: '√', latex: '\\sqrt{x}' },
      { label: 'frac', latex: 'a/b' },
      { label: 'log', latex: '\\log(x)' },
      { label: 'sin', latex: '\\sin(x)' },
      { label: 'cos', latex: '\\cos(x)' },
      { label: 'tan', latex: '\\tan(x)' },
      { label: '∫', latex: '\\int x dx' },
      { label: 'Σ', latex: '\\sum_{i=1}^{n} i' },
      { label: 'π', latex: '\\pi' },
      { label: 'θ', latex: '\\theta' }
    ],

    chemistry: [
      { label: 'H₂O', latex: 'H2O' },
      { label: 'CO₂', latex: 'CO2' },
      { label: 'NH₃', latex: 'NH3' },
      { label: 'Na⁺', latex: 'Na^+' },
      { label: 'Cl⁻', latex: 'Cl^-' },
      { label: 'e⁻', latex: 'e^-' },
      { label: '→', latex: '\\rightarrow' },
      { label: '⇌', latex: '\\rightleftharpoons' },
      { label: '(aq)', latex: '(aq)' },
      { label: '(l)', latex: '(l)' },
      { label: '(g)', latex: '(g)' },
      { label: 'Δ', latex: '\\Delta' }
    ],

    physics: [
      { label: 'v=d/t', latex: 'v=d/t' },
      { label: 'a=(v-u)/t', latex: 'a=(v-u)/t' },
      { label: 'F=ma', latex: 'F=ma' },
      { label: 'E=mc²', latex: 'E=mc^2' },
      { label: 'V=IR', latex: 'V=IR' },
      { label: 'P=W/t', latex: 'P=W/t' },
      { label: 'p=mv', latex: 'p=mv' },
      { label: 'ρ=m/V', latex: 'ρ=m/V' },
      { label: 'KE', latex: 'KE=1/2 mv^2' },
      { label: 'PE', latex: 'PE=mgh' },
      { label: 'λ', latex: '\\lambda' }
    ]
  }

  function insertText(value){
    setInputText(prev => prev + ' ' + value)
  }

  if (loading) return <p>Loading...</p>

  return (
    <div style={styles.page}>

      <h1>🧠 LaTeX Helper Tool</h1>
      <p>Welcome, {adminName}</p>

      {/* TABS */}
      <div style={{marginBottom:10}}>
        <button onClick={()=>setActiveTab('math')} style={styles.tab}>Math</button>
        <button onClick={()=>setActiveTab('chemistry')} style={styles.tab}>Chem</button>
        <button onClick={()=>setActiveTab('physics')} style={styles.tab}>Physics</button>
      </div>

      {/* TOOLBAR */}
      <div style={{marginBottom:15}}>
        {TOOLBAR[activeTab].map((t,i)=>(
          <button key={i} onClick={()=>insertText(t.latex)} style={styles.btn}>
            {t.label}
          </button>
        ))}
      </div>

      {/* INPUT */}
      <textarea
        value={inputText}
        onChange={(e)=>setInputText(e.target.value)}
        placeholder="Type normally: x^2, H2O, m/V..."
        style={styles.textarea}
      />

      {/* OUTPUT (copy to excel) */}
      <h3>📋 Auto Wrapped (copy this to Excel)</h3>
      <div style={styles.outputBox}>
        {outputText}
      </div>

      {/* PREVIEW */}
      <h3>👁️ Preview</h3>
      <div style={styles.preview}>
        {outputText}
      </div>

    </div>
  )
}

/* ================= STYLES ================= */

const styles = {
  page:{padding:30,maxWidth:900,margin:'auto'},
  textarea:{width:'100%',height:120,padding:10,marginBottom:10},
  outputBox:{background:'#f1f5f9',padding:10,marginBottom:20},
  preview:{background:'#fff',padding:20,border:'1px solid #ddd'},
  btn:{margin:5,padding:'6px 10px'},
  tab:{marginRight:10,padding:'6px 12px'}
}
