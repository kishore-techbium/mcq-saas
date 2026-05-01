'use client'

import { useState, useEffect } from 'react'
import { getAdminCollege } from '../../../../lib/getAdminCollege'

import * as XLSX from 'xlsx'
import JSZip from 'jszip'
import { supabase } from '../../../../lib/supabase'
import 'katex/dist/katex.min.css'
import renderMathInElement from 'katex/contrib/auto-render'

const BATCH_SIZE = 25

export default function UploadExcelPage(){

  const [excelFile,setExcelFile] = useState(null)
  const [zipFile,setZipFile] = useState(null)
const [exams,setExams] = useState([])
const [selectedExam,setSelectedExam] = useState('')
  const [batches,setBatches] = useState([])
  const [currentBatch,setCurrentBatch] = useState(0)

  const [imageMap,setImageMap] = useState({})
  const [uploading,setUploading] = useState(false)

  const [progress,setProgress] = useState(0)
  const [status,setStatus] = useState('')
  const [toast,setToast] = useState(null)

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
  
  /* ================= TOAST ================= */
  function showToast(msg,type='success'){
    setToast({msg,type})
    setTimeout(()=>setToast(null),3000)
  }

  /* ================= RENDER ================= */
  function renderContent(el, text){
  if(!el) return

  const value = text === null || text === undefined ? '' : String(text)

  el.innerHTML = value

  renderMathInElement(el, {
    delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '$', right: '$', display: false }
    ],
    throwOnError: false
  })
}
  /* ================= ZIP ================= */
  async function processZip(file){
    if(!file) return {}

    const zip = await JSZip.loadAsync(file)
    const map = {}

    for(const f in zip.files){
      const fileObj = zip.files[f]
      if(!fileObj.dir){
        const cleanName = fileObj.name.split('/').pop().trim().toLowerCase()
        map[cleanName] = await fileObj.async('blob')
      }
    }

    console.log('ZIP FILES:', Object.keys(map))
    return map
  }

  /* ================= PREVIEW ================= */
  async function handlePreview(){

    if(!excelFile){
      alert('Upload Excel file')
      return
    }

    const buffer = await excelFile.arrayBuffer()
    const wb = XLSX.read(buffer)

    const rawRows = XLSX.utils.sheet_to_json(
      wb.Sheets[wb.SheetNames[0]],
      { defval: '' }
    )

    const rows = rawRows.filter(r => Object.keys(r).length > 0)

    const zipMap = await processZip(zipFile)
    setImageMap(zipMap)

    const enriched = rows.map(r=>({
      ...r,
      image_name: r.image_name || r['Image Name'] || '',
      explanation_image_name:
        r.explanation_image_name ||
        r['Explanation Image Name'] ||
        '',
    }))

    const temp=[]
    for(let i=0;i<enriched.length;i+=BATCH_SIZE){
      temp.push(enriched.slice(i,i+BATCH_SIZE))
    }

    setBatches(temp)
    setCurrentBatch(0)
  }

  /* ================= UPDATE ================= */
  function updateField(i,field,value){
    const copy=[...batches]
    copy[currentBatch][i][field]=value
    setBatches(copy)
  }

  /* ================= IMAGE UPLOAD ================= */
  async function uploadImage(blob, name){

  const fileName = `question_images/${Date.now()}_${name}`

  const { error } = await supabase.storage
    .from('question-images')
    .upload(fileName, blob)

  if(error){
    console.error('IMAGE UPLOAD ERROR:', error)
    return null
  }

  const { data } = supabase.storage
    .from('question-images')
    .getPublicUrl(fileName)

  return data.publicUrl
}
  async function uploadImages(){

    const uploadedMap = {}

    for(const name in imageMap){

      const file = imageMap[name]

      const { error } = await supabase.storage
        .from('question-images')
        .upload(name, file, { upsert:true })

      if(error){
        console.error('Image upload error:', name)
      }

      const { data } = supabase.storage
        .from('question-images')
        .getPublicUrl(name)

      uploadedMap[name] = data.publicUrl
    }

    return uploadedMap
  }

  /* ================= UPLOAD ================= */
  async function uploadBatch(){

  try{

    setUploading(true)
    setProgress(0)
    setStatus('Starting upload...')

    const collegeId = await getAdminCollege()
    const batch = batches[currentBatch]

    let batchUploaded = 0

    for(let r of batch){

      setStatus(`Uploading question ${batchUploaded + 1} of ${batch.length}`)

      let q = r.question || ''
      let e = r.explanation || ''

      const qImg = (r.image_name || '').trim().toLowerCase()
      const eImg = (r.explanation_image_name || '').trim().toLowerCase()

      if(qImg && imageMap[qImg]){
        const url = await uploadImage(imageMap[qImg], qImg)
        if(url) q += `<br><img src="${url}" />`
      }

      if(eImg && imageMap[eImg]){
        const url = await uploadImage(imageMap[eImg], eImg)
        if(url) e += `<br><img src="${url}" />`
      }

      const payload = {
        exam_category: r.exam_category || '',
        subject: r.subject || '',
        chapter: r.chapter || '',
        subtopic: r.subtopic || '',
        difficulty: r.difficulty || '',
        question: q,
        option_a: r.option_a || '',
        option_b: r.option_b || '',
        option_c: r.option_c || '',
        option_d: r.option_d || '',
        correct_answer: r.correct_answer || '',
        explanation: e,
        college_id: collegeId,
        is_active: true
      }

      const { data, error } = await supabase
        .from('question_bank')
        .insert([payload])
        .select()

      if(error){
        console.error(error)
        showToast(`Error uploading question`, 'error')
        setUploading(false)
        return
      }

      batchUploaded++

      const percent = Math.round((batchUploaded / batch.length) * 100)
      setProgress(percent)

      if(selectedExam && data && data.length > 0){
        await supabase.from('exam_questions').insert([{
          exam_id: selectedExam,
          question_id: data[0].id,
          college_id: collegeId
        }])
      }
    }

    setUploading(false)

    if(currentBatch + 1 < batches.length){
      setCurrentBatch(currentBatch + 1)
      showToast(`Batch ${currentBatch+1} uploaded`)
    }else{
      showToast('All batches completed ✅')
    }

  }catch(err){
    console.error('UPLOAD CRASH:', err)
    showToast('Unexpected error occurred', 'error')
    setUploading(false)
  }
}

  const batch = batches[currentBatch] || []
