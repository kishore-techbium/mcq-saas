export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(req) {

  try {

    const { searchParams } =
      new URL(req.url)

    const level =
      searchParams.get('level') || 'national'

    const state =
      searchParams.get('state')

    const district =
      searchParams.get('district')

    /* ======================================================
       FETCH
    ====================================================== */

    let query = supabase

      .from('anse_school_championships')

      .select('*')

    /* ======================================================
       FILTERS
    ====================================================== */

    if (state) {

      query =
        query.eq('state', state)
    }

    if (district) {

      query =
        query.eq(
          'district',
          district
        )
    }

    /* ======================================================
       SORTING
    ====================================================== */

    if (level === 'district') {

      query =
        query.order(
          'district_rank',
          {
            ascending: true
          }
        )

    } else if (
      level === 'state'
    ) {

      query =
        query.order(
          'state_rank',
          {
            ascending: true
          }
        )

    } else {

      query =
        query.order(
          'national_rank',
          {
            ascending: true
          }
        )
    }

    const {
      data,
      error
    } = await query

    if (error) {
      throw error
    }

    return Response.json({

      championships:
        data || []
    })

  } catch (err) {

    console.error(err)

    return Response.json(
      {
        error:
          err?.message ||
          'Internal server error'
      },
      { status: 500 }
    )
  }
}
