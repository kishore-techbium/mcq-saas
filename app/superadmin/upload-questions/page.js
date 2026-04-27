'use client'

import { supabase } from '../../../lib/supabase'
import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import JSZip from 'jszip'

const BATCH_SIZE = 25

export default function UploadGlobalQuestions() {

  const [excelFile,setExcelFile] = useState(null)
  const [zipFile,setZipFile] = useState(null)

  const [batches,setBatches] = useState([])
  const [currentBatch,setCurrentBatch] = useState(0)

  const [imageMap,setImageMap] = useState({})
  const [errors,setErrors] = useState([])

  const [uploading,setUploading] = useState(false)

  const [exams,setExams] = useState([])
  const [selectedExam,setSelectedExam] = useState('')

  // ✅ LOAD GLOBAL EXAMS
  useEffect(()=>{
    loadGlobalExams()
  },[])

  async function loadGlobalExams(){
    const { data, error } = await supabase
      .from('exams')
      .select('id,title')
      .eq('is_global', true)

    if(error){
      console.error(error)
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
  // PREVIEW
  // =============================
  async function handlePreview(){

    if(!excelFile) return alert('Select Excel')

    const buffer = await excelFile.arrayBuffer()
    const wb = XLSX.read(buffer)
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]])

    const zipMap = await processZip(zipFile)
    setImageMap(zipMap)

    const enriched = rows.map(r=>({
      ...r,
      rejected:false
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
  // UPLOAD BATCH
  // =============================
  async function uploadBatch(){

    if(!selectedExam){
      return alert('Select exam')
    }

    setUploading(true)

    const batch = batches[currentBatch]

    for(let r of batch){

      if(r.rejected) continue

      let q = r.question || ''

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
        explanation:r.explanation,
        college_id:null // 🔥 GLOBAL
      }

      const { data, error } = await supabase
        .from('question_bank')
        .insert([payload])
        .select()

      if(error){
        console.error(error)
      }else{
        
          // 🔥 MAP TO GLOBAL EXAM

        if (!selectedExam) {
        console.error("❌ No exam selected")
        continue
        }

        if (!data || !data.length) {
        console.error("❌ Question insert failed, no ID returned")
        continue
        }
const { error: mapError } = await supabase
  .from('exam_questions')
  .insert([{
    exam_id: selectedExam,
    question_id: data[0].id,
    college_id: null
  }])

if (mapError) {
  console.error("❌ MAPPING ERROR:", mapError)
} else {
  console.log("✅ MAPPED:", selectedExam, data[0].id)
}
      }
    }

    setUploading(false)

    if(currentBatch+1 < batches.length){
      setCurrentBatch(currentBatch+1)
    }else{
      alert('Upload complete')
    }
  }

  const batch = batches[currentBatch] || []

  return (
    <div style={{padding:30,maxWidth:900,margin:'auto'}}>

      <h2>📊 Upload Questions (Global Exams)</h2>

      <select
        value={selectedExam}
        onChange={e=>setSelectedExam(e.target.value)}
        style={{width:'100%',padding:10,marginBottom:20}}
      >
        <option value="">Select Global Exam</option>
        {exams.map(e=>(
          <option key={e.id} value={e.id}>{e.title}</option>
        ))}
      </select>
   <label>🖼️ Select csv file</label>
      <input type="file" onChange={e=>setExcelFile(e.target.files[0])}/>
      <br/><br/>
   <label>🖼️ Select Images ZIP (optional)</label>
      <input type="file" onChange={e=>setZipFile(e.target.files[0])}/>
      <br/><br/>

      <button onClick={handlePreview}>Preview</button>

      {batch.length > 0 && (
        <>
          <h3>Batch {currentBatch+1}</h3>

          {batch.map((r,i)=>(
            <div key={i} style={{border:'1px solid #ddd',padding:10,marginBottom:10}}>
              <textarea value={r.question} readOnly style={{width:'100%'}}/>
            </div>
          ))}

          <button onClick={uploadBatch}>
            {uploading ? 'Uploading...' : 'Upload Batch'}
          </button>
        </>
      )}
    </div>
  )
}
