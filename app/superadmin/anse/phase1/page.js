'use client'

import { useEffect, useState } from 'react'

export default function Phase1RankingEngine() {

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
     GENERATE PHASE 1 RANKINGS
  ===================================================== */

  async function generateRankings() {

    if (!selectedExam) {

      alert('Select exam')

      return
    }

    try {

      setGenerating(true)

      setStatus(
        'Generating rankings...'
      )

      setSummary(null)

      const res =
        await fetch(
          '/api/anse/generate-rankings-phase1',
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
        '✅ Phase 1 rankings generated successfully'
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

      `/superadmin/anse/results/phase1?examId=${selectedExam}`,

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
          ANSE Phase 1 Ranking Engine
        </h1>

        <p className="
          text-gray-600
          mt-2
        ">
          School-Level Screening Qualification System
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

        {/* =====================================================
           EXAM DROPDOWN
        ===================================================== */}

        <div className="mb-6">

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

        {/* =====================================================
           BUTTONS
        ===================================================== */}

        <div className="
          flex
          flex-wrap
          gap-4
        ">

          <button
            onClick={generateRankings}
            disabled={
              generating ||
              !selectedExam
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

          <button
            onClick={openResults}
            disabled={!selectedExam}
            className="
              bg-green-600
              hover:bg-green-700
              disabled:bg-gray-400
              text-white
              px-5
              py-3
              rounded-xl
              font-semibold
            "
          >

            View Results

          </button>

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

            {/* QUALIFIED */}

            <div className="
              bg-green-50
              border
              border-green-200
              rounded-2xl
              p-5
            ">

              <p className="
                text-sm
                text-green-700
                font-medium
              ">
                Qualified For Phase 2
              </p>

              <h2 className="
                text-4xl
                font-bold
                text-green-900
                mt-2
              ">

                {summary.qualifiedForPhase2 || 0}

              </h2>

            </div>

          </div>

        )}

      </div>

    </div>
  )
}
