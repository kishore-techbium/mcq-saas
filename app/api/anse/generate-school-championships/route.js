export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/* ======================================================
   COMPETITION RANKING
====================================================== */

function assignCompetitionRanks(rows, key) {

  let currentRank = 1

  for (let i = 0; i < rows.length; i++) {

    if (i > 0) {

      const prev = rows[i - 1]
      const curr = rows[i]

      if (
        Number(prev.total_points)
        !==
        Number(curr.total_points)
      ) {

        currentRank = i + 1
      }
    }

    rows[i][key] = currentRank
  }

  return rows
}

/* ======================================================
   POINT FUNCTIONS
====================================================== */

function getNationalPoints(rank) {

  switch (Number(rank)) {

    case 1:
      return 10

    case 2:
      return 8

    case 3:
      return 6

    case 4:
      return 4

    case 5:
      return 2

    default:
      return 0
  }
}

function getStatePoints(rank) {

  switch (Number(rank)) {

    case 1:
      return 6

    case 2:
      return 4

    case 3:
      return 2

    default:
      return 0
  }
}

function getDistrictPoints(rank) {

  switch (Number(rank)) {

    case 1:
      return 4

    case 2:
      return 2

    case 3:
      return 1

    default:
      return 0
  }
}

export async function POST() {

  try {

    /* ======================================================
       DELETE OLD DATA
    ====================================================== */

    await supabase
      .from('anse_school_championships')
      .delete()
      .neq(
        'id',
        '00000000-0000-0000-0000-000000000000'
      )

    /* ======================================================
       FETCH PHASE 2 RANKINGS
    ====================================================== */

    const {
      data: rankings,
      error
    } = await supabase

      .from('anse_exam_rankings')

      .select('*')

      .eq('phase', 'PHASE_2')

    if (error) {
      throw error
    }

    if (!rankings?.length) {

      return Response.json({

        success: false,

        message:
          'No phase 2 rankings found'
      })
    }

    /* ======================================================
       FETCH SCHOOLS
    ====================================================== */

    const schoolIds = [

      ...new Set(

        rankings
          .map(r => r.school_id)
          .filter(Boolean)

      )

    ]

    const {
      data: schoolRows
    } = await supabase

      .from('schools')

      .select('*')

      .in('id', schoolIds)

    const schoolsLookup = {}

    ;(schoolRows || []).forEach(s => {

      schoolsLookup[s.id] = s
    })

    /* ======================================================
       SCHOOL AGGREGATION
    ====================================================== */

    const schoolMap = {}

    for (const row of rankings) {

      if (!row.school_id) {
        continue
      }

      const school =
        schoolsLookup[row.school_id]

      if (!schoolMap[row.school_id]) {

        schoolMap[row.school_id] = {

          school_id:
            row.school_id,

          school_name:
            school?.name || '',

          city:
            school?.city || '',

          district:
            school?.district || '',

          state:
            school?.state || '',

          academic_year:
            2027,

          national_points: 0,

          state_points: 0,

          district_points: 0,

          total_points: 0,

          national_rank: null,

          state_rank: null,

          district_rank: null,

          national_title: null,

          state_title: null,

          district_title: null
        }
      }

      /* ======================================================
         ADD NATIONAL POINTS
      ====================================================== */

      schoolMap[row.school_id]
        .national_points +=

          getNationalPoints(
            row.national_rank
          )

      /* ======================================================
         ADD STATE POINTS
      ====================================================== */

      schoolMap[row.school_id]
        .state_points +=

          getStatePoints(
            row.state_rank
          )

      /* ======================================================
         ADD DISTRICT POINTS
      ====================================================== */

      schoolMap[row.school_id]
        .district_points +=

          getDistrictPoints(
            row.district_rank
          )
    }

    /* ======================================================
       FINALIZE TOTAL POINTS
    ====================================================== */

    const schoolsData =
      Object.values(schoolMap)

    schoolsData.forEach(s => {

      s.total_points =

        Number(s.national_points || 0)

        +

        Number(s.state_points || 0)

        +

        Number(s.district_points || 0)
    })

    /* ======================================================
       NATIONAL RANKINGS
    ====================================================== */

    schoolsData.sort((a, b) =>

      b.total_points -
      a.total_points
    )

    assignCompetitionRanks(
      schoolsData,
      'national_rank'
    )

    /* ======================================================
       NATIONAL TITLES
    ====================================================== */

    schoolsData.forEach(s => {

      if (s.national_rank === 1) {

        s.national_title =
          '👑 National Champion School'

      } else if (
        s.national_rank <= 5
      ) {

        s.national_title =
          '🥇 National Excellence School'

      } else if (
        s.national_rank <= 20
      ) {

        s.national_title =
          '🚀 National Emerging School'
      }
    })

    /* ======================================================
       STATE RANKINGS
    ====================================================== */

    const stateGroups = {}

    schoolsData.forEach(s => {

      if (!stateGroups[s.state]) {

        stateGroups[s.state] = []
      }

      stateGroups[s.state].push(s)
    })

    Object.values(stateGroups)
      .forEach(group => {

        group.sort((a, b) =>

          b.total_points -
          a.total_points
        )

        assignCompetitionRanks(
          group,
          'state_rank'
        )

        group.forEach(s => {

          if (s.state_rank === 1) {

            s.state_title =
              '🏆 State Champion School'

          } else if (
            s.state_rank <= 5
          ) {

            s.state_title =
              '🎖 State Academic Excellence School'

          } else if (
            s.state_rank <= 15
          ) {

            s.state_title =
              '🌟 State Emerging Talent School'
          }
        })
      })

    /* ======================================================
       DISTRICT RANKINGS
    ====================================================== */

    const districtGroups = {}

    schoolsData.forEach(s => {

      const key =
        `${s.state}_${s.district}`

      if (!districtGroups[key]) {

        districtGroups[key] = []
      }

      districtGroups[key].push(s)
    })

    Object.values(districtGroups)
      .forEach(group => {

        group.sort((a, b) =>

          b.total_points -
          a.total_points
        )

        assignCompetitionRanks(
          group,
          'district_rank'
        )

        group.forEach(s => {

          if (s.district_rank === 1) {

            s.district_title =
              '🥇 District Champion School'

          } else if (
            s.district_rank <= 5
          ) {

            s.district_title =
              '🎓 District Academic Excellence School'

          } else if (
            s.district_rank <= 15
          ) {

            s.district_title =
              '🌠 District Emerging Talent School'
          }
        })
      })

    /* ======================================================
       INSERT
    ====================================================== */

    const {
      error: insertError
    } = await supabase

      .from('anse_school_championships')

      .insert(schoolsData)

    if (insertError) {

      console.error(insertError)

      return Response.json(
        {
          error:
            insertError.message
        },
        { status: 500 }
      )
    }

    return Response.json({

      success: true,

      totalSchools:
        schoolsData.length,

      nationalChampion:

        schoolsData.find(
          s =>
            s.national_rank === 1
        )?.school_name || null
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
