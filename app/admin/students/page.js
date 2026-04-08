'use client'

import { supabase } from '../../../lib/supabase'
import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { getStudentsWithCollege } from '../../../lib/db'

export default function StudentListPage() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStudents()
  }, [])

  async function fetchStudents() {
  setLoading(true)

  // 1️⃣ Fetch students
const studentData = await getStudentsWithCollege()
  // 2️⃣ Fetch attempt counts grouped
const res = await fetch('/api/admin/student-attempts')
const attemptMap = await res.json()
   // 3️⃣ Merge counts into students
    console.log('STUDENT IDS:', studentData.map(s => s.id))
console.log('ATTEMPT MAP:', attemptMap)
  const merged = (studentData || []).map(s => ({
    ...s,
    attempt_count: attemptMap[String(s.id)] || 0
  }))

  setStudents(merged)
  setLoading(false)
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
        <h1 style={styles.heading}>👨‍🎓 Registered Students</h1>

        <button style={styles.exportBtn} onClick={exportToExcel}>
          ⬇ Download Excel
        </button>
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
                <th style={styles.th}>First Name</th>
                <th style={styles.th}>Last Name</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Phone</th>
                <th style={styles.th}>College</th>
                <th style={styles.th}>Study Year</th>
                <th style={styles.th}>Address</th>
                <th style={styles.th}>Created At</th>
                <th style={styles.th}>Attempts</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td style={styles.td}>
                    {student.first_name || '-'}
                  </td>
                  <td style={styles.td}>
                    {student.last_name || '-'}
                  </td>
                  <td style={styles.td}>{student.email}</td>
                  <td style={styles.td}>{student.phone || '-'}</td>
                  <td style={styles.td}>
                    {student.college_name || '-'}
                  </td>
                  <td style={styles.td}>
                    {student.study_year || '-'}
                  </td>
                  <td style={styles.td}>
                    {student.address || '-'}
                  </td>
                  <td style={styles.td}>
                    {new Date(student.created_at).toLocaleString()}
                  </td>
                  <td style={styles.td}>
  {student.attempt_count}
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
  }
}
