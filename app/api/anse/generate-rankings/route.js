export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/* ======================================================
   COMPETITION RANKING
   Example:
   29,29,19 => 1,1,3
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

/* ======================================================
   DYNAMIC QUALIFICATION COUNT
====================================================== */

function getQualifierCount(totalParticipants) {

  if (totalParticipants <= 25) {
    return 1
  }

  if (totalParticipants <= 75) {
    return 2
  }

  if (totalParticipants <= 150) {
    return 3
  }

  return 5
}

export async function POST(req) {

  try {

    const body = await req.json()

    const examId = body.examId

    if (!examId) {

      return Response.json(
        { error: 'examId required' },
        { status: 400 }
      )
    }

    /* ======================================================
       DELETE OLD RANKINGS
    ====================================================== */

    await supabase
      .from('anse_exam_rankings')
      .delete()
      .eq('exam_id', examId)

    /* ======================================================
       FETCH EXAM
    ====================================================== */

    const { data: exam } = await supabase
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

    const { data: sessions } = await supabase
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
      sessions.map(s => s.student_id)

    const { data: students } = await supabase
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

    const { data: schools } = await supabase
      .from('schools')
      .select('*')
      .in('id', schoolIds)

    const schoolMap = {}

    ;(schools || []).forEach(sc => {

      schoolMap[sc.id] = sc
    })

    /* ======================================================
       BUILD RANKING ROWS
    ====================================================== */

    let rows = sessions.map(session => {

      const student =
        studentMap[session.student_id]

      const school =
        schoolMap[student?.school_id]

      const totalQuestions =
        Number(session.total_questions || 0)

      const correctAnswers =
        Number(session.correct_answers || 0)

      const wrongAnswers =
        Number(session.wrong_answers || 0)

      const unanswered =
        Math.max(
          0,
          totalQuestions -
          correctAnswers -
          wrongAnswers
        )

      const accuracy =
        

  totalQuestions > 0

    ? Number(
        (
          (correctAnswers /
            totalQuestions) * 100
        ).toFixed(2)
      )

    : 0

      const timeTaken =
        Number(session.time_spent || 0)

      return {

        exam_id: examId,

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

    /* ======================================================
       GLOBAL SORT
    ====================================================== */

    rows.sort((a, b) => {

      // higher score first

      if (b.score !== a.score) {
        return b.score - a.score
      }

      // higher accuracy first

      if (b.accuracy !== a.accuracy) {
        return b.accuracy - a.accuracy
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
      rows,
      'national_rank'
    )

    /* ======================================================
       STATE RANK
    ====================================================== */

    const stateGroups = {}

    rows.forEach(r => {

      const key =
        r.state || 'UNKNOWN'

      if (!stateGroups[key]) {
        stateGroups[key] = []
      }

      stateGroups[key].push(r)
    })

    Object.values(stateGroups)
      .forEach(group => {

        assignCompetitionRanks(
          group,
          'state_rank'
        )
      })

    /* ======================================================
       DISTRICT RANK
    ====================================================== */

    const districtGroups = {}

    rows.forEach(r => {

      const key =
        `${r.state}-${r.district}`

      if (!districtGroups[key]) {
        districtGroups[key] = []
      }

      districtGroups[key].push(r)
    })

    Object.values(districtGroups)
      .forEach(group => {

        assignCompetitionRanks(
          group,
          'district_rank'
        )
      })

    /* ======================================================
       SCHOOL RANK
    ====================================================== */

    const schoolGroups = {}

    rows.forEach(r => {

      const key =
        r.school_id || 'UNKNOWN'

      if (!schoolGroups[key]) {
        schoolGroups[key] = []
      }

      schoolGroups[key].push(r)
    })

    Object.values(schoolGroups)
      .forEach(group => {

        assignCompetitionRanks(
          group,
          'school_rank'
        )
      })

    /* ======================================================
       PHASE 2 QUALIFICATION
    ====================================================== */

    const qualificationGroups = {}

    rows.forEach(r => {

      const key =

        `${r.school_id}-` +

        `${r.grade}-` +

        `${r.olympiad_category}`

      if (!qualificationGroups[key]) {
        qualificationGroups[key] = []
      }

      qualificationGroups[key].push(r)
    })

    Object.values(qualificationGroups)
      .forEach(group => {

        const qualifierCount =
          getQualifierCount(
            group.length
          )

        let boundaryRank = null

        group.forEach(r => {

          if (
            r.school_rank <=
            qualifierCount
          ) {

            r.qualified_phase2 =
              true

            boundaryRank =
              r.school_rank
          }
        })

        // tie expansion

        if (boundaryRank !== null) {

          group.forEach(r => {

            if (
              r.school_rank ===
              boundaryRank
            ) {

              r.qualified_phase2 =
                true
            }
          })
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

      totalRankings:
        rows.length
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
