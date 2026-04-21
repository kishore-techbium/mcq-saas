import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {
  try {
    /* ================= AUTH ================= */

    const authHeader = req.headers.get('authorization')

    if (!authHeader) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')

    const {
      data: { user }
    } = await supabase.auth.getUser(token)

    if (!user) {
      return Response.json({ error: 'Invalid user' }, { status: 401 })
    }

    /* ================= GET ADMIN ================= */

    const { data: admin } = await supabase
      .from('students')
      .select('college_id, college_name')
      .eq('user_id', user.id)
      .single()

    if (!admin) {
      return Response.json(
        { error: 'Admin college info missing' },
        { status: 400 }
      )
    }

    /* ================= READ FILE ================= */

    const formData = await req.formData()
    const file = formData.get('file')

    const text = await file.text()

    const rows = text.split('\n').slice(1) // skip header

    let inserted = 0
    let failed = 0

    /* ================= PROCESS ROWS ================= */

    for (let row of rows) {
      if (!row.trim()) continue

      const [
        email,
        first_name,
        last_name,
        login_id,
        password,
        exam_preference,
        phone,
        address,
        study_year
      ] = row.split(',')

      if (!email || !login_id) {
        failed++
        continue
      }

      try {
        const id = randomUUID()

        await supabase.from('students').insert({
          id,
          user_id: id,
          email: email.trim(),
          first_name: first_name?.trim(),
          last_name: last_name?.trim(),
          login_id: login_id?.trim(),
          password: password?.trim(),
          exam_preference: exam_preference?.trim(),
          phone: phone?.trim(),
          address: address?.trim(),
          study_year: Number(study_year),
          role: 'student',
          college_id: admin.college_id,
          college_name: admin.college_name
        })

        inserted++

      } catch (err) {
        console.error(err)
        failed++
      }
    }

    return Response.json({ inserted, failed })

  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Upload failed' }, { status: 500 })
  }
}
