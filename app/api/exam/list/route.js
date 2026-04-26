import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {
  try {
    const { collegeId, category, studyYear } = await req.json()

    if (!collegeId || !category || !studyYear) {
      return Response.json({ error: 'Missing data' }, { status: 400 })
    }

    // 🔹 STEP 1: Get assigned exams
    const { data: assignments, error: assignError } = await supabase
      .from('exam_assignments')
      .select('exam_id')
      .eq('college_id', collegeId)
      .eq('is_active', true)

    if (assignError) throw assignError

   const examIds = (assignments || []).map(a => a.exam_id)

let query = supabase.from('exams').select('*')

if (examIds.length > 0) {
  const formattedIds = examIds.map(id => `"${id}"`).join(',')

  query = query.or(
    `and(college_id.eq.${collegeId},is_active.eq.true),id.in.(${formattedIds})`
  )
} else {
  query = query
    .eq('college_id', collegeId)
    .eq('is_active', true)
}

    const { data: exams, error } = await query

    if (error) {
      console.error("SUPABASE ERROR:", error)
      throw error
    }

    console.log("ALL EXAMS:", exams)

    // 🔹 STEP 3: Apply filters AFTER fetching
    const filtered = (exams || []).filter(e =>
      e.exam_category === category &&
      Number(e.target_year) === Number(studyYear)
    )

    console.log("FILTERED EXAMS:", filtered)

    return Response.json(filtered)

  } catch (err) {
    console.error("API ERROR:", err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
