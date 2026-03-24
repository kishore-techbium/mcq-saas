import { supabase } from './supabase'

export async function getAdminCollege() {
  try {
    const { data } = await supabase.auth.getUser()

    if (!data?.user) return null

    const email = data.user.email

    // ✅ Read college_id from URL or localStorage
    let collegeId = null

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const urlCollege = params.get('college')

      if (urlCollege) {
        localStorage.setItem('college_id', urlCollege)
        collegeId = urlCollege
      } else {
        collegeId = localStorage.getItem('college_id')
      }
    }

    // ✅ Fetch existing user safely
    let { data: user, error } = await supabase
      .from('students')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (error) {
      console.error('Fetch error:', error)
      return null
    }

    // ✅ If new user → create automatically
    if (!user) {
      const { data: newUser, error: insertError } = await supabase
        .from('students')
        .insert([
          {
            email: email,
            role: 'student',
            college_id: collegeId
          }
        ])
        .select()
        .single()

      if (insertError) {
        console.error('Insert error:', insertError)
        return null
      }

      user = newUser
    }

    // ✅ If user exists but no college_id → update it
    if (!user.college_id && collegeId) {
      await supabase
        .from('students')
        .update({ college_id: collegeId })
        .eq('id', user.id)

      user.college_id = collegeId
    }

    return user.college_id
  } catch (err) {
    console.error('getAdminCollege error:', err)
    return null
  }
}
