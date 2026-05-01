'use client'

import { useState } from 'react'
import * as XLSX from 'xlsx'
import JSZip from 'jszip'
import 'katex/dist/katex.min.css'
import renderMathInElement from 'katex/contrib/auto-render'

const BATCH_SIZE = 25

export default function UploadExcelPage(){

  const [excelFile,setExcelFile] = useState(null)
  const [zipFile,setZipFile] = useState(null)

  const [batches,setBatches] = useState([])
  const [currentBatch,setCurrentBatch] = useState(0)

  const [imageMap,setImageMap] = useState({})

  // ================= ZIP =================
  async function processZip(file){
    if(!file) return {}

    const zip = await JSZip.loadAsync(file)
    const map = {}

    for(const f in zip.files){
      const fileObj = zip.files[f]
      if(!fileObj.dir){

        // 🔥 FIX: remove folder path
        const cleanName = fileObj.name.split('/').pop().trim()

        map[cleanName] = await fileObj.async('blob')
      }
    }

    console.log('ZIP FILES:', Object.keys(map)) // ✅ DEBUG

    return map
  }

  // ================= PREVIEW =================
  async function handlePreview(){

    if(!excelFile){
      alert('Upload Excel file first')
      return
    }

    const buffer = await excelFile.arrayBuffer()
    const wb = XLSX.read(buffer)

    const rawRows = XLSX.utils.sheet_to_json(
      wb.Sheets[wb.SheetNames[0]],
      { defval: '' }
    )

    const rows = rawRows.filter(r => Object.keys(r).length > 0)

    const zipMap = await processZip(zipFile)
    setImageMap(zipMap)

    const enriched = rows.map(r=>({
      ...r,
      rejected:false
    }))

    const temp=[]
    for(let i=0;i<enriched.length;i+=BATCH_SIZE){
      temp.push(enriched.slice(i,i+BATCH_SIZE))
    }

    setBatches(temp)
    setCurrentBatch(0)
  }

  // ================= UPDATE =================
  function updateField(i,field,value){
    const copy=[...batches]
    copy[currentBatch][i][field]=value
    setBatches(copy)
  }

  const batch = batches[currentBatch] || []

  return (
    <div style={{maxWidth:1100,margin:'auto',padding:20}}>

      <h2>📊 Excel Upload</h2>

      {/* FILE INPUTS */}
      <input type="file" onChange={e=>setExcelFile(e.target.files[0])}/>
      <br/><br/>
      <input type="file" onChange={e=>setZipFile(e.target.files[0])}/>
      <br/><br/>

      <button onClick={handlePreview}>Preview</button>

      <br/><br/>

      {/* QUESTIONS */}
      {batch.map((r,i)=>(

        <div key={i} style={{
          display:'flex',
          gap:20,
          marginBottom:20,
          border:'1px solid #ddd',
          padding:10
        }}>

          {/* ================= LEFT SIDE (EDIT) ================= */}
          <div style={{flex:1}}>

            <b>Q{i+1}</b>

            <textarea
              value={r.question || ''}
              onChange={e=>updateField(i,'question',e.target.value)}
              style={{width:'100%',height:80}}
            />

            {['option_a','option_b','option_c','option_d'].map(op=>(
              <textarea
                key={op}
                value={r[op] || ''}
                onChange={e=>updateField(i,op,e.target.value)}
                style={{width:'100%',height:50,marginTop:5}}
              />
            ))}

          </div>

          {/* ================= RIGHT SIDE (PREVIEW) ================= */}
          <div style={{
            flex:1,
            background:'#f8fafc',
            padding:10
          }}>

            {/* QUESTION */}
            <div
              ref={(el)=>{
                if(el){
                  el.innerHTML = r.question || ''
                  renderMathInElement(el)
                }
              }}
            />

            {/* QUESTION IMAGE */}
            {r.image_name?.trim() && imageMap[r.image_name.trim()] && (
              <img
                src={URL.createObjectURL(imageMap[r.image_name.trim()])}
                style={{maxWidth:200, marginTop:10}}
              />
            )}

            {/* OPTIONS */}
            {['option_a','option_b','option_c','option_d'].map((op,idx)=>(
              <div key={op} style={{marginTop:10}}>
                <b>{String.fromCharCode(65+idx)}.</b>

                <span
                  ref={(el)=>{
                    if(el){
                      el.innerHTML = r[op] || ''
                      renderMathInElement(el)
                    }
                  }}
                />
              </div>
            ))}

            {/* EXPLANATION */}
            {r.explanation && (
              <div style={{marginTop:10}}>
                <b>Explanation:</b>

                <div
                  ref={(el)=>{
                    if(el){
                      el.innerHTML = r.explanation || ''
                      renderMathInElement(el)
                    }
                  }}
                />
              </div>
            )}

            {/* EXPLANATION IMAGE */}
            {r.explanation_image_name?.trim() && imageMap[r.explanation_image_name.trim()] && (
              <img
                src={URL.createObjectURL(imageMap[r.explanation_image_name.trim()])}
                style={{maxWidth:200, marginTop:10}}
              />
            )}

          </div>

        </div>

      ))}

    </div>
  )
}
