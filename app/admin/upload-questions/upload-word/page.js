'use client'
export const runtime = 'nodejs'

import { supabase } from '../../../../lib/supabase'
import { useState } from 'react'
import mammoth from 'mammoth'
import { getAdminCollege } from '../../../../lib/getAdminCollege'

const BATCH_SIZE = 25

export default function UploadWordPage(){

  const [file,setFile] = useState(null)

  const [allRows,setAllRows] = useState([])
  const [batches,setBatches] = useState([])
  const [currentBatch,setCurrentBatch] = useState(0)

  const [errors,setErrors] = useState([])
  const [uploading,setUploading] = useState(false)
  const [status,setStatus] = useState('')
  const [progress,setProgress] = useState(0)

  const [toast,setToast] = useState(null)

  function showToast(msg,type='success'){
    setToast({msg,type})
    setTimeout(()=>setToast(null),3000)
  }

  const clean = (t)=> t?.replace(/\s+/g,' ').trim()

  // =============================
  // PARSE WORD (WITH IMAGE)
  // =============================
  async function parseWord(file){

    setStatus('Processing...')
    setProgress(20)

    const buffer = await file.arrayBuffer()
    let imageIndex = 0

    const result = await mammoth.convertToHtml(
      { arrayBuffer:buffer },
      {
        convertImage: mammoth.images.inline(async (image)=>{
          const imgBuffer = await image.read()

          const fileName = `question_images/${Date.now()}_${imageIndex++}.jpg`

          await supabase.storage
            .from('question-images')
            .upload(fileName, imgBuffer, { contentType:'image/jpeg' })

          const { data } = supabase.storage
            .from('question-images')
            .getPublicUrl(fileName)

          return { src: data.publicUrl }
        })
      }
    )

    const html = result.value

    const blocks = html
      .split(/Question\s+\d+:/i)
      .map(b => b.trim())
      .filter(b => b && b.includes('Q:'))

    return blocks.map(block=>{

      const get = (label)=>{
        const regex = new RegExp(`${label}:\\s*([^<]*)`,'i')
        const match = block.match(regex)
        return match ? clean(match[1]) : ''
      }

      const getOption = (letter)=>{
        const regex = new RegExp(`${letter}\\.\\s*([^<]*)`,'i')
        const match = block.match(regex)
        return match ? clean(match[1]) : ''
      }

      const getQuestionHTML = ()=>{
        const match = block.match(/Q:\s*([\s\S]*?)A\./i)
        return match ? match[1].trim() : ''
      }

      return {
        exam_category:get('Exam Category'),
        subject:get('Subject'),
        chapter:get('Chapter'),
        subtopic:get('Subtopic'),
        difficulty:get('Difficulty') || 'Medium',

        question_html:getQuestionHTML(),

        option_a:getOption('A'),
        option_b:getOption('B'),
        option_c:getOption('C'),
        option_d:getOption('D'),

        correct_answer:get('Answer')?.trim().toUpperCase(),
        explanation:get('Explanation') || '',

        rejected:false,
        rejection_reason:'',
        edited:false
      }
    })
  }

  // =============================
  // MASTER VALIDATION (STRICT)
  // =============================
  async function validateMaster(rows){

    const { data } = await supabase
      .from('subjects_master')
      .select('*')

    const errs = []

    rows.forEach((r,i)=>{
      const ok = data.some(m =>
        m.exam_category === r.exam_category &&
        m.subject === r.subject &&
        m.chapter === r.chapter &&
        m.subtopic === r.subtopic
      )

      if(!ok){
        errs.push(`Row ${i+1}: Invalid mapping → ${r.exam_category} | ${r.subject} | ${r.chapter} | ${r.subtopic}`)
      }
    })

    return errs
  }

  // =============================
  // PREVIEW
  // =============================
  async function handlePreview(){

    if(!file) return alert('Select file')

    const parsed = await parseWord(file)

    const masterErrors = await validateMaster(parsed)

    if(masterErrors.length){
      setErrors(masterErrors.slice(0,20))
      return showToast('Master validation failed','error')
    }

    const temp=[]
    for(let i=0;i<parsed.length;i+=BATCH_SIZE){
      temp.push(parsed.slice(i,i+BATCH_SIZE))
    }

    setAllRows(parsed)
    setBatches(temp)
    setCurrentBatch(0)

    setProgress(100)
    setStatus(`Preview Ready (${parsed.length})`)
  }

  // =============================
  // UPLOAD BATCH
  // =============================
  async function uploadBatch(){

    setUploading(true)
    const collegeId = await getAdminCollege()

    const batch = batches[currentBatch]

    let success = 0

    for(let i=0;i<batch.length;i++){

      const r = batch[i]
      if(r.rejected) continue

      const payload = {
        exam_category:r.exam_category,
        subject:r.subject,
        chapter:r.chapter,
        subtopic:r.subtopic,
        difficulty:r.difficulty,

        question:r.question_html,
        option_a:r.option_a,
        option_b:r.option_b,
        option_c:r.option_c,
        option_d:r.option_d,

        correct_answer:r.correct_answer,
        explanation:r.explanation,

        college_id:collegeId
      }

      const { error } = await supabase
        .from('question_bank')
        .insert([payload])

      if(!error) success++

      setProgress(Math.round(((i+1)/batch.length)*100))
    }

    setUploading(false)

    if(currentBatch+1 < batches.length){
      setCurrentBatch(currentBatch+1)
    }else{
      showToast(`Completed (${success})`)
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

  function toggleReject(i){
    const copy=[...batches]
    copy[currentBatch][i].rejected = !copy[currentBatch][i].rejected
    setBatches(copy)
  }

  const batch = batches[currentBatch] || []

  return (
    <div style={{padding:20}}>

      <h2>Word Upload (Batch Mode)</h2>

      <input type="file" onChange={e=>setFile(e.target.files[0])}/>

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

              <div dangerouslySetInnerHTML={{ __html: r.question_html }} />

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
