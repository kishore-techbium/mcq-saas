import { supabase } from './supabase'

export async function useAdminGuard() {

  const { data } = await supabase.auth.getUser()

  if (!data?.user) {
    window.location.href = '/'
    return false
  }

  const email = data.user.email

  const { data: user } = await supabase
    .from('students')
    .select('role')
    .eq('email', email)
    .single()

  if (user?.role !== 'admin') {
    window.location.href = '/'
    return false
  }

  return true
}