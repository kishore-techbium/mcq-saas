'use client'

import { supabase } from '../../../lib/supabase'
import { getAdminCollege } from '../../../lib/getAdminCollege'
import { useEffect, useState } from 'react'

export default function AvailableExamsPage() {
const [exams, setExams] = useState([])
const [loading, setLoading] = useState(true)

useEffect(() => {
init()
}, [])

async function init() {
try {
const { data } = await supabase.auth.getUser()

```
  if (!data?.user) {
    window.location.href = '/'
    return
  }

  const email = data.user.email

  const { data: user, error } = await supabase
    .from('students')
    .select('role')
    .eq('email', email)
    .single()

  if (error) {
    console.error('User fetch error:', error)
    return
  }

  if (user?.role !== 'admin') {
    window.location.href = '/'
    return
  }

  await loadExams()
} catch (err) {
  console.error('Init error:', err)
} finally {
  setLoading(false)
}
```

}

async function loadExams() {
try {
const collegeId = await getAdminCollege()

```
  if (!collegeId) {
    console.error('No college_id found for admin')
    return
  }

  /* ===== FETCH EXAMS ===== */
  const { data: examsData, error } = await supabase
    .from('exams')
    .select('*')
    .eq('college_id', collegeId) // ✅ multi-tenant filter
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Exam fetch error:', error)
    return
  }

  if (!examsData || examsData.length === 0) {
    setExams([])
    return
  }

  /* ===== FETCH QUESTION COUNTS ===== */
  const examIds = examsData.map(e => e.id)
  const questionCountMap = {}

  const { data: mappings, error: mapError } = await supabase
    .from('exam_questions')
    .select('exam_id')
    .in('exam_id', examIds)

  if (mapError) {
    console.error('Mapping fetch error:', mapError)
  }

  ;(mappings || []).forEach(row => {
    questionCountMap[row.exam_id] =
      (questionCountMap[row.exam_id] || 0) + 1
  })

  const enriched = examsData.map(exam => ({
    ...exam,
    question_count: questionCountMap[exam.id] || 0
  }))

  setExams(enriched)
} catch (err) {
  console.error('Load exams error:', err)
}
```

}

async function toggleExam(id, active) {
await supabase
.from('exams')
.update({ is_active: !active })
.eq('id', id)

```
loadExams()
```

}

async function deleteExam(id) {
const confirmText = prompt('Type DELETE to confirm')
if (confirmText !== 'DELETE') return

```
await supabase.from('exams').delete().eq('id', id)
loadExams()
```

}

if (loading) {
return <p style={{ padding: 30 }}>Loading exams…</p>
}

return (
<div style={{ padding: 20 }}> <h1>📚 Available Exams</h1>

```
  {exams.length === 0 ? (
    <p>No exams found</p>
  ) : (
    exams.map(exam => (
      <div key={exam.id} style={{
        border: '1px solid #ddd',
        padding: 15,
        marginBottom: 10,
        borderRadius: 8
      }}>
        <h3>{exam.title}</h3>
        <p>Questions: {exam.question_count}</p>
        <p>Status: {exam.is_active ? 'Active' : 'Inactive'}</p>

        <button onClick={() => toggleExam(exam.id, exam.is_active)}>
          Toggle
        </button>

        <button
          onClick={() => deleteExam(exam.id)}
          style={{ marginLeft: 10, color: 'red' }}
        >
          Delete
        </button>
      </div>
    ))
  )}
</div>

)
}

/* ================= HELPERS ================= */

function prettyCategory(cat) {
  if (cat === 'JEE_MAINS') return 'JEE Mains'
  if (cat === 'JEE_ADVANCED') return 'JEE Advanced'
  if (cat === 'NEET') return 'NEET UG'
  return '-'
}

/* ================= STYLES ================= */

const styles = {
  page: {
    padding: 40,
    minHeight: '100vh',
    background: '#f8fafc',
    fontFamily: 'system-ui, sans-serif'
  },
  heading: {
    fontSize: 30,
    marginBottom: 6
  },
  subheading: {
    color: '#555',
    marginBottom: 24
  },
  card: {
    background: '#fff',
    borderRadius: 14,
    boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  categoryBadge: {
    padding: '4px 10px',
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 600,
    background: '#e0f2fe',
    color: '#0369a1'
  },
  statusBadge: {
    padding: '4px 10px',
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 700
  },
  secondaryBtn: {
    padding: '6px 10px',
    background: '#e5e7eb',
    border: 'none',
    borderRadius: 6,
    marginRight: 6,
    cursor: 'pointer'
  },
  dangerBtn: {
    padding: '6px 10px',
    background: '#fee2e2',
    color: '#991b1b',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer'
  }
}
