'use client'

import { useEffect, useState } from 'react'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function AnsePage() {

  const [exams, setExams] =
    useState([])

  const [selectedExam, setSelectedExam] =
    useState('')

  const [loading, setLoading] =
    useState(false)

  const [message, setMessage] =
    useState('')

  useEffect(() => {

    loadExams()

  }, [])

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

  async function generateRankings() {

    if (!selectedExam) {

      alert('Select exam')
      return
    }

    try {

      setLoading(true)

      setMessage(
        'Generating rankings...'
      )

      const res = await fetch(
        '/api/anse/generate-rankings',
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

        setMessage(
          data.error || 'Failed'
        )

        return
      }

      setMessage(
        `✅ Rankings generated successfully (${data.totalRankings})`
      )

    } catch (err) {

      console.error(err)

      setMessage(err.message)

    } finally {

      setLoading(false)
    }
  }

  return (

    <div className="p-10">

      <h1 className="text-4xl font-bold mb-10">
        ANSE Ranking Engine
      </h1>

      <div className="flex gap-4 items-center">

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
              Class {exam.target_year}

            </option>

          ))}

        </select>

        <button
          onClick={generateRankings}
          disabled={loading}
          className="
            bg-black
            text-white
            px-6
            py-2
            rounded
          "
        >

          {loading
            ? 'Generating...'
            : 'Generate Rankings'}

        </button>

      </div>

      {message && (

        <div className="mt-6">

          {message}

        </div>

      )}

    </div>
  )
}
