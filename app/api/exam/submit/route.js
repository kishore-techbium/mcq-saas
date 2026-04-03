import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {
  try {
    const body = await req.json()
    const { sessionId, answers, timeSpent, questionOrder } = body

    if (!sessionId || !answers) {
      return Response.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // ✅ SAVE ANSWERS EXACTLY LIKE OLD SYSTEM
    const { error } = await supabase
      .from('exam_sessions')
      .update({
        answers: {
          ...answers,
          timeSpent,
          questionOrder
        },
        submitted: true,
        submitted_at: new Date(),
        processing_status: 'queued'
      })
      .eq('id', sessionId)

    if (error) throw error

    // ✅ QUEUE ONLY SESSION ID (LIGHTWEIGHT)
    await supabase
      .from('job_queue')
      .insert({
        type: 'PROCESS_EXAM',
        payload: { sessionId },
        status: 'pending'
      })

    return Response.json({ success: true })

  } catch (err) {
    console.error('Submit API error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
