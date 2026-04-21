import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {
  try {
    const body = await req.json()

    let {
      email,
      first_name,
      last_name,
      login_id,
      password,
      exam_preference,
      phone,
      address,
      } = body

    /* ================= CLEAN INPUT ================= */

    email = email?.trim()
    login_id = login_id?.trim()
    first_name = first_name?.trim()
    last_name = last_name?.trim()

    /* ================= VALIDATION ================= */

    if (!email || !first_name || !last_name || !login_id || !password || !exam_preference) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

   /* ================= GET ADMIN COLLEGE ================= */

const authHeader = req.headers.get('authorization')

if (!authHeader) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 })
}

const token = authHeader.replace('Bearer ', '')

const {
  data: { user },
  error: authError
} = await supabase.auth.getUser(token)

if (authError || !user) {
  return Response.json({ error: 'Invalid user' }, { status: 401 })
}

const { data: admin, error: adminError } = await supabase
  .from('students')
  .select('college_id, college_name')
  .eq('user_id', user.id)
  .single()

if (adminError || !admin) {
  return Response.json(
    { error: 'Admin college info missing' },
    { status: 400 }
  )
}

const adminCollegeId = admin.college_id
const adminCollegeName = admin.college_name
    /* ================= CHECK DUPLICATE USERNAME ================= */

    const { data: existingUser, error: checkError } = await supabase
      .from('students')
      .select('id')
      .eq('login_id', login_id)
      .maybeSingle()

    if (checkError) throw checkError

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
        user_id: id, // always same
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
