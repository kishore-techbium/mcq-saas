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
       FETCH RANKINGS
    ===================================================== */

    const { data: rankings, error } =
      await supabase
        .from('anse_exam_rankings')
        .select('*')
        .eq('exam_id', examId)
        .order('national_rank', {
          ascending: true
        })

    if (error) {
      throw error
    }

    if (!rankings?.length) {
      return Response.json([])
    }

    /* =====================================================
       FETCH STUDENTS
    ===================================================== */

    const studentIds =
      rankings.map(
        r => r.student_id
      )

    const { data: students } =
      await supabase
        .from('students')
        .select(`
          id,
          first_name,
          last_name
        `)
        .in('id', studentIds)

    const studentMap = {}

    ;(students || []).forEach(s => {

      studentMap[s.id] =

        `${s.first_name || ''} ${s.last_name || ''}`
          .trim()
    })

    /* =====================================================
       FETCH SCHOOLS
    ===================================================== */

    const schoolIds = [

      ...new Set(

        rankings
          .map(r => r.school_id)
          .filter(Boolean)

      )

    ]

    const { data: schools } =
      await supabase
        .from('schools')
        .select(`
          id,
          school_name
        `)
        .in('id', schoolIds)

    const schoolMap = {}

    ;(schools || []).forEach(s => {

      schoolMap[s.id] =
        s.school_name
    })

    /* =====================================================
       FINAL RESPONSE
    ===================================================== */

    const result =
      rankings.map(r => ({

        ...r,

        student_name:
          studentMap[r.student_id] || '-',

        school_name:
          schoolMap[r.school_id] || '-'
      }))

    return Response.json(result)

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
