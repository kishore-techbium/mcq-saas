'use client'

import { supabase } from '../../../../lib/supabase'
import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { getAdminCollege } from '../../../../lib/getAdminCollege'

const BATCH_SIZE = 25

export default function UploadExcelPage(){

  const [excelFile,setExcelFile] = useState(null)
  const [batches,setBatches] = useState([])
  const [currentBatch,setCurrentBatch] = useState(0)

  const [exams,setExams] = useState([])
  const [selectedExam,setSelectedExam] = useState('')

  const [globalStats,setGlobalStats] = useState({
    total:0, uploaded:0, rejected:0, edited:0
  })

  const [toast,setToast] = useState(null)

  function showToast(msg){
    setToast(msg)
    setTimeout(()=>setToast(null),3000)
  }

  // =============================
  // LOAD EXAMS
  // =============================
  useEffect(()=>{
    loadExams()
  },[])

  async function loadExams(){
    const { data } = await supabase.from('exams').select('*')
    setExams(data || [])
  }

  // =============================
  // PREVIEW
  // =============================
  async function handlePreview(){

    const buffer = await excelFile.arrayBuffer()
    const wb = XLSX.read(buffer)
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]])

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
  // UPLOAD
  // =============================
  async function uploadBatch(){

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

      const { data, error } = await supabase
        .from('question_bank')
        .insert([{
          ...r,
          college_id:collegeId
        }])
        .select()

      if(!error && data){

        // 🔥 MAP TO EXAM
        await supabase.from('exam_questions').insert([{
          exam_id:selectedExam,
          question_id:data[0].id
        }])

        batchUploaded++
      }
    }

    setGlobalStats(prev=>({
      total:prev.total,
      uploaded:prev.uploaded+batchUploaded,
      rejected:prev.rejected+batchRejected,
      edited:prev.edited+batchEdited
    }))

    if(currentBatch+1 < batches.length){
      setCurrentBatch(currentBatch+1)
    }else{
      showToast('Upload Completed')
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
    <div style={{padding:30,maxWidth:900,margin:'auto'}}>

      <h2>📊 Excel Upload</h2>

      <select onChange={e=>setSelectedExam(e.target.value)} style={input}>
        <option>Select Exam</option>
        {exams.map(e=>(
          <option key={e.id} value={e.id}>{e.name}</option>
        ))}
      </select>

      <input type="file" onChange={e=>setExcelFile(e.target.files[0])}/>
      <br/><br/>

      <button onClick={handlePreview} style={btn}>Preview</button>

      {batch.map((r,i)=>(
        <div key={i} style={card}>
          <textarea value={r.question}
            onChange={e=>updateField(i,'question',e.target.value)}
            style={input}
          />

          <button onClick={()=>toggleReject(i)} style={rejectBtn}>
            {r.rejected?'Undo':'Reject'}
          </button>
        </div>
      ))}

      {batch.length>0 && (
        <button onClick={uploadBatch} style={btn}>
          Upload Batch
        </button>
      )}

      <div style={statsBox}>
        Total:{globalStats.total} | Uploaded:{globalStats.uploaded}
      </div>

      {toast && <div style={toastStyle}>{toast}</div>}
    </div>
  )
}

const card={border:'1px solid #ddd',padding:10,marginBottom:10}
const input={width:'100%',padding:8,marginBottom:8}
const btn={padding:10,background:'#2563eb',color:'#fff',border:'none'}
const rejectBtn={background:'red',color:'#fff',padding:5}
const statsBox={background:'#ecfdf5',padding:10,marginTop:10}
const toastStyle={position:'fixed',bottom:20,right:20,background:'green',color:'#fff',padding:10}
