import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {
  try {
    const { email, category, subject } = await req.json()

    // get college_id
    const { data: student } = await supabase
      .from('students')
      .select('college_id')
      .eq('email', email)
      .single()

    const collegeId = student?.college_id

    // get chapters
    const { data, error } = await supabase
      .from('question_bank')
      .select('chapter')
      .eq('exam_category', category)
      .eq('subject', subject)
      .eq('college_id', collegeId)
      .eq('is_active', true)

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    const chapters = [...new Set(data.map(d => d.chapter))]

    return Response.json({ chapters })

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}