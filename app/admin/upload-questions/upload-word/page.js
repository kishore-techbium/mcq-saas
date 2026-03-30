'use client'
export const runtime = 'nodejs'

import { supabase } from '../../../../lib/supabase'
import { useState } from 'react'
import mammoth from 'mammoth'
import { getAdminCollege } from '../../../../lib/getAdminCollege'

export default function UploadWordPage(){

  const [file,setFile] = useState(null)
  const [rows,setRows] = useState([])
  const [isPreview,setIsPreview] = useState(false)

  const [uploading,setUploading] = useState(false)
  const [progress,setProgress] = useState(0)
  const [status,setStatus] = useState('')
  const [stats,setStats] = useState(null)

  const clean = (t)=> t?.replace(/\s+/g,' ').trim()

  // ✅ IMAGE + TEXT PARSER (FINAL)
  async function parseWord(file){

    setStatus('Processing file...')
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

    setProgress(60)

    const html = result.value

    const blocks = html
      .split(/Question\s+\d+:/i)
      .map(b => b.trim())
      .filter(b => b && b.includes('Q:'))

    setProgress(80)

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

      const imgMatch = block.match(/<img[^>]+src="([^"]+)"/i)

      return {
        question:get('Q'),
        image: imgMatch ? imgMatch[1] : '',
        option_a:getOption('A'),
        option_b:getOption('B'),
        option_c:getOption('C'),
        option_d:getOption('D'),
        correct_answer:get('Answer')?.trim().toUpperCase() || 'A',
        difficulty:get('Difficulty') || 'Medium'
      }
    })
  }

  async function handlePreview(){

    if(!file) return alert('Select file')

    const parsed = await parseWord(file)

    setRows(parsed)
    setIsPreview(true)

    setProgress(100)
    setStatus(`Preview Ready (${parsed.length})`)
  }

  const delay = (ms)=> new Promise(res=>setTimeout(res,ms))

  async function handleUpload(){

    setUploading(true)
    setStatus('Uploading...')
    setProgress(0)

    const collegeId = await getAdminCollege()

    let uploaded = []

    for(let i=0;i<rows.length;i++){

      const r = rows[i]

      const { data } = await supabase
        .from('question_bank')
        .insert([{
          ...r,
          correct_answer:r.correct_answer?.trim().toUpperCase(),
          college_id:collegeId
        }])
        .select()

      if(data) uploaded.push(data[0])

      setProgress(Math.round(((i+1)/rows.length)*100))
      setStatus(`Uploading ${i+1}/${rows.length}`)

      await delay(5)
    }

    setUploading(false)
    setStatus(`Upload Completed (${uploaded.length})`)

    setStats({
      total: rows.length,
      uploaded: uploaded.length
    })
  }

  function handleChange(i,field,value){
    const updated = [...rows]
    updated[i][field] = value
    setRows(updated)
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
            <div style={{marginTop:10,background:'#ecfdf5',padding:10}}>
              Uploaded: {stats.uploaded} / {stats.total}
            </div>
          )}

          {rows.map((r,i)=>(
            <div key={i} style={{border:'1px solid #ccc',marginTop:10,padding:10}}>

              <b>Q{i+1}</b>

              <textarea
                value={r.question}
                onChange={e=>handleChange(i,'question',e.target.value)}
              />

              {r.image && (
                <img src={r.image} width="150" style={{marginTop:10}}/>
              )}

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

            </div>
          ))}
        </>
      )}

    </div>
  )
}
