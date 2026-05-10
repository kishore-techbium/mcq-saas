export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(req, { params }) {

  try {

    const examId = params.examId

    const { searchParams } =
      new URL(req.url)

    const userId =
      searchParams.get('userId')

    if (!examId || !userId) {

      return Response.json(
        {
          error:
            'Missing examId or userId'
        },
        { status: 400 }
      )
    }

    // =====================================================
    // 1. GET USER SCOPE
    // =====================================================

    const { data: adminUser } =
      await supabase
        .from('students')
        .select(`
          college_id,
          school_id
        `)
        .eq('user_id', userId)
        .single()

    const schoolId =
      adminUser?.school_id

    const collegeId =
      adminUser?.college_id

    const isSchoolMode =
      !!schoolId

    const scopeId =
      schoolId || collegeId

    if (!scopeId) {

      return Response.json(
        {
          error:
            'Access scope not found'
        },
        { status: 403 }
      )
    }

    // =====================================================
    // 2. FETCH EXAM
    // =====================================================

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

    // =====================================================
    // 3. VALIDATE ACCESS
    // =====================================================

    let allowed = false

    // own exam

    if (isSchoolMode) {

      if (
        exam.school_id &&
        String(exam.school_id) ===
        String(schoolId)
      ) {
        allowed = true
      }

    } else {

      if (
        exam.college_id &&
        String(exam.college_id) ===
        String(collegeId)
      ) {
        allowed = true
      }
    }

    // assigned global exam

    if (
      !allowed &&
      !exam.college_id &&
      !exam.school_id
    ) {

      let assignmentQuery = supabase
        .from('exam_assignments')
        .select('id')
        .eq('exam_id', examId)
        .eq('is_active', true)

      if (isSchoolMode) {

        assignmentQuery =
          assignmentQuery.eq(
            'school_id',
            schoolId
          )

      } else {

        assignmentQuery =
          assignmentQuery.eq(
            'college_id',
            collegeId
          )
      }

      const { data: assignment } =
        await assignmentQuery

      if (
        assignment &&
        assignment.length > 0
      ) {
        allowed = true
      }
    }

    if (!allowed) {

      return Response.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // =====================================================
    // 4. FETCH STUDENTS
    // =====================================================

    let studentsQuery = supabase
      .from('students')
      .select(`
        id,
        first_name,
        last_name,
        email,
        college_id,
        school_id
      `)

    if (isSchoolMode) {

      studentsQuery =
        studentsQuery.eq(
          'school_id',
          schoolId
        )

    } else {

      studentsQuery =
        studentsQuery.eq(
          'college_id',
          collegeId
        )
    }

    const { data: students } =
      await studentsQuery

    const allowedStudentIds =
      (students || []).map(
        s => s.id
      )

    const studentsMap = {}

    ;(students || []).forEach(s => {

      studentsMap[s.id] = {

        id: s.id,

        name:
          `${s.first_name || ''} ${s.last_name || ''}`
            .trim(),

        email: s.email,

        college_id: s.college_id,

        school_id: s.school_id
      }
    })

    // =====================================================
    // 5. EXAM STATS
    // =====================================================

    const { data: stats } =
      await supabase
        .from('student_exam_stats')
        .select('*')
        .eq('exam_id', examId)
        .in(
          'student_id',
          allowedStudentIds.length
            ? allowedStudentIds
            : ['dummy']
        )

    // =====================================================
    // 6. SUBJECT STATS
    // =====================================================

    const { data: subjectStats } =
      await supabase
        .from('student_subject_stats')
        .select('*')
        .in(
          'student_id',
          allowedStudentIds.length
            ? allowedStudentIds
            : ['dummy']
        )

    // =====================================================
    // 7. SUBTOPIC STATS
    // =====================================================

    const { data: subtopicStats } =
      await supabase
        .from('student_subtopic_stats')
        .select('*')
        .in(
          'student_id',
          allowedStudentIds.length
            ? allowedStudentIds
            : ['dummy']
        )

    // =====================================================
    // 8. EXAM SESSIONS
    // =====================================================

    const { data: sessions } =
      await supabase
        .from('exam_sessions')
        .select(`
          student_id,
          proctor_status
        `)
        .eq('exam_id', examId)
        .in(
          'student_id',
          allowedStudentIds.length
            ? allowedStudentIds
            : ['dummy']
        )

    const proctorMap = {}

    ;(sessions || []).forEach(s => {

      proctorMap[s.student_id] =
        s.proctor_status
    })

    // =====================================================
    // 9. SCOPE NAME
    // =====================================================

    let scopeName = ''

    if (isSchoolMode) {

      const { data: school } =
        await supabase
          .from('schools')
          .select('name')
          .eq('id', schoolId)
          .single()

      scopeName =
        school?.name || ''

    } else {

      const { data: college } =
        await supabase
          .from('colleges')
          .select('name')
          .eq('id', collegeId)
          .single()

      scopeName =
        college?.name || ''
    }

    // =====================================================
    // 10. FINAL RESPONSE
    // =====================================================

    return Response.json({

      success: true,

      exam,

      scopeName,

      studentsMap,

      stats: stats || [],

      subjectStats:
        subjectStats || [],

      subtopicStats:
        subtopicStats || [],

      proctorMap
    })

  } catch (err) {

    console.error(
      'FULL API ERROR:'
    )

    console.error(err)

    return Response.json(
      {
        success: false,
        error:
          err?.message ||
          'Internal server error'
      },
      { status: 500 }
    )
  }
}
