'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../../lib/supabase'

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

  const text =
    await selectedFile.text()

  const rows =
    text
      .split('\n')
      .slice(1)
      .filter(r => r.trim())

  const parsed =
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
