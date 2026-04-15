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

    /* ================= VALIDATION ================= */

    if (!email || !first_name || !last_name || !login_id || !password || !exam_preference) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    /* ================= CHECK DUPLICATE LOGIN ID ================= */

    const { data: existingUser } = await supabase
      .from('students')
      .select('id')
      .eq('login_id', login_id)
      .single()

    if (existingUser) {
      return Response.json(
        { error: 'Username already exists' },
        { status: 400 }
      )
    }

    /* ================= GENERATE ID ================= */

    const id = randomUUID()

    /* ================= INSERT STUDENT ================= */

    const { error } = await supabase
      .from('students')
      .insert({
        id: id,
        user_id: id, // same as id
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

    /* ================= SUCCESS ================= */

    return Response.json({
      success: true,
      student_id: id
    })

  } catch (err) {
    console.error('CREATE STUDENT ERROR:', err)

    return Response.json(
      { error: err.message },
      { status: 500 }
    )
  }
}
