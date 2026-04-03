import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log("🚀 Worker started...")

async function processJobs() {
  try {
    const { data: jobs } = await supabase
      .from('job_queue')
      .select('*')
      .eq('status', 'pending')
      .eq('locked', false)
      .order('created_at', { ascending: true })
      .limit(30)

    if (!jobs || jobs.length === 0) return

    const jobIds = jobs.map(j => j.id)

    // 🔒 LOCK JOBS
    await supabase
      .from('job_queue')
      .update({
        locked: true,
        locked_at: new Date()
      })
      .in('id', jobIds)

    const BATCH_SIZE = 5

    for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
      const batch = jobs.slice(i, i + BATCH_SIZE)

      await Promise.all(
        batch.map(async (job) => {
          try {
            const payload = job.payload
            const sessionId = payload.sessionId

            const answers = JSON.parse(payload.answers || "{}")

            const questionIds = Object.keys(answers)

            // ✅ FETCH QUESTIONS
            const { data: questions } = await supabase
              .from('question_bank')
              .select('id, correct_answer, subject, chapter')
              .in('id', questionIds)

            let correctCount = 0
            let totalQuestions = questionIds.length

            const answerRows = []
            const subjectStats = {}

            questions.forEach(q => {
              const selected = answers[q.id]
              const isCorrect = selected === q.correct_answer

              if (isCorrect) correctCount++

              answerRows.push({
                exam_session_id: sessionId,
                question_id: q.id,
                selected_answer: selected,
                correct_answer: q.correct_answer,
                is_correct: isCorrect
              })

              // 📊 SUBJECT ANALYTICS
              const key = `${q.subject}-${q.chapter}`

              if (!subjectStats[key]) {
                subjectStats[key] = {
                  subject: q.subject,
                  chapter: q.chapter,
                  correct: 0,
                  total: 0
                }
              }

              subjectStats[key].total++
              if (isCorrect) subjectStats[key].correct++
            })

            // ✅ INSERT ANSWERS
            if (answerRows.length > 0) {
              await supabase
                .from('exam_answers')
                .upsert(answerRows, {
                  onConflict: ['exam_session_id', 'question_id']
                })
            }

            // ✅ CALCULATE SCORE
            const percentage =
              totalQuestions > 0
                ? (correctCount / totalQuestions) * 100
                : 0

            // ✅ INSERT RESULTS (analytics)
            const resultRows = Object.values(subjectStats).map(stat => ({
              exam_session_id: sessionId,
              subject: stat.subject,
              chapter: stat.chapter,
              correct_count: stat.correct,
              total_questions: stat.total,
              percentage:
                stat.total > 0
                  ? (stat.correct / stat.total) * 100
                  : 0
            }))

            if (resultRows.length > 0) {
              await supabase
                .from('exam_results')
                .insert(resultRows)
            }

            // ✅ UPDATE SESSION FINAL SCORE
            await supabase
              .from('exam_sessions')
              .update({
                processing_status: 'completed',
                score: correctCount,
                original_score: correctCount
              })
              .eq('id', sessionId)

            // ✅ COMPLETE JOB
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

// 🔁 FAST LOOP
setInterval(processJobs, 500)
