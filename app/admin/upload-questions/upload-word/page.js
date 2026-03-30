'use client'
export const runtime = 'nodejs'

import { supabase } from '../../../../lib/supabase'
import { useState, useEffect } from 'react'
import mammoth from 'mammoth'
import { getAdminCollege } from '../../../../lib/getAdminCollege'

export default function UploadWordPage(){

  const [file,setFile] = useState(null)
  const [rows,setRows] = useState([])
  const [errors,setErrors] = useState({})
  const [isPreview,setIsPreview] = useState(false)

  const [uploading,setUploading] = useState(false)
  const [progress,setProgress] = useState(0)
  const [status,setStatus] = useState('')
  const [stats,setStats] = useState(null)

  const clean = (t)=> t?.replace(/\s+/g,' ').trim()

  // 🔥 NORMALIZE ANSWER
  const normalizeAnswer = (val)=>{
    if(!val) return ''
    return val.replace(/[^A-D]/gi,'').toUpperCase()
  }

  async function parseWord(file){

    setStatus('Processing...')
    setProgress(30)

    const buffer = await file.arrayBuffer()

    const result = await mammoth.convertToHtml({ arrayBuffer:buffer })

    const html = result.value

    const blocks = html
      .split(/Question\s+\d+:/i)
      .map(b => b.trim())
      .filter(b => b && b.includes('Q:'))

    setProgress(70)

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
        exam_category:get('Exam Category') || 'JEE_MAINS',
        subject:get('Subject') || 'General',
        chapter:get('Chapter') || 'General',
        subtopic:get('Subtopic') || 'General',
        difficulty:get('Difficulty') || 'Medium',

        question:get('Q'),

        option_a:getOption('A') || 'Option A',
        option_b:getOption('B') || 'Option B',
        option_c:getOption('C') || 'Option C',
        option_d:getOption('D') || 'Option D',

        correct_answer: normalizeAnswer(get('Answer')) || 'A',
        explanation:get('Explanation') || ''
      }
    })
  }

  // 🔥 RELAXED VALIDATION
  function validate(r){
    const e=[]

    if(!r.question) e.push('Question')

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

    const parsed = await parseWord(file)

    setRows(parsed)
    setIsPreview(true)
    revalidate(parsed)

    setProgress(100)
    setStatus(`Preview Ready (${parsed.length})`)
  }

  const delay = (ms) => new Promise(res => setTimeout(res, ms))

  async function handleUpload(){

    setUploading(true)
    setStatus('Uploading...')
    setProgress(0)

    const collegeId = await getAdminCollege()

    let uploaded = []

    for(let i=0;i<rows.length;i++){

      const r = rows[i]

      const cleanedRow = {
        ...r,
        correct_answer: normalizeAnswer(r.correct_answer),
        college_id: collegeId
      }

      const { data, error } = await supabase
        .from('question_bank')
        .insert([cleanedRow])
        .select()

      if(!error && data){
        uploaded.push(data[0])
      }

      const percent = Math.round(((i+1)/rows.length)*100)

      setProgress(percent)
      setStatus(`Uploading ${i+1}/${rows.length}`)

      await delay(5)
    }

    setUploading(false)
    setStatus(`Upload Completed (${uploaded.length})`)

    setStats({
      total: rows.length,
      uploaded: uploaded.length,
      skipped: rows.length - uploaded.length
    })
  }

  return(
    <div style={{padding:20}}>

      <h2>Word Upload</h2>

      <input type="file" onChange={e=>setFile(e.target.files[0])}/>

      <div style={{marginTop:10}}>
        <div style={{width:'100%',background:'#ddd',height:10}}>
          <div style={{width:`${progress}%`,background:'blue',height:10}}/>
        </div>
        <div>{status}</div>
      </div>

      {!isPreview && <button onClick={handlePreview}>Preview</button>}

      {isPreview && (
        <>
          <button onClick={handleUpload}>
            {uploading ? 'Uploading...' : 'Upload'}
          </button>

          {stats && (
            <div style={{marginTop:15,background:'#ecfdf5',padding:10}}>
              <b>Upload Summary</b><br/>
              Total: {stats.total}<br/>
              Uploaded: {stats.uploaded}<br/>
              Skipped: {stats.skipped}
            </div>
          )}

          {rows.map((r,i)=>(
            <div key={i} style={{border:'1px solid #ccc',marginTop:10,padding:10}}>
              <b>Q{i+1}</b>
              <div>{r.question}</div>
              <div>{r.option_a}</div>
              <div>{r.option_b}</div>
              <div>{r.option_c}</div>
              <div>{r.option_d}</div>
              <div>Answer: {r.correct_answer}</div>
            </div>
          ))}
        </>
      )}

    </div>
  )
}
