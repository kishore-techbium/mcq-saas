export async function getStudentsWithCollege() {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return []

  // 🔥 get admin college
  const { data: admin } = await supabase
    .from('students')
    .select('college_id')
    .eq('user_id', auth.user.id)
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
