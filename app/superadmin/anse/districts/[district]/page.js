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
} from '../../../../../lib/supabase'

export default function DistrictCommandCenterPage() {

  const { district } =
    useParams()

  const [loading, setLoading] =
    useState(true)

  const [schools, setSchools] =
    useState([])

  const [topStudents, setTopStudents] =
    useState([])

  const [stats, setStats] =
    useState({

      totalSchools: 0,

      totalStudents: 0,

      totalParticipations: 0,

      activeParticipants: 0
    })

  useEffect(() => {

    if (district) {

      loadData()
    }

  }, [district])

  /* ======================================================
     LOAD
  ====================================================== */

  async function loadData() {

    try {

      setLoading(true)

      /* ======================================================
         DISTRICT SCHOOLS
      ====================================================== */

      const {
        data: schoolRows
      } = await supabase

        .from('schools')

        .select('*')

        .eq(
          'district',
          decodeURIComponent(
            district
          )
        )

      const schoolIds =
        (schoolRows || [])
          .map(s => s.id)

      setStats(prev => ({
        ...prev,
        totalSchools:
          schoolIds.length
      }))

      setSchools(schoolRows || [])

      /* ======================================================
         STUDENTS
      ====================================================== */

      const {
        data: students
      } = await supabase

        .from('students')

        .select(`
          id,
          school_id,
          first_name,
          last_name
        `)

        .in(
          'school_id',
          schoolIds
        )

        .eq('role', 'student')

      const studentIds =
        (students || [])
          .map(s => s.id)

      setStats(prev => ({
        ...prev,
        totalStudents:
          studentIds.length
      }))

      /* ======================================================
         PARTICIPATIONS
      ====================================================== */

      const {
        count:
          participationCount
      } = await supabase

        .from(
          'student_exam_categories'
        )

        .select('*', {
          count: 'exact',
          head: true
        })

        .in(
          'student_id',
          studentIds
        )

      /* ======================================================
         ACTIVE PARTICIPANTS
      ====================================================== */

      const {
        data: sessions
      } = await supabase

        .from('exam_sessions')

        .select(`
          student_id,
          score
        `)

        .in(
          'student_id',
          studentIds
        )

        .eq(
          'submitted',
          true
        )

      const uniqueParticipants =
        [
          ...new Set(
            (sessions || [])
              .map(
                s => s.student_id
              )
          )
        ]

      setStats(prev => ({

        ...prev,

        totalParticipations:
          participationCount || 0,

        activeParticipants:
          uniqueParticipants.length
      }))

      /* ======================================================
         SCHOOL STATS
      ====================================================== */

      const schoolMap = {}

      ;(schoolRows || [])
        .forEach(s => {

        schoolMap[s.id] = {

          ...s,

          students: 0,

          participations: 0,

          avgScore: 0,

          scores: []
        }
      })

      students.forEach(student => {

        if (
          schoolMap[
            student.school_id
          ]
        ) {

          schoolMap[
            student.school_id
          ].students++
        }
      })

      /* ======================================================
         PARTICIPATION COUNTS
      ====================================================== */

      const {
        data: entitlementRows
      } = await supabase

        .from(
          'student_exam_categories'
        )

        .select(`
          student_id
        `)

        .in(
          'student_id',
          studentIds
        )

      ;(entitlementRows || [])
        .forEach(row => {

        const student =
          students.find(
            s =>
              s.id ===
              row.student_id
          )

        if (
          student &&
          schoolMap[
            student.school_id
          ]
        ) {

          schoolMap[
            student.school_id
          ].participations++
        }
      })

      /* ======================================================
         SCORES
      ====================================================== */

      ;(sessions || [])
        .forEach(session => {

        const student =
          students.find(
            s =>
              s.id ===
              session.student_id
          )

        if (
          student &&
          schoolMap[
            student.school_id
          ]
        ) {

          schoolMap[
            student.school_id
          ].scores
            .push(
              session.score || 0
            )
        }
      })

      const schoolRanking =
        Object.values(schoolMap)

          .map(s => {

            const avg =

              s.scores.length > 0

                ? s.scores.reduce(
                    (a,b) => a+b,
                    0
                  ) / s.scores.length

                : 0

            return {

              ...s,

              avgScore:
                avg.toFixed(2)
            }
          })

          .sort(
            (a, b) =>
              b.avgScore -
              a.avgScore
          )

      setSchools(schoolRanking)

      /* ======================================================
         TOP STUDENTS
      ====================================================== */

      const studentMap = {}

      students.forEach(s => {

        studentMap[s.id] =

          `${s.first_name || ''}
           ${s.last_name || ''}`
      })

      const topperRows =
        (sessions || [])

          .map(s => {

            const student =
              students.find(
                st =>
                  st.id ===
                  s.student_id
              )

            return {

              name:
                studentMap[
                  s.student_id
                ],

              score:
                s.score || 0,

              school:
                schoolMap[
                  student
                    ?.school_id
                ]?.name
            }
          })

          .sort(
            (a,b) =>
              b.score - a.score
          )

          .slice(0, 10)

      setTopStudents(topperRows)

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

            🌍 District Olympiad Command Center

          </div>

          <h1 className="
            text-5xl
            font-black
            text-gray-900
            mb-4
          ">

            {decodeURIComponent(
              district
            )}

          </h1>

          <p className="
            text-lg
            text-gray-600
          ">

            ANSE District Intelligence Dashboard

          </p>

        </div>

        {/* ======================================================
           KPI
        ====================================================== */}

        <div className="
          grid
          md:grid-cols-4
          gap-6
          mb-10
        ">

          <KPI
            title="Schools"
            value={stats.totalSchools}
          />

          <KPI
            title="Students"
            value={stats.totalStudents}
          />

          <KPI
            title="Participations"
            value={stats.totalParticipations}
          />

          <KPI
            title="Active Participants"
            value={stats.activeParticipants}
          />

        </div>

        {/* ======================================================
           SCHOOL RANKINGS
        ====================================================== */}

        <div className="
          bg-white
          rounded-[32px]
          shadow-sm
          overflow-hidden
          mb-10
        ">

          <div className="
            p-8
            border-b
            border-slate-100
          ">

            <h2 className="
              text-3xl
              font-black
            ">

              🏫 District School Rankings

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
                    School
                  </th>

                  <th className={thStyle}>
                    Students
                  </th>

                  <th className={thStyle}>
                    Participations
                  </th>

                  <th className={thStyle}>
                    Avg Score
                  </th>

                </tr>

              </thead>

              <tbody>

                {schools.map(
                  (school, idx) => (

                  <tr
                    key={school.id}
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

                      <a
                        href={`
/superadmin/anse/schools/${school.id}
                        `}
                        className="
                          text-indigo-700
                          font-black
                          hover:underline
                        "
                      >

                        {school.name}

                      </a>

                      <div className="
                        text-sm
                        text-gray-500
                        mt-1
                      ">

                        {school.city}

                      </div>

                    </td>

                    <td className={tdStyle}>
                      {school.students}
                    </td>

                    <td className={tdStyle}>
                      {school.participations}
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
                      ">

                        {school.avgScore}

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>

        {/* ======================================================
           DISTRICT TOPPERS
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
            border-slate-100
          ">

            <h2 className="
              text-3xl
              font-black
            ">

              🏅 District Toppers

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
                    School
                  </th>

                  <th className={thStyle}>
                    Score
                  </th>

                </tr>

              </thead>

              <tbody>

                {topStudents.map(
                  (student, idx) => (

                  <tr
                    key={idx}
                    className="
                      border-b
                      border-slate-100
                    "
                  >

                    <td className={tdStyle}>

                      <div className="
                        font-black
                      ">

                        #{idx + 1}

                      </div>

                    </td>

                    <td className={tdStyle}>

                      <div className="
                        font-bold
                      ">

                        {student.name}

                      </div>

                    </td>

                    <td className={tdStyle}>
                      {student.school}
                    </td>

                    <td className={tdStyle}>

                      <div className="
                        inline-flex
                        items-center
                        justify-center
                        px-4
                        py-2
                        rounded-2xl
                        bg-black
                        text-white
                        font-black
                      ">

                        {student.score}

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

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
      rounded-[32px]
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
        text-gray-900
      ">

        {value}

      </div>

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
