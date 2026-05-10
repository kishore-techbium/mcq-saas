export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function assignCompetitionRanks(rows, key) {

  let currentRank = 1

  for (let i = 0; i < rows.length; i++) {

    if (i > 0) {

      const prev = rows[i - 1]
      const curr = rows[i]

      const sameRank =
        prev.score === curr.score &&
        prev.accuracy === curr.accuracy &&
        prev.correct_answers === curr.correct_answers &&
        prev.time_taken_seconds === curr.time_taken_seconds

      if (!sameRank) {
        currentRank = i + 1
      }
    }

    rows[i][key] = currentRank
  }

  return rows
}

function getQualifierCount(participants) {

  if (participants <= 25) return 1
  if (participants <= 75) return 2
  if (participants <= 150) return 3

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

    // ==========================================
    // DELETE OLD RANKINGS
    // ==========================================

    await supabase
      .from('anse_exam_rankings')
      .delete()
      .eq('exam_id', examId)

    // ==========================================
    // FETCH EXAM
    // ==========================================

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

    // ==========================================
    // FETCH VALID SESSIONS
    // ==========================================

    const { data: sessions } = await supabase
      .from('exam_sessions')
      .select('*')
      .eq('exam_id', examId)
      .eq('submitted', true)
      .eq('is_rejected', false)

    if (!sessions || sessions.length === 0) {

      return Response.json({
        success: false,
        message: 'No valid sessions found'
      })
    }

    // ==========================================
    // FETCH STUDENTS
    // ==========================================

    const studentIds = sessions.map(s => s.student_id)

    const { data: students } = await supabase
      .from('students')
      .select('*')
      .in('id', studentIds)

    const studentMap = {}

    ;(students || []).forEach(st => {
      studentMap[st.id] = st
    })

    // ==========================================
    // FETCH SCHOOLS
    // ==========================================

    const schoolIds =
      [...new Set(
        (students || [])
          .map(s => s.school_id)
          .filter(Boolean)
      )]

    const { data: schools } = await supabase
      .from('schools')
      .select('*')
      .in('id', schoolIds)

    const schoolMap = {}

    ;(schools || []).forEach(sc => {
      schoolMap[sc.id] = sc
    })

    // ==========================================
    // BUILD BASE ROWS
    // ==========================================

    let rows = sessions.map(session => {

      const student = studentMap[session.student_id]
      const school = schoolMap[student?.school_id]

      const totalQuestions =
        session.total_questions || 0

      const correctAnswers =
        Math.max(
          0,
          Math.round((session.original_score || 0) / 4)
        )

      const wrongAnswers =
        Math.max(
          0,
          totalQuestions - correctAnswers
        )

      const unanswered = 0

      const accuracy =
        totalQuestions > 0
          ? (correctAnswers / totalQuestions) * 100
          : 0

      const timeTaken =
        exam.duration_minutes * 60 -
        (session.time_left || 0)

      return {

        exam_id: examId,
        exam_session_id: session.id,

        student_id: session.student_id,

        school_id: student?.school_id || null,

        score: session.score || 0,

        accuracy,

        correct_answers: correctAnswers,

        wrong_answers: wrongAnswers,

        unanswered,

        time_taken_seconds: timeTaken,

        grade: exam.target_year,

        olympiad_category:
          exam.exam_category,

        city: school?.city || null,

        district: school?.district || null,

        state: school?.state || null,

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

    // ==========================================
    // GLOBAL SORT
    // ==========================================

    rows.sort((a, b) => {

      if (b.score !== a.score)
        return b.score - a.score

      if (b.accuracy !== a.accuracy)
        return b.accuracy - a.accuracy

      if (b.correct_answers !== a.correct_answers)
        return b.correct_answers - a.correct_answers

      return a.time_taken_seconds - b.time_taken_seconds
    })

    // ==========================================
    // NATIONAL RANK
    // ==========================================

    assignCompetitionRanks(rows, 'national_rank')

    // ==========================================
    // STATE RANK
    // ==========================================

    const stateGroups = {}

    rows.forEach(r => {

      if (!stateGroups[r.state]) {
        stateGroups[r.state] = []
      }

      stateGroups[r.state].push(r)
    })

    Object.values(stateGroups).forEach(group => {
      assignCompetitionRanks(group, 'state_rank')
    })

    // ==========================================
    // DISTRICT RANK
    // ==========================================

    const districtGroups = {}

    rows.forEach(r => {

      const key = `${r.state}-${r.district}`

      if (!districtGroups[key]) {
        districtGroups[key] = []
      }

      districtGroups[key].push(r)
    })

    Object.values(districtGroups).forEach(group => {
      assignCompetitionRanks(group, 'district_rank')
    })

    // ==========================================
    // SCHOOL RANK
    // ==========================================

    const schoolGroups = {}

    rows.forEach(r => {

      const key = r.school_id

      if (!schoolGroups[key]) {
        schoolGroups[key] = []
      }

      schoolGroups[key].push(r)
    })

    Object.values(schoolGroups).forEach(group => {
      assignCompetitionRanks(group, 'school_rank')
    })

    // ==========================================
    // PHASE 2 QUALIFICATION
    // ==========================================

    const qualificationGroups = {}

    rows.forEach(r => {

      const key =
        `${r.school_id}-${r.grade}-${r.olympiad_category}`

      if (!qualificationGroups[key]) {
        qualificationGroups[key] = []
      }

      qualificationGroups[key].push(r)
    })

    Object.values(qualificationGroups).forEach(group => {

      const qualifiersNeeded =
        getQualifierCount(group.length)

      let boundaryRank = null

      group.forEach(r => {

        if (r.school_rank <= qualifiersNeeded) {

          r.qualified_phase2 = true

          boundaryRank = r.school_rank
        }
      })

      // ties expansion

      if (boundaryRank !== null) {

        group.forEach(r => {

          if (r.school_rank === boundaryRank) {
            r.qualified_phase2 = true
          }
        })
      }
    })

    // ==========================================
    // INSERT
    // ==========================================

    const { error: insertError } = await supabase
      .from('anse_exam_rankings')
      .insert(rows)

    if (insertError) {

      console.error(insertError)

      return Response.json(
        { error: insertError.message },
        { status: 500 }
      )
    }

    return Response.json({
      success: true,
      totalRankings: rows.length
    })

  } catch (err) {

    console.error(err)

    return Response.json(
      { error: err.message },
      { status: 500 }
    )
  }
}
