'use client'

import {
  useEffect,
  useState
} from 'react'

import {
  supabase
} from '../../../../lib/supabase'

export default function NationalCommandCenterPage() {

  const [loading, setLoading] =
    useState(true)

  const [stats, setStats] =
    useState({

      states: 0,

      districts: 0,

      schools: 0,

      students: 0,

      participations: 0,

      activeParticipants: 0
    })

  const [topStates, setTopStates] =
    useState([])

  const [topSchools, setTopSchools] =
    useState([])

  const [topStudents, setTopStudents] =
    useState([])

  useEffect(() => {

    loadData()

  }, [])

  /* ======================================================
     LOAD
  ====================================================== */

  async function loadData() {

    try {

      setLoading(true)

      /* ======================================================
         SCHOOLS
      ====================================================== */

      const {
        data: schools
      } = await supabase

        .from('schools')

        .select('*')

      const schoolIds =
        (schools || [])
          .map(s => s.id)

      const uniqueStates =
        [
          ...new Set(
            (schools || [])
              .map(s => s.state)
          )
        ]

      const uniqueDistricts =
        [
          ...new Set(
            (schools || [])
              .map(s => s.district)
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
         EXAM SESSIONS
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

        states:
          uniqueStates.length,

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
         STATE RANKINGS
      ====================================================== */

      const stateMap = {}

      uniqueStates.forEach(state => {

        stateMap[state] = {

          state,

          schools: 0,

          students: 0,

          participations: 0,

          scores: []
        }
      })

      schools.forEach(school => {

        stateMap[
          school.state
        ].schools++
      })

      students.forEach(student => {

        const school =
          schools.find(
            s =>
              s.id ===
              student.school_id
          )

        if (school) {

          stateMap[
            school.state
          ].students++
        }
      })

      /* ======================================================
         ENTITLEMENTS
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
          schools.find(
            s =>
              s.id ===
              student?.school_id
          )

        if (school) {

          stateMap[
            school.state
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
          schools.find(
            s =>
              s.id ===
              student?.school_id
          )

        if (school) {

          stateMap[
            school.state
          ].scores.push(
            session.score || 0
          )
        }
      })

      const rankedStates =
        Object.values(stateMap)

          .map(state => {

            const avg =

              state.scores.length > 0

                ? state.scores.reduce(
                    (a,b) => a+b,
                    0
                  ) / state.scores.length

                : 0

            return {

              ...state,

              avgScore:
                avg.toFixed(2)
            }
          })

          .sort(
            (a,b) =>
              b.avgScore -
              a.avgScore
          )

      setTopStates(
        rankedStates
      )

      /* ======================================================
         TOP SCHOOLS
      ====================================================== */

      const schoolMap = {}

      schools.forEach(s => {

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
          ].scores.push(
            session.score || 0
          )
        }
      })

      const rankedSchools =
        Object.values(schoolMap)

          .map(school => {

            const avg =

              school.scores.length > 0

                ? school.scores.reduce(
                    (a,b) => a+b,
                    0
                  ) / school.scores.length

                : 0

            return {

              ...school,

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
         TOPPERS
      ====================================================== */

      const studentMap = {}

      students.forEach(s => {

        studentMap[s.id] =

          `${s.first_name || ''}
           ${s.last_name || ''}`
      })

      const toppers =
        (sessions || [])

          .map(session => {

            const student =
              students.find(
                s =>
                  s.id ===
                  session.student_id
              )

            const school =
              schools.find(
                s =>
                  s.id ===
                  student?.school_id
              )

            return {

              name:
                studentMap[
                  session.student_id
                ],

              school:
                school?.name,

              state:
                school?.state,

              score:
                session.score || 0
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
           HERO
        ====================================================== */}

        <div className="
          bg-white
          rounded-[36px]
          p-10
          shadow-sm
          mb-10
        ">

          <div className="
            inline-flex
            items-center
            gap-2
            bg-indigo-100
            text-indigo-700
            px-5
            py-2
            rounded-full
            text-sm
            font-bold
            mb-6
          ">

            🇮🇳 National Olympiad Command Center

          </div>

          <h1 className="
            text-6xl
            font-black
            text-gray-900
            mb-5
          ">

            ANSE National Intelligence

          </h1>

          <p className="
            text-xl
            text-gray-600
            max-w-4xl
          ">

            Real-time national participation,
            rankings and Olympiad ecosystem
            intelligence across India.

          </p>

        </div>

        {/* ======================================================
           KPI
        ====================================================== */}

        <div className="
          grid
          md:grid-cols-3
          xl:grid-cols-6
          gap-6
          mb-10
        ">

          <KPI
            title="States"
            value={stats.states}
          />

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
            title="Active"
            value={stats.activeParticipants}
          />

        </div>

        {/* ======================================================
           TOP STATES
        ====================================================== */}

        <Section
          title="🏛️ Top States"
        >

          <table className="
            w-full
          ">

            <thead>

              <tr className="
                bg-slate-50
              ">

                <th className={thStyle}>
                  Rank
                </th>

                <th className={thStyle}>
                  State
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

              {topStates.map(
                (state, idx) => (

                <tr
                  key={state.state}
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
/superadmin/anse/states/${encodeURIComponent(state.state)}
                      `}
                      className="
                        text-indigo-700
                        font-black
                        hover:underline
                      "
                    >

                      {state.state}

                    </a>

                  </td>

                  <td className={tdStyle}>
                    {state.schools}
                  </td>

                  <td className={tdStyle}>
                    {state.students}
                  </td>

                  <td className={tdStyle}>
                    {state.participations}
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

                      {state.avgScore}

                    </div>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </Section>

        {/* ======================================================
           TOP SCHOOLS
        ====================================================== */}

        <Section
          title="🏫 Top Schools"
        >

          <table className="
            w-full
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
                  State
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
                    {school.state}
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

        </Section>

        {/* ======================================================
           TOPPERS
        ====================================================== */}

        <Section
          title="🏅 National Toppers"
        >

          <table className="
            w-full
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
                  State
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
                    {student.name}
                  </td>

                  <td className={tdStyle}>
                    {student.school}
                  </td>

                  <td className={tdStyle}>
                    {student.state}
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

        </Section>

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

function Section({
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
