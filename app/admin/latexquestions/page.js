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
      { label: 'frac', latex: 'a/b' },
      { label: 'log', latex: '\\log(x)' },
      { label: 'ln', latex: '\\ln(x)' },
      { label: 'sin', latex: '\\sin(x)' },
      { label: 'cos', latex: '\\cos(x)' },
      { label: 'tan', latex: '\\tan(x)' },
      { label: '∫', latex: '\\int x dx' },
      { label: 'Σ', latex: '\\sum_{i=1}^{n} i' },
      { label: 'lim', latex: '\\lim_{x \\to a}' },
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

  if (loading) return <p>Loading...</p>

  return (
    <div style={styles.page}>

      <h1>LaTeX Helper</h1>
      <p>Welcome, {adminName}</p>

      <div style={styles.container}>

        {/* LEFT SIDE */}
        <div style={styles.left}>

          {/* TABS */}
          <div style={{marginBottom:10}}>
            <button onClick={()=>setActiveTab('math')}>Math</button>
            <button onClick={()=>setActiveTab('chemistry')}>Chem</button>
            <button onClick={()=>setActiveTab('physics')}>Physics</button>
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
  copyBtn:{background:'green',color:'#fff',padding:6,marginTop:5}
}
