'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../../lib/supabase'
import * as XLSX from 'xlsx'
export default function BulkUpload() {
  const [file, setFile] = useState(null)
  
  const [loading, setLoading] = useState(false)
const [previewRows, setPreviewRows] =
  useState([])
  /* ================= FETCH ADMIN ================= */

useEffect(() => {
  
}, [])

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

        const [

          email,
          first_name,
          last_name,
          login_id,
          password,
          exam_preference,
          phone,
          address,
          study_year,
          olympiad_subjects

        ] = row.split(',')

        return {

          email,
          first_name,
          last_name,
          login_id,
          password,
          exam_preference,
          phone,
          address,
          study_year,
          olympiad_subjects
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

          email:
            row[0],

          first_name:
            row[1],

          last_name:
            row[2],

          login_id:
            row[3],

          password:
            row[4],

          exam_preference:
            row[5],

          phone:
            row[6],

          address:
            row[7],

          study_year:
            row[8],

          olympiad_subjects:
            row[9]
        }))

  }

  else {

    alert(
      'Only CSV or XLSX files allowed'
    )

    return
  }

  setPreviewRows(parsed)
}
  /* ================= UPLOAD ================= */

  async function handleUpload() {
  if (!file) {
    alert('Please select a file')
    return
  }

  setLoading(true)

  try {
    const { data } = await supabase.auth.getSession()

    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/admin/bulk-students', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${data.session.access_token}`
      },
      body: formData
    })

    const result = await res.json()

if (!res.ok) {
  setLoading(false)
  alert(result.error || 'Upload failed')
  return
}

    alert(`✅ Inserted: ${result.inserted}\n❌ Failed: ${result.failed}`)

  } catch (err) {
    console.error(err)
    alert('Upload error')
  }

  setLoading(false)
}

  /* ================= UI ================= */

  return (
    <div style={{ padding: 40 }}>
      <h1>Bulk Upload Students</h1>

      <p>Upload CSV file using the template format</p>

<input
  type="file"
  accept=".csv,.xlsx"
  onChange={handleFileChange}
/>

      <br /><br />
{previewRows.length > 0 && (

<div
  style={{
    marginTop: 30,
    marginBottom: 30,
    overflowX: 'auto',
    overflowY: 'auto',
    maxHeight: 500,
    border: '1px solid #ddd',
    borderRadius: 10
  }}
>
<p
  style={{
    padding: 12,
    fontWeight: 600
  }}
>
  Total Students:
  {' '}
  {previewRows.length}
</p>
    <table
      style={{
        width: '100%',
        borderCollapse: 'collapse'
      }}
    >

      <thead>

        <tr
          style={{
            background: '#f1f5f9'
          }}
        >

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
      <button onClick={handleUpload} disabled={loading}>
        {loading ? 'Uploading...' : 'Upload'}
      </button>
    </div>
  )
}
const styles = {

  th: {

    padding: 12,

    borderBottom:
      '1px solid #ddd',

    textAlign: 'left',

    fontSize: 14
  },

  td: {

    padding: 12,

    borderBottom:
      '1px solid #eee',

    fontSize: 14
  }
}
