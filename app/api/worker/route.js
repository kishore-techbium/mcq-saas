import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET() {
  try {
    const { data: sessions, error } = await supabase
      .from('exam_sessions')
      .select('*')
      .eq('processing_status', 'pending')
      .eq('submitted', true)
      .limit(10)

    if (error) throw error

    if (!sessions || sessions.length === 0) {
      return Response.json({ message: 'No pending exams' })
    }

    for (const session of sessions) {

      if (!session.answers) {
        console.log("Skipping - no answers:", session.id)
        continue
      }

      console.log("Processing session:", session.id)

      const answers = session.answers
      const timeSpent = answers.timeSpent || {}

      const questionIds = Object.keys(answers).filter(
        qid => qid !== 'timeSpent' && qid !== 'questionOrder'
      )

      if (questionIds.length === 0) {
        console.log("No valid questions:", session.id)
        continue
      }

      // Fetch correct answers
      const { data: questions, error: qError } = await supabase
        .from('question_bank')
        .select('id, correct_answer')
        .in('id', questionIds)

      if (qError) throw qError

      const correctMap = {}
      questions.forEach(q => {
        correctMap[q.id] = q.correct_answer
      })

      const answerRows = []

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

      // Insert answers
      if (answerRows.length > 0) {
        const { error: insertError } = await supabase
          .from('exam_answers')
          .upsert(answerRows, {
            onConflict: ['exam_session_id', 'question_id']
          })

        if (insertError) throw insertError
      }

      // Mark completed
      const { error: updateError } = await supabase
        .from('exam_sessions')
        .update({ processing_status: 'completed' })
        .eq('id', session.id)

      if (updateError) throw updateError
    }

    return Response.json({ success: true })

  } catch (err) {
    console.error('Worker error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
