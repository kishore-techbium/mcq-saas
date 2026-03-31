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

      const questionIds = Object.keys(answers).filter(
  qid => qid !== 'timeSpent' && qid !== 'questionOrder'
)

// 1. fetch correct answers from DB
const { data: questions } = await supabase
  .from('question_bank')
  .select('id, correct_answer')
  .in('id', questionIds)

const correctMap = {}
questions.forEach(q => {
  correctMap[q.id] = q.correct_answer
})

// 2. build answer rows
for (const qid of questionIds) {
  const selected = answers[qid]
  const correct = correctMap[qid]

  answerRows.push({
    exam_session_id: session.id,
    question_id: qid,
    selected_answer: selected,
    correct_answer: correct,
    is_correct: selected === correct
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
