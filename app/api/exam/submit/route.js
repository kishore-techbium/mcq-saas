import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {
  try {
    const body = await req.json()

    const { sessionId, answers, timeSpent, questionOrder, score } = body

    if (!sessionId || !answers) {
      return Response.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const { error } = await supabase
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

    // ✅ FIRST check DB success
    if (error) throw error

    // ✅ THEN trigger worker
    fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/worker`)
      .catch(() => {})

    return Response.json({ success: true })

  } catch (err) {
    console.error('Submit API error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
