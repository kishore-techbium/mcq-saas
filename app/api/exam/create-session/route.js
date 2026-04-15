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
    const { data: student } = await supabase
  .from('students')
  .select('college_id')
  .eq('id', studentId)
  .single()
      if (!studentId) {
        return Response.json({ error: 'studentId required' }, { status: 400 })
      }
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
  { error: err.message, details: err },
  { status: 500 }
)
  }
}
