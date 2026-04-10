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

  const [data, setData] = useState({})
  const [expanded, setExpanded] = useState({})
  const [student, setStudent] = useState(null)
  const [collegeName, setCollegeName] = useState('')

  useEffect(() => {
    if (studentId) fetchData()
  }, [studentId])

  async function fetchData() {
    // 🔥 Fetch student
    const { data: studentData } = await supabase
      .from('students')
      .select('name, college_id')
      .eq('id', studentId)
      .single()

    setStudent(studentData)

    // 🔥 Fetch college
    if (studentData?.college_id) {
      const { data: college } = await supabase
        .from('colleges')
        .select('name')
        .eq('id', studentData.college_id)
        .single()

      setCollegeName(college?.name || '')
    }

    // 🔥 Fetch stats
    const { data: stats } = await supabase
      .from('student_subtopic_stats')
      .select('*')
      .eq('student_id', studentId)

    if (!stats) return

    const grouped = {}

    stats.forEach((row) => {
      if (!grouped[row.subject]) grouped[row.subject] = {}

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

  function downloadPDF() {
    const element = document.getElementById('pdf-report')

    const opt = {
      margin: 0.5,
      filename: `${student?.name || 'student'}-report.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    }

    html2pdf().set(opt).from(element).save()
  }

  function getColor(value) {
    if (value < 50) return '#dc2626'
    if (value < 70) return '#f59e0b'
    return '#16a34a'
  }

  function toggle(subject) {
    setExpanded((prev) => ({
      ...prev,
      [subject]: !prev[subject]
    }))
  }

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.header}>
        <h1 style={styles.heading}>📊 Detailed Analysis</h1>

        <button onClick={downloadPDF} style={styles.pdfBtn}>
          Download PDF
        </button>
      </div>

      {/* UI VIEW */}
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
                        key={index}
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
              | <strong>Strongest:</strong>{' '}
              {strongest
                ? `${strongest.name} (${strongest.accuracy.toFixed(1)}%)`
                : '-'}
            </div>

            <button style={styles.button} onClick={() => toggle(subject)}>
              {expanded[subject] ? 'Hide Subtopics ▲' : 'View Subtopics ▼'}
            </button>

            {expanded[subject] &&
              Object.entries(chapters).map(([chapter, value]) => (
                <div key={chapter} style={styles.subtopicBox}>
                  <strong>{chapter}</strong>

                  {value.subtopics.map((s, i) => (
                    <div key={i} style={styles.subtopicRow}>
                      {s.subtopic} –{' '}
                      <span style={{ color: getColor(s.accuracy) }}>
                        {s.accuracy.toFixed(1)}%
                      </span>{' '}
                      ({s.attempts} attempts)
                    </div>
                  ))}
                </div>
              ))}
          </div>
        )
      })}

      {/* 🔥 PDF VERSION (HIDDEN) */}
      <div id="pdf-report" style={{ display: 'none', padding: 20 }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <h2>{collegeName}</h2>
          <h3>Student Performance Report</h3>
          <p><strong>Student:</strong> {student?.name}</p>
        </div>

        {/* WATERMARK */}
        <div style={{
          position: 'fixed',
          top: '40%',
          left: '20%',
          fontSize: 60,
          opacity: 0.05,
          transform: 'rotate(-30deg)'
        }}>
          {collegeName}
        </div>

        {Object.entries(data).map(([subject, chapters]) => (
          <div key={subject} style={{ marginBottom: 20 }}>
            <h3>{subject}</h3>

            {Object.entries(chapters).map(([chapter, value]) => (
              <div key={chapter}>
                <strong>{chapter}</strong>

                {value.subtopics.map((s, i) => (
                  <div key={i}>
                    {s.subtopic} – {s.accuracy.toFixed(1)}% ({s.attempts})
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}

        {/* FOOTER */}
        <div style={{
          position: 'fixed',
          bottom: 10,
          width: '100%',
          textAlign: 'center',
          fontSize: 12,
          borderTop: '1px solid #ccc'
        }}>
          Confidential Report – Generated by ExamzCanvas
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: {
    padding: 40,
    background: '#f5f7fb',
    minHeight: '100vh'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  heading: {
    fontSize: 26
  },
  pdfBtn: {
    padding: '8px 14px',
    background: '#16a34a',
    color: '#fff',
    border: 'none',
    borderRadius: 6
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
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 6
  },
  subtopicBox: {
    marginTop: 10,
    padding: 10,
    background: '#f9fafb'
  },
  subtopicRow: {
    fontSize: 13,
    marginTop: 4
  }
}
