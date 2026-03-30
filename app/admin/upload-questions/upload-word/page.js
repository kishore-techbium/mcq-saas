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

  function groupStats(data, key){
    const map = {}
    data.forEach(r=>{
      const val = r[key] || 'Unknown'
      map[val] = (map[val] || 0) + 1
    })
    return map
  }

  function buildStats(data){
    return {
      subject: groupStats(data,'subject'),
      chapter: groupStats(data,'chapter'),
      subtopic: groupStats(data,'subtopic'),
      exam_category: groupStats(data,'exam_category')
    }
  }

  async function parseWord(file){

    setStatus('Processing Word...')
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

    const blocks = html
      .split(/Question\s+\d+:/i)
      .filter(q => q.trim())

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

      return {
        exam_category: get('Exam Category'),
        subject: get('Subject'),
        chapter: get('Chapter'),
        subtopic: get('Subtopic'),
        difficulty: get('Difficulty'),
        question: get('Q'),
        option_a: getOption('A'),
        option_b: getOption('B'),
        option_c: getOption('C'),
        option_d: getOption('D'),
        correct_answer: get('Answer'),
        explanation: get('Explanation')
      }
    })
  }

  function validate(r){
    const e=[]
    if(!r.question) e.push('Question')
    if(!['A','B','C','D'].includes(r.correct_answer)) e.push('Answer')
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

  async function handleUpload(){

    setUploading(true)
    setIsCompleted(false)
    setIsCancelled(false)
    setStatus('Uploading...')
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

      const { data } = await supabase
        .from('question_bank')
        .insert([{...validRows[i], college_id:collegeId}])
        .select()

      uploaded.push(data[0])

      setProgress(Math.round(((i+1)/validRows.length)*100))
    }

    setUploading(false)
    setIsCompleted(true)
    setStatus('Upload Completed')

    setStats(buildStats(uploaded))
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
          <div style={{
            width:`${progress}%`,
            background:'#2563eb',
            height:10
          }}/>
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
            <div style={{marginTop:20,background:'#ecfdf5',padding:15}}>
              <h3>Upload Statistics</h3>

              <pre>{JSON.stringify(stats,null,2)}</pre>
            </div>
          )}

          {rows.map((r,i)=>(
            <div key={i} style={{marginTop:10}}>
              <b>Q{i+1}:</b> {r.question}
            </div>
          ))}
        </>
      )}

    </div>
  )
}
