import { supabase } from './supabase'

async function getCollegeId() {
  const { data } = await supabase.auth.getUser()
  if (!data?.user) return null

  const { data: student } = await supabase
    .from('students')
    .select('college_id')
    .eq('id', data.user.id)
    .maybeSingle()

  return student?.college_id || null
}

export async function fromWithCollege(table) {
  const collegeId = await getCollegeId()

  let query = supabase.from(table)

  // apply only for multi-tenant tables
  const tablesToFilter = ['exams', 'question_bank']

  if (tablesToFilter.includes(table) && collegeId) {
    query = query.eq('college_id', collegeId)
  }

  return query
}