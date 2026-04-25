import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

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
      .eq('attempt_number', 1)
      .maybeSingle()

    // ✅ If session already exists → reuse
    if (existing) {
      return Response.json({ id: existing.id })
    }

    // 🔥 STEP 2: CREATE NEW ONLY IF NOT EXISTS
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

    if (error) throw error

    return Response.json({ id: data.id })

  } catch (err) {
    console.error(err)
    return Response.json(
      { error: err.message },
      { status: 500 }
    )
  }
}
