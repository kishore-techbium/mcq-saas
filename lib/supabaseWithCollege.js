import { supabase } from './supabase'

async function getCollegeId() {

  // ✅ 1. Try Google login
  const { data } = await supabase.auth.getUser()

  if (data?.user) {
    const { data: student } = await supabase
      .from('students')
      .select('college_id')
      .eq('id', data.user.id)
      .maybeSingle()

    return student?.college_id || null
  }

  // ✅ 2. Try manual login
  const localUser = localStorage.getItem('student')

  if (localUser) {
    const user = JSON.parse(localUser)
    return user.college_id || null
  }

  return null
}

export async function fromWithCollege(table) {
  const collegeId = await getCollegeId()

  const base = supabase.from(table)

  // return helper object (NOT raw query)
  return {
    select: (columns = '*') => {
      let q = base.select(columns)

      if (collegeId && ['exams', 'question_bank'].includes(table)) {
        q = q.eq('college_id', collegeId)
      }

      return q
    }
  }
}
