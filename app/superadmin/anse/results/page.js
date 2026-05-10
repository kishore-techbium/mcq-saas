'use client'

import { useEffect, useState } from 'react'

export default function AnseResultsPage() {

  const [exams, setExams] =
    useState([])

  const [selectedExam, setSelectedExam] =
    useState('')

  const [rows, setRows] =
    useState([])

  const [qualifiedOnly, setQualifiedOnly] =
    useState(false)

  const [loading, setLoading] =
    useState(false)

  useEffect(() => {

    loadExams()

  }, [])

  useEffect(() => {

    if (selectedExam) {
      loadRankings()
    }

  }, [selectedExam])

  async function loadExams() {

    try {

      const res = await fetch(
        '/api/anse/exams'
      )

      const data =
        await res.json()

      setExams(
        Array.isArray(data)
          ? data
          : []
      )

    } catch (err) {

      console.error(err)
    }
  }

  async function loadRankings() {

    try {

      setLoading(true)

      const res = await fetch(
        `/api/anse/results?examId=${selectedExam}`
      )

      const data =
        await res.json()

      setRows(
        Array.isArray(data)
          ? data
          : []
      )

    } catch (err) {

      console.error(err)

    } finally {

      setLoading(false)
    }
  }

  const filteredRows =

    qualifiedOnly

      ? rows.filter(
          r => r.qualified_phase2
        )

      : rows

  return (

    <div className="p-10">

      <h1 className="text-4xl font-bold mb-8">
        ANSE Results Dashboard
      </h1>

      {/* FILTERS */}

      <div className="flex gap-4 items-center mb-8 flex-wrap">

        <select
          value={selectedExam}
          onChange={(e) =>
            setSelectedExam(
              e.target.value
            )
          }
          className="
            border
            rounded
            px-4
            py-2
            min-w-[350px]
          "
        >

          <option value="">
            Select Exam
          </option>

          {exams.map(exam => (

            <option
              key={exam.id}
              value={exam.id}
            >

              {exam.title}
              {' - '}
              {exam.exam_category}
              {' - '}
              Class {exam.target_year}

            </option>

          ))}

        </select>

        <label className="flex items-center gap-2">

          <input
            type="checkbox"
            checked={qualifiedOnly}
            onChange={(e) =>
              setQualifiedOnly(
                e.target.checked
              )
            }
          />

          Qualified Only

        </label>

        <div className="text-sm text-gray-600">

          Total Records:
          {' '}
          {filteredRows.length}

        </div>

      </div>

      {/* TABLE */}

      <div className="overflow-auto border rounded-xl">

        <table className="w-full border-collapse text-sm">

          <thead className="bg-gray-100">

            <tr>

              <th className="border p-3">
                National Rank
              </th>

              <th className="border p-3">
                Student
              </th>

              <th className="border p-3">
                School
              </th>

              <th className="border p-3">
                City
              </th>

              <th className="border p-3">
                District
              </th>

              <th className="border p-3">
                State
              </th>

              <th className="border p-3">
                Score
              </th>

              <th className="border p-3">
                Accuracy
              </th>

              <th className="border p-3">
                School Rank
              </th>

              <th className="border p-3">
                District Rank
              </th>

              <th className="border p-3">
                State Rank
              </th>

              <th className="border p-3">
                Qualified
              </th>

            </tr>

          </thead>

          <tbody>

            {loading && (

              <tr>

                <td
                  colSpan="12"
                  className="
                    text-center
                    p-10
                  "
                >

                  Loading...

                </td>

              </tr>

            )}

            {!loading &&
              filteredRows.length === 0 && (

              <tr>

                <td
                  colSpan="12"
                  className="
                    text-center
                    p-10
                    text-gray-500
                  "
                >

                  No rankings found

                </td>

              </tr>

            )}

            {!loading &&
              filteredRows.map(row => (

              <tr
                key={row.id}
                className="
                  hover:bg-gray-50
                "
              >

                <td className="border p-3 text-center font-semibold">
                  {row.national_rank}
                </td>

                <td className="border p-3">
                  {row.student_name}
                </td>

                <td className="border p-3">
                  {row.school_name}
                </td>

                <td className="border p-3">
                  {row.city}
                </td>

                <td className="border p-3">
                  {row.district}
                </td>

                <td className="border p-3">
                  {row.state}
                </td>

                <td className="border p-3 text-center font-semibold">
                  {row.score}
                </td>

                <td className="border p-3 text-center">
                  {row.accuracy}%
                </td>

                <td className="border p-3 text-center">
                  {row.school_rank}
                </td>

                <td className="border p-3 text-center">
                  {row.district_rank}
                </td>

                <td className="border p-3 text-center">
                  {row.state_rank}
                </td>

                <td className="border p-3 text-center">

                  {row.qualified_phase2

                    ? (
                      <span className="text-green-600 font-semibold">
                        ✅ Qualified
                      </span>
                    )

                    : '-'
                  }

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  )
}
