import { supabase } from './supabase'

export async function getAdminCollege() {
  try {
    const { data } = await supabase.auth.getUser()

    if (!data?.user) return null

    const email = data.user.email

    const { data: user, error } = await supabase
      .from('students')
      .select('college_id')
      .eq('email', email)
      .maybeSingle()   // ✅ safe

    if (error) {
      console.error('Fetch error:', error)
      return null
    }

    return user?.college_id || null
  } catch (err) {
    console.error('getAdminCollege error:', err)
    return null
  }
}
