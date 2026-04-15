import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {
  try {
    const { sessionId } = await req.json()

    // 1. Get session
    const { data: session } = await supabase
      .from('exam_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (!session) throw new Error('Session not found')

    // 2. Get exam
    const { data: exam } = await supabase
      .from('exams')
      .select('*')
      .eq('id', session.exam_id)
      .single()

    // 3. Get questions
    const { data: questions } = await supabase
      .rpc('get_exam_questions', {
        p_exam_id: session.exam_id
      })

    return Response.json({
      session,
      exam,
      questions: questions || []
    })

  } catch (err) {
    console.error(err)
    return Response.json(
      { error: err.message },
      { status: 500 }
    )
  }
}