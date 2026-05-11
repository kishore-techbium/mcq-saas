export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'

import {
  calculateExamMetrics
} from '../../../../lib/anseexamMetrics'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/* ======================================================
   COMPETITION RANKING
====================================================== */

function assignCompetitionRanks(rows, key) {

  let currentRank = 1

  for (let i = 0; i < rows.length; i++) {

    if (i > 0) {

      const prev = rows[i - 1]
      const curr = rows[i]

      const sameRank =

        Number(prev.score) ===
        Number(curr.score)

        &&

        Number(prev.accuracy) ===
        Number(curr.accuracy)

        &&

        Number(prev.correct_answers) ===
        Number(curr.correct_answers)

        &&

        Number(prev.time_taken_seconds) ===
        Number(curr.time_taken_seconds)

      if (!sameRank) {

        currentRank = i + 1
      }
    }

    rows[i][key] = currentRank
  }

  return rows
}

export async function POST(req) {

  try {

    const body =
      await req.json()

    const examId =
      body.examId

    if (!examId) {

      return Response.json(
        { error: 'examId required' },
        { status: 400 }
      )
    }

    /* ======================================================
       DELETE OLD PHASE 3 RANKINGS
    ====================================================== */

    await supabase
      .from('anse_exam_rankings')
      .delete()
      .eq('exam_id', examId)
      .eq('phase', 'PHASE_3')

    /* ======================================================
       FETCH EXAM
    ====================================================== */

    const { data: exam } =
      await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single()

    if (!exam) {

      return Response.json(
        { error: 'Exam not found' },
        { status: 404 }
      )
    }

    /* ======================================================
       FETCH VALID SESSIONS
    ====================================================== */

    const { data: sessions } =
      await supabase
        .from('exam_sessions')
        .select('*')
        .eq('exam_id', examId)
        .eq('submitted', true)
        .eq('is_rejected', false)

    if (!sessions || sessions.length === 0) {

      return Response.json({

        success: false,

        message: 'No sessions found'
      })
    }

    /* ======================================================
       FETCH STUDENTS
    ====================================================== */

    const studentIds =
      sessions.map(
        s => s.student_id
      )

    const { data: students } =
      await supabase
        .from('students')
        .select('*')
        .in('id', studentIds)

    const studentMap = {}

    ;(students || []).forEach(st => {

      studentMap[st.id] = st
    })

    /* ======================================================
       FETCH SCHOOLS
    ====================================================== */

    const schoolIds = [

      ...new Set(

        (students || [])
          .map(s => s.school_id)
          .filter(Boolean)

      )

    ]

    const { data: schools } =
      await supabase
        .from('schools')
        .select('*')
        .in('id', schoolIds)

    const schoolMap = {}

    ;(schools || []).forEach(sc => {

      schoolMap[sc.id] = sc
    })

    /* ======================================================
       BUILD ROWS
    ====================================================== */

    let rows = await Promise.all(

      sessions.map(async (session) => {

        const student =
          studentMap[
            session.student_id
          ]

        const school =
          schoolMap[
            student?.school_id
          ]

        /* ======================================================
           FETCH QUESTIONS
        ====================================================== */

        const answers =
          session.answers || {}

        const questionIds = Object.keys(answers)

          .filter(id =>
            id !== 'timeSpent'
          )

          .filter(id =>
            id !== 'questionOrder'
          )

        let questions = []

        if (questionIds.length > 0) {

          const rpcResult =
            await supabase
              .rpc('get_exam_questions', {
                p_exam_id:
                  session.exam_id
              })

          questions =
            rpcResult?.data || []
        }

        /* ======================================================
           CALCULATE METRICS
        ====================================================== */

        const metrics =
          calculateExamMetrics({

            session,
            questions,
            exam
          })

        const correctAnswers =
          metrics.correct

        const wrongAnswers =
          metrics.wrong

        const unanswered =
          metrics.unattempted

        const accuracy =
          metrics.accuracy

        const timeTaken =

          answers?.timeSpent

            ? Object.values(
                answers.timeSpent
              ).reduce(
                (sum, sec) =>
                  sum + Number(sec || 0),
                0
              )

            : 0

        return {

          phase: 'PHASE_3',

          exam_id:
            examId,

          exam_session_id:
            session.id,

          student_id:
            session.student_id,

          school_id:
            student?.school_id || null,

          score:
            Number(session.score || 0),

          accuracy,

          correct_answers:
            correctAnswers,

          wrong_answers:
            wrongAnswers,

          unanswered,

          time_taken_seconds:
            timeTaken,

          grade:
            Number(exam.target_year),

          olympiad_category:
            exam.exam_category,

          city:
            school?.city || null,

          district:
            school?.district || null,

          state:
            school?.state || null,

          national_rank: null,

          crown_title: null,

          crown_award: null
        }
      })
    )

    /* ======================================================
       SORT
    ====================================================== */

    rows.sort((a, b) => {

      // higher score first

      if (b.score !== a.score) {
        return b.score - a.score
      }

      // higher accuracy first

      if (
        b.accuracy !==
        a.accuracy
      ) {

        return (
          b.accuracy -
          a.accuracy
        )
      }

      // higher correct answers first

      if (
        b.correct_answers !==
        a.correct_answers
      ) {

        return (
          b.correct_answers -
          a.correct_answers
        )
      }

      // lower time first

      return (
        a.time_taken_seconds -
        b.time_taken_seconds
      )
    })

    /* ======================================================
       NATIONAL CROWN RANK
    ====================================================== */

    assignCompetitionRanks(
      rows,
      'national_rank'
    )

    /* ======================================================
       CROWN TITLES
    ====================================================== */

    rows.forEach(r => {

      if (r.national_rank === 1) {

        r.crown_title =
          'GRAND_SCHOLAR_CHAMPION'

        r.crown_award =
          '₹1,00,000'

      } else if (
        r.national_rank === 2
      ) {

        r.crown_title =
          'NATIONAL_ELITE_SCHOLAR'

        r.crown_award =
          'National Elite Recognition'

      } else if (
        r.national_rank === 3
      ) {

        r.crown_title =
          'NATIONAL_DISTINGUISHED_SCHOLAR'

        r.crown_award =
          'National Distinguished Recognition'
      }
    })

    /* ======================================================
       INSERT INTO DB
    ====================================================== */

    const { error: insertError } =
      await supabase
        .from('anse_exam_rankings')
        .insert(rows)

    if (insertError) {

      console.error(insertError)

      return Response.json(
        {
          error:
            insertError.message
        },
        { status: 500 }
      )
    }

    return Response.json({

      success: true,

      phase: 'PHASE_3',

      totalRankings:
        rows.length,

      champion:

        rows.find(
          r =>
            r.national_rank === 1
        )?.student_id || null
    })

  } catch (err) {

    console.error(err)

    return Response.json(
      {
        error:
          err?.message ||
          'Internal server error'
      },
      { status: 500 }
    )
  }
}
