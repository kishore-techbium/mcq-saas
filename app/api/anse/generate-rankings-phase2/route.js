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
       DELETE OLD PHASE 2 RANKINGS
    ====================================================== */

    await supabase
      .from('anse_exam_rankings')
      .delete()
      .eq('exam_id', examId)
      .eq('phase', 'PHASE_2')

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
       FETCH VALID EXAM SESSIONS
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

          phase: 'PHASE_2',

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

          school_rank: null,

          district_rank: null,

          state_rank: null,

          national_rank: null,

          qualified_phase2: false,

          qualified_phase3: false,

        

          scholarship_rank: null,

          scholarship_amount: null
        }
      })
    )

    /* ======================================================
       GROUP BY
       GRADE + SUBJECT
    ====================================================== */

    const rankingGroups = {}

    rows.forEach(r => {

      const key =

        `${r.grade}-` +

        `${r.olympiad_category}`

      if (!rankingGroups[key]) {

        rankingGroups[key] = []
      }

      rankingGroups[key].push(r)
    })

    /* ======================================================
       PROCESS EACH GROUP
    ====================================================== */

    let finalRows = []

    Object.values(rankingGroups)
      .forEach(group => {

        /* ======================================================
           SORT
        ====================================================== */

        group.sort((a, b) => {

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
           NATIONAL RANK
        ====================================================== */

        assignCompetitionRanks(
          group,
          'national_rank'
        )

        /* ======================================================
           STATE RANK
        ====================================================== */

        const stateGroups = {}

        group.forEach(r => {

          const key =
            r.state || 'UNKNOWN'

          if (!stateGroups[key]) {

            stateGroups[key] = []
          }

          stateGroups[key].push(r)
        })

        Object.values(stateGroups)
          .forEach(stateGroup => {

            assignCompetitionRanks(
              stateGroup,
              'state_rank'
            )
          })

        /* ======================================================
           DISTRICT RANK
        ====================================================== */

        const districtGroups = {}

        group.forEach(r => {

          const key =

            `${r.state}-` +

            `${r.district}`

          if (!districtGroups[key]) {

            districtGroups[key] = []
          }

          districtGroups[key]
            .push(r)
        })

        Object.values(districtGroups)
          .forEach(districtGroup => {

            assignCompetitionRanks(
              districtGroup,
              'district_rank'
            )
          })

        /* ======================================================
           PHASE 3 QUALIFICATION
           ONLY NATIONAL RANK 1
        ====================================================== */

        group.forEach(r => {

          if (r.national_rank === 1) {

            r.qualified_phase3 = true

            
          }
        })

        finalRows.push(...group)
      })
/* ======================================================
   PHASE 3 ELIGIBILITY
====================================================== */

const qualifiedStudents =

  finalRows.filter(
    r => r.qualified_phase3
  )

for (const student of qualifiedStudents) {

  /* ==========================================
     FIND PHASE 3 EXAM
  ========================================== */

  const {
    data: phase3Exam
  } = await supabase

    .from('exams')

    .select('id')

    .eq('phase', 'PHASE_3')

    .eq(
      'target_year',
      student.grade
    )

    .eq(
      'olympiad_subject',
      exam.olympiad_subject
    )

    .single()

  if (!phase3Exam) {

    console.error(
      'Phase 3 exam not found'
    )

    continue
  }

  /* ==========================================
     UPSERT ELIGIBILITY
  ========================================== */

  const {
    error: eligibilityError
  } = await supabase

    .from(
      'anse_student_phase_eligibility'
    )

.upsert(
  {
      student_id:
        student.student_id,

      olympiad_subject:
        exam.olympiad_subject,

      grade:
        student.grade,

      qualified_phase2:
        true,

      qualified_phase3:
        true,

      phase2_exam_id:
        examId,

      phase3_exam_id:
        phase3Exam.id
    
},
{
  onConflict:
    'student_id,olympiad_subject,grade'
}
)

  if (eligibilityError) {

    console.error(
      eligibilityError
    )
  }
}
    /* ======================================================
       INSERT INTO DB
    ====================================================== */

    const { error: insertError } =
      await supabase
        .from('anse_exam_rankings')
        .insert(finalRows)

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

      phase: 'PHASE_2',

      totalRankings:
        finalRows.length,

      phase3Qualified:

        finalRows.filter(
          r =>
            r.qualified_phase3
        ).length
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
