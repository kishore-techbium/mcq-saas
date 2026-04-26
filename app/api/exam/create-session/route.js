import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {
  try {
    const body = await req.json()
    const { studentId, examId } = body

    if (!studentId || !examId) {
      return Response.json({ error: 'Missing data' }, { status: 400 })
    }

    // Get student
    const { data: student } = await supabase
      .from('students')
      .select('college_id')
      .eq('id', studentId)
      .single()

    // 🔥 STEP 1: CHECK EXISTING SESSION
    const { data: existing } = await supabase
      .from('exam_sessions')
      .select('*')
      .eq('student_id', studentId)
      .eq('exam_id', examId)
      .eq('submitted', false)
      .maybeSingle()

    if (existing) {
      return Response.json({ id: existing.id })
    }

    // 🔥 STEP 2: CREATE NEW
    const { data, error } = await supabase
      .from('exam_sessions')
      .insert({
        student_id: studentId,
        exam_id: examId,
        college_id: student.college_id,
        attempt_number: 1,
        submitted: false,
        score: 0,
        original_score: 0
      })
      .select()
      .single()

    if (error) {
      const { data: fallback } = await supabase
        .from('exam_sessions')
        .select('*')
        .eq('student_id', studentId)
        .eq('exam_id', examId)
        .eq('submitted', false)
        .maybeSingle()

      if (fallback) {
        return Response.json({ id: fallback.id })
      }

      throw error
    }

    // ✅ FINAL RETURN
    return Response.json({ id: data.id })

  } catch (err) {
    console.error(err)
    return Response.json(
      { error: err.message },
      { status: 500 }
    )
  }
}
