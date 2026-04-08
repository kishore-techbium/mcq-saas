import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET() {
  const { data, error } = await supabase
    .from('exam_sessions')
    .select('student_id')

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  const attemptMap = {}

  data.forEach(a => {
    const sid = String(a.student_id)
    attemptMap[sid] = (attemptMap[sid] || 0) + 1
  })

  return Response.json(attemptMap)
}