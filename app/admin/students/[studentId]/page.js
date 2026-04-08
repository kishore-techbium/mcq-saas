'use client'

import { supabase } from '../../../../lib/supabase'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import * as XLSX from 'xlsx'

export default function StudentDetailsPage() {
  const { studentId } = useParams()

  const [student, setStudent] = useState(null)
  const [sessions, setSessions] = useState([])
  const [grouped, setGrouped] = useState({})
  const [subtopicData, setSubtopicData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (studentId) fetchData()
  }, [studentId])

  async function fetchData() {
    setLoading(true)

    const { data: studentData } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single()

    const { data: sessionData } = await supabase
      .from('exam_sessions')
      .select('*')
      .eq('student_id', studentId)
      .eq('submitted', true)
      .order('created_at', { ascending: false })

    let enriched = []

    if (sessionData?.length > 0) {
      const examIds = [
        ...new Set(
          sessionData
            .filter((s) => s.exam_id)
            .map((s) => s.exam_id)
        )
      ]

      let examsMap = {}

      if (examIds.length > 0) {
        const { data: examsData } = await supabase
          .from('exams')
          .select('id, title, created_at, exam_type, exam_category')
          .in('id', examIds)

        examsData?.forEach((exam) => {
          examsMap[exam.id] = exam
        })
      }

      enriched = sessionData.map((session) => {
        if (session.exam_id && examsMap[session.exam_id]) {
          const exam = examsMap[session.exam_id]
          return {
            ...session,
            exam_title: exam.title,
            exam_created_at: exam.created_at,
            exam_type: exam.exam_type,
            exam_category: exam.exam_category
          }
        } else {
          const meta = session.answers?.__meta
          return {
            ...session,
            exam_title:
              meta?.type === 'CUSTOM_TEST'
                ? `Custom Test (${meta?.subject || ''})`
                : 'Custom Test',
            exam_created_at: null,
            exam_type: 'CUSTOM',
            exam_category: meta?.category || '-'
          }
        }
      })
    }

    const groupedData = {}
    enriched.forEach((s) => {
      if (!groupedData[s.exam_title]) {
        groupedData[s.exam_title] = []
      }
      groupedData[s.exam_title].push(s)
    })

    setStudent(studentData)
    setSessions(enriched)
    setGrouped(groupedData)
    // ===== FETCH SUBTOPIC LEVEL DATA =====

if (sessionData?.length > 0) {

  const sessionIds = sessionData.map(s => s.id)

  const { data: answerData } = await supabase
    .from('exam_answers')
    .select('question_id, is_correct, exam_session_id')
    .in('exam_session_id', sessionIds)

  if (answerData && answerData.length > 0) {

    const questionIds = [
      ...new Set(answerData.map(a => a.question_id))
    ]

    const { data: questionData } = await supabase
      .from('question_bank')
      .select('id, subject, chapter, subtopic')
      .in('id', questionIds)

    const questionMap = {}
    questionData?.forEach(q => {
      questionMap[q.id] = q
    })

    const merged = answerData.map(a => ({
      ...a,
      ...(questionMap[a.question_id] || {})
    }))

    setSubtopicData(merged)
  }
}
    setLoading(false)
  }

  function exportExcel() {
    if (!sessions.length) return

    const exportData = sessions.map((s) => ({
      Exam: s.exam_title,
      Type: s.exam_type,
      Category: s.exam_category,
      Attempt: s.attempt_number,
      Score: s.score,
      Attempt_Date: new Date(s.created_at).toLocaleString()
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'History')
    XLSX.writeFile(wb, `${student.email}_History.xlsx`)
  }

  if (loading) return <p style={{ padding: 30 }}>Loading...</p>

  // ===== ADVANCED ANALYTICS =====

  const totalAttempts = sessions.length
  const totalExams = Object.keys(grouped).length

  const averageScore =
    totalAttempts > 0
      ? (
          sessions.reduce((sum, s) => sum + (s.score || 0), 0) /
          totalAttempts
        ).toFixed(2)
      : 0

  const bestScore =
    totalAttempts > 0
      ? Math.max(...sessions.map((s) => s.score || 0))
      : 0
const sortedSessions = [...sessions].sort(
  (a, b) => new Date(b.created_at) - new Date(a.created_at)
)
 const latestScore = sortedSessions[0]?.score ?? 0
const firstScore = sortedSessions[sortedSessions.length - 1]?.score ?? 0
const improvement = latestScore - firstScore

  const trend =
    improvement > 0
      ? 'Improving 📈'
      : improvement < 0
      ? 'Declining 📉'
      : 'Stable ➖'

  // ===== SUBJECT ANALYSIS =====

// ===== SUBTOPIC ANALYSIS =====

let subtopicStats = {}

subtopicData.forEach((row) => {
  const key = `${row.subject} → ${row.chapter} → ${row.subtopic}`

  if (!subtopicStats[key]) {
    subtopicStats[key] = { total: 0, correct: 0 }
  }

  subtopicStats[key].total += 1
  if (row.is_correct) subtopicStats[key].correct += 1
})

const subtopicPerformance = Object.entries(subtopicStats).map(
  ([key, values]) => ({
    name: key,
    accuracy:
      values.total > 0
        ? (values.correct / values.total) * 100
        : 0,
    attempts: values.total
  })
)

// ❗ Ignore low data (<5 attempts)
const filteredSubtopics = subtopicPerformance.filter(
  (s) => s.attempts >= 2
)
// ===== TOP INSIGHTS =====
const WEAK_THRESHOLD = 60
const STRONG_THRESHOLD = 80
const topWeak = filteredSubtopics
  .filter(s => s.accuracy < WEAK_THRESHOLD)
  .sort((a, b) => a.accuracy - b.accuracy)
  .slice(0, 5)

const topStrong = filteredSubtopics
  .filter(s => s.accuracy >= STRONG_THRESHOLD)
  .sort((a, b) => b.accuracy - a.accuracy)
  .slice(0, 5)

const strongestSubtopic =
  filteredSubtopics
    .filter(s => s.accuracy >= STRONG_THRESHOLD)
    .sort((a, b) => b.accuracy - a.accuracy)[0] || null

const weakestSubtopic =
  filteredSubtopics
    .filter(s => s.accuracy < WEAK_THRESHOLD)
    .sort((a, b) => a.accuracy - b.accuracy)[0] || null
  // ===== RETAKE INTELLIGENCE =====

  let mostRetakenExam = '-'
  let maxAttempts = 0

  Object.entries(grouped).forEach(([exam, attempts]) => {
    if (attempts.length > maxAttempts) {
      maxAttempts = attempts.length
      mostRetakenExam = exam
    }
  })

  const avgAttemptsPerExam =
    totalExams > 0
      ? (totalAttempts / totalExams).toFixed(2)
      : 0

  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>Student Performance</h1>

      <div style={styles.analyticsBox}>
        <div>
          <strong>Attempts:</strong> {totalAttempts} |
          <strong> Exams:</strong> {totalExams} |
          <strong> Avg:</strong> {averageScore} |
          <strong> Best:</strong> {bestScore} |
          <strong> Latest:</strong> {latestScore}
    {/* 🔥 TOP INSIGHTS */}

<div style={{ marginTop: 10 }}>
  <strong>Top Weak Areas:</strong>
  {topWeak.length === 0 && <div>-</div>}
  {topWeak.map((s, i) => (
    <div key={i} style={{ color: '#dc2626', fontSize: 13 }}>
      {s.name} ({s.accuracy.toFixed(1)}%)
    </div>
  ))}
  {/* 🔥 RECOMMENDATION */}
<div style={{ marginTop: 10 }}>
  <strong>🎯 Recommendation:</strong>{' '}
  {weakestSubtopic
    ? `Focus on ${weakestSubtopic.name} (${weakestSubtopic.accuracy.toFixed(1)}%)`
    : '-'}
</div>

{/* 🔥 INSIGHT */}
<div>
  <strong>📊 Insight:</strong>{' '}
  {trend.includes('Improving')
    ? 'Student is improving overall.'
    : trend.includes('Declining')
    ? 'Performance is declining. Needs attention.'
    : 'Performance is stable.'}
</div>
</div>

<div style={{ marginTop: 10 }}>
  <strong>Top Strong Areas:</strong>
  {topStrong.length === 0 && <div>-</div>}
  {topStrong.map((s, i) => (
    <div key={i} style={{ color: '#16a34a', fontSize: 13 }}>
      {s.name} ({s.accuracy.toFixed(1)}%)
    </div>
  ))}
</div>
        </div>

        <div>
          <strong>Trend:</strong> {trend} |
    <strong> Strongest:</strong>{' '}
  {strongestSubtopic
  ? `${strongestSubtopic.name} (${strongestSubtopic.accuracy.toFixed(1)}%)`
  : '-'}{' '}
|

<strong> Weakest:</strong>{' '}
{weakestSubtopic
  ? `${weakestSubtopic.name} (${weakestSubtopic.accuracy.toFixed(1)}%)`
  : '-'}
        </div>

        <div>
          <strong>Most Retaken:</strong> {mostRetakenExam} |
          <strong> Avg Attempts/Exam:</strong> {avgAttemptsPerExam}
        </div>

        <button style={styles.exportBtn} onClick={exportExcel}>
          Download Excel
        </button>
      </div>

      {Object.entries(grouped).map(([examTitle, attempts]) => {
        const best = Math.max(...attempts.map((a) => a.score || 0))
        const examInfo = attempts[0]

        return (
          <div key={examTitle} style={styles.examBlock}>
            <h2 style={{ marginBottom: 5 }}>{examTitle}</h2>
            <p style={{ fontSize: 13, color: '#555' }}>
              Type: {examInfo.exam_type} | Category: {examInfo.exam_category}
            </p>
            <p style={{ fontSize: 13 }}>
              Attempts: {attempts.length} | Best: {best}
            </p>

            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Attempt</th>
                    <th style={styles.th}>Score</th>
                    <th style={styles.th}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map((a) => (
                    <tr key={a.id}>
                      <td style={styles.td}>{a.attempt_number}</td>
                      <td style={styles.td}>{a.score}</td>
                      <td style={styles.td}>
                        {new Date(a.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )
}

const styles = {
  page: {
    padding: 40,
    background: '#f5f7fb',
    minHeight: '100vh',
    fontFamily: 'system-ui, sans-serif'
  },
  heading: { fontSize: 26, fontWeight: 700, marginBottom: 25 },
  analyticsBox: {
    background: '#ffffff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 30,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    border: '1px solid #e5e7eb',
    fontSize: 14
  },
  exportBtn: {
    padding: '8px 14px',
    background: '#16a34a',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer'
  },
  examBlock: {
    background: '#ffffff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 25,
    border: '1px solid #e5e7eb'
  },
  tableWrapper: { marginTop: 15, overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    padding: 10,
    background: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
    textAlign: 'left'
  },
  td: {
    padding: 10,
    borderBottom: '1px solid #f1f5f9'
  }
}
