'use client'
export const runtime = 'nodejs'

import { supabase } from '../../../../lib/supabase'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import mammoth from 'mammoth'
import { getAdminCollege } from '../../../../lib/getAdminCollege'

export default function UploadWordPage(){

  const router = useRouter()

  const [file,setFile] = useState(null)
  const [rows,setRows] = useState([])
  const [errors,setErrors] = useState({})
  const [isPreview,setIsPreview] = useState(false)

  const [selectedExam,setSelectedExam] = useState('')
  const [exams,setExams] = useState([])

  const [uploading,setUploading] = useState(false)
  const [progress,setProgress] = useState(0)
  const [status,setStatus] = useState('')
  const [stats,setStats] = useState(null)

  useEffect(()=>{ loadExams() },[])

  async function loadExams(){
    const collegeId = await getAdminCollege()
    const { data } = await supabase
      .from('exams')
      .select('*')
      .eq('college_id',collegeId)

    setExams(data || [])
  }

  const clean = (t)=> t?.replace(/\s+/g,' ').trim()

  async function compressImage(buffer){
    return new Promise((resolve)=>{
      const blob = new Blob([buffer])
      const img = new Image()

      img.onload = ()=>{
        const canvas = document.createElement('canvas')
        const scale = 600 / img.width

        canvas.width = 600
        canvas.height = img.height * scale

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img,0,0,canvas.width,canvas.height)

        canvas.toBlob(b=>resolve(b),'image/jpeg',0.7)
      }

      img.src = URL.createObjectURL(blob)
    })
  }

  async function uploadImage(file,i){
    const path = `question_images/${Date.now()}_${i}.jpg`

    await supabase.storage.from('question-images')
      .upload(path,file,{contentType:'image/jpeg'})

    const { data } = supabase.storage
      .from('question-images')
      .getPublicUrl(path)

    return data.publicUrl
  }

  async function parseWord(file){
    setStatus('Processing Word file...')
    setProgress(10)

    const buffer = await file.arrayBuffer()
    let imgIndex = 0

    const result = await mammoth.convertToHtml(
      { arrayBuffer:buffer },
      {
        convertImage: mammoth.images.inline(async (img)=>{
          const raw = await img.read()
          const compressed = await compressImage(raw)
          const url = await uploadImage(compressed,imgIndex++)
          return { src:url }
        })
      }
    )

    setProgress(50)

    const rawBlocks = result.value.split(/Question\s+\d+:/i)

    const blocks = rawBlocks
      .map(b => b.trim())
      .filter(b => b && b.includes('Q:') && b.includes('Answer:'))

    setProgress(80)

    return blocks.map(block=>{
      const get = (l)=> clean((block.match(new RegExp(`${l}:\\s*([^<]*)`,'i'))||[])[1])
      const opt = (l)=> clean((block.match(new RegExp(`${l}\\.\\s*([^<]*)`,'i'))||[])[1])
      const img = (block.match(/<img[^>]+src="([^"]+)"/)||[])[1]

      return {
        exam_category:get('Exam Category'),
        subject:get('Subject'),
        chapter:get('Chapter'),
        subtopic:get('Subtopic'),
        difficulty:get('Difficulty'),
        question:get('Q'),
        image:img || '',
        option_a:opt('A'),
        option_b:opt('B'),
        option_c:opt('C'),
        option_d:opt('D'),
        correct_answer:get('Answer'),
        explanation:get('Explanation')
      }
    })
  }

  function validate(r){
    const e=[]
    if(!r.question) e.push('Question')
    if(!r.option_a||!r.option_b||!r.option_c||!r.option_d) e.push('Options')
    if(!['A','B','C','D'].includes(r.correct_answer)) e.push('Answer')
    if(!['Easy','Medium','Hard'].includes(r.difficulty)) e.push('Difficulty')
    return e
  }

  function revalidate(updatedRows){
    let errMap={}
    updatedRows.forEach((r,i)=>{
      const e = validate(r)
      if(e.length) errMap[i]=e
    })
    setErrors(errMap)
  }

  async function handlePreview(){
    if(!file) return alert('Select file')

    const parsed = await parseWord(file)

    setStatus('Validating questions...')
    setProgress(90)

    setRows(parsed)
    setIsPreview(true)
    revalidate(parsed)

    setProgress(100)
    setStatus('Preview ready')
  }

  async function handleUpload(){

    const validRows = rows.filter((_,i)=>!errors[i])
    const errorCount = rows.length - validRows.length

    if(!validRows.length) return alert('Fix errors first')

    setUploading(true)
    setStatus('Uploading questions...')
    setProgress(0)

    const collegeId = await getAdminCollege()

    const payload = validRows.map(r=>({...r,college_id:collegeId}))

    const { data:inserted } = await supabase
      .from('question_bank')
      .insert(payload)
      .select()

    setProgress(80)

    if(selectedExam){
      await supabase.from('exam_questions').insert(
        inserted.map(q=>({exam_id:selectedExam,question_id:q.id}))
      )
    }

    setProgress(100)
    setStatus('Upload completed')

    setStats({
      total: rows.length,
      valid: validRows.length,
      errors: errorCount,
      uploaded: inserted.length
    })

    setUploading(false)
  }

  function handleChange(i,field,value){
    const updated = [...rows]
    updated[i][field]=value
    setRows(updated)
    revalidate(updated)
  }

  return(
    <div style={{padding:20}}>

      <h2>Word Upload (Edit Enabled)</h2>

      <input type="file" accept=".docx"
        onChange={e=>setFile(e.target.files[0])}
      />

      <select onChange={e=>setSelectedExam(e.target.value)}>
        <option value="">Select Exam (Optional)</option>
        {exams.map(e=>(
          <option key={e.id} value={e.id}>{e.title}</option>
        ))}
      </select>

      <div style={{marginTop:10}}>
        <div style={{width:'100%',background:'#ddd',height:10}}>
          <div style={{
            width:`${progress}%`,
            background:'#2563eb',
            height:10
          }} />
        </div>
        <div>{status}</div>
      </div>

      {!isPreview && <button onClick={handlePreview}>Preview & Edit</button>}

      {isPreview && (
        <>
          <button onClick={handleUpload}>
            {uploading ? 'Uploading...' : 'Upload'}
          </button>

          {stats && (
            <div style={{marginTop:15,background:'#ecfdf5',padding:10}}>
              <b>Upload Summary</b><br/>
              Total: {stats.total}<br/>
              Valid: {stats.valid}<br/>
              Errors Skipped: {stats.errors}<br/>
              Uploaded: {stats.uploaded}
            </div>
          )}

          {rows.map((r,i)=>(
            <div key={i}
              style={{
                border:'1px solid #ccc',
                padding:10,
                marginTop:10,
                background: errors[i] ? '#fee2e2':'#ecfdf5'
              }}
            >
              <div>Q{i+1}</div>

              <textarea value={r.question}
                onChange={e=>handleChange(i,'question',e.target.value)}
              />

              {r.image && <img src={r.image} width="120"/>}

              {['option_a','option_b','option_c','option_d'].map(op=>(
                <input key={op}
                  value={r[op]}
                  onChange={e=>handleChange(i,op,e.target.value)}
                />
              ))}

              <input value={r.correct_answer}
                onChange={e=>handleChange(i,'correct_answer',e.target.value)}
              />

              <input value={r.difficulty}
                onChange={e=>handleChange(i,'difficulty',e.target.value)}
              />

              {errors[i] && (
                <div style={{color:'red'}}>
                  {errors[i].join(', ')}
                </div>
              )}
            </div>
          ))}
        </>
      )}

    </div>
  )
}
