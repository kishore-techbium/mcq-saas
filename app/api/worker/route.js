import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET() {
  try {
    // 1. get pending sessions (limit to avoid overload)
    const { data: sessions } = await supabase
      .from('exam_sessions')
      .select('*')
      .eq('processing_status', 'pending')
      .limit(10)

    if (!sessions || sessions.length === 0) {
      return Response.json({ message: 'No pending exams' })
    }

    for (const session of sessions) {
      const answers = session.answers || {}

      const timeSpent = answers.timeSpent || {}

      const answerRows = []

      for (const qid in answers) {
        if (qid === 'timeSpent' || qid === 'questionOrder') continue

        answerRows.push({
          exam_session_id: session.id,
          question_id: qid,
          selected_answer: answers[qid],
          correct_answer: null, // we’ll improve later
          is_correct: null
        })
      }

      // insert answers
      if (answerRows.length > 0) {
        await supabase.from('exam_answers').insert(answerRows)
      }

      // mark completed
      await supabase
        .from('exam_sessions')
        .update({ processing_status: 'completed' })
        .eq('id', session.id)
    }

    return Response.json({ success: true })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'worker failed' }, { status: 500 })
  }
}