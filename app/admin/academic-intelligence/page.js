'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../../lib/supabase'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, BarChart, Bar
} from 'recharts'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

function format2(num) {
  return Number(num || 0).toFixed(2)
}

function getHeatColor(val) {
  if (val < 40) return '#ef4444'   // red
  if (val < 70) return '#f59e0b'   // yellow
  return '#10b981'                 // green
}

export default function AcademicIntelligence() {
  
  const [groupedSubtopics, setGroupedSubtopics] = useState({})
  const summaryRef = useRef(null)
  const subjectRef = useRef(null)
  const performanceRef = useRef(null)
  const leaderboardRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [showAllZones, setShowAllZones] = useState({
  low: false,
  struggle: false,
  ideal: false,
  potential: false
})
  const [effortZonesState, setEffortZonesState] = useState({
  low: [],
  struggle: [],
  ideal: [],
  potential: []
})
  const [examCategory, setExamCategory] = useState('JEE_MAINS')
  const [targetYear, setTargetYear] = useState('1')
  const [summary, setSummary] = useState({})
  const [topPerformers, setTopPerformers] = useState({})
  const [subjects, setSubjects] = useState([])
  const [subtopics, setSubtopics] = useState([])
  const [riskStudents, setRiskStudents] = useState([])
  const [effortData, setEffortData] = useState([])
  const [efficiencyData, setEfficiencyData] = useState([])
  const [trendData, setTrendData] = useState({})
  const [recommendations, setRecommendations] = useState([])
  const [aiInsights, setAiInsights] = useState([])
  const MIN_QUESTIONS = 2
  const ACC_THRESHOLD = 50

  useEffect(() => { init() }, [examCategory, targetYear])

  async function init() {
    setLoading(true)

    const { data: auth } = await supabase.auth.getUser()
    const user = auth?.user

    const { data: userData } = await supabase
      .from('students')
      .select('college_id')
      .eq('email', user.email)
      .single()

    await loadData(userData.college_id)
    setLoading(false)
  }

  async function loadData(college_id) {

// ================= STEP 1: GET EXAMS =================
let examQuery = supabase.from('exams').select('id, exam_date')

  if (examCategory !== 'ALL') {
    examQuery = examQuery.eq('exam_category', examCategory)
  }

  const { data: exams } = await examQuery
  const examIds = exams?.map(e => e.id) || []

  // ================= STEP 2: BASE QUERIES =================
  let examStatsQuery = supabase
    .from('student_exam_stats')
    .select('*')
    .eq('college_id', college_id)

  let subQuery = supabase
    .from('student_subtopic_stats')
    .select('*')
    .eq('college_id', college_id)

  if (examIds.length > 0) {
    examStatsQuery = examStatsQuery.in('exam_id', examIds)
    subQuery = subQuery.in('exam_id', examIds)
  }

  const { data: examStats = [] } = await examStatsQuery
  const { data: subStats = [] } = await subQuery

const examMap = {}

exams?.forEach(e => {
  examMap[e.id] = e.exam_date ? new Date(e.exam_date) : null
})
// ================= TOTAL STUDENTS (REAL COUNT) =================
let studentQuery = supabase
.from('students')
.select('id')
.eq('college_id', college_id)
.neq('role', 'admin')   

if (examCategory !== 'ALL') {
  studentQuery = studentQuery.eq(
    'exam_preference',
    examCategory === 'JEE_MAINS' ? 'JEE' : 'NEET'
  )
}

if (targetYear !== 'ALL') {
  studentQuery = studentQuery.eq('study_year', String(targetYear))
}

const { data: allStudents = [] } = await studentQuery
const totalStudentsCount = allStudents.length

  // ================= STEP 3: TARGET YEAR FILTER =================
  let filteredExamStats = examStats
  let filteredSubStats = subStats

  if (targetYear !== 'ALL') {
  const { data: yearStudents } = await supabase
.from('students')
.select('id')
.eq('college_id', college_id)
.neq('role', 'admin')   // ✅ ADD
.eq('study_year', String(targetYear))

  const ids = yearStudents?.map(s => s.id) || []

  filteredExamStats = examStats.filter(s => ids.includes(s.student_id))
  filteredSubStats = subStats.filter(s => ids.includes(s.student_id))
}

  // ================= STEP 4: STUDENT MAP =================
  const studentIds = [...new Set(filteredExamStats.map(s => s.student_id))]

  let studentMap = {}

  if (studentIds.length > 0) {
    const { data: students } = await supabase
.from('students')
.select('id, first_name, last_name')
.in('id', studentIds)
.neq('role', 'admin')   // ✅ ADD

    students?.forEach(s => {
      studentMap[s.id] = `${s.first_name} ${s.last_name}`
    })
  }

  // ================= STEP 5: SUMMARY =================
  let totalScore = 0
  let totalAttempts = 0

  filteredExamStats.forEach(s => {
    totalScore += (s.avg_score || 0) * (s.attempts || 0)
    totalAttempts += s.attempts || 0
  })

  const avgScore = totalAttempts > 0 ? totalScore / totalAttempts : 0

  const uniqueStudents = new Set(filteredExamStats.map(s => s.student_id))

  // ================= STEP 6: SUBJECT =================
  const subjectAgg = {}

  filteredSubStats.forEach(s => {
    if (!subjectAgg[s.subject]) {
      subjectAgg[s.subject] = { correct: 0, total: 0, time: 0 }
    }

    subjectAgg[s.subject].correct += s.correct || 0
    subjectAgg[s.subject].total += s.total_questions || 0
    subjectAgg[s.subject].time += s.total_time_spent || 0
  })

    const subjectArray = Object.keys(subjectAgg).map(sub => {
    const d = subjectAgg[sub]
    
    return {
      subject: sub,
      accuracy: d.total > 0 ? (d.correct / d.total) * 100 : 0,
      avgTime: d.total > 0 ? d.time / d.total : 0
    }
  })

  // ================= STEP 7: SUBTOPICS =================
const subArray = filteredSubStats.map(s => ({
  student_id: s.student_id,   // ⭐ REQUIRED
  subject: s.subject,
  chapter: s.chapter || 'General', // ⭐ REQUIRED
  subtopic: s.subtopic,
  exam_type: s.exam_type || 'OTHER',
  correct: s.correct || 0,
  total: s.total_questions || 0
}))
// ================= STEP 7A: STUDENT AGG =================
const studentAgg = {}

subArray.forEach(s => {
  const key = `${s.student_id}_${s.subject}_${s.chapter}_${s.subtopic}_${s.exam_type}`

  if (!studentAgg[key]) {
    studentAgg[key] = {
      student_id: s.student_id,
      subject: s.subject,
      chapter: s.chapter,
      subtopic: s.subtopic,
      exam_type: s.exam_type,
      correct: 0,
      total: 0
    }
  }

  studentAgg[key].correct += s.correct
  studentAgg[key].total += s.total
})
// ================= STEP 7B: FINAL GROUPING =================
// ================= STEP 7B: FINAL GROUPING =================
const groupedSubtopics = {}

Object.values(studentAgg).forEach(s => {

  const subject = s.subject
  const chapter = s.chapter
  const subtopic = s.subtopic
  const type = s.exam_type

  if (!groupedSubtopics[subject]) groupedSubtopics[subject] = {}
  if (!groupedSubtopics[subject][chapter]) groupedSubtopics[subject][chapter] = {}
  if (!groupedSubtopics[subject][chapter][subtopic]) {
    groupedSubtopics[subject][chapter][subtopic] = {}
  }

  if (!groupedSubtopics[subject][chapter][subtopic][type]) {
    groupedSubtopics[subject][chapter][subtopic][type] = {
      correct: 0,
      total: 0,
      studentsCorrect: new Set()
    }
  }

  const entry = groupedSubtopics[subject][chapter][subtopic][type]

  entry.correct += s.correct
  entry.total += s.total

  if (s.total >= MIN_QUESTIONS) {
    const acc = (s.correct / s.total) * 100

    if (acc >= ACC_THRESHOLD) {
      entry.studentsCorrect.add(s.student_id)
    }
  }
})


// ================= STEP 7C: SUBTOPIC INSIGHTS =================
const subtopicInsightsMap = {}

Object.entries(groupedSubtopics).forEach(([subject, chapters]) => {
  Object.entries(chapters).forEach(([chapter, subs]) => {
    Object.entries(subs).forEach(([sub, exams]) => {

      const weekly = exams['WEEKLY_TEST']
      if (!weekly || weekly.total === 0) return

      const acc = (weekly.correct / weekly.total) * 100
      const studentsUnderstood = weekly.studentsCorrect.size

      const percent =
        totalStudentsCount > 0
          ? (studentsUnderstood / totalStudentsCount) * 100
          : 0

      if (!subtopicInsightsMap[subject]) {
        subtopicInsightsMap[subject] = []
      }

      // 🔴 Weak concept
      if (acc < 40 && percent < 40) {
        subtopicInsightsMap[subject].push(
          `🔴 ${subject} → ${sub}: Only ${studentsUnderstood}/${totalStudentsCount} students (${format2(percent)}%) understand this concept.`
        )
      }

      // 🟡 Practice issue
      else if (acc < 60 && percent >= 40) {
        subtopicInsightsMap[subject].push(
          `🟡 ${subject} → ${sub}: Students partially understand but make mistakes. Needs more practice.`
        )
      }

      // ⚠️ Misleading high score
      else if (acc >= 70 && percent < 40) {
        subtopicInsightsMap[subject].push(
          `⚠️ ${subject} → ${sub}: High accuracy but only few students performing well. Others need attention.`
        )
      }

    })
  })
})


// ================= STEP 7D: BALANCED OUTPUT =================
const subtopicInsights = []

Object.values(subtopicInsightsMap).forEach(list => {
  subtopicInsights.push(...list.slice(0, 2)) // max 2 per subject
})
  // ================= STEP 8: RISK =================
const riskMap = {}

filteredExamStats.forEach(s => {
  const id = s.student_id

  if (!riskMap[id]) {
    riskMap[id] = {
      name: studentMap[id] || 'Unknown',
      scores: [],
      attempts: 0
    }
  }

  riskMap[id].scores.push(s.avg_score || 0)
  riskMap[id].attempts += (s.attempts || 1)
})

const risk = Object.values(riskMap)
  .map(s => {
    const avg =
      s.scores.reduce((a, b) => a + b, 0) / s.scores.length

    return {
      name: s.name,
      score: avg,
      attempts: s.attempts,
      issue: avg < 70 ? 'Below 70% performance' : null
    }
  })
  .filter(s => s.score < 70)
  .sort((a, b) => a.score - b.score) // weakest first

  
// ================= STEP 10: TREND (CORRECT FOR YOUR DB) =================

const trendMap = {
  WEEKLY_TEST: {},
  MONTHLY_TEST: {},
  GRAND_TEST: {}
}

// Step 1: group by exam_id
filteredExamStats.forEach(s => {
  const type = s.exam_type || 'OTHER'
  const examId = s.exam_id

  if (!trendMap[type][examId]) {
  const examDate = examMap[examId]

  trendMap[type][examId] = {
    totalScore: 0,
    totalStudents: 0,
    date: examDate ?? s.created_at
  }
}

  trendMap[type][examId].totalScore += s.avg_score || 0
  trendMap[type][examId].totalStudents += 1
})


// Step 2: convert to trend points
Object.keys(trendMap).forEach(type => {
  trendMap[type] = Object.values(trendMap[type])
    .map(e => ({
      date: e.date,
      score: e.totalStudents > 0
        ? e.totalScore / e.totalStudents
        : 0
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-10)
    .map((s, i) => ({
    name: new Date(s.date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short'
    }),
      score: Number(format2(s.score))
    }))
})  

// ================= STEP 11: EFFORT (STUDENT LEVEL) =================

// Step 1: aggregate per student
const studentEffortMap = {}

filteredExamStats.forEach(s => {
  const id = s.student_id

  if (!studentEffortMap[id]) {
    studentEffortMap[id] = {
      name: studentMap[id] || 'Unknown',
      totalTime: 0,
      totalScore: 0,
      totalAttempts: 0
    }
  }

  studentEffortMap[id].totalTime += s.total_time_spent || 0
  studentEffortMap[id].totalScore += (s.avg_score || 0) * (s.attempts || 1)
  studentEffortMap[id].totalAttempts += (s.attempts || 1)
})


// Step 2: convert to student-level data
const effort = Object.values(studentEffortMap).map(s => {
  const avgScore =
    s.totalAttempts > 0 ? s.totalScore / s.totalAttempts : 0

  let zone = 'neutral'

  if (s.totalTime < 300 && avgScore < 50) zone = 'low'
  else if (s.totalTime >= 300 && avgScore < 50) zone = 'struggle'
  else if (s.totalTime >= 300 && avgScore >= 70) zone = 'ideal'
  else if (s.totalTime < 300 && avgScore >= 70) zone = 'potential'

  return {
    name: s.name,
    effort: s.totalTime,
    score: avgScore,
    zone
  }
})

const effortZones = {
  low: [],
  struggle: [],
  ideal: [],
  potential: []
}

effort.forEach(e => {
  if (e.zone === 'low') effortZones.low.push(e)
  if (e.zone === 'struggle') effortZones.struggle.push(e)
  if (e.zone === 'ideal') effortZones.ideal.push(e)
  if (e.zone === 'potential') effortZones.potential.push(e)
})
setEffortZonesState(effortZones)

const effortInsights = []

if (effortZones.low.length > 0) {
  effortInsights.push(
    `🔴 ${effortZones.low.length} students are not putting enough effort and scoring low. Need monitoring.`
  )
}

if (effortZones.struggle.length > 0) {
  effortInsights.push(
    `🟡 ${effortZones.struggle.length} students are working hard but scoring low. They need conceptual clarity.`
  )
}

if (effortZones.potential.length > 0) {
  effortInsights.push(
    `⚠️ ${effortZones.potential.length} students have high potential but are not putting enough effort.`
  )
}

if (effortZones.ideal.length > 0) {
  effortInsights.push(
    `🟢 ${effortZones.ideal.length} students are performing well with good effort.`
  )
}
// ================= STEP 12: TOP PERFORMERS (GROUPED) =================
const performersMap = {}

filteredExamStats.forEach(s => {
  const type = s.exam_type || 'OTHER'

  if (!performersMap[type]) {
    performersMap[type] = {}
  }

  if (!performersMap[type][s.student_id]) {
    performersMap[type][s.student_id] = []
  }

  performersMap[type][s.student_id].push(s.avg_score || 0)
})

Object.keys(performersMap).forEach(type => {
  performersMap[type] = Object.entries(performersMap[type])
    .map(([id, scores]) => ({
      name: studentMap[id] || 'Unknown',
      score: scores.reduce((a, b) => a + b, 0) / scores.length
    }))
    .filter(s => s.score >= 70)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
})
  
// ================= STEP 13: SUBJECT INSIGHTS =================
const subjectInsights = subjectArray.map(s => {
  if (s.accuracy < 40) {
    return `🔴 ${s.subject} is weak (${format2(s.accuracy)}%). Immediate intervention required.`
  }
  if (s.accuracy < 60) {
    return `🟡 ${s.subject} needs improvement (${format2(s.accuracy)}%). Increase practice.`
  }
  return `🟢 ${s.subject} is strong (${format2(s.accuracy)}%).`
})
  // ================= STEP 14: AI INSIGHTS =================

const studentInsights = []

const insights = [
  ...subtopicInsights,
  ...subjectInsights,
  ...studentInsights,
  ...effortInsights
].sort((a, b) => {
  const priority = (txt) =>
    txt.startsWith('🔴') ? 1 :
    txt.startsWith('⚠️') ? 2 :
    txt.startsWith('🟡') ? 3 : 4

  return priority(a) - priority(b)
}).slice(0, 8)

if (risk.length > 0) {
  studentInsights.push(
    `⚠️ ${risk.length} students are scoring below 70%. Focus on mentoring them.`
  )
}
  // ================= FINAL SET =================
  const activeStudentsCount = uniqueStudents.size

  const participation =
  totalStudentsCount > 0
    ? (activeStudentsCount / totalStudentsCount) * 100
    : 0
 setSummary({
  avgScore: format2(avgScore),
  totalStudents: totalStudentsCount,
  activeStudents: activeStudentsCount,
  participation: format2(participation),
  risk: risk.length
})
  setSubjects(subjectArray)
  
  setRiskStudents(risk)
  setEffortData(effort)
  setTrendData(trendMap)  
  setAiInsights(insights)
 setTopPerformers(performersMap)
 setGroupedSubtopics(groupedSubtopics)
}


async function downloadPDF() {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4')

    const addPage = async (ref, isFirst = false) => {
      if (!ref.current) {
        console.warn('Missing ref:', ref)
        return
      }

      const canvas = await html2canvas(ref.current, {
        scale: 2,
        useCORS: true
      })

      const img = canvas.toDataURL('image/png')

      const imgProps = pdf.getImageProperties(img)
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width

      if (!isFirst) pdf.addPage()

      pdf.addImage(img, 'PNG', 0, 0, pdfWidth, pdfHeight)
    }

    await addPage(summaryRef, true)
    await addPage(subjectRef)
    await addPage(performanceRef)
    await addPage(leaderboardRef)

    pdf.save('academic-intelligence.pdf')

  } catch (err) {
    console.error('PDF error:', err)
    alert('Failed to download PDF. Check console.')
  }
}
const zoneColor = {
  low: '#ef4444',        // red
  struggle: '#f59e0b',   // yellow
  ideal: '#10b981',      // green
  potential: '#3b82f6'   // blue
}
const getNames = (arr, key) => {
  const list = showAllZones[key] ? arr : arr.slice(0, 3)
  return list.map(s => s.name).join(', ')
}

  if (loading) return <p>Loading...</p>
  const totalStudents = summary.totalStudents || 0
      return (
        <div style={styles.page}>

          <div style={styles.header}>
              <h1>📊 Academic Intelligence</h1>
                  <button
                    style={styles.btn}
                    onMouseEnter={e => e.target.style.background = '#1d4ed8'}
                    onMouseLeave={e => e.target.style.background = '#2563eb'}
                    onClick={downloadPDF}
                  >
                    📄 Export PDF
                  </button>
          </div>

          <div style={styles.filters}>
           

            <select value={examCategory} onChange={e => setExamCategory(e.target.value)}>
              
              <option value="JEE_MAINS">JEE</option>
              <option value="NEET">NEET</option>
            </select>

            <select value={targetYear} onChange={e => setTargetYear(e.target.value)}>
              
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
            </select>
          </div>
    {/* ================= PAGE 1 ================= */}
    <div ref={summaryRef} style={styles.pageBlock}>

      <Section title="Summary" desc="Overall performance snapshot">
        <CardRow>
          <Card title="Total Students" value={summary.totalStudents} />
          <Card title="Active Students" value={summary.activeStudents} />
          <Card title="Participation" value={summary.participation + '%'} />
          <Card title="Avg Score" value={summary.avgScore + '%'} />
          <Card title="At Risk" value={summary.risk} />
        </CardRow>
      </Section>

      <Section title="AI Insights" desc="Automatically generated key findings">
        {aiInsights.map((i, idx) => <Insight key={idx} text={i} />)}
      </Section>

    </div>


    {/* ================= PAGE 2 ================= */}
    <div ref={subjectRef} style={styles.pageBlock}>

      <Section title="Subjects" desc="Accuracy = Correct answers / Total questions. Also shows avg time per question.">
        {subjects.map(s => (
          <Row key={s.subject} left={s.subject} right={`${format2(s.accuracy)}% | ${format2(s.avgTime)}s`} />
        ))}
      </Section>

      <Section
  title="Subtopic Analysis"
  desc="Chapter-wise comparison across exam types"
>
<div style={styles.infoBox}>
  <strong>How to read this:</strong>

  <div style={{ marginTop: 6 }}>
    <b>% (big number)</b> → Overall accuracy of students in this subtopic  
    (how well questions were answered)
  </div>

  <div>
    <b>Correct / Total (e.g., 38 / 60)</b> → Total correct answers out of all attempts  
    across all students and exams
  </div>

  <div>
    <b>👥 Students (e.g., 5 / 12)</b> → Number of students who understood the concept  
    (scored ≥ {ACC_THRESHOLD}%)
  </div>

  <div style={{ marginTop: 6 }}>
    <b>What it means:</b>
  </div>
<div style={{ marginTop: 6 }}>
  <b>Example:</b>  
  43% | 10/23 | 👥 5/12 → Only 5 out of 12 students understood the topic,  
  and overall performance is weak → Needs more practice and revision
</div>
  <div>🔴 <b>Low % + Low 👥</b> → Most students don’t understand → Re-teach the concept</div>

  <div>🟡 <b>Medium % + High 👥</b> → Students understand but make mistakes → Practice needed</div>

  <div>🟢 <b>High % + High 👥</b> → Strong topic → No action needed</div>

  <div>⚠️ <b>High % + Low 👥</b> → Only few students are performing well → Focus on weak students</div>
</div>

{Object.entries(groupedSubtopics).map(([subject, chapters]) => (

  <div key={subject} style={{ marginBottom: 40 }}>

    <h2>{subject}</h2>

    {Object.entries(chapters).map(([chapter, subtopics]) => (

      <div key={chapter} style={{ marginBottom: 20 }}>

        <h4 style={{ marginBottom: 10 }}>{chapter}</h4>

        <table style={styles.table}>

          <thead>
            <tr>
              <th style={{ width: '40%', textAlign: 'left' }}>Subtopic</th>
              <th style={{ width: '20%' }}>Weekly</th>
              <th style={{ width: '20%' }}>Monthly</th>
              <th style={{ width: '20%' }}>Grand</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(subtopics).map(([sub, exams]) => {

              const getCell = (type) => {
              const d = exams[type]
              if (!d || d.total === 0) return <span style={{ color:'#9ca3af' }}>—</span>
            
              const acc = (d.correct / d.total) * 100
            
              const studentPercent =
              totalStudents > 0
                ? (d.studentsCorrect.size / totalStudents) * 100
                : 0
              return (
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 10,
                  color: '#fff',
                  background:
                    acc < 40 ? '#ef4444' :
                    acc < 70 ? '#f59e0b' :
                    '#10b981'
                }}>
            
                  {/* BIG METRIC */}
                  <div style={{ fontSize: 18, fontWeight: 'bold' }}>
                    {format2(acc)}%
                  </div>
            
                  {/* DETAILS */}
                  <div style={{ fontSize: 12, marginTop: 4 }}>
                    {d.correct}/{d.total}
                  </div>
            
                  <div style={{ fontSize: 11, opacity: 0.9 }}>
                    👥 {d.studentsCorrect.size} / {totalStudents} ({format2(studentPercent)}%)
                  </div>
            
                </div>
              )
            }

              return (
                <tr key={sub}>
                  <td style={{ textAlign: 'left', fontWeight: 500 }}>
                    {sub}
                  </td>
                  <td>{getCell('WEEKLY_TEST')}</td>
                  <td>{getCell('MONTHLY_TEST')}</td>
                  <td>{getCell('GRAND_TEST')}</td>
                </tr>
              )
            })}
          </tbody>

        </table>

      </div>

    ))}

  </div>

))}

