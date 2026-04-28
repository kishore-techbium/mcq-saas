'use client'

import { supabase } from '../../../../lib/supabase'
import { useState, useEffect } from 'react'   // ✅ added useEffect
import * as XLSX from 'xlsx'
import JSZip from 'jszip'
import { BlockMath, InlineMath } from 'react-katex'
import { getAdminCollege } from '../../../../lib/getAdminCollege'
import 'katex/dist/katex.min.css'
import renderMathInElement from 'katex/contrib/auto-render'

const BATCH_SIZE = 25


export default function UploadExcelPage(){

  const [excelFile,setExcelFile] = useState(null)
  const [zipFile,setZipFile] = useState(null)

  const [editingIndex, setEditingIndex] = useState(null)
  const [editorValue, setEditorValue] = useState('')
  
  const [batches,setBatches] = useState([])
  const [currentBatch,setCurrentBatch] = useState(0)

  const [imageMap,setImageMap] = useState({})
  const [errors,setErrors] = useState([])

  const [uploading,setUploading] = useState(false)

  const [globalStats,setGlobalStats] = useState({
    total:0,
    uploaded:0,
    rejected:0,
    edited:0
  })

  const [toast,setToast] = useState(null)

  // ✅ NEW STATES
  const [exams,setExams] = useState([])
  const [selectedExam,setSelectedExam] = useState('')
  const [activeTab, setActiveTab] = useState('math')
  const TOOLBAR = {
  math: [
    { label: 'x²', latex: 'x^{2}' },
    { label: 'xⁿ', latex: 'x^{n}' },
    { label: '√', latex: '\\sqrt{x}' },
    { label: 'n√', latex: '\\sqrt[n]{x}' },
    { label: 'frac', latex: '\\frac{a}{b}' },
    { label: '( )', latex: '(a+b)' },
    { label: '|x|', latex: '|x|' },
    { label: 'log', latex: '\\log(x)' },
    { label: 'ln', latex: '\\ln(x)' },
    { label: 'e^x', latex: 'e^{x}' },
    { label: '10^x', latex: '10^{x}' },
    { label: 'sin', latex: '\\sin(x)' },
    { label: 'cos', latex: '\\cos(x)' },
    { label: 'tan', latex: '\\tan(x)' },
    { label: 'cot', latex: '\\cot(x)' },
    { label: 'sec', latex: '\\sec(x)' },
    { label: 'cosec', latex: '\\csc(x)' },
    { label: '∫', latex: '\\int x \\, dx' },
    { label: '∫ limits', latex: '\\int_{a}^{b} f(x) dx' },
    { label: 'Σ', latex: '\\sum_{i=1}^{n} i' },
    { label: 'lim', latex: '\\lim_{x \\to a}' },
    { label: '∞', latex: '\\infty' },
    { label: 'θ', latex: '\\theta' },
    { label: 'π', latex: '\\pi' },
    { label: '≈', latex: '\\approx' },
    { label: '≠', latex: '\\neq' },
    { label: '≤', latex: '\\leq' },
    { label: '≥', latex: '\\geq' }
  ],

  chemistry: [
    { label: 'H₂O', latex: 'H_{2}O' },
    { label: 'CO₂', latex: 'CO_{2}' },
    { label: 'NH₃', latex: 'NH_{3}' },
    { label: 'H₂SO₄', latex: 'H_{2}SO_{4}' },
    { label: 'Na⁺', latex: 'Na^{+}' },
    { label: 'Cl⁻', latex: 'Cl^{-}' },
    { label: 'e⁻', latex: 'e^{-}' },
    { label: '→', latex: '\\rightarrow' },
    { label: '⇌', latex: '\\rightleftharpoons' },
    { label: '↑', latex: '\\uparrow' },
    { label: '↓', latex: '\\downarrow' },
    { label: 'Δ', latex: '\\Delta' },
    { label: '°C', latex: '^{\\circ}C' },
    { label: 'mol', latex: '\\text{mol}' },
    { label: 'aq', latex: '_{(aq)}' },
    { label: 'solid', latex: '_{(s)}' },
    { label: 'liquid', latex: '_{(l)}' },
    { label: 'gas', latex: '_{(g)}' }
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
    { label: 'W=Fd', latex: 'W = Fd' },
    { label: 'KE', latex: 'KE = \\frac{1}{2}mv^{2}' },
    { label: 'PE', latex: 'PE = mgh' },
    { label: 'g', latex: 'g = 9.8 \\, m/s^{2}' },
    { label: 'λ', latex: '\\lambda' },
    { label: 'f', latex: 'f = \\frac{1}{T}' },
    { label: 'c', latex: 'c = 3 \\times 10^{8} \\, m/s' }
  ]
}

  
  function showToast(msg,type='success'){
    setToast({msg,type})
    setTimeout(()=>setToast(null),3000)
  }

  // =============================
  // ✅ LOAD EXAMS (NEW)
  // =============================
  useEffect(()=>{
    loadExams()
  },[])

  async function loadExams(){
    const collegeId = await getAdminCollege()

    const { data, error } = await supabase
      .from('exams')
      .select('id,title')
      .eq('college_id', collegeId)

    if(error){
      console.error('EXAM FETCH ERROR:', error)
    }else{
      setExams(data || [])
    }
  }

  // =============================
  // ZIP PROCESS
  // =============================
  async function processZip(file){
    if(!file) return {}

    const zip = await JSZip.loadAsync(file)
    const map = {}

    for(const f in zip.files){
      const fileObj = zip.files[f]
      if(!fileObj.dir){
        map[fileObj.name] = await fileObj.async('blob')
      }
    }

    return map
  }

  // =============================
  // MASTER VALIDATION
  // =============================
  async function validateMaster(rows){

    const { data } = await supabase
      .from('subjects_master')
      .select('*')

    const errs=[]

    rows.forEach((r,i)=>{
      const ok = data.some(m =>
m.exam_category === (r.exam_category || '') &&
m.subject === (r.subject || '') &&
m.chapter === (r.chapter || '') &&
m.subtopic === (r.subtopic || '')
      )

      if(!ok){
        errs.push({
  row: i + 2,
  message: 'Invalid mapping',
  data: r
})
      }
    })

    return errs
  }

  // =============================
  // PREVIEW
  // =============================
  async function handlePreview(){

    if(!excelFile){
      return showToast('Please select Excel file','error')
    }

    const buffer = await excelFile.arrayBuffer()
    const wb = XLSX.read(buffer)
  const rawRows = XLSX.utils.sheet_to_json(
  wb.Sheets[wb.SheetNames[0]],
  { defval: '' }
)

const rows = rawRows.filter(r =>
  r && Object.keys(r).length > 0
)

// ✅ NOW it's safe
console.log('Parsed Rows:', rows)

    const masterErrors = await validateMaster(rows)

    if(masterErrors.length){
      setErrors(masterErrors)
      return showToast('Master validation failed','error')
    }

    const zipMap = await processZip(zipFile)
    setImageMap(zipMap)
// 🔥 IMAGE VALIDATION
const imageErrors = []

rows.forEach((r, i) => {
  if (r.image_name && !zipMap[r.image_name]) {
    imageErrors.push({
  row: i + 2,
  message: `Missing image ${r.image_name}`,
  data: r
})
  }

  if (r.explanation_image_name && !zipMap[r.explanation_image_name]) {
    imageErrors.push(`Row ${i+2}: Missing explanation image ${r.explanation_image_name}`)
  }
})


    const enriched = rows.map(r=>({
      ...r,
      rejected:false,
      edited:false
    }))

    const temp=[]
    for(let i=0;i<enriched.length;i+=BATCH_SIZE){
      temp.push(enriched.slice(i,i+BATCH_SIZE))
    }

    setBatches(temp)
    setCurrentBatch(0)

    setGlobalStats({
      total: enriched.length,
      uploaded:0,
      rejected:0,
      edited:0
    })
  }

  // =============================
  // IMAGE UPLOAD
  // =============================
  async function uploadImage(blob,name){
    const fileName = `question_images/${Date.now()}_${name}`

    await supabase.storage
      .from('question-images')
      .upload(fileName, blob)

    const { data } = supabase.storage
      .from('question-images')
      .getPublicUrl(fileName)

    return data.publicUrl
  }

  // =============================
  // UPLOAD BATCH
  // =============================
  async function uploadBatch(){


    setUploading(true)

    const collegeId = await getAdminCollege()
    const batch = batches[currentBatch]

    let batchUploaded=0
    let batchRejected=0
    let batchEdited=0

    for(let r of batch){

      if(r.rejected){
        batchRejected++
        continue
      }

      if(r.edited){
        batchEdited++
      }

      let q = r.question || ''
      let e = r.explanation || ''

      if(r.image_name && imageMap[r.image_name]){
        const url = await uploadImage(imageMap[r.image_name],r.image_name)
        q += `<br><img src="${url}" />`
      }

      const payload = {
        exam_category:r.exam_category,
        subject:r.subject,
        chapter:r.chapter,
        subtopic:r.subtopic,
        difficulty:r.difficulty,
        question:q,
        option_a:r.option_a,
        option_b:r.option_b,
        option_c:r.option_c,
        option_d:r.option_d,
        correct_answer:r.correct_answer,
        explanation:e,
        college_id:collegeId
      }

      // ✅ IMPORTANT: get inserted id
      const { data, error } = await supabase
        .from('question_bank')
        .insert([payload])
        .select()

      if(error){
        console.error('INSERT ERROR:', error)
      }else{
        batchUploaded++

        // ✅ NEW: MAP TO EXAM
      if(selectedExam && data && data.length > 0){
await supabase.from('exam_questions').insert([{
  exam_id: selectedExam,
  question_id: data[0].id,
  college_id: collegeId   // ✅ ADD THIS
}])
}
      }
    }

    setGlobalStats(prev => ({
      total: prev.total,
      uploaded: prev.uploaded + batchUploaded,
      rejected: prev.rejected + batchRejected,
      edited: prev.edited + batchEdited
    }))

    setUploading(false)

    if(currentBatch+1 < batches.length){
      setCurrentBatch(currentBatch+1)
    }else{
      showToast('All batches completed')
    }
  }

  // =============================
  // EDIT / REJECT
  // =============================
  function updateField(i,field,value){
    const copy=[...batches]
    copy[currentBatch][i][field]=value
    copy[currentBatch][i].edited=true
    setBatches(copy)
  }

  function toggleReject(i){
    const copy=[...batches]
    copy[currentBatch][i].rejected=!copy[currentBatch][i].rejected
    setBatches(copy)
  }
function openLatexEditor(row, index){
  setEditingIndex(index)
  setEditorValue(row.question || '')
}
function insertLatex(value){
  setEditorValue(prev => prev + '\n' + value + ' ')
}
  const batch = batches[currentBatch] || []

  return (
  <div style={container}>

    <h2 style={title}>📊 Excel Upload</h2>

    {/* EXAM DROPDOWN */}
    <div style={fileBox}>
      <label>🎯 Select Exam</label>
      <select
        value={selectedExam}
        onChange={e=>setSelectedExam(e.target.value)}
        style={{width:'100%',padding:8}}
      >
        <option value="">Select Exam</option>
        {exams.map(e=>(
          <option key={e.id} value={e.id}>{e.title}</option>
        ))}
      </select>
    </div>

    {/* FILE INPUTS */}
    <div style={fileBox}>
      <label>📄 Select Excel File</label>
      <input type="file" onChange={e=>setExcelFile(e.target.files[0])}/>
      <div>{excelFile?.name}</div>
    </div>

    <div style={fileBox}>
      <label>🖼️ Select Images ZIP (optional)</label>
      <input type="file" onChange={e=>setZipFile(e.target.files[0])}/>
      <div>{zipFile?.name}</div>
    </div>

    <button onClick={handlePreview} style={btn}>Preview</button>

    {/* ERRORS */}
    {errors.length>0 && (
      <div style={errorBox}>
        {errors.map((e,i)=>(
          <div key={i} style={{marginBottom:10}}>
            <b>Row {e.row}</b> - {e.message}
            <div style={{fontSize:12,color:'#555'}}>
              {e.data.subject} | {e.data.chapter} | {e.data.subtopic}
            </div>
          </div>
        ))}
      </div>
    )}

    {/* BATCH DISPLAY */}
    {batch.length>0 && (
      <>
        <h3>Batch {currentBatch+1} / {batches.length}</h3>

        {batch.map((r,i)=>(
          <div key={i} style={card}>
            <b>Q{i+1}</b>

            {/* TEXTAREA */}
            <textarea
              value={r.question || ''}
              onChange={e=>updateField(i,'question',e.target.value)}
              style={input}
            />

            {/* PREVIEW */}
            {r.question && (
              <div style={{
                background:'#f1f5f9',
                padding:10,
                marginBottom:10,
                borderRadius:6
              }}>
<div
  ref={(el) => {
    if(el){
      el.innerHTML = r.question
      renderMathInElement(el, {
        delimiters: [
          { left: '$', right: '$', display: false },
          { left: '$$', right: '$$', display: true }
        ]
      })
    }
  }}
  style={{whiteSpace:'pre-wrap'}}
/>
              </div>
            )}

            {/* ✅ ADVANCED EDIT BUTTON (CORRECT PLACE) */}
            <button
              onClick={() => openLatexEditor(r, i)}
              style={{
                marginBottom:10,
                background:'#059669',
                color:'#fff',
                padding:'6px 10px',
                border:'none',
                borderRadius:6
              }}
            >
              ✏️ Advanced Edit
            </button>

            {/* IMAGE */}
            {r.image_name && imageMap[r.image_name] && (
              <img
                src={URL.createObjectURL(imageMap[r.image_name])}
                style={{maxWidth:200, marginBottom:10}}
              />
            )}

            {/* OPTIONS */}
            {['option_a','option_b','option_c','option_d'].map(op=>(
              <input
                key={op}
                value={r[op]}
                onChange={e=>updateField(i,op,e.target.value)}
                style={input}
              />
            ))}

            {/* EXPLANATION IMAGE */}
            {r.explanation_image_name && imageMap[r.explanation_image_name] && (
              <img
                src={URL.createObjectURL(imageMap[r.explanation_image_name])}
                style={{maxWidth:200, marginTop:10}}
              />
            )}

            {/* REJECT */}
            <button onClick={()=>toggleReject(i)} style={rejectBtn}>
              {r.rejected ? 'Undo Reject' : 'Reject'}
            </button>

          </div>
        ))}

        <button onClick={uploadBatch} style={uploadBtn}>
          {uploading ? 'Uploading...' : 'Upload Batch'}
        </button>
      </>
    )}

    {/* STATS */}
    {globalStats.total > 0 && (
      <div style={statsBox}>
        <b>Summary</b><br/>
        Total: {globalStats.total} <br/>
        Uploaded: {globalStats.uploaded} <br/>
        Rejected: {globalStats.rejected} <br/>
        Edited: {globalStats.edited}
      </div>
    )}

    {/* TOAST */}
    {toast && (
      <div style={toastStyle}>{toast.msg}</div>
    )}

    {/* 🔥 POPUP EDITOR WITH TOOLBAR */}
    {editingIndex !== null && (
      <div style={{
        position:'fixed',
        top:0,
        left:0,
        width:'100%',
        height:'100%',
        background:'rgba(0,0,0,0.5)',
        display:'flex',
        justifyContent:'center',
        alignItems:'center'
      }}>
        <div style={{
          background:'#fff',
          padding:20,
          width:'650px',
          borderRadius:10
        }}>
          <h3>LaTeX Editor</h3>

          {/* TOOLBAR */}
          {/* 🔥 TAB BUTTONS */}
<div style={{marginBottom:10}}>
  <button onClick={()=>setActiveTab('math')} style={tabBtn}>Math</button>
  <button onClick={()=>setActiveTab('chemistry')} style={tabBtn}>Chem</button>
  <button onClick={()=>setActiveTab('physics')} style={tabBtn}>Physics</button>
</div>

{/* 🔥 TOOLBAR ITEMS */}
<div style={{marginBottom:10}}>
  {TOOLBAR[activeTab].map((t,i)=>(
    <button
      key={i}
      onClick={()=>insertLatex(t.latex)}
      style={toolbarBtn}
    >
      {t.label}
    </button>
  ))}
</div>

          {/* TEXTAREA */}
          <textarea
            value={editorValue}
            onChange={(e)=>setEditorValue(e.target.value)}
            style={{width:'100%',height:120}}
          />

          {/* PREVIEW */}
          <div style={{marginTop:10, background:'#f1f5f9', padding:10}}>
          <div style={{
            whiteSpace:'pre-wrap',
            lineHeight: '1.6'
          }}>
            {editorValue}
          </div>
          </div>

          {/* ACTIONS */}
          <div style={{marginTop:15}}>
            <button
              onClick={()=>{
                updateField(editingIndex,'question',editorValue)
                setEditingIndex(null)
              }}
              style={{marginRight:10}}
            >
              ✅ Save
            </button>

            <button onClick={()=>setEditingIndex(null)}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    )}

  </div>
)
}
/* ================== STYLES ================== */

