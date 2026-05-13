'use client'

import { useEffect, useState } from 'react'

export default function Phase3RankingEngine() {

  const [exams, setExams] =
    useState([])

  const [selectedExam, setSelectedExam] =
    useState('')

  const [loading, setLoading] =
    useState(false)

  const [message, setMessage] =
    useState('')

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

      const filtered =

        Array.isArray(data)

          ? data.filter(
              exam =>
                exam.phase ===
                'PHASE_3'
            )

          : []

      setExams(filtered)

    } catch (err) {

      console.error(err)
    }
  }

  /* =====================================================
     GENERATE RANKINGS
  ===================================================== */

  async function generateRankings() {

    if (!selectedExam) {

      alert('Select exam')

      return
    }

    try {

      setLoading(true)

      setMessage('')

      const res =
        await fetch(
          '/api/anse/generate-rankings-phase3',
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

        throw new Error(
          data.error ||
          'Failed'
        )
      }

      setMessage(
        `✅ Rankings generated successfully.
         Champion Count: ${data.totalRankings}`
      )

    } catch (err) {

      console.error(err)

      setMessage(
        `❌ ${err.message}`
      )

    } finally {

      setLoading(false)
    }
  }

  /* =====================================================
     VIEW RESULTS
  ===================================================== */

  function viewResults() {

    if (!selectedExam) {

      alert('Select exam')

      return
    }

    window.location.href =

      `/superadmin/anse/results/phase3?examId=${selectedExam}`
  }

  return (

    <div className="
      p-10
      bg-gray-100
      min-h-screen
    ">

      <div className="
        max-w-3xl
        mx-auto
        bg-white
        rounded-3xl
        shadow-sm
        p-10
      ">

        <h1 className="
          text-4xl
          font-bold
          text-gray-800
          mb-3
        ">

          👑 ANSE Phase 3 Ranking Engine

        </h1>

        <p className="
          text-gray-600
          mb-10
        ">

          Grand Scholar Crown Finale
          National Championship Rankings

        </p>

      <div className="
  flex
  flex-col
  lg:flex-row
  gap-5
  items-stretch
  lg:items-end
  justify-between
  bg-gray-50
  border
  border-gray-200
  rounded-3xl
  p-6
  mb-4
">

  {/* SELECT */}

  <div className="flex-1">

    <label className="
      block
      text-sm
      font-semibold
      mb-3
      text-gray-700
    ">

      Select Phase 3 Exam

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
        rounded-2xl
        px-5
        py-4
        text-lg
        bg-white
        shadow-sm
        focus:outline-none
        focus:ring-2
        focus:ring-yellow-400
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

  {/* BUTTONS */}

  <div className="
    flex
    gap-3
    flex-wrap
  ">

    <button
      onClick={generateRankings}
      disabled={loading}
      className="
        bg-gradient-to-r
        from-yellow-500
        to-orange-500
        hover:from-yellow-600
        hover:to-orange-600
        text-black
        px-6
        py-4
        rounded-2xl
        font-bold
        text-lg
        shadow-lg
      "
    >

      {loading

        ? 'Generating...'

        : '👑 Generate Crown Rankings'
      }

    </button>

    <button
      onClick={viewResults}
      className="
        bg-white
        border
        border-gray-300
        hover:bg-gray-100
        text-gray-800
        px-6
        py-4
        rounded-2xl
        font-bold
        text-lg
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

        {message && (

          <div className="
            mt-8
            p-5
            rounded-2xl
            bg-gray-100
            text-gray-800
            whitespace-pre-line
          ">

            {message}

          </div>

        )}

      </div>

    </div>
  )
}
