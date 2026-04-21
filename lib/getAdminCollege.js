import { supabase } from './supabase'

export async function getAdminCollege() {
  try {
    const { data: auth } = await supabase.auth.getUser()

    if (!auth?.user) {
      console.error('No logged-in user')
      return null
    }

    const userId = auth.user.id

    const { data, error } = await supabase
      .from('students')
      .select('college_id')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Fetch error:', error)
      return null
    }

    if (!data?.college_id) {
      console.error('No college_id found for admin')
      return null
    }

    return data.college_id

  } catch (err) {
    console.error('getAdminCollege error:', err)
    return null
  }
}
