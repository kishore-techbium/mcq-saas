export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(req, context) {

  try {

    const examId = context?.params?.examId

    const { searchParams } = new URL(req.url)

    const userId = searchParams.get('userId')

    if (!examId || !userId) {
      return NextResponse.json(
        { error: 'Missing examId or userId' },
        { status: 400 }
      )
    }

    // =====================================================
    // 1. FIND ADMIN/SCHOOL COLLEGE
    // =====================================================

    let collegeId = null

    const { data: adminStudent } = await supabase
      .from('students')
      .select('college_id')
      .eq('user_id', userId)
      .maybeSingle()

    if (adminStudent?.college_id) {
      collegeId = adminStudent.college_id
    }

    if (!collegeId) {

      const { data: collegeAdmin } = await supabase
        .from('colleges')
        .select('id')
        .eq('admin_user_id', userId)
        .maybeSingle()

      if (collegeAdmin?.id) {
        collegeId = collegeAdmin.id
      }
    }

    if (!collegeId) {
      return NextResponse.json(
        { error: 'College not found' },
        { status: 403 }
      )
    }

    // =====================================================
    // 2. FETCH EXAM
    // =====================================================

    const { data: exam } = await supabase
      .from('exams')
      .select('*')
      .eq('id', examId)
      .maybeSingle()

    if (!exam) {
      return NextResponse.json(
        { error: 'Exam not found' },
        { status: 404 }
      )
    }

    // =====================================================
    // 3. ACCESS VALIDATION
    // =====================================================

    let allowed = false

    // own college exam
    if (
      exam.college_id &&
      String(exam.college_id) === String(collegeId)
    ) {
      allowed = true
    }

    // assigned global exam
    if (!allowed && !exam.college_id) {

      const { data: assignment } = await supabase
        .from('exam_assignments')
        .select('id')
        .eq('college_id', collegeId)
        .eq('exam_id', examId)
        .eq('is_active', true)
        .maybeSingle()

      if (assignment) {
        allowed = true
      }
    }

    if (!allowed) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // =====================================================
    // 4. GET ALLOWED STUDENTS
    // =====================================================

    const { data: students } = await supabase
      .from('students')
      .select('*')
      .eq('college_id', collegeId)

    const allowedStudentIds =
      (students || []).map(s => s.id)

    const studentsMap = {}

    ;(students || []).forEach(s => {

      studentsMap[s.id] = {
        id: s.id,
        name:
          `${s.first_name || ''} ${s.last_name || ''}`.trim(),
        email: s.email,
        college_id: s.college_id
      }
    })

    // =====================================================
    // 5. EXAM STATS
    // =====================================================

    const { data: stats } = await supabase
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

    const { data: subjectStats } = await supabase
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

    const { data: subtopicStats } = await supabase
      .from('student_subtopic_stats')
      .select('*')
      .in(
        'student_id',
        allowedStudentIds.length
          ? allowedStudentIds
          : ['dummy']
      )

    // =====================================================
    // 8. PROCTOR SESSIONS
    // =====================================================

    const { data: sessions } = await supabase
      .from('exam_sessions')
      .select('student_id, proctor_status')
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
    // 9. COLLEGE NAME
    // =====================================================

    let collegeName = ''

    const { data: college } = await supabase
      .from('colleges')
      .select('name')
      .eq('id', collegeId)
      .maybeSingle()

    collegeName = college?.name || ''

    // =====================================================
    // 10. RETURN CLEAN RESPONSE
    // =====================================================

    return NextResponse.json({
      exam,
      collegeName,
      studentsMap,
      stats: stats || [],
      subjectStats: subjectStats || [],
      subtopicStats: subtopicStats || [],
      proctorMap
    })

  } catch (err) {

 console.error('RESULT API ERROR = ', err)

return NextResponse.json(
  {
    error: err?.message || 'Internal server error'
  },
  { status: 500 }
)
  }
}
