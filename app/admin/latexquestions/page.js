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
    'x^2','x^n','\\sqrt{x}','\\frac{a}{b}','\\log(x)','\\ln(x)',
    '\\sin(x)','\\cos(x)','\\tan(x)','\\cot(x)','\\sec(x)','\\csc(x)',
    '\\int x dx','\\int_{a}^{b} f(x) dx',
    '\\sum_{i=1}^{n} i','\\lim_{x \\to a}',
    '\\pi','\\theta','\\infty','\\approx','\\neq','\\leq','\\geq'
  ],

  chemistry: [
    'H2O','CO2','NH3','H2SO4',
    'Na^+','Cl^-','e^-',
    '\\rightarrow','\\rightleftharpoons',
    '\\uparrow','\\downarrow',
    '\\Delta','^{\\circ}C',
    '(aq)','(l)','(g)','(s)',
    '\\text{mol}'
  ],

  physics: [
    'v=d/t','a=(v-u)/t','F=ma','E=mc^2','V=IR',
    'P=W/t','p=mv','\\rho=m/V','W=Fd',
    'KE=\\frac{1}{2}mv^2','PE=mgh',
    'g=9.8 m/s^2','\\lambda','f=1/T','c=3\\times10^8'
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
      onClick={()=>insertText(t)}
      style={styles.toolBtn}
    >
      {t}
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
  padding:'5px 8px',
  fontSize:12,
  border:'1px solid #ddd',
  borderRadius:5,
  background:'#f8fafc',
  cursor:'pointer'
}
}
