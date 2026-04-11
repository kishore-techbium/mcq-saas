'use client'

import { supabase } from '../../../../lib/supabase'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'
import JSZip from 'jszip'
import { getAdminCollege } from '../../../../lib/getAdminCollege'

const BATCH_SIZE = 25

export default function UploadExcelPage(){

  const router = useRouter()

  const [file,setFile] = useState(null)
  const [zipFile,setZipFile] = useState(null)

  const [allRows,setAllRows] = useState([])
  const [batches,setBatches] = useState([])
  const [currentBatch,setCurrentBatch] = useState(0)

  const [imageMap,setImageMap] = useState({})
  const [errors,setErrors] = useState([])
  const [uploading,setUploading] = useState(false)

  const [toast,setToast] = useState(null)

  function showToast(msg,type='success'){
    setToast({msg,type})
    setTimeout(()=>setToast(null),3000)
  }

  // =============================
  // ZIP PROCESS
  // =============================
  async function processZip(zipFile){
    if(!zipFile) return {}

    const zip = await JSZip.loadAsync(zipFile)
    const map = {}

    for(const f in zip.files){
      const file = zip.files[f]
      if(!file.dir){
        map[file.name] = await file.async('blob')
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

    const errors = []

    rows.forEach((r,i)=>{
      const ok = data.some(m =>
        m.exam_category === r.exam_category &&
        m.subject === r.subject &&
        m.chapter === r.chapter &&
        m.subtopic === r.subtopic
      )

      if(!ok){
        errors.push(`Row ${i+2}: Invalid mapping → ${r.exam_category} | ${r.subject} | ${r.chapter} | ${r.subtopic}`)
      }
    })

    return errors
  }

  // =============================
  // PREVIEW
  // =============================
  async function handlePreview(){

    if(!file) return showToast('Select Excel','error')

    const buffer = await file.arrayBuffer()
    const wb = XLSX.read(buffer)
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]])

    // MASTER VALIDATION (STRICT)
    const masterErrors = await validateMaster(rows)

    if(masterErrors.length){
      setErrors(masterErrors.slice(0,20))
      return showToast('Master validation failed','error')
    }

    const zipMap = await processZip(zipFile)
    setImageMap(zipMap)

    // Add extra fields
    const enriched = rows.map(r=>({
      ...r,
      rejected:false,
      rejection_reason:'',
      edited:false
    }))

    setAllRows(enriched)

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
  // UPLOAD BATCH
  // =============================
  async function uploadBatch(){

    setUploading(true)

    const collegeId = await getAdminCollege()
    const batch = batches[currentBatch]

    for(let i=0;i<batch.length;i++){

      const r = batch[i]
      if(r.rejected) continue

      let q = r.question || ''
      let e = r.explanation || ''

      if(r.image_name && imageMap[r.image_name]){
        const url = await uploadImage(imageMap[r.image_name],r.image_name)
        q += `<br><img src="${url}" />`
      }

      if(r.explanation_image_name && imageMap[r.explanation_image_name]){
        const url = await uploadImage(imageMap[r.explanation_image_name],r.explanation_image_name)
        e += `<br><img src="${url}" />`
      }

      await supabase.from('question_bank').insert([{
        ...r,
        question:q,
        explanation:e,
        college_id:collegeId
      }])
    }

    setUploading(false)

    if(currentBatch+1 < batches.length){
      setCurrentBatch(currentBatch+1)
    }else{
      showToast('All batches uploaded')
      router.push('/admin')
    }
  }

  // =============================
  // EDIT
  // =============================
  function updateField(i,field,value){
    const copy=[...batches]
    copy[currentBatch][i][field]=value
    copy[currentBatch][i].edited=true
    setBatches(copy)
  }

  // =============================
  // REJECT
  // =============================
  function toggleReject(i){
    const copy=[...batches]
    copy[currentBatch][i].rejected = !copy[currentBatch][i].rejected
    setBatches(copy)
  }

  const batch = batches[currentBatch] || []

  return (
    <div style={{padding:20}}>

      <h2>Excel Upload (Batch Mode)</h2>

      <input type="file" onChange={e=>setFile(e.target.files[0])}/>
      <br/><br/>
      <input type="file" onChange={e=>setZipFile(e.target.files[0])}/>
      <br/><br/>

      <button onClick={handlePreview}>Start</button>

      {errors.length>0 && (
        <div style={{color:'red'}}>
          {errors.map((e,i)=><div key={i}>{e}</div>)}
        </div>
      )}

      {batch.length>0 && (
        <>
          <h3>Batch {currentBatch+1} / {batches.length}</h3>

          {batch.map((r,i)=>(
            <div key={i} style={{border:'1px solid #ccc',marginBottom:10,padding:10}}>

              <b>Q{i+1}</b>

              <textarea
                value={r.question}
                onChange={e=>updateField(i,'question',e.target.value)}
              />

              {r.image_name && imageMap[r.image_name] && (
                <img src={URL.createObjectURL(imageMap[r.image_name])} width={120}/>
              )}

              {['option_a','option_b','option_c','option_d'].map(op=>(
                <input
                  key={op}
                  value={r[op]}
                  onChange={e=>updateField(i,op,e.target.value)}
                />
              ))}

              <input
                value={r.correct_answer}
                onChange={e=>updateField(i,'correct_answer',e.target.value)}
              />

              <textarea
                value={r.explanation}
                onChange={e=>updateField(i,'explanation',e.target.value)}
              />

              {r.explanation_image_name && imageMap[r.explanation_image_name] && (
                <img src={URL.createObjectURL(imageMap[r.explanation_image_name])} width={120}/>
              )}

              <br/>

              <button onClick={()=>toggleReject(i)}>
                {r.rejected ? 'Undo Reject' : 'Reject'}
              </button>

            </div>
          ))}

          <button onClick={uploadBatch}>
            {uploading ? 'Uploading...' : 'Upload Batch'}
          </button>
        </>
      )}

      {toast && (
        <div style={{
          position:'fixed',
          bottom:20,
          right:20,
          background: toast.type==='error'?'red':'green',
          color:'#fff',
          padding:10
        }}>
          {toast.msg}
        </div>
      )}

    </div>
  )
}
