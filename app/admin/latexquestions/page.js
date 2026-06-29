'use client'

import { useEffect, useState, useRef } from 'react'
import { getAdminCollege } from '../../../lib/getAdminCollege'
import * as XLSX from 'xlsx'
import 'katex/dist/katex.min.css'
import Tesseract from "tesseract.js"
import renderMathInElement from 'katex/contrib/auto-render'

export default function LatexQuestionsPage() {

const [adminName,setAdminName]=useState('')
const [loading,setLoading]=useState(true)

const [inputText,setInputText]=useState('')
const [outputText,setOutputText]=useState('')

const [excelFile,setExcelFile]=useState(null)
const [imageFile,setImageFile]=useState(null)
const [ocrLoading,setOcrLoading]=useState(false)
const [ocrProgress,setOcrProgress]=useState(0)
const [dragActive,setDragActive]=useState(false)
const [pastedImage,setPastedImage]=useState(null)
const [previewRows,setPreviewRows]=useState([])
const [processedData,setProcessedData]=useState([])

const [activeTab,setActiveTab]=useState('math')

const previewRef=useRef(null)

/* ================= AUTH ================= */

useEffect(()=>{

async function init(){

const data=await getAdminCollege()

if(!data){
window.location.href='/'
return
}

setAdminName(data.adminName)
setLoading(false)

}

init()

},[])

useEffect(() => {

  function handlePaste(e){

    const items = e.clipboardData?.items

    if(!items) return

    for(const item of items){

      if(item.type.startsWith("image/")){

        const file = item.getAsFile()

setImageFile(file)
setPastedImage(URL.createObjectURL(file))

setTimeout(()=>{
  processImageOCR(file)
},100)
        e.preventDefault()

        break
      }

    }

  }

  window.addEventListener("paste", handlePaste)

  return ()=>window.removeEventListener("paste", handlePaste)

},[])

useEffect(()=>{

  return ()=>{

    if(pastedImage){

      URL.revokeObjectURL(pastedImage)

    }

  }

},[pastedImage])
  
/* ================= SMART LATEX ================= */

function autoWrap(text){

  if(text === null || text === undefined) return ''

  let t = String(text)

  /* Preserve line breaks */
  t = t.replace(/\r\n/g, '\n')

  /* Replace Greek letters */
  t = t
    .replace(/ρ/g,'\\rho')
    .replace(/λ/g,'\\lambda')
    .replace(/θ/g,'\\theta')
    .replace(/π/g,'\\pi')
    .replace(/Δ/g,'\\Delta')
    .replace(/ε/g,'\\epsilon')

  /* Chemical formulas */
  t = t.replace(/([A-Z][a-z]?)(\d+)/g,'$1_{$2}')

  /* Powers */
  t = t.replace(/([A-Za-z0-9])\^([A-Za-z0-9+\-]+)/g,'$1^{$2}')

  /* Fractions */
  t = t.replace(
    /\b([A-Za-z0-9]+)\s*\/\s*([A-Za-z0-9]+)\b/g,
    '\\frac{$1}{$2}'
  )

  /* Square root */
  t = t.replace(/√([A-Za-z0-9]+)/g,'\\sqrt{$1}')

  /* Detect complete equations */
  t = t.replace(

    /([A-Za-z\\][A-Za-z0-9_{}\\^]*\s*=\s*[^.,;\n]+)/g,

    (eq)=>{

      if(eq.includes('$')) return eq

      return `$$${eq.trim()}$$`

    }

  )

  return t

}

/* ================= LIVE ================= */

useEffect(()=>{

setOutputText(autoWrap(inputText))

},[inputText])



/* ================= PREVIEW ================= */

function renderPreview(element,text){

  if(!element) return

element.innerHTML = text
  renderMathInElement(element,{
    throwOnError:false,
    delimiters:[
      {left:'$$',right:'$$',display:true},
      {left:'$',right:'$',display:false}
    ]
  })

}


useEffect(()=>{

renderPreview(previewRef.current,outputText)

},[outputText])


/* ================= COPY ================= */

function copyToClipboard(){

navigator.clipboard.writeText(outputText)

alert('Copied')

}


/* ================= EXCEL ================= */

function processExcel(){

if(!excelFile){

alert('Upload Excel')

return

}

const reader=new FileReader()

reader.onload=(e)=>{

const data=new Uint8Array(e.target.result)

const workbook=XLSX.read(data,{type:'array'})

const sheet=workbook.Sheets[workbook.SheetNames[0]]

const json=XLSX.utils.sheet_to_json(sheet)

const updated=json.map((row,index)=>{

const converted={

...row,

question:autoWrap(row.question || ''),

option_a:autoWrap(row.option_a || ''),
option_b:autoWrap(row.option_b || ''),
option_c:autoWrap(row.option_c || ''),
option_d:autoWrap(row.option_d || ''),
explanation:autoWrap(row.explanation || '')

}

return{

index,

original:row,

converted

}

})

setPreviewRows(updated)

setProcessedData(updated.map(r=>r.converted))

}

reader.readAsArrayBuffer(excelFile)

}

async function processImageOCR(fileToRead){

  const file = fileToRead || imageFile

  if(!file){
    alert("Please select an image")
    return
  }
  setOcrLoading(true)
  setOcrProgress(0)
  try{

    const { data } = await Tesseract.recognize(
      imageFile,
      "eng",
      {
        logger:m=>{

          if(m.status==="recognizing text"){
        
            setOcrProgress(Math.round(m.progress * 100))
        
          }
        
        }
      }
    )

    setInputText(data.text)

  }
  catch(err){

    console.error(err)

    alert("OCR failed")

  }
  setOcrProgress(100)
  setOcrLoading(false)

}
function handleDrag(e){
  e.preventDefault()
  e.stopPropagation()
}

function handleDragEnter(e){
  e.preventDefault()
  e.stopPropagation()
  setDragActive(true)
}

function handleDragLeave(e){
  e.preventDefault()
  e.stopPropagation()
  setDragActive(false)
}

function handleDrop(e){

  e.preventDefault()
  e.stopPropagation()

  setDragActive(false)

  if(e.dataTransfer.files && e.dataTransfer.files[0]){

    const file=e.dataTransfer.files[0]

    if(file.type.startsWith('image/')){

      setImageFile(file)

    }else{

      alert("Please drop an image.")

    }

  }

}

  
function downloadExcel(){

const sheet=XLSX.utils.json_to_sheet(processedData)

const wb=XLSX.utils.book_new()

XLSX.utils.book_append_sheet(wb,sheet,'Converted')

XLSX.writeFile(wb,'latex_converted.xlsx')

}



/* ================= INSERT ================= */

function insertText(value){

const textarea=document.getElementById('inputBox')

const start=textarea.selectionStart

const end=textarea.selectionEnd

const newText=

inputText.substring(0,start)+

value+

inputText.substring(end)

setInputText(newText)

setTimeout(()=>{

textarea.focus()

textarea.selectionStart=textarea.selectionEnd=start+value.length

},0)

}
/* ================= TOOLBAR ================= */

const TOOLBAR = {

  math:[
    {label:'x²',latex:'x^2'},
    {label:'xⁿ',latex:'x^n'},
    {label:'√',latex:'\\sqrt{x}'},
    {label:'∛',latex:'\\sqrt[3]{x}'},
    {label:'½',latex:'\\frac{a}{b}'},

    {label:'∫',latex:'\\int x\\,dx'},
    {label:'∫ₐᵇ',latex:'\\int_{a}^{b}f(x)\\,dx'},
    {label:'Σ',latex:'\\sum_{i=1}^{n}i'},

    {label:'d/dx',latex:'\\frac{d}{dx}'},
    {label:'∂',latex:'\\partial'},

    {label:'lim',latex:'\\lim_{x\\to a}'},

    {label:'∞',latex:'\\infty'},
    {label:'π',latex:'\\pi'},
    {label:'θ',latex:'\\theta'},
    {label:'λ',latex:'\\lambda'},

    {label:'≈',latex:'\\approx'},
    {label:'≠',latex:'\\neq'},
    {label:'≤',latex:'\\leq'},
    {label:'≥',latex:'\\geq'},

    {label:'→',latex:'\\rightarrow'},
    {label:'←',latex:'\\leftarrow'},
    {label:'↔',latex:'\\leftrightarrow'},

    {label:'|x|',latex:'|x|'},
    {label:'( )',latex:'(x)'}
  ],

  chemistry:[

    {label:'H₂O',latex:'H2O'},
    {label:'CO₂',latex:'CO2'},
    {label:'NH₃',latex:'NH3'},
    {label:'H₂SO₄',latex:'H2SO4'},

    {label:'Na⁺',latex:'Na^+'},
    {label:'Cl⁻',latex:'Cl^-'},
    {label:'e⁻',latex:'e^-'},

    {label:'→',latex:'\\rightarrow'},
    {label:'⇌',latex:'\\rightleftharpoons'},

    {label:'↑',latex:'\\uparrow'},
    {label:'↓',latex:'\\downarrow'},

    {label:'Δ',latex:'\\Delta'},
    {label:'°C',latex:'^{\\circ}C'},

    {label:'(aq)',latex:'(aq)'},
    {label:'(l)',latex:'(l)'},
    {label:'(g)',latex:'(g)'},
    {label:'(s)',latex:'(s)'},

    {label:'mol',latex:'\\text{mol}'}

  ],

  physics:[

    {label:'v=d/t',latex:'v=d/t'},
    {label:'a=(v-u)/t',latex:'a=(v-u)/t'},
    {label:'F=ma',latex:'F=ma'},
    {label:'E=mc²',latex:'E=mc^2'},

    {label:'V=IR',latex:'V=IR'},
    {label:'P=W/t',latex:'P=W/t'},
    {label:'p=mv',latex:'p=mv'},
    {label:'ρ=m/V',latex:'\\rho=m/V'},
    {label:'W=Fd',latex:'W=Fd'},

    {label:'KE=½mv²',latex:'KE=\\frac{1}{2}mv^2'},
    {label:'PE=mgh',latex:'PE=mgh'},

    {label:'g=9.8',latex:'g=9.8\\,m/s^2'},

    {label:'λ',latex:'\\lambda'},

    {label:'f=1/T',latex:'f=1/T'},

    {label:'c=3×10⁸',latex:'c=3\\times10^8'}

  ]

}

if(loading) return <p>Loading...</p>

return(

<div style={styles.page}>

<h1>LaTeX Helper</h1>

<p>Welcome, {adminName}</p>

<div style={styles.container}>

<div style={styles.left}>

<div style={styles.tabs}>

{['math','chemistry','physics'].map(tab=>(

<button

key={tab}

onClick={()=>setActiveTab(tab)}

style={{

...styles.tab,

background:activeTab===tab ? '#2563eb' : '#e5e7eb',

color:activeTab===tab ? '#fff' : '#000'

}}

>

{tab.toUpperCase()}

</button>

))}

</div>

<div style={styles.toolbarContainer}>

{TOOLBAR[activeTab].map((btn,index)=>(

<button

key={index}

style={styles.toolBtn}

title={btn.latex}

onClick={()=>insertText(btn.latex)}

>

{btn.label}

</button>

))}

</div>
<button
style={styles.btn}
onClick={processExcel}
>

🚀 Convert Excel

</button>

<div style={{marginTop:15}}>

<input
type="file"
accept=".xlsx,.xls,.csv"
onChange={(e)=>setExcelFile(e.target.files[0])}
/>

</div>

{/* ================= OCR ================= */}

<div style={{marginTop:30}}>

<h3>📷 OCR Upload</h3>

<div

tabIndex={0}

onClick={(e)=>e.currentTarget.focus()}

style={{

border:'2px dashed #2563eb',

borderRadius:10,

padding:35,

textAlign:'center',

background:'#f8fbff',

outline:'none',

cursor:'pointer'

}}

>

<h3>📋 Press Ctrl + V</h3>

<p>

Copy a screenshot using

<b> Win + Shift + S </b>

then click here and press

<b> Ctrl + V </b>

</p>

<input

type="file"

accept="image/*"

onChange={(e)=>{

if(e.target.files[0]){

setImageFile(e.target.files[0])
setPastedImage(URL.createObjectURL(e.target.files[0]))

}

}}

style={{marginTop:15}}

 />

</div>

{pastedImage && (

<div style={{marginTop:20}}>

<img

src={pastedImage}

style={{

maxWidth:'100%',

maxHeight:250,

border:'1px solid #ddd',

borderRadius:8

}}

/>

</div>

)}

<button

style={{

...styles.btn,

marginTop:20

}}

disabled={ocrLoading}

onClick={processImageOCR}

>

{ocrLoading

? "Reading Image..."

: "Extract Text"}

</button>
{ocrLoading && (

<div style={{marginTop:10}}>

Reading Image... {ocrProgress}%

</div>

)}
</div>
          {/* ================= INPUT ================= */}

          <h3>Input</h3>

          <textarea
            id="inputBox"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            spellCheck={false}
            placeholder="Type or paste your question here..."
            style={styles.textarea}
          />

          {/* ================= OUTPUT ================= */}

          <div
            style={{
              display:'flex',
              justifyContent:'space-between',
              alignItems:'center',
              marginTop:20
            }}
          >
            <h3 style={{margin:0}}>Copy to Excel</h3>

            <button
              onClick={copyToClipboard}
              style={styles.copyBtn}
            >
              📋 Copy
            </button>
          </div>

          <textarea
            value={outputText}
            readOnly
            spellCheck={false}
            style={styles.output}
          />

        </div>

        {/* ================= RIGHT SIDE ================= */}

        <div style={styles.right}>

          <h3>Live Preview</h3>

          <div
            ref={previewRef}
            style={styles.preview}
          />

        </div>

      </div>

    </div>

  )

}

