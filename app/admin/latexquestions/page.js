'use client'

import { useEffect, useState, useRef } from 'react'
import { getAdminCollege } from '../../../lib/getAdminCollege'
import * as XLSX from 'xlsx'
import 'katex/dist/katex.min.css'
import renderMathInElement from 'katex/contrib/auto-render'

export default function LatexQuestionsPage() {

  const [adminName, setAdminName] = useState('')
  const [loading, setLoading] = useState(true)
const [previewRows, setPreviewRows] = useState([])
const [processedData, setProcessedData] = useState([])
  const [inputText, setInputText] = useState('')
  const [outputText, setOutputText] = useState('')
  const [excelFile, setExcelFile] = useState(null)
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

  const hasMath = /[\^\/_=]/.test(t)

  t = t.replace(/(\w+)\/(\w+)/g, '\\frac{$1}{$2}')
  t = t.replace(/(\w)\^(\w+)/g, '$1^{$2}')
  t = t.replace(/([A-Za-z])(\d+)/g, '$1_{$2}')
  t = t.replace(/ρ/g, '\\rho')

  return hasMath ? `$${t}$` : t
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
    /* ================= EXCEL PROCESSING ================= */
function processExcel(){

  if(!excelFile){
    alert('Please upload file')
    return
  }

  const reader = new FileReader()

  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result)

    const workbook = XLSX.read(data, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]

    const json = XLSX.utils.sheet_to_json(sheet)

    const updated = json.map((row, index) => {

      const converted = {
        ...row,
        question: autoWrap(row.question || ''),
        option_a: autoWrap(row.option_a || ''),
        option_b: autoWrap(row.option_b || ''),
        option_c: autoWrap(row.option_c || ''),
        option_d: autoWrap(row.option_d || ''),
        explanation: autoWrap(row.explanation || '')
      }

      return {
        original: row,
        converted,
        index
      }
    })

    setPreviewRows(updated.slice(0, 20))   // show first 20
    setProcessedData(updated.map(r => r.converted))
  }

  reader.readAsArrayBuffer(excelFile)
}

function downloadExcel(){

  const sheet = XLSX.utils.json_to_sheet(processedData)
  const workbook = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(workbook, sheet, 'Converted')

  XLSX.writeFile(workbook, 'latex_converted.xlsx')
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

    { label: 'd/dx', latex: '\\frac{d}{dx}' },
    { label: '∂', latex: '\\partial' },

    { label: 'lim', latex: '\\lim_{x \\to a}' },

    { label: '∞', latex: '\\infty' },
    { label: 'π', latex: '\\pi' },
    { label: 'θ', latex: '\\theta' },

    { label: '≈', latex: '\\approx' },
    { label: '≠', latex: '\\neq' },
    { label: '≤', latex: '\\leq' },
    { label: '≥', latex: '\\geq' },

    { label: '→', latex: '\\rightarrow' },
    { label: '←', latex: '\\leftarrow' },
    { label: '↔', latex: '\\leftrightarrow' },

    { label: '|x|', latex: '|x|' },
    { label: '( )', latex: '(x)' }
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

    { label: '(aq)', latex: '(aq)' },
    { label: '(l)', latex: '(l)' },
    { label: '(g)', latex: '(g)' },
    { label: '(s)', latex: '(s)' },

    { label: 'mol', latex: '\\text{mol}' }
  ],

  physics: [
    { label: 'v=d/t', latex: 'v=d/t' },
    { label: 'a=(v-u)/t', latex: 'a=(v-u)/t' },
    { label: 'F=ma', latex: 'F=ma' },
    { label: 'E=mc²', latex: 'E=mc^2' },

    { label: 'V=IR', latex: 'V=IR' },
    { label: 'P=W/t', latex: 'P=W/t' },
    { label: 'p=mv', latex: 'p=mv' },

    { label: 'ρ=m/V', latex: '\\rho=m/V' },
    { label: 'W=Fd', latex: 'W=Fd' },

    { label: 'KE=½mv²', latex: 'KE=\\frac{1}{2}mv^2' },
    { label: 'PE=mgh', latex: 'PE=mgh' },

    { label: 'g=9.8', latex: 'g=9.8\\,m/s^2' },
    { label: 'λ', latex: '\\lambda' },

    { label: 'f=1/T', latex: 'f=1/T' },
    { label: 'c=3×10⁸', latex: 'c=3\\times10^8' }
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
<button onClick={processExcel} style={{marginTop:10}}>
  🚀 Convert Excel
</button>
          <div style={{marginBottom:15}}>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e)=>setExcelFile(e.target.files[0])}
            />
            {previewRows.length > 0 && (
            <div style={{marginTop:20}}>

              <h3>🔍 Preview (Before → After)</h3>

              <div style={{maxHeight:400, overflow:'auto', border:'1px solid #ddd'}}>

                {previewRows.map((row, i)=>(
                  <div key={i} style={{padding:10, borderBottom:'1px solid #eee'}}>
                      <b>Row {row.index + 1}</b>

                      {/* ORIGINAL */}
                      <div style={{marginTop:5}}>
                        <b>Original:</b>
                        <div>{row.original.question}</div>
                      </div>

                      {/* CONVERTED QUESTION */}
                      <div style={{marginTop:5}}>
                        <b>Converted:</b>
                        <div
                          ref={(el) => {
                            if(el){
                              el.innerHTML = row.converted.question
                              renderMathInElement(el, {
                                delimiters: [
                                  { left: '$', right: '$', display: false },
                                  { left: '$$', right: '$$', display: true }
                                ]
                              })
                            }
                          }}
                          style={{color:'green'}}
                        />
                      </div>

                      {/* OPTIONS */}
                      <div style={{marginTop:8}}>
                        <b>Options:</b>

                        {['option_a','option_b','option_c','option_d'].map((op, idx)=>(
                          <div key={op} style={{marginLeft:10}}>
                            <b>{String.fromCharCode(65+idx)}:</b>

                            <span
                              ref={(el) => {
                                if(el){
                                  el.innerHTML = row.converted[op] || ''
                                  renderMathInElement(el, {
                                    delimiters: [
                                      { left: '$', right: '$', display: false },
                                      { left: '$$', right: '$$', display: true }
                                    ]
                                  })
                                }
                              }}
                            />
                          </div>
                        ))}
                      </div>

                      {/* EXPLANATION */}
                      <div style={{marginTop:8}}>
                        <b>Explanation:</b>

                        <div
                          ref={(el) => {
                            if(el){
                              el.innerHTML = row.converted.explanation || ''
                              renderMathInElement(el, {
                                delimiters: [
                                  { left: '$', right: '$', display: false },
                                  { left: '$$', right: '$$', display: true }
                                ]
                              })
                            }
                          }}
                        />
                      </div>
                    
                  </div>
                ))}

              </div>

            </div>
          )}
  {processedData.length > 0 && (
  <button onClick={downloadExcel} style={{marginTop:15}}>
    📥 Download Converted Excel
  </button>
)}
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
  fontSize:13,
  border:'1px solid #ddd',
  borderRadius:6,
  background:'#fff',
  cursor:'pointer',
  minWidth:55,
  textAlign:'center'
}
}
