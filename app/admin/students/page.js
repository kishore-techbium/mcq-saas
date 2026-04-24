'use client'

import { supabase } from '../../../lib/supabase'
import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { getStudentsWithCollege } from '../../../lib/db'

export default function StudentListPage() {
  const [students, setStudents] = useState([])
  const [sortBy, setSortBy] = useState('first_name')
  const [loading, setLoading] = useState(true)
  const [allStudents, setAllStudents] = useState([])
  const [search, setSearch] = useState('')
  const [examCategory, setExamCategory] = useState('ALL')
  const [selectedStudents, setSelectedStudents] = useState([])
  const [yearCounts, setYearCounts] = useState({ first: 0, second: 0 })
  const [studyYear, setStudyYear] = useState('ALL')
useEffect(() => {
  fetchStudents()
}, [])
useEffect(() => {
  let filtered = allStudents

  // 🔍 FIRST NAME SEARCH
  if (search) {
    filtered = filtered.filter(s =>
      (s.first_name || '')
        .toLowerCase()
        .includes(search.toLowerCase().trim())
    )
  }

  // 🎯 CATEGORY
  if (examCategory !== 'ALL') {
    filtered = filtered.filter(s => s.exam_preference === examCategory)
  }

  // 🎯 YEAR
  if (studyYear !== 'ALL') {
    filtered = filtered.filter(s => String(s.study_year) === studyYear)
  }
  if (sortBy === 'first_name') {
  filtered = [...filtered].sort((a, b) =>
    (a.first_name || '').localeCompare(b.first_name || '')
  )
}

if (sortBy === 'last_name') {
  filtered = [...filtered].sort((a, b) =>
    (a.last_name || '').localeCompare(b.last_name || '')
  )
}

if (sortBy === 'rank') {
  filtered = [...filtered].sort((a, b) => {
    const rankA = a.rank === '-' ? 9999 : Number(a.rank)
    const rankB = b.rank === '-' ? 9999 : Number(b.rank)
    return rankA - rankB
  })
}
  setStudents(filtered)
}, [search, examCategory, studyYear, allStudents, sortBy])

  async function fetchStudents() {
  setLoading(true)

  // 1️⃣ Fetch students
  const studentData = await getStudentsWithCollege()

  const collegeId = studentData[0]?.college_id

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
const merged = (studentData || [])
  .filter(s => s.role !== 'admin')   // 🔥 ADD THIS
  .map(s => ({
    ...s,
    attempt_count: attemptMap[String(s.id)] || 0,
    rank: rankMap[s.id] || '-'
  }))

const firstYearCount = merged.filter(s => String(s.study_year) === '1').length
const secondYearCount = merged.filter(s => String(s.study_year) === '2').length
  
let filtered = merged

// 🔍 Search filter (name + email)
if (search) {
  filtered = filtered.filter(s =>
    (s.first_name || '')
      .toString()
      .trim()
      .toLowerCase()
      .includes(search.toLowerCase().trim())
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
setAllStudents(merged)
setStudents(merged)
setYearCounts({
  first: firstYearCount,
  second: secondYearCount
})  
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

async function toggleLogin(studentId, email, currentStatus) {
  const newStatus = !(currentStatus ?? true)

  console.log('Toggling:', email, currentStatus, '→', newStatus)


   const { data, error } = await supabase
    .from('students')
    .update({ is_active: newStatus })
    .eq('id', studentId)
    .select()   

  if (error) {
    console.error('Toggle error:', error)
    alert('Failed to update login status')
    return
  }


  // UI update
  setStudents(prev =>
    prev.map(s =>
      s.id === studentId ? { ...s, is_active: newStatus } : s
    )
  )

  setAllStudents(prev =>
    prev.map(s =>
      s.id === studentId ? { ...s, is_active: newStatus } : s
    )
  )
}
async function resetPassword(studentId) {
  const newPassword = prompt('Enter new password')

  if (!newPassword) {
    alert('Password cannot be empty')
    return
  }

  if (newPassword.length < 4) {
    alert('Password must be at least 4 characters')
    return
  }

  const { error } = await supabase
    .from('students')
    .update({ password: newPassword })
    .eq('id', studentId)

  if (error) {
    console.error(error)
    alert('Failed to update password')
    return
  }

  alert('Password updated successfully')
}
  return (
    
    <div style={styles.page}>
     <div style={{ marginBottom: 20 }}>
  <div>
  <h1 style={styles.heading}>👨‍🎓 Registered Students</h1>
  <p style={styles.subHeading}>
    1st Year: {yearCounts.first} | 2nd Year: {yearCounts.second}
  </p>
</div>

  <div style={styles.controlsRow}>
    
    {/* SEARCH */}
    <input
      type="text"
      placeholder="Search by first name..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      style={styles.input}
    />

    {/* CATEGORY */}
    <select
      value={examCategory}
      onChange={(e) => setExamCategory(e.target.value)}
      style={styles.input}
    >
      <option value="ALL">All Categories</option>
      <option value="JEE">JEE</option>
      <option value="NEET">NEET</option>
    </select>

    {/* YEAR */}
    <select
      value={studyYear}
      onChange={(e) => setStudyYear(e.target.value)}
      style={styles.input}
    >
      <option value="ALL">All Years</option>
      <option value="1">1st Year</option>
      <option value="2">2nd Year</option>
    </select>
<select
  value={sortBy}
  onChange={(e) => setSortBy(e.target.value)}
  style={styles.input}
>
  <option value="first_name">Sort: First Name</option>
  <option value="last_name">Sort: Last Name</option>
  <option value="rank">Sort: Rank</option>
</select>
    {/* BUTTONS */}
    <div style={styles.buttonGroup}>
      <button style={styles.createBtn} onClick={() => window.location.href = '/admin/students/create'}>
        ➕ Create
      </button>

      <button style={styles.templateBtn} onClick={downloadTemplate}>
        📄 Template
      </button>

      <button style={styles.uploadBtn} onClick={() => window.location.href = '/admin/students/bulk-upload'}>
        ⬆ Upload
      </button>

      <button style={styles.exportBtn} onClick={exportToExcel}>
        ⬇ Export
      </button>

      <button
        style={styles.compareBtn}
        disabled={selectedStudents.length < 2}
        onClick={() => {
          if (selectedStudents.length > 5) {
            alert('Maximum 5 students allowed')
            return
          }
          const ids = selectedStudents.join(',')
          window.location.href = `/admin/students/compare?ids=${ids}`
        }}
      >
        Compare
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
                <th style={styles.th}>Grand Test Rank</th>
                <th style={styles.th}>Access</th>
                <th style={styles.th}>Reset Password</th>
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
                    onClick={() => toggleLogin(student.id, student.email, student.is_active)}
                    style={{
                  padding: '6px 12px',
                  borderRadius: 20,
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  backgroundColor: student.is_active ? '#2563eb' : '#ef4444', // 🔥 HERE
                  color: '#fff'
                }}
                  >
                    {student.is_active ? 'ON' : 'OFF'}
                  </button>
                </td>
                <td style={styles.td}>
               <button
                  onClick={() => resetPassword(student.id)}
                  style={styles.resetBtn}
                >
                  Set Password
                </button>
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
  resetBtn: {
  padding: '6px 12px',
  background: '#f59e0b',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 12
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
},
  subHeading: {
  fontSize: 14,
  color: '#6b7280',
  marginTop: 4
},
  controlsRow: {
  display: 'flex',
  gap: 10,
  alignItems: 'center',
  flexWrap: 'wrap',
  marginTop: 10
},

input: {
  padding: 8,
  borderRadius: 6,
  border: '1px solid #ccc',
  minWidth: 180
},
switch: {
  position: 'relative',
  display: 'inline-block',
  width: 40,
  height: 20
},
slider: {
  position: 'absolute',
  cursor: 'pointer',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: '#ccc',
  borderRadius: 20,
  transition: '.3s'
},

buttonGroup: {
  display: 'flex',
  gap: 10,
  marginLeft: 'auto',
  flexWrap: 'wrap'
}
}
