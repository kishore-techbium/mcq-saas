export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET() {
  try {
    console.log("🚀 WORKER STARTED")

    // 🔥 STEP 1: FETCH ONE JOB FROM QUEUE
    const { data: jobs, error } = await supabase
      .from('job_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(1)

    if (error) throw error
if (!jobs || jobs.length === 0) {
  // wait before retry
  setTimeout(() => {
    fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/worker`)
      .catch(() => {})
  }, 3000)

  return Response.json({ message: 'No jobs' })
}

    const job = jobs[0]
    const sessionId = job.payload.sessionId

    console.log("📦 Processing job:", job.id, "Session:", sessionId)

    // 🔥 STEP 2: FETCH SESSION
    const { data: session, error: sessionError } = await supabase
      .from('exam_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (sessionError) throw sessionError

    if (!session) {
      console.log("❌ Session not found")

      await supabase
        .from('job_queue')
        .update({ status: 'failed' })
        .eq('id', job.id)

      return Response.json({ message: 'Session not found' })
    }

    // 🔹 Safety check
    if (!session.answers) {
      console.log("⚠️ No answers, marking completed")

      await supabase
        .from('exam_sessions')
        .update({ processing_status: 'completed' })
        .eq('id', session.id)

      await completeJob(job.id)

      // 🔁 CONTINUE WORKER LOOP (NON-BLOCKING)
setTimeout(() => {
  fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/worker`)
    .catch(() => {})
}, 1000)

return Response.json({ success: true })
    }

    const answers = session.answers

    // 🔹 Extract question IDs
    const questionIds = Object.keys(answers).filter(
      qid => qid !== 'timeSpent' && qid !== 'questionOrder'
    )

    if (questionIds.length === 0) {
      console.log("⚠️ No valid questions")

      await supabase
        .from('exam_sessions')
        .update({ processing_status: 'completed' })
        .eq('id', session.id)

      await completeJob(job.id)

      return Response.json({ success: true })
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

    // 🔹 Mark session completed
    await supabase
      .from('exam_sessions')
      .update({ processing_status: 'completed' })
      .eq('id', session.id)

    console.log("✅ Session completed:", session.id)

    // 🔹 Mark job completed
    await completeJob(job.id)

    console.log("✅ Job completed:", job.id)

    return Response.json({ success: true })

  } catch (err) {
    console.error('❌ Worker error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}

// 🔥 helper
async function completeJob(jobId) {
  await supabase
    .from('job_queue')
    .update({ status: 'completed' })
    .eq('id', jobId)
}
