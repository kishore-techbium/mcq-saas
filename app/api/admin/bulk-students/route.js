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
const {
  data: parentCategories,
  error: categoryError
} = await supabase
  .from('exam_categories')
  .select('code,parent_code')
  .eq('active', true)

if (categoryError) {
  throw categoryError
}

const validPreferences =
  (parentCategories || [])
    .filter(
      c => c.code === c.parent_code
    )
    .map(c => c.code)
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
const parsedStudyYear =
  Number(study_year)

if (
  ![1,2,3,4,5,6,7,8,9,10]
    .includes(parsedStudyYear)
) {
  failed++
  continue
}
      if (
        !validPreferences.includes(
          exam_preference
        )
      ) {
        failed++
        continue
      }
      try {

        const id = randomUUID()

        const { error: insertError } =
          await supabase
            .from('students')
            .insert({
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
              study_year: parsedStudyYear,
              role: 'student',
              college_id: admin.college_id,
              college_name: admin.college_name
            })

        if (insertError) {
          failed++
          continue
        }

        inserted++

      } catch (err) {

        console.error(err)
        failed++
      }
    }

    return Response.json({ inserted, failed })

  } catch (err) {

    console.error(err)

    return Response.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}
