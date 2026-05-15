'use client'

import {
  useEffect,
  useState
} from 'react'

import {
  useParams
} from 'next/navigation'

import {
  supabase
} from '../../../../../../../lib/supabase'

export default function SchoolExamAnalyticsPage() {

  const {
    schoolId,
    examId
  } = useParams()

  const [loading, setLoading] =
    useState(true)

  const [exam, setExam] =
    useState(null)

  const [school, setSchool] =
    useState(null)

  const [leaderboard, setLeaderboard] =
    useState([])

  const [stats, setStats] =
    useState({

      totalStudents: 0,

      avgScore: 0,

      highestScore: 0,

      lowestScore: 0
    })

  useEffect(() => {

    if (
      schoolId &&
      examId
    ) {

      loadData()
    }

  }, [schoolId, examId])

  /* ======================================================
     LOAD
  ====================================================== */

  async function loadData() {

    try {

      setLoading(true)

      /* ======================================================
         SCHOOL
      ====================================================== */

      const {
        data: schoolData
      } = await supabase

        .from('schools')

        .select('*')

        .eq('id', schoolId)

        .single()

      setSchool(schoolData)

      /* ======================================================
         EXAM
      ====================================================== */

      const {
        data: examData
      } = await supabase

        .from('exams')

        .select('*')

        .eq('id', examId)

        .single()

      setExam(examData)

      /* ======================================================
         SCHOOL STUDENTS
      ====================================================== */

      const {
        data: students
      } = await supabase

        .from('students')

        .select(`
          id,
          first_name,
          last_name
        `)

        .eq('school_id', schoolId)

        .eq('role', 'student')

      const studentIds =
        (students || [])
          .map(s => s.id)

      if (
        studentIds.length === 0
      ) {

        setLoading(false)

        return
      }

      const studentsMap = {}

      students.forEach(s => {

        studentsMap[s.id] =

          `${s.first_name || ''}
           ${s.last_name || ''}`
      })

      /* ======================================================
         SESSIONS
      ====================================================== */

      const {
        data: sessions
      } = await supabase

        .from('exam_sessions')

        .select(`
          student_id,
          score,
          submitted_at
        `)

        .eq('exam_id', examId)

        .eq('submitted', true)

        .in(
          'student_id',
          studentIds
        )

      const rows =
        (sessions || [])

          .map(s => ({

            student_id:
              s.student_id,

            name:
              studentsMap[
                s.student_id
              ],

            score:
              s.score || 0,

            submitted_at:
              s.submitted_at
          }))

          .sort(
            (a, b) =>
              b.score - a.score
          )

      setLeaderboard(rows)

      /* ======================================================
         KPI
      ====================================================== */

      const scores =
        rows.map(r => r.score)

      const total =
        scores.length

      const avg =
        total > 0

          ? scores.reduce(
              (a,b) => a+b,
              0
            ) / total

          : 0

      const highest =
        total > 0
          ? Math.max(...scores)
          : 0

      const lowest =
        total > 0
          ? Math.min(...scores)
          : 0

      setStats({

        totalStudents:
          total,

        avgScore:
          avg.toFixed(2),

        highestScore:
          highest,

        lowestScore:
          lowest
      })

    } catch (err) {

      console.error(err)

    } finally {

      setLoading(false)
    }
  }

  if (loading) {

    return (

      <div className="p-10">
        Loading...
      </div>

    )
  }

  return (

    <div className="
      min-h-screen
      bg-gray-100
      p-8
    ">

      <div className="
        max-w-7xl
        mx-auto
      ">

        {/* ======================================================
           HEADER
        ====================================================== */}

        <div className="
          bg-white
          rounded-3xl
          p-8
          shadow-sm
          mb-8
        ">

          <h1 className="
            text-4xl
            font-black
            text-gray-800
            mb-3
          ">

            🏆 {school?.name}

          </h1>

          <p className="
            text-lg
            text-gray-600
            mb-6
          ">

            {exam?.title}

          </p>

          <div className="
            flex
            flex-wrap
            gap-3
          ">

            <Badge>
              {exam?.phase}
            </Badge>

            <Badge>
              {exam?.olympiad_subject}
            </Badge>

            <Badge>
              {exam?.exam_category}
            </Badge>

          </div>

        </div>

        {/* ======================================================
           KPI
        ====================================================== */}

        <div className="
          grid
          md:grid-cols-4
          gap-6
          mb-8
        ">

          <KPI
            title="Participants"
            value={stats.totalStudents}
          />

          <KPI
            title="Average Score"
            value={stats.avgScore}
          />

          <KPI
            title="Highest Score"
            value={stats.highestScore}
          />

          <KPI
            title="Lowest Score"
            value={stats.lowestScore}
          />

        </div>

        {/* ======================================================
           LEADERBOARD
        ====================================================== */}

        <div className="
          bg-white
          rounded-3xl
          shadow-sm
          overflow-x-auto
        ">

          <div className="
            p-6
            border-b
            border-gray-200
          ">

            <h2 className="
              text-2xl
              font-black
            ">

              📊 School Leaderboard

            </h2>

          </div>

          <table className="
            w-full
            border-collapse
          ">

            <thead>

              <tr className="
                bg-gray-50
              ">

                <th className={thStyle}>
                  Rank
                </th>

                <th className={thStyle}>
                  Student
                </th>

                <th className={thStyle}>
                  Score
                </th>

                <th className={thStyle}>
                  Submitted
                </th>

              </tr>

            </thead>

            <tbody>

              {leaderboard.map(
                (row, idx) => (

                <tr
                  key={idx}
                  className="
                    border-b
                    border-gray-100
                  "
                >

                  <td className={tdStyle}>

                    {idx === 0 && '👑 '}
                    {idx === 1 && '🥈 '}
                    {idx === 2 && '🥉 '}

                    {idx + 1}

                  </td>

                  <td className={tdStyle}>
                    {row.name}
                  </td>

                  <td className={tdStyle}>

                    <span className="
                      font-black
                      text-lg
                    ">

                      {row.score}

                    </span>

                  </td>

                  <td className={tdStyle}>

                    {row.submitted_at

                      ? new Date(
                          row.submitted_at
                        ).toLocaleString()

                      : '-'
                    }

                  </td>

                </tr>

              ))}

              {leaderboard.length === 0 && (

                <tr>

                  <td
                    className={tdStyle}
                    colSpan={4}
                  >

                    No submissions found

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  )
}

/* ======================================================
   KPI
====================================================== */

function KPI({
  title,
  value
}) {

  return (

    <div className="
      bg-white
      rounded-3xl
      p-6
      shadow-sm
    ">

      <div className="
        text-sm
        text-gray-500
        mb-2
      ">

        {title}

      </div>

      <div className="
        text-4xl
        font-black
        text-gray-800
      ">

        {value}

      </div>

    </div>
  )
}

/* ======================================================
   BADGE
====================================================== */

function Badge({
  children
}) {

  return (

    <div className="
      bg-black
      text-white
      px-4
      py-2
      rounded-2xl
      font-bold
    ">

      {children}

    </div>
  )
}

const thStyle = `
  text-left
  p-4
  border-b
  border-gray-200
  font-bold
  text-gray-700
`

const tdStyle = `
  p-4
  text-gray-700
`
