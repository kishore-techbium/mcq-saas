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
       FETCH EXAM
    ===================================================== */

    const { data: exam } =
      await supabase
        .from('exams')
        .select(`
          id,
          title,
          exam_category,
          target_year,
          created_at
        `)
        .eq('id', examId)
        .single()

    /* =====================================================
       FETCH RANKINGS
       PHASE 1 SCREENING ONLY
    ===================================================== */

    const { data: rankings, error } =
      await supabase
        .from('anse_exam_rankings')
        .select('*')
        .eq('exam_id', examId)
        .order('school_rank', {
          ascending: true
        })

    if (error) {
      throw error
    }

    if (!rankings?.length) {

      return Response.json({
        exam,
        totalRecords: 0,
        qualifiedCount: 0,
        rankings: []
      })
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
          last_name,
          school_id
        `)
        .in('id', studentIds)

    const studentMap = {}

    ;(students || []).forEach(s => {

      studentMap[s.id] = {

        name:

          `${s.first_name || ''} ${s.last_name || ''}`
            .trim(),

        school_id:
          s.school_id
      }
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
          name,
          city,
          district,
          state
        `)
        .in('id', schoolIds)

    const schoolMap = {}

    ;(schools || []).forEach(s => {

      schoolMap[s.id] = {

        name:
          s.name || '-',

        city:
          s.city || '-',

        district:
          s.district || '-',

        state:
          s.state || '-'
      }
    })

    /* =====================================================
       FINAL RESULT
       PHASE 1 SCREENING VIEW
    ===================================================== */

    const result =
      rankings.map(r => ({

        id:
          r.id,

        student_id:
          r.student_id,

        student_name:
          studentMap[r.student_id]?.name || '-',

        school_name:
          schoolMap[r.school_id]?.name || '-',

        city:
          schoolMap[r.school_id]?.city || '-',

        district:
          schoolMap[r.school_id]?.district || '-',

        state:
          schoolMap[r.school_id]?.state || '-',

        score:
          r.score || 0,

        accuracy:
          r.accuracy || 0,

        correct_answers:
          r.correct_answers || 0,

        wrong_answers:
          r.wrong_answers || 0,

        unanswered:
          r.unanswered || 0,

        school_rank:
          r.school_rank || null,

        qualified_phase2:
          r.qualified_phase2 || false,

        olympiad_category:
          r.olympiad_category || '-',

        grade:
          r.grade || '-'
      }))

    /* =====================================================
       SUMMARY
    ===================================================== */

    const qualifiedCount =
      result.filter(
        r => r.qualified_phase2
      ).length

    return Response.json({

      success: true,

      phase: 'PHASE_1_SCREENING',

      note:
        'Phase 1 rankings are school-level screening rankings used only for qualification into Phase 2. Official national rankings will be generated after Phase 2 centralized examination.',

      exam,

      totalRecords:
        result.length,

      qualifiedCount,

      rankings:
        result
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