</Section>

    </div>


    {/* ================= PAGE 3 ================= */}
    <div ref={performanceRef} style={styles.pageBlock}>

  <Section title="Trend" desc="Performance across exam types">

  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>

    {['WEEKLY_TEST', 'MONTHLY_TEST', 'GRAND_TEST'].map(type => (
      
      <div key={type}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>
          {type.replace('_TEST','')}
        </div>

        <Chart>
          <LineChart data={trendData[type] || []}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line dataKey="score" />
          </LineChart>
        </Chart>
      </div>

    ))}

  </div>

</Section>
      <Section title="Effort vs Performance" desc="Student behavior analysis on overall exams">
        <div style={styles.infoBox}>
  <strong>How to read this:</strong>

  <div style={{ marginTop: 6 }}>
    <b>Effort</b> → Total time spent by students in exams
  </div>

  <div>
    <b>Score</b> → Average marks scored by students
  </div>

  <div style={{ marginTop: 6 }}>
    Students are divided into 4 categories:
  </div>

  <div>🔴 <b>Low Effort + Low Score</b> → Not studying → Needs monitoring</div>

  <div>🟡 <b>High Effort + Low Score</b> → Working hard but not understanding → Needs concept clarity</div>

  <div>🟢 <b>High Effort + High Score</b> → Ideal students → Performing well</div>

  <div>⚠️ <b>Low Effort + High Score</b> → High potential → Can improve further with effort</div>

  <div style={{ marginTop: 6 }}>
    <b>Example:</b>
  </div>

  <div>
    🟡 4 students in "High Effort + Low Score" → They are trying hard but still scoring low → Teacher should focus on clearing concepts
  </div>
