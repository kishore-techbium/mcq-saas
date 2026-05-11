'use client'

import { useEffect, useState, useRef } from 'react'

import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export default function AnseResultsPage() {

  const reportRef = useRef()

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

  /* =====================================================
     LOAD EXAMS
  ===================================================== */

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
     LOAD RANKINGS
  ===================================================== */

  async function loadRankings() {

    try {

      setLoading(true)

      const res =
        await fetch(
          `/api/anse/results/phase1?examId=${selectedExam}`
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

  /* =====================================================
     PDF DOWNLOAD
  ===================================================== */

  async function downloadPDF() {

    const canvas =
      await html2canvas(
        reportRef.current,
        {
          scale: 2
        }
      )

    const imgData =
      canvas.toDataURL('image/png')

    const pdf =
      new jsPDF(
        'p',
        'mm',
        'a4'
      )

    const pdfWidth = 210
    const pdfHeight =
      (canvas.height * pdfWidth)
      / canvas.width

    pdf.addImage(
      imgData,
      'PNG',
      0,
      0,
      pdfWidth,
      pdfHeight
    )

    pdf.save(
      'ANSE_Phase1_Results.pdf'
    )
  }

  /* =====================================================
     FILTERED ROWS
  ===================================================== */

  const filteredRows =

    qualifiedOnly

      ? rows.filter(
          r => r.qualified_phase2
        )

      : rows

  /* =====================================================
     SELECTED EXAM
  ===================================================== */

  const selectedExamData =

    exams.find(
      e => e.id === selectedExam
    )

  return (

    <div className="p-8 bg-gray-100 min-h-screen">

      {/* =====================================================
         HEADER
      ===================================================== */}

      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">

        <div>

          <h1 className="text-4xl font-bold text-gray-800">
            ANSE Phase 1 Results
          </h1>

          <p className="text-gray-600 mt-2">
            School Level Screening Results
          </p>

        </div>

        <button
          onClick={downloadPDF}
          className="
            bg-blue-600
            hover:bg-blue-700
            text-white
            px-5
            py-3
            rounded-xl
            font-semibold
            shadow
          "
        >
          Download PDF
        </button>

      </div>

      {/* =====================================================
         FILTERS
      ===================================================== */}

      <div className="
        bg-white
        p-5
        rounded-2xl
        shadow-sm
        mb-8
        flex
        flex-wrap
        gap-4
        items-center
      ">

        <select
          value={selectedExam}
          onChange={(e) =>
            setSelectedExam(
              e.target.value
            )
          }
          className="
            border
            rounded-xl
            px-4
            py-3
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

        <label className="
          flex
          items-center
          gap-2
          font-medium
        ">

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
         REPORT
      ===================================================== */}

      <div
        ref={reportRef}
        className="
          bg-white
          rounded-2xl
          shadow-sm
          overflow-hidden
        "
      >

        {/* =====================================================
           REPORT HEADER
        ===================================================== */}

        <div className="
          border-b
          p-8
          text-center
        ">

          <h2 className="
            text-3xl
            font-bold
            text-gray-800
          ">

            AURELIUS NATIONAL
            SCHOLARSHIP EXAM

          </h2>

          <p className="
            text-lg
            mt-2
            text-gray-600
          ">

            Phase 1 Screening Result Sheet

          </p>

          {selectedExamData && (

            <div className="
              mt-5
              text-sm
              text-gray-700
              space-y-1
            ">

              <p>
                <b>Exam:</b>
                {' '}
                {selectedExamData.title}
              </p>

              <p>
                <b>Category:</b>
                {' '}
                {selectedExamData.exam_category}
              </p>

              <p>
                <b>Class:</b>
                {' '}
                {selectedExamData.target_year}
              </p>

            </div>

          )}

        </div>

        {/* =====================================================
           TABLE
        ===================================================== */}

        <div className="overflow-x-auto">

          <table className="
            w-full
            border-collapse
            text-sm
          ">

            <thead>

              <tr className="
                bg-gray-100
                text-gray-700
              ">

                <th className="border p-4">
                  School Rank
                </th>

                <th className="border p-4">
                  Student
                </th>

                <th className="border p-4">
                  School
                </th>

                <th className="border p-4">
                  City
                </th>

                <th className="border p-4">
                  District
                </th>

                <th className="border p-4">
                  State
                </th>

                <th className="border p-4">
                  Score
                </th>

                <th className="border p-4">
                  Accuracy
                </th>

                <th className="border p-4">
                  Qualified
                </th>

              </tr>

            </thead>

            <tbody>

              {loading && (

                <tr>

                  <td
                    colSpan="9"
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
                    colSpan="9"
                    className="
                      text-center
                      p-10
                      text-gray-500
                    "
                  >

                    No results found

                  </td>

                </tr>

              )}

              {!loading &&
                filteredRows.map((row, idx) => (

                <tr
                  key={row.id}
                  className={

                    idx % 2 === 0

                      ? 'bg-white'

                      : 'bg-gray-50'
                  }
                >

                  <td className="
                    border
                    p-4
                    text-center
                    font-bold
                  ">

                    {row.school_rank}

                  </td>

                  <td className="
                    border
                    p-4
                    font-medium
                  ">

                    {row.student_name}

                  </td>

                  <td className="border p-4">

                    {row.school_name}

                  </td>

                  <td className="
                    border
                    p-4
                    text-center
                  ">

                    {row.city}

                  </td>

                  <td className="
                    border
                    p-4
                    text-center
                  ">

                    {row.district}

                  </td>

                  <td className="
                    border
                    p-4
                    text-center
                  ">

                    {row.state}

                  </td>

                  <td className="
                    border
                    p-4
                    text-center
                    font-bold
                    text-blue-700
                  ">

                    {row.score}

                  </td>

                  <td className="
                    border
                    p-4
                    text-center
                    font-semibold
                  ">

                    {Number(
                      row.accuracy || 0
                    ).toFixed(2)}%

                  </td>

                  <td className="
                    border
                    p-4
                    text-center
                  ">

                    {row.qualified_phase2

                      ? (
                        <span className="
                          text-green-600
                          font-bold
                        ">
                          ✅ Qualified
                        </span>
                      )

                      : (
                        <span className="
                          text-gray-400
                        ">
                          -
                        </span>
                      )
                    }

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

        {/* =====================================================
           FOOTER NOTE
        ===================================================== */}

        <div className="
          p-6
          border-t
          text-sm
          text-gray-600
          bg-gray-50
        ">

          <p>

            <b>Note:</b>
            {' '}
            These are Phase 1 school-level screening results
            used only for qualification into Phase 2.
            Official National Rankings will be generated
            after the centralized Phase 2 examination.

          </p>

        </div>

      </div>

    </div>
  )
}
