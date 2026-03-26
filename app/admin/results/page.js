'use client'

import { supabase } from '../../../lib/supabase'
import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { useAdminGuard } from '../../../lib/useAdminGuard'

export default function AdminResults() {
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState(null)
  const [sortAsc, setSortAsc] = useState(true)
  const [page, setPage] = useState(1)

  const pageSize = 10

  useEffect(() => {
    init()
  }, [])


async function init() {
  const allowed = await useAdminGuard()
  if (!allowed) return

  await loadResults() // or loadExams / whatever
  setLoading(false)
}

  async function loadResults() {
    const { data: exams } = await supabase
      .from('exams')
      .select('id, title, exam_category, exam_type, created_at')
      .order('created_at', { ascending: false })

    const { data: sessions } = await supabase
      .from('exam_sessions')
      .select('exam_id, score, student_id, attempt_number, created_at')
      .eq('submitted', true)
      .not('exam_id', 'is', null)

    const stats = {}

    ;(sessions || []).forEach(s => {
      if (!stats[s.exam_id]) {
        stats[s.exam_id] = {
          attempts: 0,
          total: 0,
          max: s.score,
          min: s.score,
          last: s.created_at,
          students: new Set(),
          reattempts: 0
        }
      }

      const e = stats[s.exam_id]
      e.attempts++
      e.total += s.score
      e.max = Math.max(e.max, s.score)
      e.min = Math.min(e.min, s.score)
      e.last = e.last > s.created_at ? e.last : s.created_at
      e.students.add(s.student_id)
      if (s.attempt_number > 1) e.reattempts++
    })

    const finalRows = (exams || []).map(exam => {
      const s = stats[exam.id]
      return {
        ...exam,
        students: s ? s.students.size : 0,
        attempts: s ? s.attempts : 0,
        reattempts: s ? s.reattempts : 0,
        avg_score: s ? (s.total / s.attempts).toFixed(2) : '-',
        max_score: s ? s.max : '-',
        min_score: s ? s.min : '-',
        last_attempt: s ? s.last : null
      }
    })

    setRows(finalRows)
  }

  function handleSort(field) {
    if (sortField === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortField(field)
      setSortAsc(true)
    }
  }

  function exportAll() {
    const data = rows.map((r, i) => ({
      SNo: i + 1,
      Exam: r.title,
      Category: r.exam_category,
      ExamType: r.exam_type,
      Students: r.students,
      Attempts: r.attempts,
      ReAttempts: r.reattempts,
      Avg: r.avg_score,
      Max: r.max_score,
      Min: r.min_score,
      LastAttempt: r.last_attempt
        ? new Date(r.last_attempt).toLocaleString()
        : '-'
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Exam Summary')
    XLSX.writeFile(wb, 'Exam_Intelligence_Summary.xlsx')
  }

  let filtered = rows.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.exam_category?.toLowerCase().includes(search.toLowerCase()) ||
    r.exam_type?.toLowerCase().includes(search.toLowerCase())
  )

  if (sortField) {
    filtered.sort((a,b)=>{
      let v1 = a[sortField]
      let v2 = b[sortField]
      if (v1 === '-' || v1 == null) v1 = 0
      if (v2 === '-' || v2 == null) v2 = 0
      if (typeof v1 === 'string')
        return sortAsc ? v1.localeCompare(v2) : v2.localeCompare(v1)
      return sortAsc ? v1 - v2 : v2 - v1
    })
  }

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice((page-1)*pageSize, page*pageSize)

  if (loading) return <p style={{ padding: 30 }}>Loading...</p>

  return (
    <div style={styles.page}>
      <h1>📊 Exam Intelligence Dashboard</h1>

      <div style={styles.topBar}>
        <input
          placeholder="Search exam, category, type..."
          value={search}
          onChange={(e)=>{setSearch(e.target.value); setPage(1)}}
          style={styles.searchInput}
        />

        <button onClick={exportAll} style={styles.exportBtn}>
          Export All Exams
        </button>
      </div>

      <div style={styles.card}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.center}>S.No</th>
              <th style={styles.left} onClick={()=>handleSort('title')}>Exam</th>
              <th style={styles.left}>Category</th>
              <th style={styles.left} onClick={()=>handleSort('exam_type')}>Exam Type</th>
              <th style={styles.right} onClick={()=>handleSort('students')}>Students</th>
              <th style={styles.right} onClick={()=>handleSort('attempts')}>Attempts</th>
              <th style={styles.right} onClick={()=>handleSort('reattempts')}>Re-Attempts</th>
              <th style={styles.right} onClick={()=>handleSort('avg_score')}>Avg</th>
              <th style={styles.right}>Max</th>
              <th style={styles.right}>Min</th>
              <th style={styles.left}>Last Attempt</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {paginated.map((r,i)=>(
              <tr key={r.id} style={styles.row}>
                <td style={styles.center}>{(page-1)*pageSize + i + 1}</td>
                <td style={styles.link}
                    onClick={()=>window.location.href=`/admin/results/${r.id}`}>
                  {r.title}
                </td>
                <td style={styles.left}>{r.exam_category}</td>
                <td style={styles.left}>{r.exam_type}</td>
                <td style={styles.right}>{r.students}</td>
                <td style={styles.right}>{r.attempts}</td>
                <td style={styles.right}>{r.reattempts}</td>
                <td style={styles.right}>{r.avg_score}</td>
                <td style={styles.right}>{r.max_score}</td>
                <td style={styles.right}>{r.min_score}</td>
                <td style={styles.left}>
                  {r.last_attempt ? new Date(r.last_attempt).toLocaleString() : '-'}
                </td>
                <td>
                  <span style={styles.analytics}
                        onClick={()=>window.location.href=`/admin/results/${r.id}`}>
                    Analytics →
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div style={styles.pagination}>
          <button disabled={page===1}
                  onClick={()=>setPage(page-1)}>
            Previous
          </button>

          <span> Page {page} of {totalPages} </span>

          <button disabled={page===totalPages}
                  onClick={()=>setPage(page+1)}>
            Next
          </button>
        </div>

      </div>
    </div>
  )
}

const styles = {
  page:{ padding:40, background:'#f1f5f9', minHeight:'100vh' },
  topBar:{ display:'flex', justifyContent:'space-between', marginBottom:20 },
  searchInput:{ padding:10, borderRadius:8, border:'1px solid #ccc', width:300 },
  exportBtn:{ padding:'8px 14px', background:'#10b981', color:'#fff',
              border:'none', borderRadius:8, cursor:'pointer' },
  card:{ background:'#fff', borderRadius:16,
         boxShadow:'0 10px 25px rgba(0,0,0,0.08)', padding:20 },
  table:{ width:'100%', borderCollapse:'collapse' },
  row:{ borderBottom:'1px solid #eee' },
  center:{ textAlign:'center', padding:10 },
  left:{ textAlign:'left', padding:10 },
  right:{ textAlign:'right', padding:10 },
  link:{ textAlign:'left', padding:10,
         color:'#2563eb', cursor:'pointer', fontWeight:600 },
  analytics:{ color:'#059669', cursor:'pointer', fontWeight:600 },
  pagination:{ marginTop:20, display:'flex',
               justifyContent:'center', gap:20 }
}
