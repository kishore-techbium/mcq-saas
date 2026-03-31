import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {
  try {
    const body = await req.json()

    const { sessionId, answers, timeSpent, questionOrder, score } = body

    await supabase
      .from('exam_sessions')
      .update({
        answers: {
          ...answers,
          timeSpent,
          questionOrder
        },
        score,
        submitted: true,
        time_left: 0,
        processing_status: 'pending'
      })
      .eq('id', sessionId)

    return Response.json({ success: true })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'failed' }, { status: 500 })
  }
}
