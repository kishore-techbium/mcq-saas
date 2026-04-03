import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log("🚀 Worker started...")

async function processJobs() {
  try {
    // 🔥 FETCH MORE JOBS
    const { data: jobs, error } = await supabase
      .from('job_queue')
      .select('*')
      .eq('status', 'pending')
      .eq('locked', false)
      .order('created_at', { ascending: true })
      .limit(30)   // 🔥 increased from 10 → 50

    if (error) throw error

    if (!jobs || jobs.length === 0) {
      return
    }

    const jobIds = jobs.map(j => j.id)

    // 🔒 LOCK ALL JOBS AT ONCE
    await supabase
      .from('job_queue')
      .update({
        locked: true,
        locked_at: new Date()
      })
      .in('id', jobIds)

    // 🔥 PROCESS IN PARALLEL
    const BATCH_SIZE = 5

for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
  const batch = jobs.slice(i, i + BATCH_SIZE)

  await Promise.all(
    batch.map(async (job) => {
      try {
        const sessionId = job.payload.sessionId

        const { data: session } = await supabase
          .from('exam_sessions')
          .select('*')
          .eq('id', sessionId)
          .single()

        if (!session) return

        const answers = session.answers || {}

        const questionIds = Object.keys(answers).filter(
          qid => qid !== 'timeSpent' && qid !== 'questionOrder'
        )

        const { data: questions } = await supabase
          .from('question_bank')
          .select('id, correct_answer')
          .in('id', questionIds)

        const correctMap = {}
        questions?.forEach(q => {
          correctMap[q.id] = q.correct_answer
        })

        const answerRows = questionIds.map(qid => ({
          exam_session_id: sessionId,
          question_id: qid,
          selected_answer: answers[qid],
          correct_answer: correctMap[qid],
          is_correct: answers[qid] === correctMap[qid]
        }))

        if (answerRows.length > 0) {
          await supabase
            .from('exam_answers')
            .upsert(answerRows, {
              onConflict: ['exam_session_id', 'question_id']
            })
        }

        await supabase
          .from('exam_sessions')
          .update({ processing_status: 'completed' })
          .eq('id', sessionId)

        await supabase
          .from('job_queue')
          .update({ status: 'completed' })
          .eq('id', job.id)

      } catch (err) {
        console.error("❌ Job failed:", job.id)

        await supabase
          .from('job_queue')
          .update({ status: 'failed' })
          .eq('id', job.id)
      }
    })
  )
}

  } catch (err) {
    console.error("❌ Worker error:", err)
  }
}

// 🔁 RUN FAST LOOP
setInterval(processJobs, 500) // 🔥 faster loop (1s → 0.5s)