return (
  <div style={{maxWidth:1100,margin:'auto',padding:20}}>

    {/* ✅ EXAM DROPDOWN */}
    <div style={{marginBottom:15}}>
      <label><b>🎯 Select Exam (optional)</b></label><br/>

      <select
        value={selectedExam}
        onChange={e=>setSelectedExam(e.target.value)}
        style={{width:'100%',padding:8}}
      >
        <option value="">No Exam Mapping</option>

        {exams.map(e=>(
          <option key={e.id} value={e.id}>
            {e.title}
          </option>
        ))}
      </select>
    </div>

    {/* ✅ MAIN UI STARTS HERE */}
    <h2>📊 Excel Upload</h2>

      <input type="file" accept=".xlsx,.xls,.csv"
        onChange={e=>setExcelFile(e.target.files[0])} />

      <br/><br/>

      <input type="file" accept=".zip"
        onChange={e=>setZipFile(e.target.files[0])} />

      <br/><br/>

      <button onClick={handlePreview}>Preview</button>

      <br/><br/>

      {batch.map((r,i)=>{

        const qImg = (r.image_name || '').trim().toLowerCase()
        const eImg = (r.explanation_image_name || '').trim().toLowerCase()

        return (
        <div key={i} style={{display:'flex',gap:20,marginBottom:20,border:'1px solid #ddd',padding:10}}>

          <div style={{
  flex:1,
  minWidth:400
}}>
            <textarea
  value={r.question || ''}
  onChange={e=>updateField(i,'question',e.target.value)}
  style={{
    width:'100%',
    minHeight:80,
    marginBottom:6,
    padding:6
  }}
/>
{['option_a','option_b','option_c','option_d'].map(op=>(
  <textarea
    key={op}
  value={r[op] || ''}
  onChange={e=>updateField(i,op,e.target.value)}
  style={{
    width:'100%',
    minHeight:50,
    marginBottom:6,
    padding:6,
    border:'1px solid #ccc',
    borderRadius:4
  }}
/>
            ))}
            <textarea
  value={r.explanation || ''}
  onChange={e=>updateField(i,'explanation',e.target.value)}
  style={{
    width:'100%',
    minHeight:70,
    marginTop:8,
    padding:6,
    border:'1px solid #ccc',
    borderRadius:4
  }}
/>
          </div>

          <div style={{
  flex:1,
  minWidth:400
}}>
            <div ref={el=>renderContent(el,r.question)} />

            {qImg && imageMap[qImg] && (
              <img src={URL.createObjectURL(imageMap[qImg])} width={200}/>
            )}

            {['option_a','option_b','option_c','option_d'].map((op,idx)=>(
              <div key={op}>
                <b>{String.fromCharCode(65+idx)}.</b>
                <span ref={el=>renderContent(el,r[op])}/>
              </div>
            ))}

            {r.explanation && (
              <div ref={el=>renderContent(el,r.explanation)} />
            )}

            {eImg && imageMap[eImg] && (
              <img src={URL.createObjectURL(imageMap[eImg])} width={200}/>
            )}
          </div>

        </div>
      )})}

      <div>
        <button disabled={currentBatch===0} onClick={()=>setCurrentBatch(p=>p-1)}>Prev</button>
        <span> {currentBatch+1} / {batches.length} </span>
        <button disabled={currentBatch===batches.length-1} onClick={()=>setCurrentBatch(p=>p+1)}>Next</button>
      </div>

      <br/>

      <button onClick={uploadBatch} disabled={uploading}>
  {uploading ? 'Uploading...' : 'Upload Batch'}
</button>
        

      {uploading && (
        <div style={{marginTop:15}}>
          <div>{status}</div>

          <div style={{width:'100%',height:20,background:'#eee'}}>
            <div style={{
              width:`${progress}%`,
              height:'100%',
              background:'#22c55e'
            }}/>
          </div>

          <div>{progress}%</div>
        </div>
      )}

      {toast && (
        <div style={{
          position:'fixed',
          bottom:20,
          right:20,
          background: toast.type==='error' ? '#ef4444' : '#22c55e',
          color:'#fff',
          padding:10,
          borderRadius:5
        }}>
          {toast.msg}
        </div>
      )}

    </div>
  )
}
