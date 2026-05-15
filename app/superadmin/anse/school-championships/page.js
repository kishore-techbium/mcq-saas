'use client'

import {
  useEffect,
  useState
} from 'react'

export default function SchoolChampionshipsPage() {

  const [loading, setLoading] =
    useState(false)

  const [message, setMessage] =
    useState('')

  const [rows, setRows] =
    useState([])

  const [level, setLevel] =
    useState('national')

  /* ======================================================
     LOAD DATA
  ====================================================== */

  useEffect(() => {

    loadData()

  }, [level])

  async function loadData() {

    try {

      const res =
        await fetch(

          `/api/anse/school-championships?level=${level}`

        )

      const data =
        await res.json()

      setRows(
        data.championships || []
      )

    } catch (err) {

      console.error(err)
    }
  }

  /* ======================================================
     GENERATE CHAMPIONSHIPS
  ====================================================== */

  async function generateChampionships() {

    try {

      setLoading(true)

      setMessage('')

      const res =
        await fetch(
          '/api/anse/generate-school-championships',
          {
            method: 'POST'
          }
        )

      const data =
        await res.json()

      if (!res.ok) {

        throw new Error(
          data.error ||
          'Failed'
        )
      }

      setMessage(

        `✅ School championships generated successfully.
        
Total Schools: ${data.totalSchools}

National Champion:
${data.nationalChampion}`

      )

      loadData()

    } catch (err) {

      console.error(err)

      setMessage(
        `❌ ${err.message}`
      )

    } finally {

      setLoading(false)
    }
  }

  return (

    <div className="
      p-8
      min-h-screen
      bg-gray-100
    ">

      <div className="
        max-w-7xl
        mx-auto
      ">

        {/* ======================================================
           HEADER
        ====================================================== */}

        <div className="
          flex
          justify-between
          items-center
          mb-8
          flex-wrap
          gap-4
        ">

          <div>

            <h1 className="
              text-4xl
              font-black
              text-gray-800
            ">

              🏆 School Championships

            </h1>

            <p className="
              text-gray-600
              mt-2
            ">

              District, State & National Recognition System

            </p>

          </div>

          <button
            onClick={generateChampionships}
            disabled={loading}
            className="
              bg-black
              hover:bg-gray-800
              text-white
              px-6
              py-4
              rounded-2xl
              font-bold
            "
          >

            {loading

              ? 'Generating...'

              : 'Generate Championships'
            }

          </button>

        </div>

        {/* ======================================================
           FILTER
        ====================================================== */}

        <div className="
          bg-white
          rounded-3xl
          p-5
          shadow-sm
          mb-6
        ">

          <select
            value={level}
            onChange={(e) =>
              setLevel(
                e.target.value
              )
            }
            className="
              border
              border-gray-300
              rounded-2xl
              px-5
              py-3
              text-lg
            "
          >

            <option value="national">
              National Rankings
            </option>

            <option value="state">
              State Rankings
            </option>

            <option value="district">
              District Rankings
            </option>

          </select>

        </div>

        {/* ======================================================
           STATUS
        ====================================================== */}

        {message && (

          <div className="
            bg-white
            rounded-3xl
            p-6
            shadow-sm
            mb-6
            whitespace-pre-line
          ">

            {message}

          </div>

        )}

        {/* ======================================================
           TABLE
        ====================================================== */}

        <div className="
          bg-white
          rounded-3xl
          shadow-sm
          overflow-x-auto
        ">

          <table className="
            w-full
            border-collapse
          ">

            <thead>

              <tr className="
                bg-gray-100
              ">

                <th className={thStyle}>
                  Rank
                </th>

                <th className={thStyle}>
                  School
                </th>

                <th className={thStyle}>
                  District
                </th>

                <th className={thStyle}>
                  State
                </th>

                <th className={thStyle}>
                  National Points
                </th>

                <th className={thStyle}>
                  State Points
                </th>

                <th className={thStyle}>
                  District Points
                </th>

                <th className={thStyle}>
                  Total Points
                </th>

                <th className={thStyle}>
                  Recognition
                </th>

              </tr>

            </thead>

            <tbody>

              {rows.map((row, idx) => {

                const rank =

                  level === 'district'

                    ? row.district_rank

                    : level === 'state'

                      ? row.state_rank

                      : row.national_rank

                const title =

                  level === 'district'

                    ? row.district_title

                    : level === 'state'

                      ? row.state_title

                      : row.national_title

                return (

                  <tr
                    key={idx}
                    className="
                      border-b
                      border-gray-200
                    "
                  >

                    <td className={tdStyle}>

                      {rank === 1 && '👑 '}
                      {rank === 2 && '🥈 '}
                      {rank === 3 && '🥉 '}

                      {rank}

                    </td>

<td className={tdStyle}>

  <a
    href={`/superadmin/anse/schools/${row.school_id}`}
    className="
      text-blue-600
      font-bold
      hover:underline
    "
  >

    {row.school_name}

  </a>

</td>

                    <td className={tdStyle}>
                      {row.district}
                    </td>

                    <td className={tdStyle}>
                      {row.state}
                    </td>

                    <td className={tdStyle}>
                      {row.national_points}
                    </td>

                    <td className={tdStyle}>
                      {row.state_points}
                    </td>

                    <td className={tdStyle}>
                      {row.district_points}
                    </td>

                    <td className={tdStyle}>

                      <span className="
                        font-black
                        text-lg
                      ">

                        {row.total_points}

                      </span>

                    </td>

                    <td className={tdStyle}>
                      {title || '-'}
                    </td>

                  </tr>

                )
              })}

              {rows.length === 0 && (

                <tr>

                  <td
                    className={tdStyle}
                    colSpan={9}
                  >

                    No championship data found

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  )
}

const thStyle = `
  text-left
  p-4
  font-bold
  text-gray-700
  border-b
  border-gray-200
`

const tdStyle = `
  p-4
  text-gray-700
`