const container={maxWidth:900,margin:'auto',padding:30}
const title={fontSize:24,marginBottom:20}
const toolbarBtn = {
  marginRight:5,
  marginTop:5,
  padding:'5px 8px',
  border:'1px solid #ccc',
  borderRadius:5,
  background:'#f8fafc',
  cursor:'pointer'
}

const fileBox={
  border:'1px solid #ddd',
  padding:10,
  marginBottom:15,
  borderRadius:8
}

const card={
  border:'1px solid #ddd',
  padding:15,
  marginBottom:10,
  borderRadius:8
}

const input={
  display:'block',
  width:'100%',
  marginBottom:8,
  padding:8
}

const btn={
  padding:'10px 15px',
  background:'#2563eb',
  color:'#fff',
  border:'none',
  borderRadius:6
}

const uploadBtn={...btn,marginTop:20}

const rejectBtn={
  background:'#ef4444',
  color:'#fff',
  padding:'6px 10px',
  border:'none',
  borderRadius:5
}
const tabBtn={
  background:'#ef4444',
  color:'#fff',
  padding:'6px 10px',
  border:'none',
  borderRadius:5
}

const statsBox={
  background:'#ecfdf5',
  padding:15,
  marginTop:20,
  borderRadius:8
}

const errorBox={
  background:'#fee2e2',
  padding:10,
  marginTop:10,
  borderRadius:6
}

const toastStyle={
  position:'fixed',
  bottom:20,
  right:20,
  background:'green',
  color:'#fff',
  padding:10,
  borderRadius:5
}
