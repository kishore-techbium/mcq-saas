import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {
  try {
    
const { collegeId, category, studyYear } = await req.json()
const { collegeId, category, studyYear } = await req.json()

// 1. Get global assignments
const { data: assignments } = await supabase
  .from('exam_assignments')
  .select('exam_id')
  .eq('college_id', collegeId)
  .eq('is_active', true)

const assignedExamIds = (assignments || []).map(a => a.exam_id)

// 2. Fetch BOTH:
// - college exams
// - assigned global exams

const { data, error } = await supabase
  .from('exams')
  .select('*')
  .or(`
    and(college_id.eq.${collegeId},is_active.eq.true),
    id.in.(${assignedExamIds.join(',')})
  `)
  .eq('exam_category', category)
  .eq('target_year', studyYear)
  .order('created_at', { ascending: false })

if (error) throw error

return Response.json(data)
}
