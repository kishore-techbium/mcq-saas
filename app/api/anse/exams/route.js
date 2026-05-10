export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET() {

  try {

    const { data, error } =
      await supabase
        .from('exams')
        .select(`
          id,
          title,
          exam_category,
          target_year
        `)
        .order('created_at', {
          ascending: false
        })

    if (error) {
      throw error
    }

    return Response.json(
      data || []
    )

  } catch (err) {

    console.error(err)

    return Response.json(
      {
        error: err.message
      },
      { status: 500 }
    )
  }
}
