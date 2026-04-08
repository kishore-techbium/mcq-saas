import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const collegeId = searchParams.get('collegeId')

  const { data, error } = await supabase.rpc('get_student_attempt_counts', {
    college: collegeId
  })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  const attemptMap = {}

  data.forEach(row => {
    attemptMap[String(row.student_id)] = Number(row.attempts)
  })

  return Response.json(attemptMap)
}
