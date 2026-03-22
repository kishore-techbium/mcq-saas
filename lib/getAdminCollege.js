import { supabase } from './supabase'

export async function getAdminCollege() {

  const { data } = await supabase.auth.getUser()

  if (!data?.user) return null

  const email = data.user.email

  const { data: user } = await supabase
    .from('students')
    .select('college_id')
    .eq('email', email)
    .single()

  return user?.college_id
}