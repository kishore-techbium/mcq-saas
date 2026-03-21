'use client'

import { supabase } from '../../../lib/supabase'
import { isAdmin } from '../../../lib/isAdmin'
import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'

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

  const [file, setFile] = useState(null)
  const [errors, setErrors] = useState([])
  const [summary, setSummary] = useState(null)
  const [status, setStatus] = useState('')
  const [successCount, setSuccessCount] = useState(0)
  const [exams, setExams] = useState([])
  const [selectedExam, setSelectedExam] = useState('')
  const [progress, setProgress] = useState(0)
  const [toast, setToast] = useState(null)
  const [uploading, setUploading] = useState(false)

  // ✅ NEW STATES
  const [previewRows, setPreviewRows] = useState([])
  const [isPreview, setIsPreview] = useState(false)

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getUser()
      if (!data.user || !isAdmin(data.user)) {
        window.location.href = '/'
      }
console.log("🚀 UPLOAD PAGE LOADED")
      const { data: examList } = await supabase
        .from('exams')
        .select('id, title, created_at')
        .order('created_at', { ascending: false })

      setExams(examList || [])
    }
    init()
  }, [])

  function showToast(message, type = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  function downloadTemplate() {
    const templateData = [{
      exam_category: 'JEE MAINS',
      subject: 'Mathematics',
      chapter: 'Limits',
      question: 'Sample question?',
      option_a: 'Option A',
      option_b: 'Option B',
      option_c: 'Option C',
      option_d: 'Option D',
      correct_answer: 'A'
    }]

    const ws = XLSX.utils.json_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Template')
    XLSX.writeFile(wb, 'Question_Bank_Template.xlsx')
  }

  function validateRow(row, index) {
    const rowErrors = []

    REQUIRED_COLUMNS.forEach(col => {
      if (
        row[col] === undefined ||
        row[col] === null ||
        String(row[col]).trim() === ''
      ) {
        rowErrors.push(`Row ${index + 2}: Missing "${col}"`)
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

  // ✅ STEP 1: PREVIEW
  async function handlePreview() {

    if (!file) {
      showToast('Please select a file first.', 'error')
      return
    }

    setErrors([])
    setSummary(null)

    try {
      const buffer = await file.arrayBuffer()
      const wb = XLSX.read(buffer)
      const sheet = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(sheet)

      if (!rows || rows.length === 0) {
        showToast('Excel file is empty.', 'error')
        return
      }

      const headers = Object.keys(rows[0])
      const missingHeaders = REQUIRED_COLUMNS.filter(
        col => !headers.includes(col)
      )

      if (missingHeaders.length > 0) {
        setErrors(missingHeaders.map(col => `Missing column: ${col}`))
        showToast('Missing required columns.', 'error')
        return
      }

      let allErrors = []
      rows.forEach((row, index) => {
        allErrors.push(...validateRow(row, index))
      })

      if (allErrors.length > 0) {
        setErrors(allErrors)
        showToast('Validation failed.', 'error')
        return
      }

      // ✅ SET PREVIEW
      setPreviewRows(rows)
      setIsPreview(true)

    } catch (err) {
      showToast('Invalid Excel file.', 'error')
    }
  }

  // ✅ STEP 2: FINAL UPLOAD
  async function handleUpload() {

    if (previewRows.length === 0) {
      showToast('No data to upload.', 'error')
      return
    }

    setUploading(true)
    setProgress(50)

    try {

      const { data: inserted, error } = await supabase
        .from('question_bank')
        .insert(previewRows)
        .select()

      if (error) {
        showToast('Upload failed.', 'error')
        setUploading(false)
        return
      }

      if (selectedExam) {
        const mappings = inserted.map(q => ({
          exam_id: selectedExam,
          question_id: q.id
        }))

        await supabase.from('exam_questions').insert(mappings)
      }

      setProgress(100)

      let summaryData = {}
      previewRows.forEach(row => {
        const key = `${row.exam_category} → ${row.subject} → ${row.chapter}`
        summaryData[key] = (summaryData[key] || 0) + 1
      })

      setSuccessCount(previewRows.length)
      setSummary(summaryData)
      showToast('Questions uploaded successfully!')

      // reset
      setPreviewRows([])
      setIsPreview(false)
      setFile(null)

    } catch (err) {
      showToast('Upload failed.', 'error')
    }

    setUploading(false)
  }

  return (
    <div style={styles.page}>
      <h1>📤 Upload Question Bank</h1>

      <button style={styles.templateBtn} onClick={downloadTemplate}>
        ⬇ Download Template
      </button>

      <div style={{ marginTop: 20 }}>
        <label>Select File:</label>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => setFile(e.target.files[0])}
        />
        {file && <p>Selected: {file.name}</p>}
      </div>

      <div style={{ marginTop: 20 }}>
        <label>Optional: Map to Exam</label>
        <select
          value={selectedExam}
          onChange={(e) => setSelectedExam(e.target.value)}
        >
          <option value="">-- No Mapping --</option>
          {exams.map(exam => (
            <option key={exam.id} value={exam.id}>
              {exam.title}
            </option>
          ))}
        </select>
      </div>

      {/* ✅ PREVIEW BUTTON */}
      {!isPreview && (
        <button style={styles.uploadBtn} onClick={handlePreview}>
          Preview File
        </button>
      )}

      {/* ✅ CONFIRM UPLOAD */}
      {isPreview && (
        <button
          style={styles.uploadBtn}
          onClick={handleUpload}
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : 'Confirm Upload'}
        </button>
      )}

      {/* ✅ PREVIEW TABLE */}
      
{isPreview && previewRows.length > 0 && (
  <div style={styles.previewBox}>
    <h3>Preview ({previewRows.length} questions)</h3>

    <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th>#</th>
            <th>Question</th>
            <th>A</th>
            <th>B</th>
            <th>C</th>
            <th>D</th>
            <th>Ans</th>
            <th>Difficulty</th>
            <th>Explanation</th>
          </tr>
        </thead>

        <tbody>
          {previewRows.map((row, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td>{row.question}</td>
              <td>{row.option_a}</td>
              <td>{row.option_b}</td>
              <td>{row.option_c}</td>
              <td>{row.option_d}</td>
              <td>{row.correct_answer}</td>
              <td>{row.difficulty}</td>
              <td>{row.explanation}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)}
      {errors.length > 0 && (
        <div style={styles.errorBox}>
          <ul>
            {errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      {summary && (
        <div style={styles.summaryBox}>
          <p>Total Inserted: {successCount}</p>
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
  )
}

/* ================= STYLES ================= */

const styles = {
  page: { padding: 30, fontFamily: 'system-ui' },

  templateBtn: {
    padding: '8px 14px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer'
  },

  uploadBtn: {
    marginTop: 20,
    padding: '10px 16px',
    background: '#16a34a',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer'
  },

  previewBox: {
    marginTop: 20,
    overflowX: 'auto'
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },

  errorBox: {
    background: '#fee2e2',
    padding: 15,
    marginTop: 20,
    borderRadius: 8
  },

  summaryBox: {
    background: '#dcfce7',
    padding: 15,
    marginTop: 20,
    borderRadius: 8
  },

  toast: {
    position: 'fixed',
    bottom: 30,
    right: 30,
    padding: '12px 18px',
    color: '#fff',
    borderRadius: 8,
    fontWeight: 600
  }
}
