import { supabase } from './supabase'

export async function ensureStudentProfile(user) {
  if (!user || !user.id) return

  const { data: existing, error } = await supabase
    .from('students')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    console.error('Student lookup failed:', error)
    return
  }

  if (!existing) {
    const { error: insertError } = await supabase
      .from('students')
      .insert({
        id: user.id,
        email: user.email
      })

    if (insertError) {
      console.error('Student creation failed:', insertError)
    }
  }
}
