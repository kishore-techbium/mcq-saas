import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {
  try {
    const body = await req.json()
    const { collegeId, category, studyYear } = body

    if (!collegeId || !category || !studyYear) {
      return Response.json({ error: 'Missing data' }, { status: 400 })
    }

    let query = supabase
      .from('exams')
      .select('*')
      .eq('exam_category', category)
      .eq('target_year', studyYear)
      .order('created_at', { ascending: false })

    // ✅ Only apply these if needed
    query = query
      .eq('college_id', collegeId)
      .eq('is_active', true)

    const { data, error } = await query

    if (error) {
      console.error("SUPABASE ERROR:", error)
      throw error
    }

    return Response.json(data || [])

  } catch (err) {
    console.error("API ERROR:", err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
