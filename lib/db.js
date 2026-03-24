import { supabase } from './supabase'
import { getAdminCollege } from './getAdminCollege'

export async function getStudentsWithCollege() {
  const collegeId = await getAdminCollege()

  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('college_id', collegeId)

  if (error) {
    console.error(error)
    return []
  }

  return data || []
}