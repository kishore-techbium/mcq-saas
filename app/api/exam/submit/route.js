import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {
  try {
    const body = await req.json()
const {
  sessionId,
  answers,
  timeSpent,
  questionOrder,
  totalQuestions,

  // 🔐 integrity fields (NEW)
  tab_switch_count,
  blur_count,
  fullscreen_exit_count,
  copy_attempts,
  fast_answer_count

} = body
  if (!sessionId || !answers) {
      return Response.json({ error: 'Invalid payload' }, { status: 400 })
    }

const { data: sessionData, error: sessionError } = await supabase
  .from('exam_sessions')
  .select('student_id')
  .eq('id', sessionId)
  .single()

if (sessionError || !sessionData) {
  throw new Error('Session not found')
}

const { data: userData, error: userError } = await supabase
  .from('students')
  .select('college_id')
  .eq('id', sessionData.student_id)
  .single()

if (userError || !userData || !userData.college_id) {
  throw new Error('College not found for student')
}
const { error } = await supabase
  .from('exam_sessions')
  .update({
  answers: {
    ...answers,
    timeSpent,
    questionOrder
  },
  total_questions: totalQuestions,
  // 🔐 integrity fields (SAFE ADD)
  tab_switch_count: tab_switch_count || 0,
  blur_count: blur_count || 0,
  fullscreen_exit_count: fullscreen_exit_count || 0,
  copy_attempts: copy_attempts || 0,
  fast_answer_count: fast_answer_count || 0,

  submitted: true,
  submitted_at: new Date(),
  processing_status: 'queued',
  college_id: userData.college_id
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
