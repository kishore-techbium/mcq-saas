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

export default function StateCommandCenterPage() {

  const { state } =
    useParams()

  const [loading, setLoading] =
    useState(true)

  const [districts, setDistricts] =
    useState([])

  const [topSchools, setTopSchools] =
    useState([])

  const [topStudents, setTopStudents] =
    useState([])

  const [stats, setStats] =
    useState({

      districts: 0,

      schools: 0,

      students: 0,

      participations: 0,

      activeParticipants: 0
    })

  useEffect(() => {

    if (state) {

      loadData()
    }

  }, [state])

  /* ======================================================
     LOAD
  ====================================================== */

  async function loadData() {

    try {

      setLoading(true)

      const decodedState =
        decodeURIComponent(state)

      /* ======================================================
         SCHOOLS
      ====================================================== */

      const {
        data: schoolRows
      } = await supabase

        .from('schools')

        .select('*')

        .eq(
          'state',
          decodedState
        )

      const schoolIds =
        (schoolRows || [])
          .map(s => s.id)

      const uniqueDistricts =
        [
          ...new Set(
            (schoolRows || [])
              .map(
                s => s.district
              )
          )
        ]

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

        .eq(
          'role',
          'student'
        )

      const studentIds =
        (students || [])
          .map(s => s.id)

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
         SESSIONS
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

      const activeParticipants =
        [
          ...new Set(
            (sessions || [])
              .map(
                s => s.student_id
              )
          )
        ]

      setStats({

        districts:
          uniqueDistricts.length,

        schools:
          schoolIds.length,

        students:
          studentIds.length,

        participations:
          participationCount || 0,

        activeParticipants:
          activeParticipants.length
      })

      /* ======================================================
         DISTRICT RANKINGS
      ====================================================== */

      const districtMap = {}

      uniqueDistricts.forEach(d => {

        districtMap[d] = {

          district: d,

          schools: 0,

          students: 0,

          participations: 0,

          scores: []
        }
      })

      ;(schoolRows || [])
        .forEach(school => {

        if (
          districtMap[
            school.district
          ]
        ) {

          districtMap[
            school.district
          ].schools++
        }
      })

      students.forEach(student => {

        const school =
          schoolRows.find(
            s =>
              s.id ===
              student.school_id
          )

        if (
          school &&
          districtMap[
            school.district
          ]
        ) {

          districtMap[
            school.district
          ].students++
        }
      })

      /* ======================================================
         PARTICIPATION COUNTS
      ====================================================== */

      const {
        data: entitlements
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

      ;(entitlements || [])
        .forEach(row => {

        const student =
          students.find(
            s =>
              s.id ===
              row.student_id
          )

        const school =
          schoolRows.find(
            s =>
              s.id ===
              student?.school_id
          )

        if (
          school &&
          districtMap[
            school.district
          ]
        ) {

          districtMap[
            school.district
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

        const school =
          schoolRows.find(
            s =>
              s.id ===
              student?.school_id
          )

        if (
          school &&
          districtMap[
            school.district
          ]
        ) {

          districtMap[
            school.district
          ].scores
            .push(
              session.score || 0
            )
        }
      })

      const districtRanking =
        Object.values(districtMap)

          .map(d => {

            const avg =

              d.scores.length > 0

                ? d.scores.reduce(
                    (a,b) => a+b,
                    0
                  ) / d.scores.length

                : 0

            return {

              ...d,

              avgScore:
                avg.toFixed(2)
            }
          })

          .sort(
            (a,b) =>
              b.avgScore -
              a.avgScore
          )

      setDistricts(
        districtRanking
      )

      /* ======================================================
         TOP SCHOOLS
      ====================================================== */

      const schoolMap = {}

      schoolRows.forEach(s => {

        schoolMap[s.id] = {

          ...s,

          scores: []
        }
      })

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

      const rankedSchools =
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
            (a,b) =>
              b.avgScore -
              a.avgScore
          )

          .slice(0, 10)

      setTopSchools(
        rankedSchools
      )

      /* ======================================================
         TOP STUDENTS
      ====================================================== */

      const studentMap = {}

      students.forEach(s => {

        studentMap[s.id] =

          `${s.first_name || ''}
           ${s.last_name || ''}`
      })

      const toppers =
        (sessions || [])

          .map(s => {

            const student =
              students.find(
                st =>
                  st.id ===
                  s.student_id
              )

            const school =
              schoolRows.find(
                sc =>
                  sc.id ===
                  student?.school_id
              )

            return {

              name:
                studentMap[
                  s.student_id
                ],

              school:
                school?.name,

              district:
                school?.district,

              score:
                s.score || 0
            }
          })

          .sort(
            (a,b) =>
              b.score - a.score
          )

          .slice(0, 10)

      setTopStudents(
        toppers
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

            🏛️ State Olympiad Command Center

          </div>

          <h1 className="
            text-5xl
            font-black
            text-gray-900
            mb-4
          ">

            {decodeURIComponent(
              state
            )}

          </h1>

          <p className="
            text-lg
            text-gray-600
          ">

            ANSE State Intelligence Dashboard

          </p>

        </div>

        {/* ======================================================
           KPI
        ====================================================== */}

        <div className="
          grid
          md:grid-cols-5
          gap-6
          mb-10
        ">

          <KPI
            title="Districts"
            value={stats.districts}
          />

          <KPI
            title="Schools"
            value={stats.schools}
          />

          <KPI
            title="Students"
            value={stats.students}
          />

          <KPI
            title="Participations"
            value={stats.participations}
          />

          <KPI
            title="Active Participants"
            value={stats.activeParticipants}
          />

        </div>

        {/* ======================================================
           DISTRICT RANKINGS
        ====================================================== */}

        <SectionCard
          title="🌍 District Rankings"
        >

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
                  District
                </th>

                <th className={thStyle}>
                  Schools
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

              {districts.map(
                (d, idx) => (

                <tr
                  key={d.district}
                  className="
                    border-b
                    border-slate-100
                  "
                >

                  <td className={tdStyle}>

                    #{idx + 1}

                  </td>

                  <td className={tdStyle}>

                    <a
                      href={`
/superadmin/anse/districts/${encodeURIComponent(d.district)}
                      `}
                      className="
                        text-indigo-700
                        font-black
                        hover:underline
                      "
                    >

                      {d.district}

                    </a>

                  </td>

                  <td className={tdStyle}>
                    {d.schools}
                  </td>

                  <td className={tdStyle}>
                    {d.students}
                  </td>

                  <td className={tdStyle}>
                    {d.participations}
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

                      {d.avgScore}

                    </div>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </SectionCard>

        {/* ======================================================
           TOP SCHOOLS
        ====================================================== */}

        <SectionCard
          title="🏫 Top Schools"
        >

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
                  District
                </th>

                <th className={thStyle}>
                  Avg Score
                </th>

              </tr>

            </thead>

            <tbody>

              {topSchools.map(
                (school, idx) => (

                <tr
                  key={school.id}
                  className="
                    border-b
                    border-slate-100
                  "
                >

                  <td className={tdStyle}>
                    #{idx + 1}
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

                  </td>

                  <td className={tdStyle}>
                    {school.district}
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

                      {school.avgScore}

                    </div>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </SectionCard>

        {/* ======================================================
           TOPPERS
        ====================================================== */}

        <SectionCard
          title="🏅 State Toppers"
        >

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
                  District
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
                    #{idx + 1}
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
                    {student.district}
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

        </SectionCard>

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

/* ======================================================
   SECTION
====================================================== */

function SectionCard({
  title,
  children
}) {

  return (

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

          {title}

        </h2>

      </div>

      <div className="
        overflow-x-auto
      ">

        {children}

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
