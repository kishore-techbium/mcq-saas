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
      .eq('college_id', collegeId)

    setExams(data || [])
  }

  /* ================= TEMPLATE DOWNLOAD ================= */

  function downloadTemplate() {

    const sampleData = [
      {
        exam_category: 'JEE_MAINS',
        subject: 'Physics',
        chapter: 'Kinematics',
        question: 'Sample Question?',
        option_a: 'Option A',
        option_b: 'Option B',
        option_c: 'Option C',
        option_d: 'Option D',
        correct_answer: 'A'
      }
    ]

    const worksheet = XLSX.utils.json_to_sheet(sampleData)
    const workbook = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template')

    XLSX.writeFile(workbook, 'question_template.xlsx')
  }

  /* ================= PREVIEW ================= */

  async function handlePreview() {
    if (!file) {
      alert('Please select a file first')
      return
    }

    const buffer = await file.arrayBuffer()
    const wb = XLSX.read(buffer)
    const sheet = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(sheet)

    setPreviewRows(rows)
    setIsPreview(true)
  }

  /* ================= UPLOAD ================= */

  async function handleUpload() {

    const collegeId = await getAdminCollege()

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
    <div style={styles.page}>

      <div style={styles.card}>

        <div style={styles.headerRow}>
          <h1 style={styles.heading}>📤 Upload Question Bank</h1>

          <button style={styles.templateBtn} onClick={downloadTemplate}>
            ⬇ Download Template
          </button>
        </div>

        {/* FILE INPUT */}
        <div style={styles.section}>
          <label style={styles.label}>Upload Excel / CSV</label>

          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            style={styles.input}
          />

          {file && (
            <p style={styles.fileName}>Selected: {file.name}</p>
          )}
        </div>

        {/* EXAM SELECT */}
        <div style={styles.section}>
          <label style={styles.label}>Map to Exam (Optional)</label>

          <select
            onChange={(e) => setSelectedExam(e.target.value)}
            style={styles.input}
          >
            <option value="">Select Exam</option>
            {exams.map(e => (
              <option key={e.id} value={e.id}>{e.title}</option>
            ))}
          </select>
        </div>

        {/* BUTTONS */}
        <div style={styles.buttonRow}>
          {!isPreview && (
            <button style={styles.previewBtn} onClick={handlePreview}>
              Preview
            </button>
          )}

          {isPreview && (
            <button style={styles.uploadBtn} onClick={handleUpload}>
              Upload Questions
            </button>
          )}
        </div>

        {/* PREVIEW */}
        {isPreview && (
          <div style={styles.previewBox}>
            <h3 style={{ marginBottom: 10 }}>Preview</h3>

            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>Question</th>
                    <th>A</th>
                    <th>B</th>
                    <th>C</th>
                    <th>D</th>
                    <th>Answer</th>
                  </tr>
                </thead>

                <tbody>
                  {previewRows.slice(0, 10).map((row, i) => (
                    <tr key={i}>
                      <td>{row.question}</td>
                      <td>{row.option_a}</td>
                      <td>{row.option_b}</td>
                      <td>{row.option_c}</td>
                      <td>{row.option_d}</td>
                      <td>{row.correct_answer}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {previewRows.length > 10 && (
              <p style={{ marginTop: 10 }}>
                Showing first 10 rows out of {previewRows.length}
              </p>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

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
