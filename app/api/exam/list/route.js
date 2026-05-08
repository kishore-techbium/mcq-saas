import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {
  try {

    const {
      collegeId,
      category,
      studyYear,
      studentId
    } = await req.json()

    console.log('REQUEST DATA:', {
      collegeId,
      category,
      studyYear,
      studentId
    })

    if (!collegeId || !category || !studyYear) {

      return Response.json(
        { error: 'Missing data' },
        { status: 400 }
      )
    }

    /* ===============================
       STEP 1: GET ACTIVE ASSIGNMENTS
    =============================== */

    const {
      data: assignments,
      error: assignError
    } = await supabase
      .from('exam_assignments')
      .select('exam_id')
      .eq('college_id', collegeId)
      .eq('is_active', true)

    if (assignError) {
      throw assignError
    }

    const examIds =
      (assignments || []).map(
        a => a.exam_id
      )

    console.log('ACTIVE EXAM IDS:', examIds)

   /* ===============================
   STEP 2A: FETCH ASSIGNED EXAMS
=============================== */

let assignedExams = []

if (examIds.length > 0) {

  const {
    data,
    error
  } = await supabase
    .from('exams')
    .select('*')
    .in('id', examIds)
    .eq('is_active', true)

  if (error) {
    throw error
  }

  assignedExams = data || []
}

/* ===============================
   STEP 2B: FETCH DIRECT COLLEGE EXAMS
=============================== */

const {
  data: collegeExams,
  error: collegeError
} = await supabase
  .from('exams')
  .select('*')
  .eq('college_id', collegeId)
  .eq('is_active', true)

if (collegeError) {
  throw collegeError
}

/* ===============================
   STEP 2C: MERGE WITHOUT DUPLICATES
=============================== */

const allExamsMap = new Map()

;[
  ...(assignedExams || []),
  ...(collegeExams || [])
].forEach(exam => {

  allExamsMap.set(
    exam.id,
    exam
  )

})

const exams =
  Array.from(
    allExamsMap.values()
  )

console.log(
  'ALL EXAMS:',
  exams
)
    /* ===============================
       STEP 3: LOAD ENTITLEMENTS
    =============================== */

    const {
      data: entitlements
    } = await supabase
      .from('student_exam_categories')
      .select('olympiad_subject')
      .eq('student_id', studentId)

    const allowedSubjects =
      (entitlements || []).map(
        e => e.olympiad_subject
      )

    console.log(
      'ALLOWED SUBJECTS:',
      allowedSubjects
    )

    /* ===============================
       STEP 4: FILTER EXAMS
    =============================== */

    const filtered =
      (exams || []).filter(e => {

        // CATEGORY FILTER

        if (
          e.exam_category !== category
        ) {
          return false
        }

        // STUDY YEAR FILTER

        if (
          Number(e.target_year) !==
          Number(studyYear)
        ) {
          return false
        }

        // NORMAL EXAMS

        if (!e.requires_entitlement) {
          return true
        }

        // OLYMPIAD EXAMS

        return (
          allowedSubjects.includes(
            e.olympiad_subject
          )
        )

      })

    console.log(
      'FILTERED EXAMS:',
      filtered
    )

    return Response.json(filtered)

  } catch (err) {

    console.error(
      'API ERROR:',
      err
    )

    return Response.json(
      { error: err.message },
      { status: 500 }
    )
  }
}