</div>
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>

  {/* 🔴 LOW */}
  <div style={{ ...styles.card, borderLeft: '4px solid #ef4444' }}>
    <div style={{ fontWeight: 600 }}>🔴 Low Effort & Low Score</div>
    <div style={{ fontSize: 22 }}>{effortZonesState.low.length}</div>
    <div style={{ fontSize: 12, color: '#64748b' }}>
      Not engaged students
    </div>

    <div style={{ fontSize: 12, marginTop: 6 }}>
      {getNames(effortZonesState.low, 'low') || '—'}
    </div>

    {effortZonesState.low.length > 3 && (
      <div
        style={{ fontSize: 12, color: '#2563eb', cursor: 'pointer' }}
        onClick={() =>
          setShowAllZones(prev => ({
            ...prev,
            low: !prev.low
          }))
        }
      >
        {showAllZones.low ? 'Show less' : 'View all'}
      </div>
    )}
  </div>

  {/* 🟡 STRUGGLE */}
  <div style={{ ...styles.card, borderLeft: '4px solid #f59e0b' }}>
    <div style={{ fontWeight: 600 }}>🟡 High Effort & Low Score</div>
    <div style={{ fontSize: 22 }}>{effortZonesState.struggle.length}</div>
    <div style={{ fontSize: 12, color: '#64748b' }}>
      Working hard but struggling
    </div>

    <div style={{ fontSize: 12, marginTop: 6 }}>
      {getNames(effortZonesState.struggle, 'struggle') || '—'}
    </div>

    {effortZonesState.struggle.length > 3 && (
      <div
        style={{ fontSize: 12, color: '#2563eb', cursor: 'pointer' }}
        onClick={() =>
          setShowAllZones(prev => ({
            ...prev,
            struggle: !prev.struggle
          }))
        }
      >
        {showAllZones.struggle ? 'Show less' : 'View all'}
      </div>
    )}
  </div>

  {/* 🟢 IDEAL */}
  <div style={{ ...styles.card, borderLeft: '4px solid #10b981' }}>
    <div style={{ fontWeight: 600 }}>🟢 High Effort & High Score</div>
    <div style={{ fontSize: 22 }}>{effortZonesState.ideal.length}</div>
    <div style={{ fontSize: 12, color: '#64748b' }}>
      Top performing students
    </div>

    <div style={{ fontSize: 12, marginTop: 6 }}>
      {getNames(effortZonesState.ideal, 'ideal') || '—'}
    </div>

    {effortZonesState.ideal.length > 3 && (
      <div
        style={{ fontSize: 12, color: '#2563eb', cursor: 'pointer' }}
        onClick={() =>
          setShowAllZones(prev => ({
            ...prev,
            ideal: !prev.ideal
          }))
        }
      >
        {showAllZones.ideal ? 'Show less' : 'View all'}
      </div>
    )}
  </div>

  {/* ⚠️ POTENTIAL */}
  <div style={{ ...styles.card, borderLeft: '4px solid #3b82f6' }}>
    <div style={{ fontWeight: 600 }}>⚠️ Low Effort & High Score</div>
    <div style={{ fontSize: 22 }}>{effortZonesState.potential.length}</div>
    <div style={{ fontSize: 12, color: '#64748b' }}>
      High potential students
    </div>

    <div style={{ fontSize: 12, marginTop: 6 }}>
      {getNames(effortZonesState.potential, 'potential') || '—'}
    </div>

    {effortZonesState.potential.length > 3 && (
      <div
        style={{ fontSize: 12, color: '#2563eb', cursor: 'pointer' }}
        onClick={() =>
          setShowAllZones(prev => ({
            ...prev,
            potential: !prev.potential
          }))
        }
      >
        {showAllZones.potential ? 'Show less' : 'View all'}
      </div>
    )}
  </div>