/* ================= STYLES ================= */
const styles = {

  page:{
    padding:30,
    background:'#f8fafc',
    minHeight:'100vh',
    fontFamily:'Arial, Helvetica, sans-serif'
  },

  container:{
    display:'flex',
    gap:25,
    alignItems:'flex-start'
  },

  left:{
    flex:1
  },

  right:{
    flex:1,
    position:'sticky',
    top:20
  },

  tabs:{
    display:'flex',
    gap:8,
    marginBottom:15
  },

  tab:{
    padding:'8px 16px',
    border:'none',
    borderRadius:6,
    cursor:'pointer',
    fontWeight:'bold'
  },

  toolbarContainer:{
    display:'flex',
    flexWrap:'wrap',
    gap:8,
    marginBottom:15,
    padding:10,
    border:'1px solid #ddd',
    borderRadius:8,
    background:'#fff'
  },

  toolBtn:{
    padding:'7px 12px',
    border:'1px solid #d1d5db',
    borderRadius:6,
    background:'#fff',
    cursor:'pointer',
    fontSize:13,
    minWidth:55
  },

  textarea:{
    width:'100%',
    minHeight:180,
    padding:12,
    marginTop:10,
    fontSize:15,
    fontFamily:'Consolas, monospace',
    border:'1px solid #ccc',
    borderRadius:8,
    resize:'vertical',
    whiteSpace:'pre-wrap',
    lineHeight:1.8,
    boxSizing:'border-box'
  },

  output:{
    width:'100%',
    minHeight:180,
    padding:12,
    marginTop:10,
    fontSize:15,
    fontFamily:'Consolas, monospace',
    border:'1px solid #ccc',
    borderRadius:8,
    resize:'vertical',
    whiteSpace:'pre-wrap',
    lineHeight:1.8,
    boxSizing:'border-box',
    background:'#f9fafb'
  },

  preview:{
    background:'#fff',
    border:'1px solid #ddd',
    borderRadius:8,
    padding:20,
    minHeight:300,
    whiteSpace:'pre-wrap',
    lineHeight:1.9,
    fontSize:16,
    overflowWrap:'break-word',
    wordBreak:'break-word'
  },

  previewCard:{
    background:'#fff',
    border:'1px solid #e5e7eb',
    borderRadius:8,
    padding:15,
    marginBottom:15
  },

  previewTitle:{
    fontWeight:'bold',
    marginBottom:10
  },

  originalText:{
    marginTop:6,
    marginBottom:10,
    whiteSpace:'pre-wrap',
    lineHeight:1.8
  },

  convertedText:{
    marginTop:6,
    color:'#15803d',
    whiteSpace:'pre-wrap',
    lineHeight:1.8
  },

  optionRow:{
    marginLeft:15,
    marginTop:6,
    whiteSpace:'pre-wrap',
    lineHeight:1.8
  },

  explanation:{
    marginTop:10,
    whiteSpace:'pre-wrap',
    lineHeight:1.8
  },

  btn:{
    padding:'8px 16px',
    border:'none',
    borderRadius:6,
    cursor:'pointer',
    background:'#2563eb',
    color:'#fff',
    marginTop:10
  },

  copyBtn:{
    background:'green',
    color:'#fff',
    border:'none',
    borderRadius:6,
    padding:'8px 16px',
    cursor:'pointer',
    marginTop:8
  }

}
