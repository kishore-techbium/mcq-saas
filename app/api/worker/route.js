import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const CORRECT_MARKS = 4
const NEGATIVE_MARKS = -1

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
            const sessionId = job.payload.sessionId

            const { data: session } = await supabase
              .from('exam_sessions')
              .select('*')
              .eq('id', sessionId)
              .single()

            if (!session || !session.answers) {
              await markCompleted(sessionId)
              await completeJob(job.id)
              return
            }

            const answers = session.answers

            const questionIds = Object.keys(answers).filter(
              qid => qid !== 'timeSpent' && qid !== 'questionOrder'
            )

            const { data: questions } = await supabase
              .from('question_bank')
              .select('id, correct_answer, subject, chapter')
              .in('id', questionIds)

            let totalScore = 0
            let correctCount = 0

            const answerRows = []
            const subjectStats = {}

            questions.forEach(q => {
              const selected = answers[q.id]
              const isCorrect = selected === q.correct_answer

              if (isCorrect) {
                correctCount++
                totalScore += CORRECT_MARKS
              } else {
                totalScore += NEGATIVE_MARKS
              }

              answerRows.push({
                exam_session_id: sessionId,
                question_id: q.id,
                selected_answer: selected,
                correct_answer: q.correct_answer,
                is_correct: isCorrect
              })

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

            // ✅ SAVE ANSWERS
            if (answerRows.length > 0) {
              await supabase
                .from('exam_answers')
                .upsert(answerRows, {
                  onConflict: ['exam_session_id', 'question_id']
                })
            }

            // ✅ FIXED RESULT INSERT
            const resultRows = Object.values(subjectStats).map(stat => ({
              exam_session_id: sessionId,
              college_id: session.college_id, // 🔥 FIX
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
              const { error: resultError } = await supabase
                .from('exam_results')
                .insert(resultRows)

              if (resultError) {
                console.error("❌ RESULT INSERT ERROR:", resultError)
              }
            }

            await supabase
              .from('exam_sessions')
              .update({
                processing_status: 'completed',
                score: totalScore,
                original_score: totalScore
              })
              .eq('id', sessionId)

            await completeJob(job.id)

          } catch (err) {
            console.error("❌ Job failed:", job.id, err)

            await supabase
              .from('job_queue')
              .update({
                status: 'failed',
                locked: false
              })
              .eq('id', job.id)
          }
        })
      )
    }

  } catch (err) {
    console.error("❌ Worker error:", err)
  }
}

async function markCompleted(sessionId) {
  await supabase
    .from('exam_sessions')
    .update({ processing_status: 'completed' })
    .eq('id', sessionId)
}

async function completeJob(jobId) {
  await supabase
    .from('job_queue')
    .update({
      status: 'completed',
      locked: false
    })
    .eq('id', jobId)
}

setInterval(processJobs, 500)
