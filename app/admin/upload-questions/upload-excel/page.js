'use client'

import { supabase } from '../../../../lib/supabase'
import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { getAdminCollege } from '../../../../lib/getAdminCollege'

const REQUIRED_COLUMNS = [
  'exam_category','subject','chapter','subtopic','difficulty','question',
  'option_a','option_b','option_c','option_d','correct_answer'
]

const BATCH_SIZE = 25

export default function UploadExcelPage() {

  const [file,setFile] = useState(null)
  const [rows,setRows] = useState([])

  const [currentBatch,setCurrentBatch] = useState(0)
  const [batches,setBatches] = useState([])

  const [selectedExam,setSelectedExam] = useState('')
  const [exams,setExams] = useState([])

  const [uploading,setUploading] = useState(false)

  const [stats,setStats] = useState({
    total:0,
    uploaded:0,
    rejected:0,
    edited:0
  })

  const [toast,setToast] = useState(null)

  useEffect(()=>{ loadExams() },[])

  async function loadExams(){
    const collegeId = await getAdminCollege()

    const { data } = await supabase
      .from('exams')
      .select('id,title')
      .eq('college_id', collegeId)

    setExams(data || [])
  }

  function showToast(msg,type='success'){
    setToast({msg,type})
    setTimeout(()=>setToast(null),3000)
  }

  async function handlePreview(){

    if(!file) return showToast('Select file','error')

    const buffer = await file.arrayBuffer()
    const wb = XLSX.read(buffer)
    const excelRows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]])

    const enriched = excelRows.map(r=>({
      ...r,
      rejected:false,
      edited:false
    }))

    const temp=[]
    for(let i=0;i<enriched.length;i+=BATCH_SIZE){
      temp.push(enriched.slice(i,i+BATCH_SIZE))
    }

    setRows(enriched)
    setBatches(temp)
    setCurrentBatch(0)

    setStats({
      total: enriched.length,
      uploaded:0,
      rejected:0,
      edited:0
    })
  }

  async function uploadBatch(){

    if(!selectedExam) return showToast('Select exam','error')

    setUploading(true)

    const collegeId = await getAdminCollege()
    const batch = batches[currentBatch]

    let uploaded=0
    let rejected=0
    let edited=0

    for(let r of batch){

      if(r.rejected){
        rejected++
        continue
      }

      if(r.edited) edited++

      const { data,error } = await supabase
        .from('question_bank')
        .insert([{ ...r, college_id:collegeId }])
        .select()

      if(!error && data){

        await supabase.from('exam_questions').insert([{
          exam_id:selectedExam,
          question_id:data[0].id
        }])

        uploaded++
      }
    }

    setStats(prev=>({
      total: prev.total,
      uploaded: prev.uploaded + uploaded,
      rejected: prev.rejected + rejected,
      edited: prev.edited + edited
    }))

    setUploading(false)

    if(currentBatch+1 < batches.length){
      setCurrentBatch(currentBatch+1)
    }else{
      showToast('All batches uploaded')
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
    <div style={styles.container}>

      <h2>📊 Excel Upload</h2>

      <select
        value={selectedExam}
        onChange={e=>setSelectedExam(e.target.value)}
        style={styles.select}
      >
        <option value="">Select Exam</option>
        {exams.map(e=>(
          <option key={e.id} value={e.id}>{e.title}</option>
        ))}
      </select>

      <input type="file" onChange={e=>setFile(e.target.files[0])}/>

      <button onClick={handlePreview}>Preview</button>

      {/* STATS */}
      <div style={styles.stats}>
        Total: {stats.total} |
        Uploaded: {stats.uploaded} |
        Rejected: {stats.rejected} |
        Edited: {stats.edited}
      </div>

      {/* BATCH INFO */}
      {batch.length>0 && (
        <div>Batch {currentBatch+1} / {batches.length}</div>
      )}

      {/* QUESTIONS */}
      {batch.map((r,i)=>(
        <div key={i} style={styles.card}>

          <b>Q{currentBatch*BATCH_SIZE + i +1}</b>

          <textarea
            value={r.question}
            onChange={e=>updateField(i,'question',e.target.value)}
          />

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

      {toast && <div>{toast.msg}</div>}
    </div>
  )
}

const styles = {
  container:{maxWidth:900,margin:'auto',padding:20},
  select:{width:'100%',marginBottom:10},
  stats:{marginTop:10},
  card:{border:'1px solid #ddd',padding:10,marginTop:10}
}
