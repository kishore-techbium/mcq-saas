'use client'

import { supabase } from '../../../lib/supabase'
import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { getStudentsWithCollege } from '../../../lib/db'

export default function StudentListPage() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [examCategory, setExamCategory] = useState('ALL')
  const [selectedStudents, setSelectedStudents] = useState([])
  const [studyYear, setStudyYear] = useState('ALL')
  useEffect(() => {
    fetchStudents()
  }, [])

async function fetchStudents() {
  setLoading(true)

  // 1️⃣ Fetch students
  const studentData = await getStudentsWithCollege()

  const collegeId = studentData[0]?.college_id

  // ❌ REMOVE API CALL
  // const res = await fetch(...)
  // const attemptMap = await res.json()

  // ✅ FETCH DIRECTLY FROM student_overall_stats
const { data: sessions } = await supabase
  .from('student_overall_stats')
  .select('student_id, total_attempts')
.eq('college_id', collegeId)
  .in('student_id', studentData.map(s => s.id))
  // ✅ BUILD ATTEMPT MAP
  const attemptMap = {}

sessions?.forEach(s => {
  const key = String(s.student_id)
  attemptMap[key] = s.total_attempts || 0
})
// 🔍 Search filter
if (search) {
  filtered = filtered.filter(s =>
    `${s.first_name} ${s.last_name}`
      .toLowerCase()
      .includes(search.toLowerCase())
  )
}

  // 🔥 FETCH GRAND TEST SCORES
const { data: grandStats } = await supabase
  .from('student_exam_stats')
  .select('student_id, avg_score, exam_id')
  .in('student_id', studentData.map(s => s.id))

// 🔥 GET GRAND TEST EXAM IDS
const { data: grandExams } = await supabase
  .from('exams')
  .select('id')
  .eq('exam_type', 'GRAND_TEST')

const grandIds = grandExams?.map(e => e.id) || []

// 🔥 FILTER GRAND TEST STATS
const grandFiltered = grandStats?.filter(s => grandIds.includes(s.exam_id))

// 🔥 CALCULATE BEST SCORE PER STUDENT
const scoreMap = {}

grandFiltered?.forEach(s => {
  if (!scoreMap[s.student_id]) {
    scoreMap[s.student_id] = []
  }
  scoreMap[s.student_id].push(s.avg_score || 0)
})

// 🔥 AVERAGE SCORE
const avgScoreMap = {}

Object.keys(scoreMap).forEach(id => {
  const arr = scoreMap[id]
  const avg = arr.reduce((a, b) => a + b, 0) / arr.length
  avgScoreMap[id] = avg
})

// 🔥 SORT + RANK
const ranked = Object.entries(avgScoreMap)
  .sort((a, b) => b[1] - a[1])

const rankMap = {}
ranked.forEach(([id], index) => {
  rankMap[id] = index + 1
})
const merged = (studentData || []).map(s => ({
  ...s,
  attempt_count: attemptMap[String(s.id)] || 0,
  rank: rankMap[s.id] || '-'
}))
let filtered = merged

// 🔍 Search filter (name + email)
if (search) {
  filtered = filtered.filter(s =>
    `${s.first_name || ''} ${s.last_name || ''} ${s.email || ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  )
}
// 🎯 Exam category filter
  if (examCategory !== 'ALL') {
  filtered = filtered.filter(s => s.exam_preference === examCategory)
}

// 🎯 Study year filter
if (studyYear !== 'ALL') {
  filtered = filtered.filter(s => String(s.study_year) === studyYear)
}

setStudents(filtered)
  setLoading(false)
}
function downloadTemplate() {
  const headers = [
    "email",
    "first_name",
    "last_name",
    "login_id",
    "password",
    "exam_preference",
    "phone",
    "address",
    "study_year"
  ]

  const csv = [
    headers.join(','),
    "student1@test.com,John,Doe,student1,1234,JEE,9876543210,Guntur"
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = 'student_template.csv'
  a.click()
}
  /* ================= EXPORT TO EXCEL ================= */

  function exportToExcel() {
    if (students.length === 0) {
      alert('No student data to export')
      return
    }

    const worksheet = XLSX.utils.json_to_sheet(students)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students')

    XLSX.writeFile(workbook, 'Students_List.xlsx')
  }

  return (
    
    <div style={styles.page}>
      <div style={styles.header}>
    <h1 style={styles.heading}>👨‍🎓 Registered Students</h1><br></br>
    <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}>

  <input
    type="text"
    placeholder="Search student name..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    style={{
      padding: 8,
      borderRadius: 6,
      border: '1px solid #ccc',
      width: 200
    }}
  />

  <select
    value={examCategory}
    onChange={(e) => setExamCategory(e.target.value)}
    style={{ padding: 8, borderRadius: 6 }}
  >
    <option value="ALL">All Categories</option>
    <option value="JEE">JEE</option>
    <option value="NEET">NEET</option>
  </select>
<select
  value={studyYear}
  onChange={(e) => setStudyYear(e.target.value)}
  style={{ padding: 8, borderRadius: 6 }}
>
  <option value="ALL">All Years</option>
  <option value="1">1st Year</option>
  <option value="2">2nd Year</option>
</select>

<div style={{ display: 'flex', gap: 10 }}>
  
          <button
            style={{
              ...styles.createBtn,
              opacity: selectedStudents.length > 0 ? 0.5 : 1,
              cursor: selectedStudents.length > 0 ? 'not-allowed' : 'pointer'
            }}
            disabled={selectedStudents.length > 0}
            onClick={() => window.location.href = '/admin/students/create'}
          >
            ➕ Create Student
          </button>

          <button
            style={{
              ...styles.templateBtn,
              opacity: selectedStudents.length > 0 ? 0.5 : 1,
              cursor: selectedStudents.length > 0 ? 'not-allowed' : 'pointer'
            }}
            disabled={selectedStudents.length > 0}
            onClick={downloadTemplate}
          >
            📄 Download login template
          </button>

          <button
            style={{
              ...styles.uploadBtn,
              opacity: selectedStudents.length > 0 ? 0.5 : 1,
              cursor: selectedStudents.length > 0 ? 'not-allowed' : 'pointer'
            }}
            
            disabled={selectedStudents.length > 0}
            onClick={() => window.location.href = '/admin/students/bulk-upload'}
          >
            ⬆ Upload logins
          </button>
          <button
            style={{
              ...styles.exportBtn,
              opacity: selectedStudents.length > 0 ? 0.5 : 1,
              cursor: selectedStudents.length > 0 ? 'not-allowed' : 'pointer'
            }}
            disabled={selectedStudents.length > 0}
            onClick={exportToExcel}
          >
            ⬇ Download
          </button>

        <button
        style={styles.compareBtn}
        disabled={selectedStudents.length < 2}
        onClick={() => {
          if (selectedStudents.length > 5) {
            alert('Maximum 5 students allowed for comparison')
            return
          }

          if (selectedStudents.length < 2) {
            alert('Select at least 2 students to compare')
            return
          }

          const ids = selectedStudents.join(',')
          window.location.href = `/admin/students/compare?ids=${ids}`
        }}
        >
        Compare Students
        </button>
  </div>
</div>
</div>

      {loading && <p>Loading students...</p>}

      {!loading && students.length === 0 && (
        <p>No students registered yet.</p>
      )}

      {!loading && students.length > 0 && (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}></th>
                <th style={styles.th}>First Name</th>
                <th style={styles.th}>Last Name</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Phone</th>
                
                <th style={styles.th}>Study Year</th>
                
                <th style={styles.th}>Created At</th>
                <th style={styles.th}>Attempts</th>
                <th style={styles.th}>Rank (Grand Test)</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td style={styles.td}>
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            if (selectedStudents.length >= 5) {
                              alert('You can compare maximum 5 students only')
                              return
                            }
                            setSelectedStudents([...selectedStudents, student.id])
                          } else {
                            setSelectedStudents(selectedStudents.filter(id => id !== student.id))
                          }
                        }}
                      />
                  </td>
                  <td style={styles.td}>
                    {student.first_name || '-'}
                  </td>
                  <td style={styles.td}>
                    {student.last_name || '-'}
                  </td>
                  <td style={styles.td}>{student.email}</td>
                  <td style={styles.td}>{student.phone || '-'}</td>
                  
                  <td style={styles.td}>
                    {student.study_year || '-'}
                  </td>

                  <td style={styles.td}>
                    {new Date(student.created_at).toLocaleDateString('en-IN')}
                  </td>
                  <td style={styles.td}>
                  {student.attempt_count}
                </td>
                <td style={{
                ...styles.td,
                color: student.rank <= 10 ? 'green' : 'black'
              }}>
                {student.rank}
              </td>
                  <td style={styles.td}>
                    <button
                      style={styles.viewBtn}
                      onClick={() =>
                        (window.location.href = `/admin/students/${student.id}`)
                      }
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ================= STYLES ================= */

const styles = {
  page: {
    padding: 40,
    minHeight: '100vh',
    background: 'linear-gradient(135deg,#f8fafc,#eef2ff)',
    fontFamily: 'system-ui, sans-serif'
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },

  heading: {
    fontSize: 28
  },

  exportBtn: {
    padding: '10px 18px',
    background: '#16a34a',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontWeight: 600,
    cursor: 'pointer'
  },
    compareBtn: {
      padding: '10px 18px',
      background: '#7c3aed',
      color: '#fff',
      border: 'none',
      borderRadius: 8,
      fontWeight: 600,
      cursor: 'pointer'
    },
  tableWrapper: {
    overflowX: 'auto',
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 10px 25px rgba(0,0,0,0.08)'
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },

  th: {
    background: '#f1f5f9',
    padding: 12,
    textAlign: 'left',
    fontSize: 14,
    borderBottom: '1px solid #e5e7eb'
  },

  td: {
    padding: 12,
    fontSize: 14,
    borderBottom: '1px solid #e5e7eb'
  },

  viewBtn: {
    padding: '6px 12px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13
  },
   templateBtn: {
    padding: '10px 18px',
    background: '#16a34a',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontWeight: 600,
    cursor: 'pointer'
  },

 uploadBtn: {
    padding: '10px 18px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontWeight: 600,
    cursor: 'pointer'
  },

 createBtn: {
  padding: '10px 18px',
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  fontWeight: 600,
  cursor: 'pointer',
  opacity: 1
}
}
