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
  const [isCompleted,setIsCompleted] = useState(false)
  const [isCancelled,setIsCancelled] = useState(false)

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

  async function parseWord(file){

    setStatus('Processing...')
    setProgress(20)

    const buffer = await file.arrayBuffer()
    let imageIndex = 0

    const result = await mammoth.convertToHtml(
      { arrayBuffer:buffer },
      {
        convertImage: mammoth.images.inline(async (image)=>{
          const buffer = await image.read()

          const fileName = `question_images/${Date.now()}_${imageIndex++}.jpg`

          await supabase.storage
            .from('question-images')
            .upload(fileName, buffer, { contentType:'image/jpeg' })

          const { data } = supabase.storage
            .from('question-images')
            .getPublicUrl(fileName)

          return { src: data.publicUrl }
        })
      }
    )

    setProgress(60)

    const html = result.value

    const rawBlocks = html.split(/Question\s+\d+:/i)

    const blocks = rawBlocks
      .map(b => b.trim())
      .filter(b => b && b.includes('Q:'))

    setProgress(80)

    return blocks.map((block)=>{

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

      const imgMatch = block.match(/<img[^>]+src="([^"]+)"/i)
      const imageUrl = imgMatch ? imgMatch[1] : ''

      return {
        exam_category:get('Exam Category'),
        subject:get('Subject'),
        chapter:get('Chapter'),
        subtopic:get('Subtopic'),
        difficulty:get('Difficulty'),
        question:get('Q'),
        image:imageUrl,
        option_a:getOption('A'),
        option_b:getOption('B'),
        option_c:getOption('C'),
        option_d:getOption('D'),
        correct_answer:get('Answer'),
        explanation:get('Explanation')
      }
    })
  }

  function validate(r){
    const e=[]
    const answer = r.correct_answer?.trim().toUpperCase()

    if(!r.question) e.push('Question')
    if(!['A','B','C','D'].includes(answer)) e.push('Answer')

    return e
  }

  function revalidate(data){
    let err={}
    data.forEach((r,i)=>{
      const e = validate(r)
      if(e.length) err[i]=e
    })
    setErrors(err)
  }

  async function handlePreview(){

    if(!file) return alert('Select file')

    setIsCompleted(false)

    const parsed = await parseWord(file)

    setRows(parsed)
    setIsPreview(true)
    revalidate(parsed)

    setProgress(100)
    setStatus(`Preview Ready (${parsed.length} questions)`)
  }

  function handleChange(i,field,value){
    const updated = [...rows]
    updated[i][field] = value
    setRows(updated)
  }

  const delay = (ms) => new Promise(res => setTimeout(res, ms))

  async function handleUpload(){

    setUploading(true)
    setIsCancelled(false)
    setIsCompleted(false)
    setStatus('Uploading started...')
    setProgress(0)

    const validRows = rows.filter((_,i)=>!errors[i])
    const collegeId = await getAdminCollege()

    let uploaded = []

    for(let i=0;i<validRows.length;i++){

      if(isCancelled){
        setStatus('Upload Cancelled')
        setUploading(false)
        return
      }

      const cleanedRow = {
        ...validRows[i],
        correct_answer: validRows[i].correct_answer?.trim().toUpperCase(),
        difficulty: validRows[i].difficulty?.trim(),
        college_id: collegeId
      }

      const { data, error } = await supabase
        .from('question_bank')
        .insert([cleanedRow])
        .select()

      if(error){
        console.error(error)
        continue
      }

      uploaded.push(data[0])

      const percent = Math.round(((i+1)/validRows.length)*100)

      setProgress(percent)
      setStatus(`Uploading ${i+1} / ${validRows.length}`)

      await delay(10)
    }

    setUploading(false)
    setIsCompleted(true)
    setStatus(`Upload Completed (${uploaded.length} questions)`)

    setStats({
      total: rows.length,
      uploaded: uploaded.length,
      skipped: rows.length - uploaded.length
    })
  }

  function cancelUpload(){
    setIsCancelled(true)
  }

  return(
    <div style={{padding:20}}>

      <h2>Word Upload</h2>

      <input type="file" onChange={e=>setFile(e.target.files[0])}/>

      <select onChange={e=>setSelectedExam(e.target.value)}>
        <option>Select Exam</option>
        {exams.map(e=>(
          <option key={e.id} value={e.id}>{e.title}</option>
        ))}
      </select>

      <div style={{marginTop:10}}>
        <div style={{width:'100%',background:'#ddd',height:10}}>
          <div style={{width:`${progress}%`,background:'#2563eb',height:10}}/>
        </div>
        <div>{status}</div>
      </div>

      {!isPreview && <button onClick={handlePreview}>Preview</button>}

      {isPreview && (
        <>
          <button onClick={handleUpload}>
            {uploading ? 'Uploading...' : 'Upload'}
          </button>

          {uploading && (
            <button onClick={cancelUpload} style={{marginLeft:10,background:'red',color:'#fff'}}>
              Cancel
            </button>
          )}

          {isCompleted && stats && (
            <div style={{
              marginTop:15,
              background:'#ecfdf5',
              padding:10,
              border:'1px solid #16a34a'
            }}>
              <b>Upload Summary</b><br/>
              Total: {stats.total}<br/>
              Uploaded: {stats.uploaded}<br/>
              Skipped: {stats.skipped}
            </div>
          )}

          {rows.map((r,i)=>(
            <div key={i} style={{
              border:'1px solid #ccc',
              padding:10,
              marginTop:10
            }}>

              <b>Q{i+1}</b>

              <textarea
                value={r.question}
                onChange={e=>handleChange(i,'question',e.target.value)}
              />

              {r.image && <img src={r.image} width="120" />}

              {['option_a','option_b','option_c','option_d'].map(op=>(
                <input
                  key={op}
                  value={r[op]}
                  onChange={e=>handleChange(i,op,e.target.value)}
                />
              ))}

              <input
                value={r.correct_answer}
                onChange={e=>handleChange(i,'correct_answer',e.target.value)}
              />

              <input
                value={r.difficulty}
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
