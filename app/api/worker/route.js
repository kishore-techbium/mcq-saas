export const dynamic = 'force-dynamic'
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
  .eq('processing_status', 'queued')
  .order('created_at', { ascending: false })
.limit(10)

console.log("ALL sessions fetched:", sessions)

if (error) throw error
    if (!sessions || sessions.length === 0) {
      return Response.json({ message: 'No pending exams' })
    }

    for (const session of sessions) {
      console.log("Processing session:", session.id)
// 🔥 GET JOB FOR THIS SESSION
const { data: jobs } = await supabase
  .from('job_queue')
  .select('*')
  .eq('payload->>sessionId', session.id)
  .eq('status', 'pending')
  .limit(1)

const job = jobs?.[0]
      // 🔹 Safety check
      if (!session.answers) {
        console.log("No answers found, marking completed:", session.id)

        await supabase
          .from('exam_sessions')
          .update({ processing_status: 'completed' })
          .eq('id', session.id)

        continue
      }
      

      const answers = session.answers

      // 🔹 Extract question IDs
      const questionIds = Object.keys(answers).filter(
        qid => qid !== 'timeSpent' && qid !== 'questionOrder'
      )

      console.log("Question IDs:", questionIds)

      // 🔹 If no valid questions → still complete
      if (questionIds.length === 0) {
        console.log("No valid questions, marking completed:", session.id)

        await supabase
          .from('exam_sessions')
          .update({ processing_status: 'completed' })
          .eq('id', session.id)

        continue
      }

      // 🔹 Fetch correct answers
      const { data: questions, error: qError } = await supabase
        .from('question_bank')
        .select('id, correct_answer')
        .in('id', questionIds)

      if (qError) throw qError

      console.log("Questions fetched:", questions)

      const correctMap = {}
      if (questions) {
        questions.forEach(q => {
          correctMap[q.id] = q.correct_answer
        })
      }

      const answerRows = []

      // 🔹 Build answer rows
      for (const qid of questionIds) {
        const selected = answers[qid]
        const correct = correctMap[qid] || null

        answerRows.push({
          exam_session_id: session.id,
          question_id: qid,
          selected_answer: selected,
          correct_answer: correct,
          is_correct: correct ? selected === correct : false
        })
      }

      console.log("Answer rows count:", answerRows.length)

      // 🔹 Insert answers (if any)
      if (answerRows.length > 0) {
        const { error: insertError } = await supabase
          .from('exam_answers')
          .upsert(answerRows, {
            onConflict: ['exam_session_id', 'question_id']
          })

        if (insertError) throw insertError
      }

      // 🔹 ALWAYS mark completed (IMPORTANT FIX)
      const { error: updateError } = await supabase
        .from('exam_sessions')
        .update({ processing_status: 'completed' })
        .eq('id', session.id)

      if (updateError) throw updateError

      console.log("Completed session:", session.id)
      // ✅ MARK JOB COMPLETED
if (job) {
  await supabase
    .from('job_queue')
    .update({ status: 'completed' })
    .eq('id', job.id)

  console.log("Job completed:", job.id)
}
    }

    return Response.json({ success: true })

  } catch (err) {
    console.error('Worker error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
