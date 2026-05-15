'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import * as XLSX from 'xlsx'

export default function SuperAdminBulkUpload() {

  const [schools, setSchools] =
    useState([])

  const [selectedSchool, setSelectedSchool] =
    useState('')

  const [file, setFile] =
    useState(null)

  const [previewRows, setPreviewRows] =
    useState([])

  const [loading, setLoading] =
    useState(false)

  useEffect(() => {
    loadSchools()
  }, [])

  async function loadSchools() {

    const { data } =
      await supabase

        .from('schools')

        .select('id,name,city')

        .order('name')

    setSchools(data || [])
  }

  async function handleFileChange(e) {

    const selectedFile =
      e.target.files[0]

    if (!selectedFile) return

    setFile(selectedFile)

    let parsed = []

    /* ================= CSV ================= */

    if (
      selectedFile.name.endsWith('.csv')
    ) {

      const text =
        await selectedFile.text()

      const rows =
        text
          .split('\n')
          .slice(1)
          .filter(r => r.trim())

      parsed =
        rows.map(row => {

          const cols =
            row.split(',')

          return {

            first_name: cols[1],
            last_name: cols[2],
            login_id: cols[3],
            study_year: cols[8],
            olympiad_subjects: cols[9]
          }
        })
    }

    /* ================= XLSX ================= */

    else if (

      selectedFile.name.endsWith('.xlsx')

    ) {

      const data =
        await selectedFile.arrayBuffer()

      const workbook =
        XLSX.read(data)

      const sheetName =
        workbook.SheetNames[0]

      const worksheet =
        workbook.Sheets[sheetName]

      const json =
        XLSX.utils.sheet_to_json(
          worksheet,
          { header: 1 }
        )

      parsed =
        json
          .slice(1)
          .filter(r => r.length > 0)
          .map(row => ({

            first_name: row[1],

            last_name: row[2],

            login_id: row[3],

            study_year: row[8],

            olympiad_subjects: row[9]
          }))
    }

    setPreviewRows(parsed)
  }

  async function handleUpload() {

    if (!selectedSchool) {

      alert('Please select school')

      return
    }

    if (!file) {

      alert('Please select file')

      return
    }

    setLoading(true)

    try {

      const { data } =
        await supabase.auth.getSession()

      const formData =
        new FormData()

      formData.append('file', file)

      formData.append(
        'school_id',
        selectedSchool
      )

      const res =
        await fetch(
          '/api/admin/bulk-students',
          {
            method: 'POST',

            headers: {
              Authorization:
                `Bearer ${data.session.access_token}`
            },

            body: formData
          }
        )

      const result =
        await res.json()

      if (!res.ok) {

        alert(
          result.error ||
          'Upload failed'
        )

        return
      }

      alert(
        `✅ Inserted: ${result.inserted}\n❌ Failed: ${result.failed}`
      )

      setPreviewRows([])

      setFile(null)

    } catch (err) {

      console.error(err)

      alert('Upload failed')
    }

    setLoading(false)
  }

  return (

    <div style={styles.page}>

      <div style={styles.card}>

        <h1 style={styles.title}>
          🏫 Superadmin Bulk Upload
        </h1>

        <p style={styles.subtext}>
          Upload students for any school using CSV or Excel.
        </p>

        {/* SCHOOL */}

        <select
          value={selectedSchool}
          onChange={(e) =>
            setSelectedSchool(
              e.target.value
            )
          }
          style={styles.select}
        >

          <option value="">
            Select School
          </option>

          {schools.map(s => (

            <option
              key={s.id}
              value={s.id}
            >
              {s.name} - {s.city}
            </option>

          ))}

        </select>

        {/* FILE */}

        <input
          type="file"
          accept=".csv,.xlsx"
          onChange={handleFileChange}
          style={styles.file}
        />

        {/* PREVIEW */}

        {previewRows.length > 0 && (

          <div style={styles.previewBox}>

            <div style={styles.previewHeader}>
              Total Students:
              {' '}
              {previewRows.length}
            </div>

            <table style={styles.table}>

              <thead>

                <tr>

                  <th style={styles.th}>
                    Name
                  </th>

                  <th style={styles.th}>
                    Grade
                  </th>

                  <th style={styles.th}>
                    Login ID
                  </th>

                  <th style={styles.th}>
                    Subjects
                  </th>

                </tr>

              </thead>

              <tbody>

                {previewRows.map((r, i) => (

                  <tr key={i}>

                    <td style={styles.td}>
                      {r.first_name}
                      {' '}
                      {r.last_name}
                    </td>

                    <td style={styles.td}>
                      {r.study_year}
                    </td>

                    <td style={styles.td}>
                      {r.login_id}
                    </td>

                    <td style={styles.td}>
                      {r.olympiad_subjects}
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

        <button
          onClick={handleUpload}
          disabled={loading}
          style={styles.uploadBtn}
        >
          {loading
            ? 'Uploading...'
            : 'Upload Students'}
        </button>

      </div>

    </div>
  )
}

const styles = {

  page: {

    minHeight: '100vh',

    background:
      'linear-gradient(135deg,#f8fafc,#eef2ff)',

    padding: 40
  },

  card: {

    background: '#fff',

    borderRadius: 20,

    padding: 30,

    maxWidth: 1200,

    margin: '0 auto',

    boxShadow:
      '0 20px 40px rgba(0,0,0,0.08)'
  },

  title: {

    fontSize: 32,

    marginBottom: 10
  },

  subtext: {

    color: '#64748b',

    marginBottom: 30
  },

  select: {

    width: '100%',

    padding: 14,

    borderRadius: 10,

    border: '1px solid #cbd5e1',

    marginBottom: 20,

    fontSize: 15
  },

  file: {

    marginBottom: 25
  },

  previewBox: {

    border: '1px solid #e2e8f0',

    borderRadius: 12,

    overflow: 'auto',

    maxHeight: 450,

    marginBottom: 25
  },

  previewHeader: {

    padding: 14,

    background: '#f8fafc',

    fontWeight: 700
  },

  table: {

    width: '100%',

    borderCollapse: 'collapse'
  },

  th: {

    textAlign: 'left',

    padding: 14,

    background: '#f1f5f9',

    borderBottom: '1px solid #e2e8f0'
  },

  td: {

    padding: 14,

    borderBottom: '1px solid #f1f5f9'
  },

  uploadBtn: {

    padding: '14px 22px',

    background: '#2563eb',

    color: '#fff',

    border: 'none',

    borderRadius: 12,

    fontWeight: 700,

    cursor: 'pointer'
  }
}
