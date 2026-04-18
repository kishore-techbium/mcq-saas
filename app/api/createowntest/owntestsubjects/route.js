import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // 🔥 important
)

export async function POST(req) {
  try {
    const { email, category } = await req.json()

    // 🔥 get college_id from students table
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('college_id')
      .eq('email', email)
      .single()

    if (studentError || !student) {
      return Response.json({ error: 'Student not found' }, { status: 400 })
    }

    const collegeId = student.college_id

    // 🔥 get subjects
    const { data, error } = await supabase
      .from('question_bank')
      .select('subject')
      .eq('exam_category', category)
      .eq('college_id', collegeId)
      .eq('is_active', true)

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    const subjects = [...new Set(data.map(d => d.subject))]

    return Response.json({ subjects })

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}