import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log("🚀 Worker started...")

async function processJobs() {
  try {
    const { data: jobs, error } = await supabase
      .from('job_queue')
      .select('*')
      .eq('status', 'pending')
      .eq('locked', false)
      .order('created_at', { ascending: true })
      .limit(10)

    if (error) throw error

    if (!jobs || jobs.length === 0) {
      console.log("⏳ No jobs...")
      return
    }

    console.log(`📦 Found ${jobs.length} jobs`)

    // 🔒 Lock jobs
    const jobIds = jobs.map(j => j.id)

    await supabase
      .from('job_queue')
      .update({
        locked: true,
        locked_at: new Date()
      })
      .in('id', jobIds)

    for (const job of jobs) {
      try {
        const sessionId = job.payload.sessionId

        console.log("➡️ Processing:", sessionId)

        const { data: session } = await supabase
          .from('exam_sessions')
          .select('*')
          .eq('id', sessionId)
          .single()

        if (!session) continue

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

        const answerRows = []

        for (const qid of questionIds) {
          const selected = answers[qid]
          const correct = correctMap[qid]

          answerRows.push({
            exam_session_id: sessionId,
            question_id: qid,
            selected_answer: selected,
            correct_answer: correct,
            is_correct: selected === correct
          })
        }

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

        console.log("✅ Done:", sessionId)

      } catch (err) {
        console.error("❌ Job error:", err)

        await supabase
          .from('job_queue')
          .update({ status: 'failed' })
          .eq('id', job.id)
      }
    }

  } catch (err) {
    console.error("❌ Worker error:", err)
  }
}

// 🔁 RUN FOREVER
setInterval(processJobs, 1000)
