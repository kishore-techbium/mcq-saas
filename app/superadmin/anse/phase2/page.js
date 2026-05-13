'use client'

import { useEffect, useState } from 'react'

export default function Phase2RankingEngine() {

  const [exams, setExams] =
    useState([])

  const [selectedExam, setSelectedExam] =
    useState('')

  const [generating, setGenerating] =
    useState(false)

  const [status, setStatus] =
    useState('')

  const [summary, setSummary] =
    useState(null)

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

      let filtered =

        Array.isArray(data)

          ? data.filter(
              exam =>
                exam.phase ===
                'PHASE_2'
            )

          : []

      setExams(filtered)

    } catch (err) {

      console.error(err)
    }
  }

  /* =====================================================
     GENERATE PHASE 2 RANKINGS
  ===================================================== */

  async function generateRankings() {

    if (!selectedExam) {

      alert('Select exam')

      return
    }

    try {

      setGenerating(true)

      setStatus(
        'Generating Phase 2 rankings...'
      )

      setSummary(null)

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

        setStatus(
          data.error ||
          'Failed to generate rankings'
        )

        return
      }

      setSummary(data)

      setStatus(
        '✅ Phase 2 rankings generated successfully'
      )

    } catch (err) {

      console.error(err)

      setStatus(
        '❌ Something went wrong'
      )

    } finally {

      setGenerating(false)
    }
  }

  /* =====================================================
     OPEN RESULTS PAGE
  ===================================================== */

  function openResults() {

    if (!selectedExam) {
      return
    }

    window.open(

      `/superadmin/anse/results/phase2?examId=${selectedExam}`,

      '_blank'
    )
  }

  return (

    <div className="
      min-h-screen
      bg-gray-100
      p-8
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
          ANSE Phase 2 Ranking Engine
        </h1>

        <p className="
          text-gray-600
          mt-2
        ">
          National Olympiad Merit Ranking System
        </p>

      </div>

      {/* =====================================================
         MAIN CARD
      ===================================================== */}

      <div className="
        bg-white
        rounded-2xl
        shadow-sm
        p-6
        max-w-3xl
      ">

    <div className="
  flex
  flex-col
  lg:flex-row
  gap-5
  items-stretch
  lg:items-center
  justify-between
  bg-gray-50
  border
  border-gray-200
  rounded-2xl
  p-5
">

  {/* EXAM SELECT */}

  <div className="flex-1">

    <label className="
      block
      mb-2
      font-semibold
      text-gray-700
    ">

      Select Exam

    </label>

    <select
      value={selectedExam}
      onChange={(e) =>
        setSelectedExam(
          e.target.value
        )
      }
      className="
        w-full
        border
        border-gray-300
        rounded-xl
        px-4
        py-3
        bg-white
        shadow-sm
        focus:outline-none
        focus:ring-2
        focus:ring-blue-400
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

  </div>

  {/* ACTION BUTTONS */}

  <div className="
    flex
    flex-wrap
    gap-3
    items-end
  ">

    <button
      onClick={generateRankings}
      disabled={
        generating ||
        !selectedExam
      }
      className="
        bg-gradient-to-r
        from-blue-600
        to-indigo-600
        hover:from-blue-700
        hover:to-indigo-700
        disabled:bg-gray-400
        text-white
        px-6
        py-3
        rounded-xl
        font-semibold
        shadow-lg
      "
    >

      {

        generating

          ? 'Generating...'

          : '⚡ Generate Rankings'
      }

    </button>

    <button
      onClick={openResults}
      disabled={!selectedExam}
      className="
        bg-white
        border
        border-gray-300
        hover:bg-gray-100
        disabled:bg-gray-200
        text-gray-800
        px-6
        py-3
        rounded-xl
        font-semibold
        shadow-sm
      "
    >

      📊 View Results

    </button>

  </div>

</div>

        {/* =====================================================
           STATUS
        ===================================================== */}

        {status && (

          <div className="
            mt-6
            p-4
            rounded-xl
            bg-gray-100
            text-gray-700
            font-medium
          ">

            {status}

          </div>

        )}

        {/* =====================================================
           SUMMARY
        ===================================================== */}

        {summary && (

          <div className="
            mt-8
            grid
            grid-cols-1
            md:grid-cols-2
            gap-5
          ">

            {/* TOTAL */}

            <div className="
              bg-blue-50
              border
              border-blue-200
              rounded-2xl
              p-5
            ">

              <p className="
                text-sm
                text-blue-700
                font-medium
              ">
                Total Rankings Generated
              </p>

              <h2 className="
                text-4xl
                font-bold
                text-blue-900
                mt-2
              ">

                {summary.totalRankings || 0}

              </h2>

            </div>

            {/* PHASE 3 */}

            <div className="
              bg-purple-50
              border
              border-purple-200
              rounded-2xl
              p-5
            ">

              <p className="
                text-sm
                text-purple-700
                font-medium
              ">
                Qualified For Phase 3
              </p>

              <h2 className="
                text-4xl
                font-bold
                text-purple-900
                mt-2
              ">

                {summary.phase3Qualified || 0}

              </h2>

            </div>

          </div>

        )}

      </div>

    </div>
  )
}
