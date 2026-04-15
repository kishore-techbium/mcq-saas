import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {
  try {
    const { email, password, first_name, last_name } = await req.json()

    // 1️⃣ Create auth user
    const { data: authUser, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      })

    if (authError) throw authError

    // 2️⃣ Insert into students table
    const { error } = await supabase
      .from('students')
      .insert({
        id: authUser.user.id,
        email,
        first_name,
        last_name
      })

    if (error) throw error

    return Response.json({ success: true })

  } catch (err) {
    console.error(err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}