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

  const [distribution, setDistribution] =
    useState([])

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
         STUDENTS
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
         SCORE DISTRIBUTION
      ====================================================== */

      const buckets = {

        '90+': 0,
        '75-89': 0,
        '60-74': 0,
        '40-59': 0,
        '<40': 0
      }

      rows.forEach(r => {

        const score = r.score

        if (score >= 90) {
          buckets['90+']++
        }

        else if (score >= 75) {
          buckets['75-89']++
        }

        else if (score >= 60) {
          buckets['60-74']++
        }

        else if (score >= 40) {
          buckets['40-59']++
        }

        else {
          buckets['<40']++
        }
      })

      setDistribution(

        Object.entries(buckets)
          .map(([label, value]) => ({
            label,
            value
          }))
      )

    } catch (err) {

      console.error(err)

    } finally {

      setLoading(false)
    }
  }

  if (loading) {

    return (

      <div className="
        p-10
      ">
        Loading...
      </div>

    )
  }

  const podium =
    leaderboard.slice(0, 3)

  const others =
    leaderboard.slice(3)

  return (

    <div className="
      min-h-screen
      bg-gradient-to-br
      from-slate-50
      to-indigo-50
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
          rounded-[32px]
          p-8
          shadow-sm
          mb-8
        ">

          <div className="
            flex
            flex-col
            lg:flex-row
            lg:items-center
            lg:justify-between
            gap-6
          ">

            <div>

              <div className="
                inline-flex
                items-center
                gap-2
                bg-indigo-100
                text-indigo-700
                px-4
                py-2
                rounded-full
                text-sm
                font-bold
                mb-5
              ">

                🏆 School Olympiad Analytics

              </div>

              <h1 className="
                text-4xl
                font-black
                text-gray-900
                mb-3
              ">

                {school?.name}

              </h1>

              <p className="
                text-lg
                text-gray-600
                mb-4
              ">

                {school?.city},
                {' '}
                {school?.district},
                {' '}
                {school?.state}

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

            <div className="
              bg-slate-50
              rounded-3xl
              p-6
              min-w-[260px]
            ">

              <div className="
                text-sm
                text-gray-500
                mb-2
              ">
                Exam
              </div>

              <div className="
                text-2xl
                font-black
                text-gray-900
                leading-snug
              ">

                {exam?.title}

              </div>

            </div>

          </div>

        </div>

        {/* ======================================================
           PODIUM
        ====================================================== */}

        {podium.length > 0 && (

          <div className="
            mb-10
          ">

            <h2 className="
              text-3xl
              font-black
              mb-6
            ">

              🏅 School Toppers

            </h2>

            <div className="
              grid
              md:grid-cols-3
              gap-6
            ">

              {/* SECOND */}

              <PodiumCard
                rank={2}
                emoji="🥈"
                row={podium[1]}
              />

              {/* FIRST */}

              <PodiumCard
                rank={1}
                emoji="👑"
                row={podium[0]}
                highlight
              />

              {/* THIRD */}

              <PodiumCard
                rank={3}
                emoji="🥉"
                row={podium[2]}
              />

            </div>

          </div>

        )}

        {/* ======================================================
           SCORE DISTRIBUTION
        ====================================================== */}

        <div className="
          bg-white
          rounded-[32px]
          p-8
          shadow-sm
          mb-10
        ">

          <div className="
            flex
            items-center
            justify-between
            mb-8
          ">

            <h2 className="
              text-3xl
              font-black
            ">

              📊 Score Distribution

            </h2>

            <div className="
              text-sm
              text-gray-500
            ">

              Total Participants:
              {' '}
              <span className="
                font-black
                text-black
              ">
                {leaderboard.length}
              </span>

            </div>

          </div>

          <div className="
            flex
            items-end
            gap-5
            h-[320px]
          ">

            {distribution.map(item => {

              const max =
                Math.max(
                  ...distribution.map(
                    d => d.value
                  ),
                  1
                )

              const height =
                (item.value / max) * 240

              return (

                <div
                  key={item.label}
                  className="
                    flex-1
                    flex
                    flex-col
                    items-center
                  "
                >

                  <div className="
                    font-black
                    mb-3
                  ">

                    {item.value}

                  </div>

                  <div
                    style={{
                      height
                    }}
                    className="
                      w-full
                      rounded-t-3xl
                      bg-gradient-to-t
                      from-indigo-600
                      to-indigo-300
                      transition-all
                    "
                  />

                  <div className="
                    mt-4
                    text-sm
                    font-bold
                    text-gray-700
                  ">

                    {item.label}

                  </div>

                </div>
              )
            })}

          </div>

        </div>

        {/* ======================================================
           LEADERBOARD
        ====================================================== */}

        <div className="
          bg-white
          rounded-[32px]
          shadow-sm
          overflow-hidden
        ">

          <div className="
            p-8
            border-b
            border-gray-100
          ">

            <h2 className="
              text-3xl
              font-black
            ">

              🏆 Full Leaderboard

            </h2>

          </div>

          <div className="
            overflow-x-auto
          ">

            <table className="
              w-full
              border-collapse
            ">

              <thead>

                <tr className="
                  bg-slate-50
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
                      border-slate-100
                      hover:bg-slate-50
                    "
                  >

                    <td className={tdStyle}>

                      <div className="
                        font-black
                        text-lg
                      ">

                        {idx === 0 && '👑 '}
                        {idx === 1 && '🥈 '}
                        {idx === 2 && '🥉 '}

                        #{idx + 1}

                      </div>

                    </td>

                    <td className={tdStyle}>

                      <div className="
                        font-bold
                        text-gray-900
                      ">

                        {row.name}

                      </div>

                    </td>

                    <td className={tdStyle}>

                      <div className="
                        inline-flex
                        items-center
                        justify-center
                        px-4
                        py-2
                        rounded-2xl
                        bg-indigo-100
                        text-indigo-700
                        font-black
                        text-lg
                      ">

                        {row.score}

                      </div>

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
                      className="
                        p-10
                        text-center
                        text-gray-500
                      "
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

    </div>
  )
}

/* ======================================================
   PODIUM CARD
====================================================== */

function PodiumCard({
  rank,
  emoji,
  row,
  highlight
}) {

  if (!row) {

    return (
      <div />
    )
  }

  return (

    <div className={`
      rounded-[32px]
      p-8
      shadow-sm
      text-center
      flex
      flex-col
      justify-center
      ${highlight
        ? 'bg-gradient-to-br from-yellow-100 to-orange-100'
        : 'bg-white'
      }
    `}>

      <div className="
        text-6xl
        mb-4
      ">

        {emoji}

      </div>

      <div className="
        text-sm
        font-bold
        text-gray-500
        mb-2
      ">

        Rank #{rank}

      </div>

      <div className="
        text-2xl
        font-black
        mb-4
        text-gray-900
      ">

        {row.name}

      </div>

      <div className="
        inline-flex
        items-center
        justify-center
        mx-auto
        bg-black
        text-white
        px-6
        py-3
        rounded-2xl
        text-2xl
        font-black
      ">

        {row.score}

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
      text-sm
    ">

      {children}

    </div>
  )
}

const thStyle = `
  text-left
  p-5
  border-b
  border-gray-200
  font-black
  text-gray-700
`

const tdStyle = `
  p-5
  text-gray-700
`
