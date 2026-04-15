import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const adminId = searchParams.get('adminId')

    if (!adminId) {
      return Response.json(
        { error: 'adminId required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', adminId)
      .eq('role', 'admin')
      .maybeSingle()

    if (error) throw error

    if (!data) {
      return Response.json(
        { error: 'Admin not found' },
        { status: 404 }
      )
    }

    return Response.json(data)

  } catch (err) {
    console.error('ADMIN FETCH ERROR:', err)

    return Response.json(
      { error: err.message },
      { status: 500 }
    )
  }
}
