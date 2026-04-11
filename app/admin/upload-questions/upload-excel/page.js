'use client'

import { supabase } from '../../../../lib/supabase'
import { useState, useEffect } from 'react'
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

  const [exams,setExams] = useState([])
  const [selectedExam,setSelectedExam] = useState('')

  const [globalStats,setGlobalStats] = useState({
    total:0, uploaded:0, rejected:0, edited:0
  })

  const [toast,setToast] = useState(null)

  function showToast(msg,type='success'){
    setToast({msg,type})
    setTimeout(()=>setToast(null),3000)
  }

  // =============================
  // LOAD EXAMS (FIXED)
  // =============================
  useEffect(()=>{
    loadExams()
  },[])

  async function loadExams(){
    const collegeId = await getAdminCollege()

    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .eq('college_id', collegeId)

    if(error){
      console.error(error)
    }else{
      setExams(data || [])
    }
  }

  // =============================
  // ZIP
  // =============================
  async function processZip(file){
    if(!file) return {}

    const zip = await JSZip.loadAsync(file)
    const map={}

    for(const f in zip.files){
      const fileObj = zip.files[f]
      if(!fileObj.dir){
        map[fileObj.name]=await fileObj.async('blob')
      }
    }

    return map
  }

  // =============================
  // MASTER VALIDATION (UNCHANGED)
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
  // PREVIEW (FIXED OPTIONS)
  // =============================
  async function handlePreview(){

    if(!excelFile){
      return showToast('Select Excel file','error')
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
      exam_category:r.exam_category,
      subject:r.subject,
      chapter:r.chapter,
      subtopic:r.subtopic,
      difficulty:r.difficulty,
      question:r.question,

      option_a:r.option_a,
      option_b:r.option_b,
      option_c:r.option_c,
      option_d:r.option_d,

      correct_answer:r.correct_answer,
      explanation:r.explanation,

      image_name:r.image_name,
      explanation_image_name:r.explanation_image_name,

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
  // IMAGE UPLOAD (UNCHANGED)
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
  // UPLOAD (KEEP YOUR LOGIC + FIX)
  // =============================
  async function uploadBatch(){

    if(!selectedExam){
      return showToast('Select Exam first','error')
    }

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

      if(r.edited) batchEdited++

      let q = r.question || ''
      let e = r.explanation || ''

      if(r.image_name && imageMap[r.image_name]){
        const url = await uploadImage(imageMap[r.image_name],r.image_name)
        q += `<br><img src="${url}" />`
      }

      const { data, error } = await supabase
        .from('question_bank')
        .insert([{
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
        }])
        .select()

      if(error){
        console.error(error)
      }else{
        batchUploaded++

        // ✅ KEEP YOUR ORIGINAL MAPPING
        await supabase.from('exam_questions').insert([{
          exam_id:selectedExam,
          question_id:data[0].id
        }])
      }
    }

    setGlobalStats(prev=>({
      total:prev.total,
      uploaded:prev.uploaded+batchUploaded,
      rejected:prev.rejected+batchRejected,
      edited:prev.edited+batchEdited
    }))

    setUploading(false)

    if(currentBatch+1 < batches.length){
      setCurrentBatch(currentBatch+1)
    }else{
      showToast('Upload completed')
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
    <div style={{padding:30,maxWidth:900,margin:'auto'}}>

      <h2>📊 Excel Upload</h2>

      {/* EXAM DROPDOWN FIXED */}
      <select value={selectedExam}
        onChange={e=>setSelectedExam(e.target.value)}
        style={{width:'100%',padding:8,marginBottom:15}}
      >
        <option value="">Select Exam</option>
        {exams.map(e=>(
          <option key={e.id} value={e.id}>{e.name}</option>
        ))}
      </select>

      <div>
        <label>Excel File</label><br/>
        <input type="file" onChange={e=>setExcelFile(e.target.files[0])}/>
        <div>{excelFile?.name}</div>
      </div>

      <br/>

      <div>
        <label>Image ZIP (optional)</label><br/>
        <input type="file" onChange={e=>setZipFile(e.target.files[0])}/>
        <div>{zipFile?.name}</div>
      </div>

      <br/>

      <button onClick={handlePreview}>Preview</button>

      {batch.map((r,i)=>(
        <div key={i} style={{border:'1px solid #ccc',padding:10,marginTop:10}}>

          <textarea value={r.question}
            onChange={e=>updateField(i,'question',e.target.value)}
            style={{width:'100%'}}
          />

          {/* ✅ OPTIONS FIXED */}
          <input value={r.option_a} onChange={e=>updateField(i,'option_a',e.target.value)} />
          <input value={r.option_b} onChange={e=>updateField(i,'option_b',e.target.value)} />
          <input value={r.option_c} onChange={e=>updateField(i,'option_c',e.target.value)} />
          <input value={r.option_d} onChange={e=>updateField(i,'option_d',e.target.value)} />

          <button onClick={()=>toggleReject(i)}>
            {r.rejected?'Undo':'Reject'}
          </button>
        </div>
      ))}

      {batch.length>0 && (
        <button onClick={uploadBatch}>
          {uploading?'Uploading...':'Upload Batch'}
        </button>
      )}

      <div style={{marginTop:20}}>
        Total:{globalStats.total} | Uploaded:{globalStats.uploaded}
      </div>

      {toast && <div>{toast.msg}</div>}
    </div>
  )
}
