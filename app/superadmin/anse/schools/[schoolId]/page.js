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

export default function SchoolCommandCenterPage() {

  const { schoolId } =
    useParams()

  const [loading, setLoading] =
    useState(true)

  const [school, setSchool] =
    useState(null)

  const [admin, setAdmin] =
    useState(null)

  const [studentCount, setStudentCount] =
    useState(0)

  const [participationCount, setParticipationCount] =
    useState(0)

  const [attemptedCount, setAttemptedCount] =
    useState(0)

  const [phaseCards, setPhaseCards] =
    useState([])

  useEffect(() => {

    if (schoolId) {

      loadData()
    }

  }, [schoolId])

  /* ======================================================
     LOAD EVERYTHING
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
         SCHOOL ADMIN
      ====================================================== */

      if (
        schoolData?.school_admin_id
      ) {

        const {
          data: adminData
        } = await supabase

          .from('students')

          .select('*')

          .eq(
            'id',
            schoolData.school_admin_id
          )

          .single()

        setAdmin(adminData)
      }

      /* ======================================================
         STUDENTS
      ====================================================== */

      const {
        data: students
      } = await supabase

        .from('students')

        .select('id')

        .eq('school_id', schoolId)

        .eq('role', 'student')

      const studentIds =
        (students || [])
          .map(s => s.id)

      setStudentCount(
        studentIds.length
      )

      /* ======================================================
         PARTICIPATIONS
      ====================================================== */

      if (studentIds.length > 0) {

        const {
          count: participationTotal
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

        setParticipationCount(
          participationTotal || 0
        )

        /* ======================================================
           ATTEMPTED STUDENTS
        ====================================================== */

        const {
          data: sessions
        } = await supabase

          .from('exam_sessions')

          .select('student_id')

          .in(
            'student_id',
            studentIds
          )

          .eq(
            'submitted',
            true
          )

        const uniqueAttempted =
          [
            ...new Set(
              (sessions || [])
                .map(
                  s => s.student_id
                )
            )
          ]

        setAttemptedCount(
          uniqueAttempted.length
        )

        /* ======================================================
           PHASE CARDS
        ====================================================== */

        const {
          data: phaseSessions
        } = await supabase

          .from('exam_sessions')

          .select(`
            student_id,
            exams (
              id,
              title,
              phase,
              olympiad_subject
            )
          `)

          .in(
            'student_id',
            studentIds
          )

          .eq(
            'submitted',
            true
          )

        const grouped = {}

        ;(phaseSessions || []).forEach(row => {

          const exam =
            row.exams

          if (!exam?.id) return

          if (!grouped[exam.id]) {

            grouped[exam.id] = {

              examId:
                exam.id,

              title:
                exam.title,

              phase:
                exam.phase,

              subject:
                exam.olympiad_subject,

              participants:
                0
            }
          }

          grouped[exam.id]
            .participants++
        })

        setPhaseCards(
          Object.values(grouped)
        )
      }

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

            🏫 {school?.name}

          </h1>

          <p className="
            text-lg
            text-gray-600
            mb-6
          ">

            {school?.city},
            {' '}
            {school?.district},
            {' '}
            {school?.state}

          </p>

          <div className="
            grid
            md:grid-cols-2
            gap-6
          ">

            <div className="
              bg-gray-50
              rounded-2xl
              p-5
            ">

              <div className="
                text-sm
                text-gray-500
                mb-2
              ">
                Coordinator
              </div>

              <div className="
                text-xl
                font-bold
              ">

                {admin?.first_name}
                {' '}
                {admin?.last_name}

              </div>

            </div>

            <div className="
              bg-gray-50
              rounded-2xl
              p-5
            ">

              <div className="
                flex
                flex-col
                gap-2
              ">

                <div>

                  📧
                  {' '}
                  {admin?.email || '-'}

                </div>

                <div>

                  📞
                  {' '}
                  {admin?.phone || '-'}

                </div>

              </div>

            </div>

          </div>

        </div>

        {/* ======================================================
           KPI ROW
        ====================================================== */}

        <div className="
          grid
          md:grid-cols-4
          gap-6
          mb-8
        ">

          <KPI
            title="Registered Students"
            value={studentCount}
          />

          <KPI
            title="Olympiad Participations"
            value={participationCount}
          />

          <KPI
            title="Active Participants"
            value={attemptedCount}
          />

          <KPI
            title="Phases Attempted"
            value={phaseCards.length}
          />

        </div>

        {/* ======================================================
           PHASE CARDS
        ====================================================== */}

        <div>

          <h2 className="
            text-3xl
            font-black
            mb-6
          ">

            📘 Olympiad Phases

          </h2>

          <div className="
            grid
            md:grid-cols-2
            xl:grid-cols-3
            gap-6
          ">

            {phaseCards.map(card => (

              <div
                key={card.examId}
                className="
                  bg-white
                  rounded-3xl
                  p-6
                  shadow-sm
                "
              >

                <div className="
                  text-sm
                  text-blue-600
                  font-bold
                  mb-2
                ">

                  {card.phase || 'PHASE'}

                </div>

                <h3 className="
                  text-2xl
                  font-black
                  mb-3
                ">

                  {card.title}

                </h3>

                <p className="
                  text-gray-600
                  mb-4
                ">

                  {card.subject}

                </p>

                <div className="
                  text-lg
                  font-bold
                  mb-6
                ">

                  👨‍🎓
                  {' '}
                  {card.participants}
                  {' '}
                  Participants

                </div>

                <a
                  href={`
/superadmin/anse/schools/${schoolId}/results/${card.examId}
                  `}
                  className="
                    inline-block
                    bg-black
                    text-white
                    px-5
                    py-3
                    rounded-2xl
                    font-bold
                  "
                >

                  View Analytics

                </a>

              </div>

            ))}

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
