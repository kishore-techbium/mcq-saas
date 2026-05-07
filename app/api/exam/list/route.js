import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {
  console.log('API HIT')
  try {
    const {
  collegeId,
  category,
  studyYear,
  studentId
} = await req.json()
console.log('REQUEST DATA:', {
  collegeId,
  category,
  studyYear,
  studentId
})
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
    console.log('ALL EXAMS:', exams)
    if (error) {
      console.error("SUPABASE ERROR:", error)
      throw error
    }
// LOAD STUDENT ENTITLEMENTS

const { data: entitlements } =
  await supabase
    .from('student_exam_categories')
    .select('exam_category')
    .eq('student_id', studentId)

const allowedCategories =
  (entitlements || []).map(
    e => e.exam_category
  )
    console.log("ALL EXAMS:", exams)

    // 🔹 STEP 3: Apply filters AFTER fetching
    const filtered = (exams || []).filter(e => {

  // CATEGORY FILTER

  if (e.exam_category !== category) {
    return false
  }

  // STUDY YEAR FILTER

  if (
    Number(e.target_year) !== Number(studyYear)
  ) {
    return false
  }

  // NORMAL EXAMS

  if (!e.requires_entitlement) {
    return true
  }

  // OLYMPIAD / PREMIUM EXAMS

return (
  allowedCategories.includes(
    e.olympiad_subject
  ) ||

  allowedCategories.includes(
    e.exam_category
  )
)

})

    console.log("FILTERED EXAMS:", filtered)

    return Response.json(filtered)

  } catch (err) {
    console.error("API ERROR:", err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
