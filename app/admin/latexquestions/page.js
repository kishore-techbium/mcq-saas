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

  // fraction m/V → \frac{m}{V}
  t = t.replace(/(\w+)\/(\w+)/g, '\\frac{$1}{$2}')

  // power x^2 → x^{2}
  t = t.replace(/(\w)\^(\w+)/g, '$1^{$2}')

  // chemical H2O → H_{2}O
  t = t.replace(/([A-Za-z])(\d+)/g, '$1_{$2}')

  // rho
  t = t.replace(/ρ/g, '\\rho')

  // 🔥 wrap full expressions (NOT pieces)
  return `$${t}$`
}

  /* ================= LIVE UPDATE ================= */

  useEffect(() => {
    setOutputText(autoWrap(inputText))
  }, [inputText])

  /* ================= PREVIEW FIX ================= */

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

  /* ================= INSERT ================= */

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
    { label: 'xⁿ', latex: 'x^n' },
    { label: '√', latex: '\\sqrt{x}' },
    { label: '∛', latex: '\\sqrt[3]{x}' },
    { label: '½', latex: '\\frac{a}{b}' },
    { label: '∫', latex: '\\int x dx' },
    { label: '∫ₐᵇ', latex: '\\int_{a}^{b} f(x) dx' },
    { label: 'Σ', latex: '\\sum_{i=1}^{n} i' },
    { label: '∂', latex: '\\partial' },
    { label: 'd/dx', latex: '\\frac{d}{dx}' },
    { label: 'lim', latex: '\\lim_{x \\to a}' },
    { label: '∞', latex: '\\infty' },
    { label: 'π', latex: '\\pi' },
    { label: 'θ', latex: '\\theta' },
    { label: '≈', latex: '\\approx' },
    { label: '≠', latex: '\\neq' },
    { label: '≤', latex: '\\leq' },
    { label: '≥', latex: '\\geq' }
  ],

  chemistry: [
    { label: 'H₂O', latex: 'H2O' },
    { label: 'CO₂', latex: 'CO2' },
    { label: 'NH₃', latex: 'NH3' },
    { label: 'H₂SO₄', latex: 'H2SO4' },
    { label: 'Na⁺', latex: 'Na^+' },
    { label: 'Cl⁻', latex: 'Cl^-' },
    { label: 'e⁻', latex: 'e^-' },
    { label: '→', latex: '\\rightarrow' },
    { label: '⇌', latex: '\\rightleftharpoons' },
    { label: '↑', latex: '\\uparrow' },
    { label: '↓', latex: '\\downarrow' },
    { label: 'Δ', latex: '\\Delta' },
    { label: '°C', latex: '^{\\circ}C' },
    { label: 'mol', latex: '\\text{mol}' },
    { label: '(aq)', latex: '(aq)' },
    { label: '(l)', latex: '(l)' },
    { label: '(g)', latex: '(g)' }
  ],

  physics: [
    { label: 'v', latex: 'v = \\frac{d}{t}' },
    { label: 'a', latex: 'a = \\frac{v-u}{t}' },
    { label: 'F', latex: 'F = ma' },
    { label: 'E', latex: 'E = mc^2' },
    { label: 'V', latex: 'V = IR' },
    { label: 'P', latex: 'P = \\frac{W}{t}' },
    { label: 'p', latex: 'p = mv' },
    { label: 'ρ', latex: '\\rho = \\frac{m}{V}' },
    { label: 'W', latex: 'W = Fd' },
    { label: 'KE', latex: 'KE = \\frac{1}{2}mv^2' },
    { label: 'PE', latex: 'PE = mgh' },
    { label: 'λ', latex: '\\lambda' },
    { label: 'f', latex: 'f = \\frac{1}{T}' },
    { label: 'c', latex: 'c = 3 \\times 10^8' }
  ]
}

  if (loading) return <p>Loading...</p>

  return (
    <div style={styles.page}>

      <h1>LaTeX Helper</h1>
      <p>Welcome, {adminName}</p>

      <div style={styles.container}>

        {/* LEFT SIDE */}
        <div style={styles.left}>

          {/* TABS */}
        <div style={styles.tabs}>
          {['math','chemistry','physics'].map(tab=>(
            <button
              key={tab}
              onClick={()=>setActiveTab(tab)}
              style={{
                ...styles.tab,
                background: activeTab===tab ? '#2563eb' : '#e5e7eb',
                color: activeTab===tab ? '#fff' : '#000'
              }}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>         

          {/* TOOLBAR */}
         <div style={styles.toolbarContainer}>
  {TOOLBAR[activeTab].map((t,i)=>(
    <button
      key={i}
      onClick={()=>insertText(t.latex)}
      style={styles.toolBtn}
      title={t.latex}
    >
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
          <h4>Copy to Excel</h4>
          <button onClick={copyToClipboard} style={styles.copyBtn}>Copy</button>

          <textarea value={outputText} readOnly style={styles.output}/>

        </div>

        {/* RIGHT SIDE */}
        <div style={styles.right}>
          <h3>Preview</h3>
          <div ref={previewRef} style={styles.preview}></div>
        </div>

      </div>

    </div>
  )
}

/* ================= STYLES ================= */

const styles = {
  page:{padding:30},
  container:{display:'flex',gap:20},
  left:{flex:1},
  right:{flex:1},
  textarea:{width:'100%',height:120,marginTop:10},
  output:{width:'100%',height:120,marginTop:10},
  preview:{background:'#fff',padding:20,border:'1px solid #ddd'},
  btn:{margin:5},
  copyBtn:{background:'green',color:'#fff',padding:6,marginTop:5},
  toolbarContainer:{
  display:'flex',
  flexWrap:'wrap',
  gap:6,
  marginBottom:10
},

toolBtn:{
  padding:'6px 10px',
  fontSize:14,
  border:'1px solid #ddd',
  borderRadius:6,
  background:'#ffffff',
  cursor:'pointer',
  minWidth:40,
  textAlign:'center'
}
}
