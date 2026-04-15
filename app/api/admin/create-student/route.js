import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {
  try {
    const body = await req.json()

    const {
      email,
      first_name,
      last_name,
      login_id,
      password,
      exam_preference,
      phone,
      address,
      adminCollegeId,
      adminCollegeName
    } = body

    // 🔥 VALIDATION
    if (!email || !first_name || !last_name || !login_id || !password || !exam_preference) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 🔥 GENERATE ID
    const id = randomUUID()

    // 🔥 INSERT
    const { error } = await supabase
      .from('students')
      .insert({
        id,
        user_id: id,
        email,
        first_name,
        last_name,
        login_id,
        password,
        exam_preference,
        role: 'student',
        college_id: adminCollegeId,
        college_name: adminCollegeName,
        phone: phone || null,
        address: address || null
      })

    if (error) throw error

    return Response.json({ success: true })

  } catch (err) {
    console.error(err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
