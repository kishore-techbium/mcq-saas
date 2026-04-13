'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

export default function ResultsPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)

    const { data: stats } = await supabase
      .from('student_exam_stats')
      .select('*')

    const { data: exams } = await supabase
      .from('exams')
      .select('*')

    const examMap = {}
    exams?.forEach(e => (examMap[e.id] = e))

    const grouped = {}

    stats?.forEach(s => {
      if (!grouped[s.exam_id]) {
        grouped[s.exam_id] = {
          exam_id: s.exam_id,
          attempts: 0,
          students: 0,
          totalScore: 0
        }
      }

      grouped[s.exam_id].attempts += s.attempts || 0
      grouped[s.exam_id].students += 1
      grouped[s.exam_id].totalScore += (s.avg_score || 0) * (s.attempts || 0)
    })

    const finalRows = Object.values(grouped).map(e => {
      const avg =
        e.attempts > 0
          ? (e.totalScore / e.attempts).toFixed(1)
          : '-'

      return {
        title: examMap[e.exam_id]?.title,
        attempts: e.attempts,
        students: e.students,
        reattempts: Math.max(0, e.attempts - e.students),
        avg
      }
    })

    setRows(finalRows)
    setLoading(false)
  }

  if (loading) return <p>Loading...</p>

  return (
    <div style={{ padding: 30 }}>
      <h2>Exam Results</h2>

      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>Exam</th>
            <th>Attempts</th>
            <th>Students</th>
            <th>Reattempts</th>
            <th>Avg Score (%)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td>{r.title}</td>
              <td>{r.attempts}</td>
              <td>{r.students}</td>
              <td>{r.reattempts}</td>
              <td>{r.avg}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
