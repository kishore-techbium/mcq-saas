import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {
  try {
    const { collegeId, category } = await req.json()

    if (!collegeId || !category) {
      return Response.json({ error: 'Missing data' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .eq('college_id', collegeId)
      .eq('is_active', true)
      .eq('exam_category', category)
      .order('created_at', { ascending: false })

    if (error) throw error

    return Response.json(data)

  } catch (err) {
    console.error(err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}