import { supabase } from './supabase'
export async function getStudentsWithCollege() {
let userId = null

// ✅ Google login
const { data: auth } = await supabase.auth.getUser()
if (auth?.user) {
  userId = auth.user.id
}

// ✅ Manual login
if (!userId) {
  const localUser = localStorage.getItem('student')
  if (localUser) {
    const user = JSON.parse(localUser)
    userId = user.id
  }
}

if (!userId) return []
  // 🔥 get admin college
  const { data: admin } = await supabase
    .from('students')
    .select('college_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (!admin?.college_id) return []

  // 🔥 fetch students of same college
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('college_id', admin.college_id)

  if (error) {
    console.error(error)
    return []
  }

  return data
}
