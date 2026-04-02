export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET() {
  try {
// 🔒 STEP 1: FETCH UNLOCKED JOBS
const { data: jobs, error } = await supabase
  .from('job_queue')
  .select('*')
  .eq('status', 'pending')
  .eq('locked', false)
  .order('created_at', { ascending: true })
  .limit(10)

if (error) throw error

if (!jobs || jobs.length === 0) {
  console.log("❌ NO JOBS FOUND")
  return Response.json({ message: 'No jobs' })
}

// 🔒 STEP 2: LOCK THEM IMMEDIATELY
const jobIds = jobs.map(j => j.id)

await supabase
  .from('job_queue')
  .update({
    locked: true,
    locked_at: new Date()
  })
  .in('id', jobIds)

    // 🔁 PROCESS EACH JOB
    for (const job of jobs) {
      try {
        const sessionId = job.payload.sessionId

        console.log("➡️ Job:", job.id, "Session:", sessionId)

        // 🔥 FETCH SESSION
        const { data: session, error: sessionError } = await supabase
          .from('exam_sessions')
          .select('*')
          .eq('id', sessionId)
          .single()

        if (sessionError || !session) {
          console.log("❌ Session not found:", sessionId)

          await supabase
            .from('job_queue')
            .update({ status: 'failed' })
            .eq('id', job.id)

          continue
        }

        // 🔹 Safety check
        if (!session.answers) {
          console.log("⚠️ No answers")

          await markCompleted(session.id)
          await completeJob(job.id)
          continue
        }

        const answers = session.answers

        // 🔹 Extract question IDs
        const questionIds = Object.keys(answers).filter(
          qid => qid !== 'timeSpent' && qid !== 'questionOrder'
        )

        if (questionIds.length === 0) {
          console.log("⚠️ No valid questions")

          await markCompleted(session.id)
          await completeJob(job.id)
          continue
        }

        // 🔹 Fetch correct answers
        const { data: questions, error: qError } = await supabase
          .from('question_bank')
          .select('id, correct_answer')
          .in('id', questionIds)

        if (qError) throw qError

        const correctMap = {}
        questions?.forEach(q => {
          correctMap[q.id] = q.correct_answer
        })

        const answerRows = []

        // 🔹 Build answers
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

        console.log("📊 Answer rows:", answerRows.length)

        // 🔹 Insert answers
        if (answerRows.length > 0) {
          const { error: insertError } = await supabase
            .from('exam_answers')
            .upsert(answerRows, {
              onConflict: ['exam_session_id', 'question_id']
            })

          if (insertError) throw insertError
        }

        // 🔹 Mark session complete
        await markCompleted(session.id)

        // 🔹 Mark job complete
        await completeJob(job.id)

        console.log("✅ Done:", job.id)

      } catch (jobError) {
        console.error("❌ Job failed:", job.id, jobError)

        await supabase
          .from('job_queue')
          .update({ status: 'failed' })
          .eq('id', job.id)
      }
    }

    return Response.json({ success: true })

  } catch (err) {
    console.error("❌ Worker error:", err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}

// 🔧 helpers
async function markCompleted(sessionId) {
  await supabase
    .from('exam_sessions')
    .update({ processing_status: 'completed' })
    .eq('id', sessionId)
}

async function completeJob(jobId) {
  await supabase
    .from('job_queue')
    .update({ status: 'completed' })
    .eq('id', jobId)
}
