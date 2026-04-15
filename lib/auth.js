export async function getCurrentUser(supabase) {

  // 1️⃣ Google login
  const { data } = await supabase.auth.getUser()

  if (data?.user) {
    return {
      type: 'google',
      email: data.user.email
    }
  }

  // 2️⃣ Manual login (ONLY students)
  const localUser = localStorage.getItem('student')

  if (localUser) {
    const user = JSON.parse(localUser)

    // ❌ Extra safety
    if (user.role !== 'student') {
      localStorage.removeItem('student')
      return null
    }

    return {
      type: 'manual',
      user
    }
  }

  return null
}
