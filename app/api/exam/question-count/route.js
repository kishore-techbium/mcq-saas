import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {
  try {
    const { examIds } = await req.json()

    if (!examIds || examIds.length === 0) {
      return Response.json({})
    }

    const { data, error } = await supabase
      .from('exam_questions')
      .select('exam_id')
      .in('exam_id', examIds)

    if (error) throw error

    const countMap = {}

    data.forEach(row => {
      countMap[row.exam_id] =
        (countMap[row.exam_id] || 0) + 1
    })

    return Response.json(countMap)

  } catch (err) {
    console.error(err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}