import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(req) {
  try {
    // ⚠️ For now: get first admin (simple version)
    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .limit(1)
      .single()

    if (error) throw error

    return Response.json(admin)

  } catch (err) {
    console.error(err)
    return Response.json(
      { error: err.message },
      { status: 500 }
    )
  }
}