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

  
  const summaryRef = useRef(null)
  const subjectRef = useRef(null)
  const performanceRef = useRef(null)
  const leaderboardRef = useRef(null)
  const [loading, setLoading] = useState(true)
  
  const [examCategory, setExamCategory] = useState('JEE_MAINS')
  const [targetYear, setTargetYear] = useState('1')
  const [summary, setSummary] = useState({})
  const [topPerformers, setTopPerformers] = useState({})
  const [subjects, setSubjects] = useState([])
  const [subtopics, setSubtopics] = useState([])
  const [riskStudents, setRiskStudents] = useState([])
  const [effortData, setEffortData] = useState([])
  const [efficiencyData, setEfficiencyData] = useState([])
  const [trendData, setTrendData] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [aiInsights, setAiInsights] = useState([])

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
  let examQuery = supabase.from('exams').select('id')

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
  subject: s.subject,
  subtopic: s.subtopic,
  exam_type: s.exam_type || 'OTHER',
  correct: s.correct || 0,
  total: s.total_questions || 0,
  accuracy:
    s.total_questions > 0
      ? (s.correct / s.total_questions) * 100
      : 0
}))

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

  // ================= STEP 9: EFFICIENCY =================
  const efficiency = filteredExamStats.map(s => ({
    name: studentMap[s.student_id] || 'Unknown',
    efficiency: s.avg_time_per_exam
      ? s.avg_score / (s.avg_time_per_exam / 60)
      : 0
  }))

  // ================= STEP 10: TREND (FIXED) =================
  const trend = [...filteredExamStats]
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .slice(-10)
    .map((s, i) => ({
      name: `Test ${i + 1}`,
      score: Number(format2(s.avg_score))
    }))

  // ================= STEP 11: EFFORT =================
  const effort = filteredExamStats.map(s => ({
    effort: s.total_time_spent || 0,
    score: s.avg_score || 0
  }))

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
  // ================= STEP 13: RECOMMENDATIONS =================
  const recs = subjectArray.map(s => ({
    subject: s.subject,
    msg:
      s.accuracy < 40
        ? '🔴 Strong intervention needed'
        : s.accuracy < 60
        ? '🟡 Improve practice'
        : '🟢 Good performance'
  }))

  // ================= STEP 14: AI INSIGHTS =================
  const insights = []

  if (subjectArray.some(s => s.accuracy < 40)) {
    insights.push('🔴 Some subjects have very low accuracy')
  }

  if (risk.length > 0) {
    insights.push(`⚠️ ${risk.length} students are at risk`)
  }

  if (efficiency.some(e => e.efficiency < 1)) {
    insights.push('⚡ Low efficiency observed in students')
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
  setSubtopics(subArray)
  setRiskStudents(risk)
  setEffortData(effort)
  setEfficiencyData(efficiency)
  setTrendData(trend)
  setRecommendations(recs)
  setAiInsights(insights)
 setTopPerformers(performersMap)
}
     const groupedSubtopics = {}

