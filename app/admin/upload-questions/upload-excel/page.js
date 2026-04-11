'use client'

import { supabase } from '../../../../lib/supabase'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'
import JSZip from 'jszip'
import { getAdminCollege } from '../../../../lib/getAdminCollege'

const BATCH_SIZE = 25

export default function UploadExcelPage(){

  const [file,setFile] = useState(null)
  const [zipFile,setZipFile] = useState(null)

  const [batches,setBatches] = useState([])
  const [currentBatch,setCurrentBatch] = useState(0)

  const [imageMap,setImageMap] = useState({})
  const [errors,setErrors] = useState([])
  const [uploading,setUploading] = useState(false)

  const [stats,setStats] = useState(null)
  const [toast,setToast] = useState(null)

  function showToast(msg,type='success'){
    setToast({msg,type})
    setTimeout(()=>setToast(null),3000)
  }

  // =============================
  // ZIP
  // =============================
  async function processZip(zipFile){
    if(!zipFile) return {}
    const zip = await JSZip.loadAsync(zipFile)
    const map={}
    for(const f in zip.files){
      const file=zip.files[f]
      if(!file.dir){
        map[file.name]=await file.async('blob')
      }
    }
    return map
  }

  // =============================
  // MASTER VALIDATION
  // =============================
  async function validateMaster(rows){
    const { data } = await supabase.from('subjects_master').select('*')

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

    const buffer = await file.arrayBuffer()
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
  // UPLOAD
  // =============================
  async function uploadBatch(){

    setUploading(true)
    const collegeId = await getAdminCollege()

    let uploaded=0
    let rejected=0
    let edited=0

    const batch = batches[currentBatch]

    for(let r of batch){

      if(r.rejected){
        rejected++
        continue
      }

      if(r.edited) edited++

      let q = r.question || ''
      let e = r.explanation || ''

      if(r.image_name && imageMap[r.image_name]){
        const url = await uploadImage(imageMap[r.image_name],r.image_name)
        q += `<br><img src="${url}" />`
      }

      console.log('INSERTING:', r)

      const { error } = await supabase.from('question_bank').insert([{
        ...r,
        question:q,
        explanation:e,
        college_id:collegeId
      }])

      if(error){
        console.error('ERROR:', error)
      }else{
        uploaded++
      }
    }

    setUploading(false)

    setStats({
      total:batch.length,
      uploaded,
      rejected,
      edited
    })

    if(currentBatch+1 < batches.length){
      setCurrentBatch(currentBatch+1)
    }else{
      showToast('All batches completed')
    }
  }

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
    <div style={{padding:30, maxWidth:900, margin:'auto'}}>

      <h2 style={{fontSize:22, marginBottom:20}}>📊 Excel Upload</h2>

      <input type="file" onChange={e=>setFile(e.target.files[0])}/>
      <br/><br/>
      <input type="file" onChange={e=>setZipFile(e.target.files[0])}/>
      <br/><br/>

      <button onClick={handlePreview} style={btn}>Preview</button>

      {errors.length>0 && (
        <div style={{color:'red'}}>
          {errors.map((e,i)=><div key={i}>{e}</div>)}
        </div>
      )}

      {batch.map((r,i)=>(
        <div key={i} style={card}>
          <b>Q{i+1}</b>

          <textarea
            value={r.question}
            onChange={e=>updateField(i,'question',e.target.value)}
            style={input}
          />

          {['option_a','option_b','option_c','option_d'].map(op=>(
            <input key={op} value={r[op]}
              onChange={e=>updateField(i,op,e.target.value)}
              style={input}
            />
          ))}

          <button onClick={()=>toggleReject(i)} style={rejectBtn}>
            {r.rejected ? 'Undo' : 'Reject'}
          </button>
        </div>
      ))}

      {batch.length>0 && (
        <button onClick={uploadBatch} style={uploadBtn}>
          {uploading ? 'Uploading...' : 'Upload Batch'}
        </button>
      )}

      {stats && (
        <div style={statsBox}>
          Total: {stats.total} <br/>
          Uploaded: {stats.uploaded} <br/>
          Rejected: {stats.rejected} <br/>
          Edited: {stats.edited}
        </div>
      )}

      {toast && <div style={toastStyle}>{toast.msg}</div>}
    </div>
  )
}

// ===== STYLES =====
const card={border:'1px solid #ddd', padding:15, marginBottom:10, borderRadius:8}
const input={display:'block', width:'100%', marginBottom:8, padding:8}
const btn={padding:'10px 15px', background:'#2563eb', color:'#fff', border:'none', borderRadius:6}
const uploadBtn={...btn, marginTop:20}
const rejectBtn={background:'#ef4444', color:'#fff', padding:'5px 10px', border:'none', borderRadius:5}
const statsBox={background:'#ecfdf5', padding:15, marginTop:20, borderRadius:8}
const toastStyle={position:'fixed', bottom:20, right:20, background:'green', color:'#fff', padding:10}
