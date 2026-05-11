
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

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

  const [selectedSchool, setSelectedSchool] =
    useState('ALL')

  const [qualifiedOnly, setQualifiedOnly] =
    useState(false)

  const [loading, setLoading] =
    useState(false)

  /* =====================================================
     LOAD EXAMS
  ===================================================== */
useEffect(() => {

  async function init() {

    await loadExams()

    const params =
      new URLSearchParams(
        window.location.search
      )

    const examId =
      params.get('examId')

    if (examId) {

      setSelectedExam(examId)

      loadRankings(examId)
    }
  }

  init()

}, [])

useEffect(() => {

  if (selectedExam) {

    loadRankings(selectedExam)
  }

}, [selectedExam])

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
          'PHASE_1'
      )

    : []

setExams(filtered)

    } catch (err) {

      console.error(err)
    }
  }

  /* =====================================================
     LOAD RANKINGS
  ===================================================== */

async function loadRankings(
  examIdParam
) {

    try {

      setLoading(true)

      const res =
        await fetch(
          `/api/anse/results/phase1?examId=${examIdParam || selectedExam}`
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
     UNIQUE SCHOOLS
  ===================================================== */

  const schools = useMemo(() => {

    return [

      ...new Set(
        rows.map(
          r => r.school_name
        )
      )

    ].sort()

  }, [rows])

  /* =====================================================
     FILTERED ROWS
  ===================================================== */

  const filteredRows = useMemo(() => {

    let data = [...rows]

    if (selectedSchool !== 'ALL') {

      data = data.filter(
        r =>
          r.school_name ===
          selectedSchool
      )
    }

    if (qualifiedOnly) {

      data = data.filter(
        r => r.qualified_phase2
      )
    }

    return data

  }, [
    rows,
    selectedSchool,
    qualifiedOnly
  ])

  /* =====================================================
     PDF DOWNLOAD
  ===================================================== */

  async function downloadPDF() {

    if (filteredRows.length === 0) {
      return
    }

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

    const schoolPart =

      selectedSchool === 'ALL'

        ? 'All_Schools'

        : selectedSchool
            .replace(/\s+/g, '_')

    pdf.save(
      `${schoolPart}_Phase1_Results.pdf`
    )
  }

  /* =====================================================
     SELECTED EXAM
  ===================================================== */

  const selectedExamData =

    exams.find(
      e => e.id === selectedExam
    )

  return (

    <div className="
      p-8
      bg-gray-100
      min-h-screen
    ">

      {/* =====================================================
         HEADER
      ===================================================== */}

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
            font-bold
            text-gray-800
          ">
            ANSE Phase 1 Results
          </h1>

          <p className="
            text-gray-600
            mt-2
          ">
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
              Class {exam.target_year}

            </option>

          ))}

        </select>

        {/* SCHOOL */}

        <select
          value={selectedSchool}
          onChange={(e) =>
            setSelectedSchool(
              e.target.value
            )
          }
          className="
            border
            border-gray-300
            rounded-xl
            px-4
            py-3
            min-w-[250px]
          "
        >

          <option value="ALL">
            All Schools
          </option>

          {schools.map(school => (

            <option
              key={school}
              value={school}
            >

              {school}

            </option>

          ))}

        </select>

        {/* QUALIFIED */}

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
          border-gray-300
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

              <p>
                <b>School:</b>
                {' '}
                {selectedSchool === 'ALL'

                  ? 'All Schools'

                  : selectedSchool
                }
              </p>

            </div>

          )}

        </div>

        {/* =====================================================
           TABLE
        ===================================================== */}

        <div className="overflow-x-auto">

        <table style={styles.table}>
            <thead>

              <tr className="
                bg-gray-100
                text-gray-700
              ">

           <th style={styles.th}>
                  School Rank
                </th>

     <th style={styles.th}>
                  Student
                </th>

            <th style={styles.th}>
                  School
                </th>

       <th style={styles.th}>
                  City
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
                  Qualified
                </th>

              </tr>

            </thead>

            <tbody>

              {loading && (

                <tr>

         <td style={styles.td}>
                    Loading...

                  </td>

                </tr>

              )}

              {!loading &&
                filteredRows.length === 0 && (

                <tr>

      <td style={styles.td}>

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

              <td style={styles.td}>
                    {row.school_rank === 1 && '🥇 '}
                    {row.school_rank === 2 && '🥈 '}
                    {row.school_rank === 3 && '🥉 '}

                    {row.school_rank}

                  </td>

              <td style={styles.td}>

                    {row.student_name}

                  </td>

             <td style={styles.td}>

                    {row.school_name}

                  </td>

          <td style={styles.td}>

                    {row.city}

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
           FOOTER
        ===================================================== */}

        <div className="
          p-6
          border-t
          border-gray-300
          text-sm
          text-gray-600
          bg-gray-50
        ">

          <p>

            <b>Note:</b>
            {' '}
            These are Phase 1 school-level screening
            results used only for qualification into
            Phase 2. Official National Rankings will
            be generated after the centralized
            Phase 2 examination.

          </p>

        </div>

      </div>

    </div>
  )
}
const styles = {

  table: {
    width: '100%',
    borderCollapse: 'collapse',
    tableLayout: 'fixed'
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
