'use client'

import { supabase } from '../../../../lib/supabase'
import { useState, useEffect } from 'react'
import mammoth from 'mammoth'
import { getAdminCollege } from '../../../../lib/getAdminCollege'

const BATCH_SIZE = 25

export default function UploadWordPage(){

  const [file,setFile] = useState(null)

  const [batches,setBatches] = useState([])
  const [currentBatch,setCurrentBatch] = useState(0)

  const [uploading,setUploading] = useState(false)

  const [globalStats,setGlobalStats] = useState({
    total:0,
    uploaded:0,
    rejected:0,
    edited:0
  })

  const [toast,setToast] = useState(null)

  // ✅ NEW
  const [exams,setExams] = useState([])
  const [selectedExam,setSelectedExam] = useState('')

  function showToast(msg,type='success'){
    setToast({msg,type})
    setTimeout(()=>setToast(null),3000)
  }

  // =============================
  // ✅ LOAD EXAMS
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
      console.error(error)
    }else{
      setExams(data || [])
    }
  }

  // =============================
  // WORD PARSE (UNCHANGED)
  // =============================
  async function parseWord(file){

    const buffer = await file.arrayBuffer()

    const result = await mammoth.convertToHtml({ arrayBuffer:buffer })

    const html = result.value

    const blocks = html.split(/Question\s+\d+:/i)
      .filter(b=>b.includes('Q:'))

    return blocks.map(block=>{

      const get = (label)=>{
        const match = block.match(new RegExp(`${label}:\\s*([^<]*)`,'i'))
        return match ? match[1]?.trim() : ''
      }
const getQuestionHTML = ()=>{
  const match = block.match(/Q:\s*([\s\S]*?)(A\.|Option A)/i)
  return match ? match[1].trim() : block
}
      const getOption = (letter)=>{
        const match = block.match(new RegExp(`${letter}\\.\\s*([^<]*)`,'i'))
        return match ? match[1]?.trim() : ''
      }

      return {
        exam_category:get('Exam Category'),
        subject:get('Subject'),
        chapter:get('Chapter'),
        subtopic:get('Subtopic'),
        difficulty:get('Difficulty'),

      question_html:getQuestionHTML(),

        option_a:getOption('A'),
        option_b:getOption('B'),
        option_c:getOption('C'),
        option_d:getOption('D'),

        correct_answer: get('Answer')?.trim().toUpperCase(),
        explanation:get('Explanation'),

        rejected:false,
        edited:false
      }
    })
  }

  // =============================
  // PREVIEW
  // =============================
  async function handlePreview(){

    if(!file){
      return showToast('Select file','error')
    }

    const parsed = await parseWord(file)

    const temp=[]
    for(let i=0;i<parsed.length;i+=BATCH_SIZE){
      temp.push(parsed.slice(i,i+BATCH_SIZE))
    }

    setBatches(temp)
    setCurrentBatch(0)

    setGlobalStats({
      total: parsed.length,
      uploaded:0,
      rejected:0,
      edited:0
    })
  }

  // =============================
  // UPLOAD
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

      const payload = {
        exam_category:r.exam_category,
        subject:r.subject,
        chapter:r.chapter,
        subtopic:r.subtopic,
        difficulty:r.difficulty,

        question:r.question_html, // KEEP HTML (images intact)

        option_a:r.option_a,
        option_b:r.option_b,
        option_c:r.option_c,
        option_d:r.option_d,

        correct_answer:r.correct_answer,
        explanation:r.explanation,

        college_id:collegeId
      }

      const { data, error } = await supabase
        .from('question_bank')
        .insert([payload])
        .select()

      if(error){
        console.error(error)
      }else{
        batchUploaded++

        // ✅ MAP TO EXAM
      if(selectedExam && data && data.length > 0){
  await supabase.from('exam_questions').insert([{
    exam_id: selectedExam,
    question_id: data[0].id
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

  const batch = batches[currentBatch] || []

  return (
    <div style={container}>

      <h2 style={title}>📄 Word Upload</h2>

      {/* ✅ EXAM DROPDOWN */}
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

      <div style={fileBox}>
        <input type="file" onChange={e=>setFile(e.target.files[0])}/>
        <div>{file?.name}</div>
      </div>

      <button onClick={handlePreview} style={btn}>Preview</button>

      {batch.length>0 && (
        <>
          <h3>Batch {currentBatch+1} / {batches.length}</h3>

          {batch.map((r,i)=>(
            <div key={i} style={card}>
              <b>Q{i+1}</b>

              {/* ✅ EDITABLE */}
{/* QUESTION */}
<textarea
  value={r.question_html}
  onChange={e=>updateField(i,'question_html',e.target.value)}
  style={{width:'100%',height:120, marginBottom:10}}
/>

{/* OPTIONS */}
<input
  value={r.option_a}
  onChange={e=>updateField(i,'option_a',e.target.value)}
  placeholder="Option A"
/>

<input
  value={r.option_b}
  onChange={e=>updateField(i,'option_b',e.target.value)}
  placeholder="Option B"
/>

<input
  value={r.option_c}
  onChange={e=>updateField(i,'option_c',e.target.value)}
  placeholder="Option C"
/>

<input
  value={r.option_d}
  onChange={e=>updateField(i,'option_d',e.target.value)}
  placeholder="Option D"
/>

{/* ANSWER */}
<input
  value={r.correct_answer}
  onChange={e=>updateField(i,'correct_answer',e.target.value)}
  placeholder="Correct Answer (A/B/C/D)"
/>

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

      {globalStats.total > 0 && (
        <div style={statsBox}>
          <b>Summary</b><br/>
          Total: {globalStats.total} <br/>
          Uploaded: {globalStats.uploaded} <br/>
          Rejected: {globalStats.rejected} <br/>
          Edited: {globalStats.edited}
        </div>
      )}

      {toast && (
        <div style={toastStyle}>{toast.msg}</div>
      )}

    </div>
  )
}

/* ================= STYLES (KEEP SAME AS EXCEL) ================= */

const container={maxWidth:900,margin:'auto',padding:30}
const title={fontSize:24,marginBottom:20}

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

const statsBox={
  background:'#ecfdf5',
  padding:15,
  marginTop:20,
  borderRadius:8
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
