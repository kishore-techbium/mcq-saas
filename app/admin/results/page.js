'use client'

import { supabase } from '../../../lib/supabase'
import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { useAdminGuard } from '../../../lib/useAdminGuard'

export default function AdminResults() {
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')
  const [examTypeFilter, setExamTypeFilter] = useState('ALL')
  const [examCategoryFilter, setExamCategoryFilter] = useState('ALL')
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
  // ✅ Get exams (same as before)
  const { data: exams } = await supabase
    .from('exams')
    .select('id, title, exam_category, exam_type, created_at')
    .order('created_at', { ascending: false })

  // ✅ Get analytics data instead of sessions
  const { data: stats } = await supabase
    .from('student_exam_stats')
    .select('*')

  const grouped = {}

  // 🔥 GROUP BY exam_id
  ;(stats || []).forEach((s) => {
    if (!grouped[s.exam_id]) {
      grouped[s.exam_id] = {
        students: 0,
        attempts: 0,
        totalScore: 0,
        max: s.best_score,
        min: s.best_score,
        last: s.last_attempt_at
      }
    }

    const e = grouped[s.exam_id]

    e.students += 1
    e.attempts += s.attempts || 0
    e.totalScore += (s.avg_score || 0) * (s.attempts || 0)
    e.max = Math.max(e.max, s.best_score || 0)
    e.min = Math.min(e.min, s.best_score || 0)

    if (!e.last || s.last_attempt_at > e.last) {
      e.last = s.last_attempt_at
    }
  })

  // 🔥 BUILD FINAL ROWS
  const finalRows = (exams || []).map((exam) => {
    const s = grouped[exam.id]

    return {
      ...exam,
      students: s ? s.students : 0,
      attempts: s ? s.attempts : 0,
      
      avg_score: s
        ? s.attempts > 0
          ? (s.totalScore / s.attempts).toFixed(1)
          : '-'
        : '-',
      max_score: s ? s.max : '-',
      min_score: s ? s.min : '-',
      efficiency: s && s.attempts > 0
  ? ((s.totalScore / s.attempts) / 60).toFixed(2)
  : '-',
      participation: s
  ? ((s.students / (exams.length || 1)) * 100).toFixed(1)
  : '-',
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
      
      Avg: r.avg_score,
      Max: r.max_score,
      
      LastAttempt: r.last_attempt
  ? new Date(r.last_attempt).toLocaleDateString('en-IN')
  : '-'
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Exam Summary')
    XLSX.writeFile(wb, 'Exam_Intelligence_Summary.xlsx')
  }

let filtered = rows.filter(r => {

  const matchSearch =
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.exam_category?.toLowerCase().includes(search.toLowerCase()) ||
    r.exam_type?.toLowerCase().includes(search.toLowerCase())

  const matchType =
    examTypeFilter === 'ALL' || r.exam_type === examTypeFilter

  const matchCategory =
    examCategoryFilter === 'ALL' || r.exam_category === examCategoryFilter

  return matchSearch && matchType && matchCategory
})

  if (sortField) {
   filtered.sort((a,b)=>{

  let v1 = a[sortField]
  let v2 = b[sortField]

  v1 = v1 === '-' ? 0 : Number(v1)
  v2 = v2 === '-' ? 0 : Number(v2)

  return sortAsc ? v1 - v2 : v2 - v1
})
  }

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice((page-1)*pageSize, page*pageSize)

  if (loading) return <p style={{ padding: 30 }}>Loading...</p>

  return (
    <div style={styles.page}>
      <h1>📊 Exam Intelligence Dashboard</h1>
<div style={{ marginBottom: 20 }}>
  <button
    onClick={() => window.location.href = '/admin/results/college-insights'}
    style={{
      padding: '10px 16px',
      background: '#6366f1',
      color: '#fff',
      border: 'none',
      borderRadius: 8,
      cursor: 'pointer',
      fontWeight: 600
    }}
  >
    🎓 College Insights Dashboard →
  </button>
</div>
    <div style={styles.topBar}>

  <div style={{ display: 'flex', gap: 10 }}>

    <input
      placeholder="Search exam..."
      value={search}
      onChange={(e)=>{setSearch(e.target.value); setPage(1)}}
      style={styles.searchInput}
    />

    <select
      value={examTypeFilter}
      onChange={(e)=>{setExamTypeFilter(e.target.value); setPage(1)}}
      style={styles.searchInput}
    >
      <option value="ALL">All Types</option>
      <option value="WEEKLY_TEST">Weekly</option>
      <option value="MONTHLY_TEST">Monthly</option>
      <option value="GRAND_TEST">Grand</option>
    </select>

    <select
      value={examCategoryFilter}
      onChange={(e)=>{setExamCategoryFilter(e.target.value); setPage(1)}}
      style={styles.searchInput}
    >
      <option value="ALL">All Categories</option>
      <option value="JEE_MAINS">JEE</option>
      <option value="NEET">NEET</option>
    </select>

  </div>

  <button onClick={exportAll} style={styles.exportBtn}>
    Export All
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
              
              <th style={styles.right} onClick={()=>handleSort('avg_score')}>Avg</th>
              <th style={styles.right}>Efficiency</th>
              <th style={styles.right}>Participation %</th>  
              <th style={styles.right}>Max</th>
              
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
                
                <td style={styles.right}>{r.avg_score}</td>
                <td style={styles.right}>{r.efficiency}</td>
                <td style={styles.right}>{r.participation}</td>
                <td style={styles.right}>{r.max_score}</td>
                
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
