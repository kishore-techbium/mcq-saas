'use client'

import { supabase } from '../../../../lib/supabase'
import { useState } from 'react'
import * as XLSX from 'xlsx'
import JSZip from 'jszip'
import { getAdminCollege } from '../../../../lib/getAdminCollege'

const BATCH_SIZE = 25

export default function UploadExcelPage(){

  const [excelFile,setExcelFile] = useState(null)
  const [zipFile,setZipFile] = useState(null)

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

  function showToast(msg,type='success'){
    setToast({msg,type})
    setTimeout(()=>setToast(null),3000)
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
        m.exam_category===r.exam_category &&
        m.subject===r.subject &&
        m.chapter===r.chapter &&
        m.subtopic===r.subtopic
      )

      if(!ok){
        errs.push(`Row ${i+2}: Invalid mapping`)
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
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]])

    const masterErrors = await validateMaster(rows)

    if(masterErrors.length){
      setErrors(masterErrors)
      return showToast('Master validation failed','error')
    }

    const zipMap = await processZip(zipFile)
    setImageMap(zipMap)

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

      const { error } = await supabase
        .from('question_bank')
        .insert([payload])

      if(error){
        console.error('INSERT ERROR:', error)
      }else{
        batchUploaded++
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

      <h2 style={title}>📊 Excel Upload</h2>

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
          {errors.map((e,i)=><div key={i}>{e}</div>)}
        </div>
      )}

      {/* BATCH */}
      {batch.length>0 && (
        <>
          <h3>Batch {currentBatch+1} / {batches.length}</h3>

          {batch.map((r,i)=>(
            <div key={i} style={card}>
              <b>Q{i+1}</b>

              <textarea
                value={r.question}
                onChange={e=>updateField(i,'question',e.target.value)}
                style={input}
              />

              {['option_a','option_b','option_c','option_d'].map(op=>(
                <input key={op}
                  value={r[op]}
                  onChange={e=>updateField(i,op,e.target.value)}
                  style={input}
                />
              ))}

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

      {/* GLOBAL STATS */}
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

    </div>
  )
}

/* ================== STYLES ================== */

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
