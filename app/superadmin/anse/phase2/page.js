'use client'

import { useEffect, useMemo, useState } from 'react'

export default function Phase2Page() {

  const [exams, setExams] =
    useState([])

  const [selectedExam, setSelectedExam] =
    useState('')

  const [loading, setLoading] =
    useState(false)

  const [generating, setGenerating] =
    useState(false)

  const [rows, setRows] =
    useState([])

  const [selectedGrade, setSelectedGrade] =
    useState('ALL')

  const [selectedSubject, setSelectedSubject] =
    useState('ALL')

  /* =====================================================
     LOAD EXAMS
  ===================================================== */

  useEffect(() => {

    loadExams()

  }, [])

  async function loadExams() {

    try {

      const res =
        await fetch('/api/anse/exams')

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

  /* =====================================================
     GENERATE RANKINGS
  ===================================================== */

  async function generateRankings() {

    if (!selectedExam) {
      return
    }

    try {

      setGenerating(true)

      const res =
        await fetch(
          '/api/anse/generate-rankings-phase2',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json'
            },

            body: JSON.stringify({
              examId: selectedExam
            })
          }
        )

      const data =
        await res.json()

      if (!res.ok) {

        alert(
          data.error ||
          'Failed to generate rankings'
        )

        return
      }

      alert(
        'Phase 2 rankings generated successfully'
      )

      loadResults()

    } catch (err) {

      console.error(err)

      alert('Something went wrong')

    } finally {

      setGenerating(false)
    }
  }

  /* =====================================================
     LOAD RESULTS
  ===================================================== */

  async function loadResults() {

    if (!selectedExam) {
      return
    }

    try {

      setLoading(true)

      const res =
        await fetch(
          `/api/anse/results/phase2?examId=${selectedExam}`
        )

      const data =
        await res.json()

      setRows(
        Array.isArray(data.rankings)
          ? data.rankings
          : []
      )

    } catch (err) {

      console.error(err)

    } finally {

      setLoading(false)
    }
  }

  useEffect(() => {

    if (selectedExam) {
      loadResults()
    }

  }, [selectedExam])

  /* =====================================================
     FILTERS
  ===================================================== */

  const grades = useMemo(() => {

    return [

      ...new Set(
        rows.map(
          r => r.grade
        )
      )

    ].sort((a, b) => a - b)

  }, [rows])

  const subjects = useMemo(() => {

    return [

      ...new Set(
        rows.map(
          r => r.olympiad_category
        )
      )

    ].sort()

  }, [rows])

  const filteredRows = useMemo(() => {

    let data = [...rows]

    if (selectedGrade !== 'ALL') {

      data = data.filter(
        r =>
          String(r.grade) ===
          String(selectedGrade)
      )
    }

    if (selectedSubject !== 'ALL') {

      data = data.filter(
        r =>
          r.olympiad_category ===
          selectedSubject
      )
    }

    data.sort((a, b) => {

      if (a.grade !== b.grade) {
        return a.grade - b.grade
      }

      if (
        a.olympiad_category <
        b.olympiad_category
      ) {
        return -1
      }

      if (
        a.olympiad_category >
        b.olympiad_category
      ) {
        return 1
      }

      return (
        a.national_rank -
        b.national_rank
      )
    })

    return data

  }, [
    rows,
    selectedGrade,
    selectedSubject
  ])

  return (

    <div className="
      p-8
      bg-gray-100
      min-h-screen
    ">

      {/* =====================================================
         HEADER
      ===================================================== */}

      <div className="mb-8">

        <h1 className="
          text-4xl
          font-bold
          text-gray-800
        ">
          ANSE Phase 2 Rankings
        </h1>

        <p className="
          text-gray-600
          mt-2
        ">
          National Subject Olympiad Rankings
        </p>

      </div>

      {/* =====================================================
         CONTROLS
      ===================================================== */}

      <div className="
        bg-white
        rounded-2xl
        shadow-sm
        p-5
        mb-8
        flex
        flex-wrap
        gap-4
        items-center
      ">

        {/* EXAM */}

        <select
          value={selectedExam}
          onChange={(e) =>
            setSelectedExam(
              e.target.value
            )
          }
          className="
            border
            border-gray-300
            rounded-xl
            px-4
            py-3
            min-w-[320px]
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
              Grade {exam.target_year}

            </option>

          ))}

        </select>

        {/* GRADE */}

        <select
          value={selectedGrade}
          onChange={(e) =>
            setSelectedGrade(
              e.target.value
            )
          }
          className="
            border
            border-gray-300
            rounded-xl
            px-4
            py-3
          "
        >

          <option value="ALL">
            All Grades
          </option>

          {grades.map(g => (

            <option
              key={g}
              value={g}
            >
              Grade {g}
            </option>

          ))}

        </select>

        {/* SUBJECT */}

        <select
          value={selectedSubject}
          onChange={(e) =>
            setSelectedSubject(
              e.target.value
            )
          }
          className="
            border
            border-gray-300
            rounded-xl
            px-4
            py-3
          "
        >

          <option value="ALL">
            All Subjects
          </option>

          {subjects.map(sub => (

            <option
              key={sub}
              value={sub}
            >
              {sub}
            </option>

          ))}

        </select>

        {/* BUTTON */}

        <button
          onClick={generateRankings}
          disabled={
            !selectedExam ||
            generating
          }
          className="
            bg-blue-600
            hover:bg-blue-700
            disabled:bg-gray-400
            text-white
            px-5
            py-3
            rounded-xl
            font-semibold
          "
        >

          {

            generating

              ? 'Generating...'

              : 'Generate Rankings'
          }

        </button>

        {/* COUNT */}

        <div className="
          ml-auto
          text-sm
          text-gray-600
          font-medium
        ">

          Total Records:
          {' '}
          {filteredRows.length}

        </div>

      </div>

      {/* =====================================================
         TABLE
      ===================================================== */}

      <div className="
        bg-white
        rounded-2xl
        shadow-sm
        overflow-x-auto
      ">

        <table style={styles.table}>

          <thead>

            <tr>

              <th style={styles.th}>
                Grade
              </th>

              <th style={styles.th}>
                Subject
              </th>

              <th style={styles.th}>
                National Rank
              </th>

              <th style={styles.th}>
                Student
              </th>

              <th style={styles.th}>
                School
              </th>

              <th style={styles.th}>
                District
              </th>

              <th style={styles.th}>
                State
              </th>

              <th style={styles.th}>
                Score
              </th>

              <th style={styles.th}>
                Accuracy
              </th>

              <th style={styles.th}>
                State Rank
              </th>

              <th style={styles.th}>
                District Rank
              </th>

            </tr>

          </thead>

          <tbody>

            {loading && (

              <tr>

                <td
                  colSpan="11"
                  style={styles.td}
                >
                  Loading...
                </td>

              </tr>

            )}

            {!loading &&
              filteredRows.length === 0 && (

              <tr>

                <td
                  colSpan="11"
                  style={styles.td}
                >
                  No Results Found
                </td>

              </tr>

            )}

            {!loading &&
              filteredRows.map(row => (

              <tr key={row.id}>

                <td style={styles.td}>
                  {row.grade}
                </td>

                <td style={styles.td}>
                  {row.olympiad_category}
                </td>

                <td style={styles.td}>

                  {row.national_rank === 1
                    && '🥇 '}

                  {row.national_rank === 2
                    && '🥈 '}

                  {row.national_rank === 3
                    && '🥉 '}

                  {row.national_rank}

                </td>

                <td style={styles.td}>
                  {row.student_name}
                </td>

                <td style={styles.td}>
                  {row.school_name}
                </td>

                <td style={styles.td}>
                  {row.district}
                </td>

                <td style={styles.td}>
                  {row.state}
                </td>

                <td style={styles.td}>
                  {row.score}
                </td>

                <td style={styles.td}>
                  {Number(
                    row.accuracy || 0
                  ).toFixed(2)}%
                </td>

                <td style={styles.td}>
                  {row.state_rank}
                </td>

                <td style={styles.td}>
                  {row.district_rank}
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  )
}

const styles = {

  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },

  th: {
    border: '1px solid #ccc',
    padding: '10px',
    background: '#f3f4f6',
    textAlign: 'center',
    fontWeight: 'bold'
  },

  td: {
    border: '1px solid #ccc',
    padding: '10px',
    textAlign: 'center'
  }
}
