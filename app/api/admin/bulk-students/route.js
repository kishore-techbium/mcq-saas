import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import * as XLSX from 'xlsx'
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
      .select('college_id, college_name, role, school_id')
       .eq('email', user.email)
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

    let rows = []

if (
  file.name.endsWith('.csv')
) {

  const text =
    await file.text()

  rows =
    text
      .split('\n')
      .slice(1)

} else if (

  file.name.endsWith('.xlsx')

) {

  const bytes =
    await file.arrayBuffer()

  const workbook =
    XLSX.read(bytes)

  const sheetName =
    workbook.SheetNames[0]

  const worksheet =
    workbook.Sheets[sheetName]

  const json =
    XLSX.utils.sheet_to_json(
      worksheet,
      { header: 1 }
    )

rows =
  json
    .slice(1)
    .filter(r => r.length > 0)

} else {

  return Response.json(
    {
      error:
        'Only CSV or XLSX files allowed'
    },
    { status: 400 }
  )
}

    let inserted = 0
    let failed = 0

    /* ================= PROCESS ROWS ================= */

   for (let row of rows) {

  if (!row) continue

  let parsedRow = []

  /* ================= CSV ================= */

  if (typeof row === 'string') {

    if (!row.trim()) continue

    parsedRow = row.split(',')

  }

  /* ================= XLSX ================= */

  else {

    parsedRow = row
  }

  const [
        email,
        first_name,
        last_name,
        login_id,
        password,
        exam_preference,
        phone,
        address,
        study_year,
        olympiad_subjects
      ] = parsedRow

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

    email:
      String(email || '').trim(),

    first_name:
      String(first_name || '').trim(),

    last_name:
      String(last_name || '').trim(),

    login_id:
      String(login_id || '').trim(),

    password:
      String(password || '').trim(),

    exam_preference:
      String(exam_preference || '').trim(),

    phone:
      String(phone || '').trim(),

    address:
      String(address || '').trim(),

    study_year:
      Number(parsedStudyYear),

    role: 'student',

    college_id:
      admin.college_id,

    college_name:
      admin.college_name,

    school_id:
      admin.role === 'school_admin'
        ? admin.school_id
        : null

  })

if (insertError) {

  console.log(
    'INSERT ERROR:',
    insertError
  )

  console.log(
    'ROW:',
    {
      email,
      first_name,
      last_name,
      login_id,
      study_year
    }
  )

  failed++

  continue
}
if (
  admin.role === 'school_admin' &&
  olympiad_subjects
) {

const subjects =
  olympiad_subjects
    ?.replace(/\r/g, '')
    .split('|')
    .map(s => s.trim())
    .filter(Boolean)

  if (subjects.length > 0) {

    const entitlementRows =
      subjects.map(subject => ({

        student_id: id,

        olympiad_subject: subject

      }))


 console.log({

  email,
  first_name,
  last_name,
  login_id,
  password,
  exam_preference,
  phone,
  address,
  study_year,
  olympiad_subjects
})
    
    await supabase
      .from('student_exam_categories')
      .insert(entitlementRows)

  }

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
