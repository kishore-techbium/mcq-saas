'use client'

import { useEffect, useState } from 'react'

export default function AnsePage() {

  const [exams, setExams] = useState([])

  const [loading, setLoading] = useState(false)

  const [selectedExam, setSelectedExam] =
    useState('')

  const [message, setMessage] = useState('')

  useEffect(() => {

    loadExams()

  }, [])

  async function loadExams() {

    try {

      const res = await fetch('/api/superadmin/exams')

      const data = await res.json()

      setExams(data || [])

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

      setMessage('Generating rankings...')

      const res = await fetch(
        '/api/anse/generate-rankings',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            examId: selectedExam
          })
        }
      )

      const data = await res.json()

      if (!res.ok) {

        setMessage(data.error || 'Failed')
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

    <div className="p-8">

      <h1 className="text-3xl font-bold mb-8">
        ANSE Ranking Engine
      </h1>

      <div className="bg-white border rounded-xl p-6 max-w-xl">

        <label className="block mb-3 font-semibold">
          Select Exam
        </label>

        <select
          value={selectedExam}
          onChange={(e) =>
            setSelectedExam(e.target.value)
          }
          className="w-full border rounded-lg p-3"
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
            </option>

          ))}

        </select>

        <button
          onClick={generateRankings}
          disabled={loading}
          className="mt-6 bg-black text-white px-6 py-3 rounded-lg"
        >

          {loading
            ? 'Generating...'
            : 'Generate Rankings'}

        </button>

        {message && (

          <div className="mt-6 text-sm">
            {message}
          </div>

        )}

      </div>

    </div>
  )
}
