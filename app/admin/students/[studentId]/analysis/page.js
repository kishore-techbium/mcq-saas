'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../../../lib/supabase'
import html2pdf from 'html2pdf.js'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts'

export default function AnalysisPage() {
  const { studentId } = useParams()
const [student, setStudent] = useState(null)
const [collegeName, setCollegeName] = useState('')
  const [data, setData] = useState({})
  const [expanded, setExpanded] = useState({})

  useEffect(() => {
    if (studentId) fetchData()
  }, [studentId])

async function fetchData() {

  // ✅ Fetch student and college
const { data: studentData } = await supabase
  .from('students')
  .select('first_name, last_name, college_name')
  .eq('id', studentId)

const student = studentData?.[0]

setStudent(student || null)
setCollegeName(student?.college_name || '')

  // ✅ Existing stats logic (unchanged)
  const { data: stats } = await supabase
    .from('student_subtopic_stats')
    .select('*')
    .eq('student_id', studentId)

  if (!stats) return

  const grouped = {}

  stats.forEach((row) => {
    if (!grouped[row.subject]) {
      grouped[row.subject] = {}
    }

    if (!grouped[row.subject][row.chapter]) {
      grouped[row.subject][row.chapter] = {
        totalAccuracy: 0,
        count: 0,
        subtopics: []
      }
    }

    grouped[row.subject][row.chapter].totalAccuracy += row.accuracy
    grouped[row.subject][row.chapter].count += 1
    grouped[row.subject][row.chapter].subtopics.push(row)
  })

  setData(grouped)
}

  function getColor(value) {
    if (value < 50) return '#dc2626' // red
    if (value < 70) return '#f59e0b' // orange
    return '#16a34a' // green
  }

  function toggle(subject) {
    setExpanded((prev) => ({
      ...prev,
      [subject]: !prev[subject]
    }))
  }

function downloadPDF() {
  const element = document.getElementById('analysis-report')

  const opt = {
    margin: 0.5,
    filename: 'student-analysis.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
  }

  html2pdf().set(opt).from(element).save()
}
  
    return (
  <div style={styles.page} id="analysis-report">
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
  
  <div>
    <h1 style={styles.heading}>📊 Detailed Analysis</h1>

    <div style={{ fontSize: 14, color: '#555' }}>
   <strong>{collegeName || '-'}</strong><br/>
Student: {student ? `${student.first_name} ${student.last_name}` : '-'}
    </div>
  </div>

  <button
    onClick={downloadPDF}
    style={{
      padding: '8px 14px',
      background: '#16a34a',
      color: '#fff',
      border: 'none',
      borderRadius: 6,
      cursor: 'pointer'
    }}
  >
    Download PDF
  </button>
</div>
      {Object.entries(data).map(([subject, chapters]) => {
        const chartData = Object.entries(chapters).map(
          ([chapter, value]) => ({
            name: chapter,
            accuracy:
              value.count > 0
                ? value.totalAccuracy / value.count
                : 0
          })
        )

        const weakest = [...chartData].sort(
          (a, b) => a.accuracy - b.accuracy
        )[0]

        const strongest = [...chartData].sort(
          (a, b) => b.accuracy - a.accuracy
        )[0]

        return (
          <div key={subject} style={styles.card}>
            <h2>{subject}</h2>

            <div style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="accuracy">
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={getColor(entry.accuracy)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ marginTop: 10 }}>
              <strong>Weakest:</strong>{' '}
              {weakest
                ? `${weakest.name} (${weakest.accuracy.toFixed(1)}%)`
                : '-'}{' '}
              |{' '}
              <strong>Strongest:</strong>{' '}
              {strongest
                ? `${strongest.name} (${strongest.accuracy.toFixed(1)}%)`
                : '-'}
            </div>

            <button
              style={styles.button}
              onClick={() => toggle(subject)}
            >
              {expanded[subject]
                ? 'Hide Subtopics ▲'
                : 'View Subtopics ▼'}
            </button>

            {expanded[subject] &&
              Object.entries(chapters).map(
                ([chapter, value]) => (
                  <div key={chapter} style={styles.subtopicBox}>
                    <strong>{chapter}</strong>

                    {value.subtopics.map((s, i) => (
                      <div key={i} style={styles.subtopicRow}>
                        {s.subtopic} –{' '}
                        <span
                          style={{
                            color: getColor(s.accuracy)
                          }}
                        >
                          {s.accuracy.toFixed(1)}%
                        </span>{' '}
                        ({s.attempts} attempts)
                      </div>
                    ))}
                  </div>
                )
              )}
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
    fontFamily: 'system-ui'
  },
  heading: {
    fontSize: 26,
    marginBottom: 20
  },
  card: {
    background: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 25,
    border: '1px solid #e5e7eb'
  },
  button: {
    marginTop: 10,
    padding: '6px 10px',
    border: 'none',
    background: '#2563eb',
    color: '#fff',
    borderRadius: 6,
    cursor: 'pointer'
  },
  subtopicBox: {
    marginTop: 10,
    padding: 10,
    background: '#f9fafb',
    borderRadius: 6
  },
  subtopicRow: {
    fontSize: 13,
    marginTop: 4
  }
}
