'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function UploadQuestionsPage() {

  const router = useRouter()
  const [uploadType, setUploadType] = useState('excel')

  function handleContinue() {
    if(uploadType === 'excel'){
      router.push('/admin/upload-questions/upload-excel')
    } else {
      router.push('/admin/upload-questions/upload-word')
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        <h1 style={styles.heading}>📤 Upload Question Bank</h1>

        {/* Upload Type Selection */}
        <div style={styles.section}>
          <h3>Select Upload Method</h3>

          <label style={styles.radio}>
            <input 
              type="radio" 
              value="excel" 
              checked={uploadType==='excel'} 
              onChange={()=>setUploadType('excel')}
            />
            <span style={styles.labelTitle}>Excel Upload</span>
          </label>

          <div style={styles.desc}>
            Best for bulk upload (100+ questions). Structured and fast.
          </div>

          <label style={{...styles.radio, marginTop:15}}>
            <input 
              type="radio" 
              value="word" 
              checked={uploadType==='word'} 
              onChange={()=>setUploadType('word')}
            />
            <span style={styles.labelTitle}>Word Upload</span>
          </label>

          <div style={styles.desc}>
            Best for teachers. Supports images, formulas, and formatted questions.
          </div>
        </div>

        {/* Templates */}
        <div style={styles.section}>
          <h3>Download Templates</h3>

          <div style={styles.templateBox}>
            <button 
              style={styles.templateBtn}
              onClick={()=>window.open('/api/download-template')}
            >
              📊 Download Excel Template
            </button>

            <button 
              style={styles.templateBtn}
              onClick={()=>window.open('/api/download-word-template')}
            >
              📄 Download Word Template
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div style={styles.section}>
          <h3>Instructions</h3>

          {uploadType === 'excel' ? (
            <ul style={styles.list}>
              <li>All columns are mandatory except explanation</li>
              <li>Include: subject, chapter, subtopic, difficulty</li>
              <li>Difficulty must be: Easy / Medium / Hard</li>
              <li>Correct answer must be: A / B / C / D</li>
              <li>Do not change column names</li>
              <li>Max file size: 20MB</li>
            </ul>
          ) : (
            <ul style={styles.list}>
              <li>Follow the Word template strictly</li>
              <li>Use labels like: Question, Q, A, B, Answer</li>
              <li>Images will be automatically processed</li>
              <li>Do not change structure of template</li>
              <li>Math symbols (Σ, π) are supported</li>
              <li>Max file size: 20MB</li>
            </ul>
          )}
        </div>

        {/* Continue Button */}
        <button style={styles.continueBtn} onClick={handleContinue}>
          Continue →
        </button>

      </div>
    </div>
  )
}

const styles = {
  page:{
    padding:30,
    display:'flex',
    justifyContent:'center',
    background:'#f9fafb',
    minHeight:'100vh'
  },
  card:{
    maxWidth:700,
    width:'100%',
    background:'#fff',
    padding:25,
    borderRadius:10,
    boxShadow:'0 4px 12px rgba(0,0,0,0.08)'
  },
  heading:{
    fontSize:24,
    marginBottom:20
  },
  section:{
    marginBottom:25
  },
  radio:{
    display:'flex',
    alignItems:'center',
    gap:10,
    fontWeight:500
  },
  labelTitle:{
    fontSize:16
  },
  desc:{
    fontSize:13,
    color:'#555',
    marginLeft:25,
    marginTop:5
  },
  templateBox:{
    display:'flex',
    gap:10,
    flexWrap:'wrap'
  },
  templateBtn:{
    background:'#2563eb',
    color:'#fff',
    padding:'10px 15px',
    border:'none',
    borderRadius:6,
    cursor:'pointer'
  },
  list:{
    paddingLeft:20,
    fontSize:14,
    lineHeight:1.6
  },
  continueBtn:{
    width:'100%',
    background:'#16a34a',
    color:'#fff',
    padding:12,
    fontSize:16,
    border:'none',
    borderRadius:6,
    cursor:'pointer'
  }
}
