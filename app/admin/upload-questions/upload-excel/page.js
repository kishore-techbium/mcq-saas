'use client'

import { supabase } from '../../../../lib/supabase'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'
import { getAdminCollege } from '../../../../lib/getAdminCollege'

const REQUIRED_COLUMNS = [
  'exam_category','subject','chapter','subtopic','difficulty','question',
  'option_a','option_b','option_c','option_d','correct_answer'
]

const MAX_FILE_SIZE = 20 * 1024 * 1024

export default function UploadExcelPage() {

  const router = useRouter()

  const [file, setFile] = useState(null)
  const [previewRows, setPreviewRows] = useState([])
  const [isPreview, setIsPreview] = useState(false)
  const [selectedExam, setSelectedExam] = useState('')
  const [exams, setExams] = useState([])

  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 25

  const [errors, setErrors] = useState([])
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => { loadExams() }, [])

  async function loadExams() {
    const collegeId = await getAdminCollege()
    const { data } = await supabase
      .from('exams')
      .select('*')
      .eq('college_id', collegeId)

    setExams(data || [])
  }

  function showToast(message, type='success') {
    setToast({ message, type })
    setTimeout(()=>setToast(null),3000)
  }

  function validateRow(row,index){
    const errs=[]

    REQUIRED_COLUMNS.forEach(col=>{
      if(row[col] === undefined || row[col] === null || String(row[col]).trim()===''){
        errs.push(`Row ${index+2}: Missing ${col}`)
      }
    })

    if(row.difficulty && !['Easy','Medium','Hard'].includes(row.difficulty)){
      errs.push(`Row ${index+2}: Invalid difficulty`)
    }

    if(row.correct_answer && !['A','B','C','D'].includes(row.correct_answer)){
      errs.push(`Row ${index+2}: Invalid answer`)
    }

    return errs
  }

  async function handlePreview(){
    if(!file) return showToast('Select file','error')
    if(file.size>MAX_FILE_SIZE) return showToast('File too large','error')

    try{
      const buffer=await file.arrayBuffer()
      const wb=XLSX.read(buffer)
      const rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]])

      if(!rows.length) return showToast('Empty file','error')

      const headers=Object.keys(rows[0])
      const missing=REQUIRED_COLUMNS.filter(c=>!headers.includes(c))
      if(missing.length){
        setErrors(missing.map(m=>`Missing ${m}`))
        return showToast('Missing columns','error')
      }

      let allErrors=[]
      rows.forEach((r,i)=>allErrors.push(...validateRow(r,i)))

      if(allErrors.length){
        setErrors(allErrors)
        return showToast('Validation failed','error')
      }

      setPreviewRows(rows.slice(0,100))
      setIsPreview(true)
      setCurrentPage(1)

    }catch{
      showToast('Invalid file','error')
    }
  }

  async function handleUpload(){

    if(!previewRows.length) return

    const collegeId=await getAdminCollege()

    setUploading(true)
    setProgress(40)

    try{

      const payload=previewRows.map(r=>({...r,college_id:collegeId}))

      const {data:inserted,error}=await supabase
        .from('question_bank')
        .insert(payload)
        .select()

      if(error) throw error

      if(selectedExam){
        await supabase.from('exam_questions').insert(
          inserted.map(q=>({exam_id:selectedExam,question_id:q.id}))
        )
      }

      setProgress(100)
      showToast('Uploaded successfully')

      setTimeout(()=>router.push('/admin'),1000)

    }catch{
      showToast('Upload failed','error')
    }

    setUploading(false)
  }

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedRows = previewRows.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        <h1 style={styles.heading}>📊 Upload Questions via Excel</h1>

        <div style={styles.section}>
          <input 
            type="file" 
            accept=".xlsx,.xls"
            onChange={e=>setFile(e.target.files[0])}
          />
        </div>

        <div style={styles.section}>
          <select onChange={e=>setSelectedExam(e.target.value)}>
            <option value="">Select Exam (Optional)</option>
            {exams.map(e=>(
              <option key={e.id} value={e.id}>{e.title}</option>
            ))}
          </select>
        </div>

        {!isPreview && (
          <button style={styles.previewBtn} onClick={handlePreview}>
            Preview
          </button>
        )}

        {isPreview && (
          <button style={styles.uploadBtn} onClick={handleUpload}>
            {uploading ? `Uploading ${progress}%` : 'Upload Questions'}
          </button>
        )}

        {isPreview && previewRows.length>0 && (
          <div style={styles.previewBox}>
            <h3>Preview ({previewRows.length})</h3>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>#</th><th>Question</th><th>A</th><th>B</th><th>C</th><th>D</th><th>Ans</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((r,i)=>(
                  <tr key={i}>
                    <td>{startIndex + i + 1}</td>
                    <td>{r.question}</td>
                    <td>{r.option_a}</td>
                    <td>{r.option_b}</td>
                    <td>{r.option_c}</td>
                    <td>{r.option_d}</td>
                    <td>{r.correct_answer}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{marginTop:10}}>
              {Array.from({length: Math.ceil(previewRows.length / ITEMS_PER_PAGE)}).map((_,i)=>(
                <button
                  key={i}
                  onClick={()=>setCurrentPage(i+1)}
                  style={{
                    marginRight:5,
                    background: currentPage===i+1 ? '#2563eb' : '#ddd',
                    color: currentPage===i+1 ? '#fff' : '#000'
                  }}
                >
                  {i+1}
                </button>
              ))}
            </div>

          </div>
        )}

        {errors.length>0 && (
          <div style={styles.errorBox}>
            {errors.slice(0,5).map((e,i)=><div key={i}>{e}</div>)}
          </div>
        )}

        {toast && (
          <div style={{
            ...styles.toast,
            background: toast.type==='error'?'#dc2626':'#16a34a'
          }}>
            {toast.message}
          </div>
        )}

      </div>
    </div>
  )
}

const styles = {
  page:{padding:30,display:'flex',justifyContent:'center'},
  card:{maxWidth:900,width:'100%',background:'#fff',padding:20},
  heading:{fontSize:22},
  section:{marginBottom:15},
  previewBtn:{background:'#2563eb',color:'#fff',padding:10},
  uploadBtn:{background:'#16a34a',color:'#fff',padding:10},
  previewBox:{marginTop:20},
  table:{width:'100%',borderCollapse:'collapse'},
  errorBox:{background:'#fee2e2',marginTop:10},
  toast:{position:'fixed',bottom:20,right:20,color:'#fff',padding:10}
}