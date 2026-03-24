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

/* ================= INIT ================= */
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

/* ================= LOAD EXAMS ================= */
async function loadExams() {
try {
const collegeId = await getAdminCollege()

```
  if (!collegeId) {
    console.error('No college_id found')
    return
  }

  const { data: examsData, error } = await supabase
    .from('exams')
    .select('*')
    .eq('college_id', collegeId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Exam fetch error:', error)
    return
  }

  if (!examsData || examsData.length === 0) {
    setExams([])
    return
  }

  const examIds = examsData.map(e => e.id)
  const questionCountMap = {}

  const { data: mappings, error: mapError } = await supabase
    .from('exam_questions')
    .select('exam_id')
    .in('exam_id', examIds)

  if (mapError) {
    console.error('Mapping error:', mapError)
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

/* ================= HELPERS ================= */
function prettyCategory(cat) {
if (!cat) return 'General'

```
return cat
  .replaceAll('_', ' ')
  .replace(/\b\w/g, l => l.toUpperCase())
```

}

/* ================= ACTIONS ================= */
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

/* ================= UI ================= */
if (loading) {
return (

Loading exams…

)
}

return (

📚 Available Exams

```
  {exams.length === 0 ? (
    <div style={styles.emptyBox}>
      <p>No exams found for your college</p>
    </div>
  ) : (
    <div style={styles.grid}>
      {exams.map(exam => (
        <div key={exam.id} style={styles.card}>
          
          <div style={styles.cardHeader}>
            <h3 style={styles.title}>{exam.title}</h3>
            <span
              style={{
                ...styles.badge,
                backgroundColor: exam.is_active ? '#d4edda' : '#f8d7da',
                color: exam.is_active ? '#155724' : '#721c24'
              }}
            >
              {exam.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>

          <p style={styles.meta}>
            Category: <b>{prettyCategory(exam.exam_category)}</b>
          </p>

          <p style={styles.meta}>
            Questions: <b>{exam.question_count}</b>
          </p>

          <p style={styles.meta}>
            Duration: <b>{exam.duration_minutes} mins</b>
          </p>

          <div style={styles.actions}>
            <button
              style={styles.toggleBtn}
              onClick={() => toggleExam(exam.id, exam.is_active)}
            >
              Toggle Status
            </button>

            <button
              style={styles.deleteBtn}
              onClick={() => deleteExam(exam.id)}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  )}
</div>
```

)
}

/* ================= STYLES ================= */
const styles = {
container: {
padding: '30px',
fontFamily: 'system-ui, sans-serif',
backgroundColor: '#f7f9fc',
minHeight: '100vh'
},

heading: {
marginBottom: '20px'
},

grid: {
display: 'grid',
gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
gap: '20px'
},

card: {
background: '#fff',
borderRadius: '12px',
padding: '18px',
boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
border: '1px solid #eee'
},

cardHeader: {
display: 'flex',
justifyContent: 'space-between',
alignItems: 'center'
},

title: {
margin: 0
},

badge: {
padding: '4px 10px',
borderRadius: '20px',
fontSize: '12px'
},

meta: {
margin: '8px 0',
color: '#555'
},

actions: {
marginTop: '12px',
display: 'flex',
gap: '10px'
},

toggleBtn: {
flex: 1,
padding: '8px',
borderRadius: '6px',
border: 'none',
background: '#007bff',
color: '#fff',
cursor: 'pointer'
},

deleteBtn: {
flex: 1,
padding: '8px',
borderRadius: '6px',
border: 'none',
background: '#dc3545',
color: '#fff',
cursor: 'pointer'
},

emptyBox: {
padding: '40px',
textAlign: 'center',
background: '#fff',
borderRadius: '10px',
border: '1px dashed #ccc'
},

center: {
display: 'flex',
justifyContent: 'center',
alignItems: 'center',
height: '60vh'
},

loading: {
fontSize: '18px'
}
}
