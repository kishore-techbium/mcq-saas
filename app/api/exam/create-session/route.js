import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {
  try {
    const body = await req.json()

const { examId, collegeId } = body

const studentId = "499fcc3c-a87f-4bcb-938b-1c7e0a82b16e"
    const { data, error } = await supabase
      .from('exam_sessions')
      .insert({
        student_id: studentId,
        exam_id: examId,
        college_id: collegeId,
        attempt_number: 1,
        submitted: false,
        score: 0,
        original_score: 0
      })
      .select()
      .single()

    if (error) throw error

    return Response.json({ sessionId: data.id })

  } catch (err) {
    console.error(err)
    return Response.json(
  { error: err.message, details: err },
  { status: 500 }
)
  }
}
