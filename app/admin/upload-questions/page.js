'use client'

import { supabase } from '../../../lib/supabase'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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

const MAX_FILE_SIZE = 5 * 1024 * 1024

export default function UploadQuestionsPage() {

  const router = useRouter()

  const [file, setFile] = useState(null)
  const [previewRows, setPreviewRows] = useState([])
  const [isPreview, setIsPreview] = useState(false)
  const [selectedExam, setSelectedExam] = useState('')
  const [exams, setExams] = useState([])

  const [errors, setErrors] = useState([])
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    loadExams()
  }, [])

  async function loadExams() {
    const collegeId = await getAdminCollege()

    const { data } = await supabase
      .from('exams')
      .select('*')
      .eq('college_id', collegeId)

    setExams(data || [])
  }

  function showToast(message, type = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  /* ================= TEMPLATE ================= */

  function downloadTemplate() {
    const sampleData = [{
      exam_category: 'JEE_MAINS',
      subject: 'Physics',
      chapter: 'Kinematics',
      question: 'Sample Question?',
      option_a: 'A',
      option_b: 'B',
      option_c: 'C',
      option_d: 'D',
      correct_answer: 'A'
    }]

    const ws = XLSX.utils.json_to_sheet(sampleData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Template')
    XLSX.writeFile(wb, 'question_template.xlsx')
  }

  /* ================= VALIDATION ================= */

  function validateRow(row, index) {
    const rowErrors = []

    REQUIRED_COLUMNS.forEach(col => {
      if (!row[col] || String(row[col]).trim() === '') {
        rowErrors.push(`Row ${index + 2}: Missing ${col}`)
      }
    })

    if (
      row.correct_answer &&
      !['A', 'B', 'C', 'D'].includes(String(row.correct_answer).trim())
    ) {
      rowErrors.push(`Row ${index + 2}: correct_answer must be A/B/C/D`)
    }

    return rowErrors
  }

  /* ================= PREVIEW ================= */

  async function handlePreview() {

    if (!file) {
      showToast('Please select file', 'error')
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      showToast('File too large (max 5MB)', 'error')
      return
    }

    setErrors([])

    try {
      const buffer = await file.arrayBuffer()
      const wb = XLSX.read(buffer)
      const sheet = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(sheet)

      if (!rows.length) {
        showToast('Empty file', 'error')
        return
      }

      const headers = Object.keys(rows[0])
      const missing = REQUIRED_COLUMNS.filter(c => !headers.includes(c))

      if (missing.length) {
        setErrors(missing.map(m => `Missing column: ${m}`))
        showToast('Missing columns', 'error')
        return
      }

      let allErrors = []
      rows.forEach((row, i) => {
        allErrors.push(...validateRow(row, i))
      })

      if (allErrors.length) {
        setErrors(allErrors)
        showToast('Validation failed', 'error')
        return
      }

      setPreviewRows(rows)
      setIsPreview(true)

    } catch {
      showToast('Invalid file', 'error')
    }
  }

  /* ================= UPLOAD ================= */

  async function handleUpload() {

    if (!previewRows.length) return

    const collegeId = await getAdminCollege()

    setUploading(true)
    setProgress(40)

    try {

      const payload = previewRows.map(r => ({
        ...r,
        college_id: collegeId
      }))

      const { data: inserted, error } = await supabase
        .from('question_bank')
        .insert(payload)
        .select()

      if (error) {
        showToast('Upload failed', 'error')
        setUploading(false)
        return
      }

      if (selectedExam) {
        await supabase.from('exam_questions').insert(
          inserted.map(q => ({
            exam_id: selectedExam,
            question_id: q.id
          }))
        )
      }

      setProgress(100)
      showToast('Uploaded successfully')

      // redirect after short delay
      setTimeout(() => {
        router.push('/admin')
      }, 1200)

    } catch {
      showToast('Upload failed', 'error')
    }

    setUploading(false)
  }

  /* ================= UI ================= */

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        <div style={styles.headerRow}>
          <h1 style={styles.heading}>📤 Upload Question Bank</h1>

          <button style={styles.templateBtn} onClick={downloadTemplate}>
            ⬇ Download Template
          </button>
        </div>

        <div style={styles.section}>
          <label>Upload Excel</label>
          <input type="file" onChange={(e) => setFile(e.target.files[0])} />
        </div>

        <div style={styles.section}>
          <label>Map to Exam</label>
          <select onChange={(e) => setSelectedExam(e.target.value)}>
            <option value="">Select</option>
            {exams.map(e => (
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

        {errors.length > 0 && (
          <div style={styles.errorBox}>
            {errors.slice(0, 5).map((e, i) => <div key={i}>{e}</div>)}
          </div>
        )}

        {toast && (
          <div style={{
            ...styles.toast,
            background: toast.type === 'error' ? '#dc2626' : '#16a34a'
          }}>
            {toast.message}
          </div>
        )}

      </div>
    </div>
  )
}

/* styles unchanged */

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f3f4f6',
    padding: 30,
    display: 'flex',
    justifyContent: 'center'
  },
  card: {
    width: '100%',
    maxWidth: 900,
    background: '#fff',
    padding: 25,
    borderRadius: 12,
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  heading: {
    fontSize: 22,
    fontWeight: 600
  },
  templateBtn: {
    padding: '8px 14px',
    background: '#f59e0b',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer'
  },
  section: {
    marginBottom: 20
  },
  label: {
    display: 'block',
    marginBottom: 6,
    fontWeight: 500
  },
  input: {
    width: '100%',
    padding: 10,
    borderRadius: 6,
    border: '1px solid #ccc'
  },
  fileName: {
    marginTop: 8,
    color: 'green',
    fontSize: 14
  },
  buttonRow: {
    marginBottom: 20
  },
  previewBtn: {
    padding: 10,
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer'
  },
  uploadBtn: {
    padding: 10,
    background: '#16a34a',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer'
  },
  previewBox: {
    marginTop: 20
  },
  tableWrapper: {
    overflowX: 'auto',
    border: '1px solid #ddd',
    borderRadius: 8
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  }
}
