import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {

  try {

    const body = await req.json()

    const collegeId =
      body.collegeId?.trim()

    const category =
      body.category?.trim()?.toUpperCase()

    const studyYear =
      Number(body.studyYear)

    const studentId =
      body.studentId

    if (
      !collegeId ||
      !category ||
      !studyYear
    ) {
      return Response.json(
        { error: 'Missing data' },
        { status: 400 }
      )
    }

    /* ===============================
       STEP 1: LOAD CATEGORY TREE
    =============================== */

    const {
      data: categoryRows,
      error: categoryError
    } = await supabase
      .from('exam_categories')
      .select('code,parent_code')

    if (categoryError) {
      throw categoryError
    }

    const allowedCategories =
      (categoryRows || [])
        .filter(
          c =>
            c.parent_code
              ?.trim()
              ?.toUpperCase()
            === category
        )
        .map(c =>
          c.code
            ?.trim()
            ?.toUpperCase()
        )

    allowedCategories.push(category)

    /* ===============================
       STEP 2: LOAD STUDENT ENTITLEMENTS
    =============================== */

    const {
      data: entitlements
    } = await supabase
      .from('student_exam_categories')
      .select('olympiad_subject')
      .eq('student_id', studentId)

    const allowedSubjects =
      (entitlements || []).map(
        e =>
          e.olympiad_subject
            ?.trim()
            ?.toUpperCase()
      )

    /* ===============================
       STEP 3: FETCH ASSIGNED EXAMS
    =============================== */

  const {
  data: assignments,
  error: assignmentError
} = await supabase
  .from('exam_assignments')
  .select('*')
  .eq('college_id', collegeId)
  .eq('is_active', true)

if (assignmentError) {
  throw assignmentError
}

const examIds =
  (assignments || []).map(
    a => a.exam_id
  )

let exams = []

if (examIds.length > 0) {

  const {
    data: examData,
    error: examError
  } = await supabase
    .from('exams')
    .select('*')
    .filter(
      'id',
      'in',
      `(${examIds.join(',')})`
    )

  if (examError) {
    throw examError
  }

  exams = examData || []
}

    if (assignmentError) {
      throw assignmentError
    }


    /* ===============================
       STEP 4: FILTER EXAMS
    =============================== */

    const filtered =
      exams.filter(e => {

        // ACTIVE EXAM

        if (!e.is_active) {
          return false
        }

        // CATEGORY

        if (
          !allowedCategories.includes(
            e.exam_category
              ?.trim()
              ?.toUpperCase()
          )
        ) {
          return false
        }

        // YEAR

        if (
          Number(e.target_year)
          !== studyYear
        ) {
          return false
        }

        // NORMAL EXAM

        if (!e.requires_entitlement) {
          return true
        }

        // OLYMPIAD

        return allowedSubjects.includes(
          e.olympiad_subject
            ?.trim()
            ?.toUpperCase()
        )

      })

    return Response.json(filtered)

  } catch (err) {

    console.error(err)

    return Response.json(
      { error: err.message },
      { status: 500 }
    )
  }
}
