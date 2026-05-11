'use client'

import {
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'

import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export default function Phase3ResultsPage() {

  const reportRef = useRef()

  const [exams, setExams] =
    useState([])

  const [selectedExam, setSelectedExam] =
    useState('')

  const [rows, setRows] =
    useState([])

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
                'PHASE_3'
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

          `/api/anse/results/phase3?examId=${examIdParam || selectedExam}`

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

    if (rows.length === 0) {
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

    pdf.save(
      `ANSE_Phase3_Crown_Results.pdf`
    )
  }

  /* =====================================================
     SELECTED EXAM
  ===================================================== */

  const selectedExamData =

    useMemo(() => {

      return exams.find(
        e => e.id === selectedExam
      )

    }, [exams, selectedExam])

  /* =====================================================
     CHAMPION
  ===================================================== */

  const champion =

    rows.find(
      r => r.national_rank === 1
    )

  return (

    <div className="
      p-8
      bg-yellow-50
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
            text-5xl
            font-black
            text-yellow-700
          ">

            👑 Phase 3 Crown Results

          </h1>

          <p className="
            text-gray-700
            mt-2
            text-lg
          ">

            Grand Scholar Crown Finale

          </p>

        </div>

        <button
          onClick={downloadPDF}
          className="
            bg-black
            hover:bg-gray-800
            text-white
            px-6
            py-4
            rounded-2xl
            font-semibold
          "
        >

          Download PDF

        </button>

      </div>

      {/* =====================================================
         EXAM SELECT
      ===================================================== */}

      <div className="
        bg-white
        p-5
        rounded-3xl
        shadow-sm
        mb-8
      ">

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
          "
        >

          <option value="">
            Select Phase 3 Exam
          </option>

          {exams.map(exam => (

            <option
              key={exam.id}
              value={exam.id}
            >

              {exam.title}
              {' - '}
              Grade {exam.target_year}

            </option>

          ))}

        </select>

      </div>

      {/* =====================================================
         REPORT
      ===================================================== */}

      <div
        ref={reportRef}
        className="
          bg-white
          rounded-3xl
          shadow-sm
          overflow-hidden
        "
      >

        {/* =====================================================
           CHAMPION CARD
        ===================================================== */}

        {champion && (

          <div className="
            bg-gradient-to-r
            from-yellow-400
            to-yellow-600
            text-black
            p-10
            text-center
          ">

            <div className="
              text-7xl
              mb-4
            ">
              👑
            </div>

            <h2 className="
              text-5xl
              font-black
              mb-4
            ">

              GRAND SCHOLAR CHAMPION

            </h2>

            <p className="
              text-3xl
              font-bold
            ">

              {champion.student_name}

            </p>

            <p className="
              text-xl
              mt-3
            ">

              {champion.school_name}
              {' • '}
              {champion.state}

            </p>

            <div className="
              mt-6
              text-2xl
              font-black
            ">

              🏆 ₹1,00,000 GRAND SCHOLAR AWARD

            </div>

          </div>

        )}

        {/* =====================================================
           EXAM INFO
        ===================================================== */}

        {selectedExamData && (

          <div className="
            border-b
            border-gray-200
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
              text-gray-600
              mt-3
            ">

              Grand Scholar Crown Finale

            </p>

            <div className="
              mt-6
              text-sm
              text-gray-700
              space-y-2
            ">

              <p>

                <b>Exam:</b>
                {' '}
                {selectedExamData.title}

              </p>

              <p>

                <b>Class:</b>
                {' '}
                {selectedExamData.target_year}

              </p>

            </div>

          </div>

        )}

        {/* =====================================================
           TABLE
        ===================================================== */}

        <div className="overflow-x-auto">

          <table style={styles.table}>

            <thead>

              <tr>

                <th style={styles.th}>
                  Crown Rank
                </th>

                <th style={styles.th}>
                  Student
                </th>

                <th style={styles.th}>
                  School
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
                  Crown Title
                </th>

                <th style={styles.th}>
                  Award
                </th>

              </tr>

            </thead>

            <tbody>

              {loading && (

                <tr>

                  <td
                    style={styles.td}
                    colSpan={8}
                  >

                    Loading...

                  </td>

                </tr>

              )}

              {!loading &&
                rows.length === 0 && (

                <tr>

                  <td
                    style={styles.td}
                    colSpan={8}
                  >

                    No results found

                  </td>

                </tr>

              )}

              {!loading &&
                rows.map((row, idx) => (

                <tr
                  key={idx}
                >

                  <td style={styles.td}>

                    {row.national_rank === 1 && '👑 '}
                    {row.national_rank === 2 && '🥈 '}
                    {row.national_rank === 3 && '🥉 '}

                    {row.national_rank}

                  </td>

                  <td style={styles.td}>
                    {row.student_name}
                  </td>

                  <td style={styles.td}>
                    {row.school_name}
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

                    {row.crown_title || '-'}

                  </td>

                  <td style={styles.td}>

                    {row.crown_award || '-'}

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
            These are the official Grand Scholar
            Crown Finale national rankings of ANSE.

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
    padding: '12px',
    background: '#fef3c7',
    textAlign: 'center',
    fontWeight: 'bold'
  },

  td: {
    border: '1px solid #ccc',
    padding: '12px',
    textAlign: 'center'
  }
}
