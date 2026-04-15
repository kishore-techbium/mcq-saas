import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {
  const { examId } = await req.json()

  const { data: exam } = await supabase
    .from('exams')
    .select('*')
    .eq('id', examId)
    .single()

  const { data: questions } = await supabase.rpc(
    'get_exam_questions',
    { p_exam_id: examId }
  )

  return Response.json({ exam, questions })
}