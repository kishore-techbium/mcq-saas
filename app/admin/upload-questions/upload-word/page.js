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

  const [exams,setExams] = useState([])
  const [selectedExam,setSelectedExam] = useState('')

  const [globalStats,setGlobalStats] = useState({
    total:0, uploaded:0, rejected:0, edited:0
  })

  useEffect(()=>{
    loadExams()
  },[])

  async function loadExams(){
    const { data } = await supabase.from('exams').select('*')
    setExams(data || [])
  }

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

      return {
        exam_category:get('Exam Category'),
        subject:get('Subject'),
        chapter:get('Chapter'),
        subtopic:get('Subtopic'),
        difficulty:get('Difficulty'),

        question:block,

        rejected:false,
        edited:false
      }
    })
  }

  async function handlePreview(){

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

  async function uploadBatch(){

    const collegeId = await getAdminCollege()
    const batch = batches[currentBatch]

    let batchUploaded=0
    let batchRejected=0

    for(let r of batch){

      if(r.rejected){
        batchRejected++
        continue
      }

      const { data } = await supabase
        .from('question_bank')
        .insert([{
          ...r,
          college_id:collegeId
        }])
        .select()

      if(data){

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
      edited:prev.edited
    }))

    if(currentBatch+1 < batches.length){
      setCurrentBatch(currentBatch+1)
    }
  }

  function toggleReject(i){
    const copy=[...batches]
    copy[currentBatch][i].rejected=!copy[currentBatch][i].rejected
    setBatches(copy)
  }

  const batch = batches[currentBatch] || []

  return (
    <div style={{padding:30,maxWidth:900,margin:'auto'}}>

      <h2>📄 Word Upload</h2>

      <select onChange={e=>setSelectedExam(e.target.value)} style={input}>
        <option>Select Exam</option>
        {exams.map(e=>(
          <option key={e.id} value={e.id}>{e.name}</option>
        ))}
      </select>

      <input type="file" onChange={e=>setFile(e.target.files[0])}/>
      <br/><br/>

      <button onClick={handlePreview} style={btn}>Preview</button>

      {batch.map((r,i)=>(
        <div key={i} style={card}>
          <textarea
            value={r.question}
            onChange={e=>{
              const copy=[...batches]
              copy[currentBatch][i].question=e.target.value
              copy[currentBatch][i].edited=true
              setBatches(copy)
            }}
            style={{width:'100%',height:120}}
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
    </div>
  )
}

const card={border:'1px solid #ddd',padding:10,marginBottom:10}
const input={width:'100%',padding:8,marginBottom:8}
const btn={padding:10,background:'#2563eb',color:'#fff',border:'none'}
const rejectBtn={background:'red',color:'#fff',padding:5}
const statsBox={background:'#ecfdf5',padding:10,marginTop:10}