</div>

</Section>

      <div ref={leaderboardRef} style={styles.pageBlock}>

        <div style={{ display: 'flex', gap: 20, marginTop: 20 }}>

          {/* AT RISK */}
          <div style={{ flex: 1 }}>
            <Section
              title="At Risk"
              desc="Students below 70% performance"
            >
              {riskStudents.length === 0 && <p>No risk students</p>}

              {riskStudents.map((r, i) => (
                <Row
                  key={i}
                  left={r.name}
                  right={`${format2(r.score)}%`}
                />
              ))}
            </Section>
          </div>

          {/* TOP PERFORMERS */}
          <div style={{ flex: 1 }}>
            <Section
              title="Top Performers"
              desc="Students above 70%"
            >
              {Object.entries(topPerformers).map(([type, list]) => (
                <div key={type} style={{ marginBottom: 10 }}>
                  <strong>{type.replace('_TEST','')}</strong>

                  {list.map((s, i) => (
                    <Row
                      key={i}
                      left={`${i + 1}. ${s.name}`}
                      right={`${format2(s.score)}%`}
                    />
                  ))}
                </div>
              ))}
            </Section>
          </div>

        </div>

      </div>
  </div>
     
</div>
        )
  }

        /* UI */

        const Section = ({title, desc, children}) => (
          <div style={styles.section}>
            <h2>{title}</h2>
            <p style={styles.desc}>{desc}</p>
            {children}
          </div>
        )

        const CardRow = ({children}) => (
          <div style={{display:'flex', gap:20}}>{children}</div>
        )

        const Card = ({title,value}) => (
          <div style={styles.card}>
            <div>{title}</div>
            <div style={{fontSize:22,fontWeight:'bold'}}>{value}</div>
          </div>
        )

        const Row = ({left,right}) => (
          <div style={styles.row}><span>{left}</span><span>{right}</span></div>
        )

        const Insight = ({text}) => (
          <div style={styles.insight}>{text}</div>
        )

        const Chart = ({children}) => (
          <ResponsiveContainer width="100%" height={250}>{children}</ResponsiveContainer>
        )

    const styles = {
      pageBlock: {
      background: '#fff',
      padding: 20,
      marginBottom: 20,
      minHeight: '280mm'
    },
        heatGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
      gap: 12,
      marginTop: 10
    },
      heatSubject: {
        marginBottom: 8,
        fontSize: 14,
        fontWeight: 'bold'
      },
    heatCard: {
      padding: 10,
      borderRadius: 10,
      color: '#fff',
      minHeight: 80,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      fontSize: 12
    },

    heatTitle: {
      fontWeight: 'bold'
    },

    heatValue: {
      fontSize: 16,
      fontWeight: 'bold'
    },

    heatSub: {
      fontSize: 11,
      opacity: 0.8
    },
    heatGrid4: {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: 12
},
table: {
  width: '100%',
  borderCollapse: 'collapse',
  tableLayout: 'fixed',
  border: '1px solid #e5e7eb'
},

