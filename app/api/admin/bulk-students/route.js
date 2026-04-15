import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {
  try {
    const formData = await req.formData()

    const file = formData.get('file')
    const adminCollegeId = formData.get('adminCollegeId')
    const adminCollegeName = formData.get('adminCollegeName')

    /* ================= VALIDATION ================= */

    if (!file) {
      return Response.json({ error: 'File missing' }, { status: 400 })
    }

    if (!adminCollegeId || !adminCollegeName) {
      return Response.json(
        { error: 'Admin college info missing' },
        { status: 400 }
      )
    }

    /* ================= READ FILE ================= */

    const text = await file.text()
    const rows = text.split('\n').slice(1) // skip header

    let inserted = 0
    let failed = 0

    /* ================= PROCESS EACH ROW ================= */

    for (const row of rows) {
      if (!row.trim()) continue

      const [
        email,
        first_name,
        last_name,
        login_id,
        password,
        exam_preference,
        phone,
        address
      ] = row.split(',')

      try {
        if (!email || !login_id || !password) {
          failed++
          continue
        }

        const id = randomUUID()

        /* 🔥 DUPLICATE CHECK */

        const { data: existing } = await supabase
          .from('students')
          .select('id')
          .eq('login_id', login_id.trim())
          .maybeSingle()

        if (existing) {
          failed++
          continue
        }

        /* 🔥 INSERT */

        const { error } = await supabase
          .from('students')
          .insert({
            id,
            user_id: id,
            email: email.trim(),
            first_name: first_name?.trim(),
            last_name: last_name?.trim(),
            login_id: login_id.trim(),
            password: password.trim(),
            exam_preference: exam_preference?.trim(),
            role: 'student',
            college_id: adminCollegeId,        // ✅ IMPORTANT
            college_name: adminCollegeName,    // ✅ IMPORTANT
            phone: phone || null,
            address: address || null
          })

        if (error) throw error

        inserted++

      } catch (err) {
        console.error('Row failed:', row, err)
        failed++
      }
    }

    /* ================= RESPONSE ================= */

    return Response.json({
      inserted,
      failed
    })

  } catch (err) {
    console.error('BULK UPLOAD ERROR:', err)

    return Response.json(
      { error: err.message },
      { status: 500 }
    )
  }
}