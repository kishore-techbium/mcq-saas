export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function generateCertificateNumber() {

  const year =
    new Date().getFullYear()

  const random =
    Math.floor(
      100000 + Math.random() * 900000
    )

  return `ANSE-${year}-${random}`
}

export async function POST(req) {

  try {

    const body =
      await req.json()

    const {
      sessionId,
      examId
    } = body

    /* ======================================================
       VALIDATION
    ====================================================== */

    if (
      !sessionId ||
      !examId
    ) {

      return Response.json(
        {
          error:
            'Missing data'
        },
        { status: 400 }
      )
    }

    /* ======================================================
       LOAD SESSION
    ====================================================== */

    const {
      data: examSession,
      error: sessionError
    } = await supabase

      .from('exam_sessions')

      .select('*')

      .eq('id', sessionId)

      .single()

    if (
      sessionError ||
      !examSession
    ) {

      return Response.json(
        {
          error:
            'Session not found'
        },
        { status: 404 }
      )
    }

    const studentId =
      examSession.student_id

    /* ======================================================
       CHECK EXISTING CERTIFICATE
    ====================================================== */

    const {
      data: existing
    } = await supabase

      .from('anse_certificates')

      .select('*')

      .eq('student_id', studentId)

      .eq('exam_id', examId)

      .single()

    if (existing) {

      return Response.json({

        success: true,

        certificateId:
          existing.id,

        alreadyExists: true
      })
    }

    /* ======================================================
       LOAD STUDENT
    ====================================================== */

    const {
      data: student,
      error: studentError
    } = await supabase

      .from('students')

      .select('*')

      .eq('id', studentId)

      .single()

    if (
      studentError ||
      !student
    ) {

      return Response.json(
        {
          error:
            'Student not found'
        },
        { status: 404 }
      )
    }

    /* ======================================================
       LOAD EXAM
    ====================================================== */

    const {
      data: exam,
      error: examError
    } = await supabase

      .from('exams')

      .select('*')

      .eq('id', examId)

      .single()

    if (
      examError ||
      !exam
    ) {

      return Response.json(
        {
          error:
            'Exam not found'
        },
        { status: 404 }
      )
    }

    /* ======================================================
       LOAD RANKINGS
    ====================================================== */

    const {
      data: ranking
    } = await supabase

      .from('anse_exam_rankings')

      .select('*')

      .eq('student_id', studentId)

      .eq('exam_id', examId)

      .maybeSingle()

    /* ======================================================
       CERTIFICATE TYPE
    ====================================================== */

    let certificateType =
      'Participation Certificate'

    if (
      ranking?.national_rank === 1
    ) {

      certificateType =
        'National Topper Certificate'

    } else if (
      ranking?.national_rank <= 10
    ) {

      certificateType =
        'National Merit Certificate'

    } else if (
      ranking?.state_rank <= 5
    ) {

      certificateType =
        'State Excellence Certificate'
    }

    /* ======================================================
       INSERT CERTIFICATE
    ====================================================== */

    const insertData = {

      student_id:
        student.id,

student_name:
  `${student.first_name || ''} ${student.last_name || ''}`.trim(),

      exam_id:
        exam.id,

      exam_title:
        exam.title,

      olympiad_subject:
        exam.olympiad_subject,

      grade:
        exam.target_year,

      phase:
        exam.phase,

      certificate_type:
        certificateType,

      certificate_number:
        generateCertificateNumber(),

      national_rank:
        ranking?.national_rank || null,

      state_rank:
        ranking?.state_rank || null,

      district_rank:
        ranking?.district_rank || null,

      score:
        examSession?.score || null
    }

    const {
      data: inserted,
      error: insertError
    } = await supabase

      .from('anse_certificates')

      .insert(insertData)

      .select()

      .single()

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

      certificateId:
        inserted.id,

      alreadyExists: false
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