th: {
  padding: 12,
  textAlign: 'center',
  border: '1px solid #e5e7eb',
  background: '#f8fafc',
  fontWeight: 'bold'
},

td: {
  padding: 12,
  textAlign: 'center',
  border: '1px solid #e5e7eb',
  verticalAlign: 'middle',
  height: 90   // ⭐ gives box feel
},

heatCardNew: {
  borderRadius: 10,
  padding: 10,
  color: '#fff',
  minHeight: 90,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  fontSize: 12
},

heatSubtopic: {
  fontWeight: 'bold',
  fontSize: 12
},

heatPercent: {
  fontSize: 16,
  fontWeight: 'bold'
},

heatQs: {
  fontSize: 11,
  opacity: 0.9
},
examTypeRow: {
  display: 'flex',
  gap: 20,
  flexWrap: 'wrap'
},

examTypeColumn: {
  flex: 1,
  minWidth: 250
},
infoBox: {
  background: '#f8fafc',
  borderLeft: '4px solid #2563eb',
  padding: 12,
  marginBottom: 15,
  fontSize: 13,
  lineHeight: 1.5
},

examTypeTitle: {
  fontSize: 14,
  fontWeight: 'bold',
  marginBottom: 8
},
btn: {
  padding: '4px 10px',
  fontSize: 12,
  background: '#2563eb',
  color: '#fff',
  borderRadius: 6,
  border: 'none',
  cursor: 'pointer',
  height: 28,
  display: 'flex',
  alignItems: 'center',
  gap: 6
},
header: {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
},
  page:{padding:40, background:'#f1f5f9'},
  filters:{display:'flex', gap:10, margin:'20px 0'},
  section:{background:'#fff', padding:20, marginTop:20, borderRadius:12},
  desc:{color:'#64748b', fontSize:13},
  card:{background:'#fff', padding:20, borderRadius:12, flex:1},
  row:{display:'flex',justifyContent:'space-between',padding:6},
  insight:{background:'#f8fafc',padding:10,borderLeft:'4px solid #2563eb',marginTop:6}
}
