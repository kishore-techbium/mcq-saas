'use client'

import { supabase } from '../../../lib/supabase'
import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { getAdminCollege } from '../../../lib/getAdminCollege'

const REQUIRED_COLUMNS = [
  'exam_category',
  'subject',
  'chapter',
  'question',
  'option_a',
  'option_b',
  'option_c',
  'option_d',
  'correct_answer'
]

export default function UploadQuestionsPage() {

  const [file, setFile] = useState(null)
  const [previewRows, setPreviewRows] = useState([])
  const [isPreview, setIsPreview] = useState(false)
  const [selectedExam, setSelectedExam] = useState('')
  const [exams, setExams] = useState([])

  useEffect(() => {
    loadExams()
  }, [])

  async function loadExams() {

    const collegeId = await getAdminCollege()

    const { data } = await supabase
      .from('exams')
      .select('*')
      .eq('college_id', collegeId) // ✅ FILTER

    setExams(data || [])
  }

  async function handlePreview() {

    const buffer = await file.arrayBuffer()
    const wb = XLSX.read(buffer)
    const sheet = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(sheet)

    setPreviewRows(rows)
    setIsPreview(true)
  }

  async function handleUpload() {

    const collegeId = await getAdminCollege()

    // ✅ ADD college_id here
    const payload = previewRows.map(row => ({
      ...row,
      college_id: collegeId
    }))

    const { data: inserted } = await supabase
      .from('question_bank')
      .insert(payload)
      .select()

    if (selectedExam) {
      await supabase.from('exam_questions').insert(
        inserted.map(q => ({
          exam_id: selectedExam,
          question_id: q.id
        }))
      )
    }

    alert('Uploaded successfully')
    setPreviewRows([])
    setIsPreview(false)
  }

  return (
    <div style={{ padding: 30 }}>

      <h1>Upload Questions</h1>

      <input type="file" onChange={(e) => setFile(e.target.files[0])} />

      <select onChange={(e) => setSelectedExam(e.target.value)}>
        <option>Select Exam</option>
        {exams.map(e => (
          <option key={e.id} value={e.id}>{e.title}</option>
        ))}
      </select>

      {!isPreview && <button onClick={handlePreview}>Preview</button>}
      {isPreview && <button onClick={handleUpload}>Upload</button>}

      {isPreview && (
        <div>
          {previewRows.map((r, i) => (
            <p key={i}>{r.question}</p>
          ))}
        </div>
      )}

    </div>
  )
}
