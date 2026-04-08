import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET() {
const { data: students } = await supabase
  .from('students')
  .select('college_id')
  .limit(1)

const collegeId = students?.[0]?.college_id

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
