'use client'

import { supabase } from '../../../../lib/supabase'
import { useState } from 'react'
import mammoth from 'mammoth'
import { getAdminCollege } from '../../../../lib/getAdminCollege'

const BATCH_SIZE = 25

export default function UploadWordPage(){

  const [file,setFile] = useState(null)
  const [batches,setBatches] = useState([])
  const [currentBatch,setCurrentBatch] = useState(0)

  const [stats,setStats] = useState(null)
  const [toast,setToast] = useState(null)

  function showToast(msg){
    setToast(msg)
    setTimeout(()=>setToast(null),3000)
  }

  const clean = (t)=> t?.replace(/\s+/g,' ').trim()

  async function parseWord(file){

    const buffer = await file.arrayBuffer()

    const result = await mammoth.convertToHtml({ arrayBuffer:buffer })

    const html = result.value

    const blocks = html.split(/Question\s+\d+:/i)
      .filter(b=>b.includes('Q:'))

    return blocks.map(block=>{

      const get = (label)=>{
        const match = block.match(new RegExp(`${label}:\\s*([^<]*)`,'i'))
        return match ? clean(match[1]) : ''
      }

      const getOption = (letter)=>{
        const match = block.match(new RegExp(`${letter}\\.\\s*([^<]*)`,'i'))
        return match ? clean(match[1]) : ''
      }

      return {
        exam_category:get('Exam Category'),
        subject:get('Subject'),
        chapter:get('Chapter'),
        subtopic:get('Subtopic'),
        difficulty:get('Difficulty'),

        question_html:block,

        option_a:getOption('A'),
        option_b:getOption('B'),
        option_c:getOption('C'),
        option_d:getOption('D'),

        correct_answer:get('Answer'),
        explanation:get('Explanation'),

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
  }

  async function uploadBatch(){

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

      const { error } = await supabase.from('question_bank').insert([{
        ...r,
        question:r.question_html,
        college_id:collegeId
      }])

      if(!error) uploaded++
    }

    setStats({total:batch.length, uploaded, rejected, edited})

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

      <h2>📄 Word Upload</h2>

      <input type="file" onChange={e=>setFile(e.target.files[0])}/>
      <br/><br/>

      <button onClick={handlePreview} style={btn}>Preview</button>

      {batch.map((r,i)=>(
        <div key={i} style={card}>
          <b>Q{i+1}</b>

          <div dangerouslySetInnerHTML={{__html:r.question_html}}/>

          <button onClick={()=>toggleReject(i)} style={rejectBtn}>
            {r.rejected ? 'Undo' : 'Reject'}
          </button>
        </div>
      ))}

      {batch.length>0 && (
        <button onClick={uploadBatch} style={uploadBtn}>
          Upload Batch
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

      {toast && <div style={toastStyle}>{toast}</div>}
    </div>
  )
}

const card={border:'1px solid #ddd', padding:15, marginBottom:10, borderRadius:8}
const btn={padding:'10px 15px', background:'#2563eb', color:'#fff', border:'none', borderRadius:6}
const uploadBtn={...btn, marginTop:20}
const rejectBtn={background:'#ef4444', color:'#fff', padding:'5px 10px', border:'none', borderRadius:5}
const statsBox={background:'#ecfdf5', padding:15, marginTop:20, borderRadius:8}
const toastStyle={position:'fixed', bottom:20, right:20, background:'green', color:'#fff', padding:10}
