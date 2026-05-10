export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(req) {

  try {

    const { searchParams } = new URL(req.url)

    const userId = searchParams.get('userId')

    if (!userId) {

      return Response.json(
        { error: 'Missing userId' },
        { status: 400 }
      )
    }

    // =====================================================
    // 1. GET ADMIN USER
    // =====================================================

    const { data: adminUser } = await supabase
      .from('students')
      .select(`
        college_id,
        school_id
      `)
      .eq('user_id', userId)
      .single()

    const collegeId = adminUser?.college_id
    const schoolId = adminUser?.school_id

    if (!collegeId) {

      return Response.json(
        { error: 'College not found' },
        { status: 403 }
      )
    }

    // =====================================================
    // 2. GET ASSIGNED EXAMS
    // =====================================================

    const { data: assignments } = await supabase
      .from('exam_assignments')
      .select('exam_id')
      .eq('college_id', collegeId)
      .eq('is_active', true)

    const assignedExamIds =
      (assignments || []).map(
        a => a.exam_id
      )

    // =====================================================
    // 3. CATEGORY MAP
    // =====================================================

    const { data: categoryRows } =
      await supabase
        .from('exam_categories')
        .select('code,parent_code')
        .eq('active', true)

    const categoryMap = {}

    ;(categoryRows || []).forEach(cat => {

      categoryMap[cat.code] =
        cat.parent_code
    })

    // =====================================================
    // 4. FETCH EXAMS
    // =====================================================

    const { data: allExams } =
      await supabase
        .from('exams')
        .select('*')

    const exams =
      (allExams || []).filter(e => {

        // own exam

        if (
          String(e.college_id) ===
          String(collegeId)
        ) {
          return true
        }

        // global assigned exam

        if (
          !e.college_id &&
          assignedExamIds.includes(e.id)
        ) {
          return true
        }

        return false
      })

    // =====================================================
    // 5. FETCH STUDENTS
    // =====================================================

    let studentsQuery = supabase
      .from('students')
      .select(`
        id,
        exam_preference,
        study_year,
        college_id,
        school_id
      `)

    // school segregation
    if (schoolId) {

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

    const studentIds =
      (students || []).map(
        s => s.id
      )

    // =====================================================
    // 6. FETCH STATS
    // =====================================================

    const { data: stats } =
      await supabase
        .from('student_exam_stats')
        .select('*')
        .in(
          'student_id',
          studentIds.length
            ? studentIds
            : ['dummy']
        )

    // =====================================================
    // 7. GROUP STATS
    // =====================================================

    const grouped = {}

    ;(stats || []).forEach((s) => {

      if (!grouped[s.exam_id]) {

        grouped[s.exam_id] = {

          students: 0,
          attempts: 0,
          totalScore: 0,
          max: s.best_score,
          min: s.best_score,
          last: s.last_attempt_at
        }
      }

      const e =
        grouped[s.exam_id]

      e.students += 1

      e.attempts +=
        s.attempts || 0

      e.totalScore +=
        (s.avg_score || 0) *
        (s.attempts || 0)

      e.max = Math.max(
        e.max,
        s.best_score || 0
      )

      e.min = Math.min(
        e.min,
        s.best_score || 0
      )

      if (
        !e.last ||
        s.last_attempt_at > e.last
      ) {
        e.last =
          s.last_attempt_at
      }
    })

    // =====================================================
    // 8. FINAL RESPONSE
    // =====================================================

    const result = exams.map((exam) => {

      const s =
        grouped[exam.id]

      const relatedStudents =
        (students || []).filter(st => {

          if (!st.study_year)
            return false

          const yearMatch =
            Number(st.study_year) ===
            Number(exam.target_year)

          let categoryMatch = true

          if (
            st.exam_preference &&
            exam.exam_category
          ) {

            const studentPref =
              st.exam_preference
                .toUpperCase()

            const examCat =
              exam.exam_category
                ?.toUpperCase?.() || ''

            const examParent =
              categoryMap[examCat]

            categoryMatch =
              studentPref === examCat ||
              studentPref === examParent
          }

          return (
            yearMatch &&
            categoryMatch
          )
        })

      return {

        id: exam.id,

        title: exam.title,

        exam_category:
          exam.exam_category,

        exam_type:
          exam.exam_type,

        year_label:

          Number(exam.target_year) === 1
            ? '1st Year'

            : Number(exam.target_year) === 2
            ? '2nd Year'

            : Number(exam.target_year) === 3
            ? '3rd Year'

            : `Class ${exam.target_year}`,

        students:
          relatedStudents.length,

        attempts:
          s ? s.attempts : 0,

        avg_score:
          s && s.attempts > 0
            ? (
                s.totalScore /
                s.attempts
              ).toFixed(1)
            : '-',

        max_score:
          s ? s.max : '-',

        min_score:
          s ? s.min : '-',

        participation:
          relatedStudents.length > 0 && s
            ? (
                (
                  (s.students || 0) /
                  relatedStudents.length
                ) * 100
              ).toFixed(1)
            : '0',

        last_attempt:
          s?.last || null
      }
    })

    return Response.json(result)

  } catch (err) {

    console.error(err)

    return Response.json(
      { error: err.message },
      { status: 500 }
    )
  }
}
