import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {

  const {
    examId,
    studentId
  } = await req.json()

  /* ======================================================
     LOAD EXAM
  ====================================================== */

  const { data: exam } = await supabase

    .from('exams')

    .select('*')

    .eq('id', examId)

    .single()

  /* ======================================================
     LOAD QUESTIONS
  ====================================================== */

  const { data: questions } = await supabase.rpc(

    'get_exam_questions',

    { p_exam_id: examId }
  )

  /* ======================================================
     SCHOOL STUDENT CHECK
  ====================================================== */

  let isSchoolStudent = false

  if (studentId) {

    const {
      data: student
    } = await supabase

      .from('students')

      .select('school_id')

      .eq('id', studentId)

      .single()

isSchoolStudent =
  !!exam?.phase
  }

  return Response.json({

    exam,
    questions,

    isSchoolStudent
  })
}
