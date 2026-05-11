export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(req) {

  try {

    const { searchParams } =
      new URL(req.url)

    const examId =
      searchParams.get('examId')

    if (!examId) {

      return Response.json(
        { error: 'examId required' },
        { status: 400 }
      )
    }

    /* =====================================================
       FETCH PHASE 1 RANKINGS
    ===================================================== */

    const { data: rankings, error } =
      await supabase
        .from('anse_exam_rankings')
        .select('*')
        .eq('exam_id', examId)
        .eq('phase', 'PHASE_1')
        .order('school_rank', {
          ascending: true
        })

    if (error) {
      throw error
    }

    if (!rankings?.length) {

      return Response.json({
        rankings: []
      })
    }

    /* =====================================================
       FETCH STUDENTS
    ===================================================== */

    const studentIds = [

      ...new Set(

        rankings.map(
          r => r.student_id
        )

      )

    ]

    const { data: students } =
      await supabase
        .from('students')
        .select(`
          id,
          first_name,
          last_name,
          school_id
        `)
        .in('id', studentIds)

    const studentMap = {}

    ;(students || []).forEach(s => {

      studentMap[s.id] = s
    })

    /* =====================================================
       FETCH SCHOOLS
    ===================================================== */

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
        .select(`
          id,
          name,
          city,
          district,
          state
        `)
        .in('id', schoolIds)

    const schoolMap = {}

    ;(schools || []).forEach(s => {

      schoolMap[s.id] = s
    })

    /* =====================================================
       FINAL RESPONSE
    ===================================================== */

    const result =
      rankings.map(r => {

        const student =
          studentMap[r.student_id]

        const school =
          schoolMap[
            student?.school_id
          ]

        return {

          ...r,

          student_name:

            `${student?.first_name || ''} ${student?.last_name || ''}`
              .trim(),

          school_name:
            school?.name || '-',

          city:
            school?.city || '-',

          district:
            school?.district || '-',

          state:
            school?.state || '-'
        }
      })

    return Response.json({
      rankings: result
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
