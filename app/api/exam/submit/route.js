import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL, // ✅ FIXED
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {
  try {
    const body = await req.json()

    const { sessionId, answers, timeSpent, questionOrder } = body

    if (!sessionId || !answers) {
      return Response.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // ✅ STEP 1: UPDATE SESSION (LIGHT WEIGHT ONLY)
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
        time_left: 0,
        processing_status: 'queued'
      })
      .eq('id', sessionId)

    if (error) throw error

    // ✅ STEP 2: PUSH TO QUEUE (NO HEAVY WORK)
    const { error: queueError } = await supabase
      .from('job_queue')
      .insert({
        type: 'PROCESS_EXAM',
        payload: { sessionId },
        status: 'pending'
      })

    if (queueError) throw queueError

    // ✅ FAST RESPONSE
    return Response.json({ success: true })

  } catch (err) {
    console.error('Submit API error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