subtopics.forEach(s => {
  const subject = s.subject
  const chapter = s.chapter || 'General'
  const subtopic = s.subtopic
  const type = s.exam_type || 'OTHER'

  if (!groupedSubtopics[subject]) groupedSubtopics[subject] = {}
  if (!groupedSubtopics[subject][chapter]) groupedSubtopics[subject][chapter] = {}
  if (!groupedSubtopics[subject][chapter][subtopic]) {
    groupedSubtopics[subject][chapter][subtopic] = {}
  }

  if (!groupedSubtopics[subject][chapter][subtopic][type]) {
    groupedSubtopics[subject][chapter][subtopic][type] = {
  correct: 0,
  total: 0,
  studentsAttempted: new Set(),
  studentsCorrect: new Set()
}
  }

const entry = groupedSubtopics[subject][chapter][subtopic][type]

entry.correct += s.correct || 0
entry.total += s.total || 0

entry.studentsAttempted.add(s.student_id)

// calculate student-level accuracy
const studentAccuracy =
  (s.total || 0) > 0 ? (s.correct / s.total) * 100 : 0

// ✅ ONLY count if meaningful understanding
if (studentAccuracy >= 50) {
  entry.studentsCorrect.add(s.student_id)
}
})

  async function downloadPDF() {

      const pdf = new jsPDF('p', 'mm', 'a4')

      const addPage = async (ref, isFirst = false) => {
        const canvas = await html2canvas(ref.current, { scale: 2 })
        const img = canvas.toDataURL('image/png')

        if (!isFirst) pdf.addPage()

        pdf.addImage(img, 'PNG', 0, 0, 210, 297)
      }

      await addPage(summaryRef, true)
      await addPage(subjectRef)
      await addPage(performanceRef)
      await addPage(leaderboardRef)

      pdf.save('academic-intelligence.pdf')
    }

      if (loading) return <p>Loading...</p>

      return (
        <div style={styles.page}>

          <div style={styles.header}>
            <h1>📊 Academic Intelligence</h1>
            <button style={styles.btn} onClick={downloadPDF}>PDF</button>
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
    <b>% (big number)</b> → Overall accuracy for that subtopic
  </div>

  <div>
    <b>Correct/Total (e.g., 38/60)</b> → Total correct answers out of all attempts
  </div>

  <div>
    <b>👥 % (students)</b> → % of students who scored ≥ 60% in that subtopic
  </div>

  <div style={{ marginTop: 6 }}>
    🔴 &lt;40% = Weak &nbsp;&nbsp;
    🟡 40–70% = Moderate &nbsp;&nbsp;
    🟢 &gt;70% = Strong
  </div>
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
                d.studentsAttempted.size > 0
                  ? (d.studentsCorrect.size / d.studentsAttempted.size) * 100
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
                    👥 {format2(studentPercent)}%
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

      <Section title="Trend" desc="Performance over recent tests">
        <Chart>
          <LineChart data={trendData}>
            <XAxis dataKey="name"/>
            <YAxis/>
            <Tooltip/>
            <Line dataKey="score"/>
          </LineChart>
        </Chart>
      </Section>

      <Section title="Efficiency" desc="Score per minute">
        {efficiencyData.slice(0,10).map(e=>(
          <Row key={e.name} left={e.name} right={format2(e.efficiency)} />
        ))}
      </Section>

      <Section title="Effort vs Performance" desc="Time vs score comparison">
        <Chart>
          <ScatterChart>
            <XAxis dataKey="effort"/>
            <YAxis dataKey="score"/>
            <Tooltip/>
            <Scatter data={effortData}/>
          </ScatterChart>
        </Chart>
      </Section>

      <div style={{ display: 'flex', gap: 20, marginTop: 20 }}>

  {/* AT RISK */}
  <div style={{ flex: 1 }}>
    <Section
      title="At Risk"
      desc="Students below 70% performance"
    >
      {riskStudents.length === 0 && <p>No risk students</p>}

      {riskStudents.map((r,i)=>(
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
      {Object.entries(topPerformers).map(([type,list])=>(
        <div key={type} style={{ marginBottom: 10 }}>
          <strong>{type.replace('_TEST','')}</strong>

          {list.map((s,i)=>(
            <Row
              key={i}
              left={`${i+1}. ${s.name}`}
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
  page:{padding:40, background:'#f1f5f9'},
  header:{display:'flex',justifyContent:'space-between'},
  btn:{padding:'6px 12px', fontSize:12, background:'#2563eb', color:'#fff', borderRadius:6},
  filters:{display:'flex', gap:10, margin:'20px 0'},
  section:{background:'#fff', padding:20, marginTop:20, borderRadius:12},
  desc:{color:'#64748b', fontSize:13},
  card:{background:'#fff', padding:20, borderRadius:12, flex:1},
  row:{display:'flex',justifyContent:'space-between',padding:6},
  insight:{background:'#f8fafc',padding:10,borderLeft:'4px solid #2563eb',marginTop:6}
}
