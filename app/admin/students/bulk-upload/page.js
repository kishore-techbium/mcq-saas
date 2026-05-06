'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../../lib/supabase'

export default function BulkUpload() {
  const [file, setFile] = useState(null)
  
  const [loading, setLoading] = useState(false)

  /* ================= FETCH ADMIN ================= */

  useEffect(() => {
    
  }, [])

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
        accept=".csv"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <br /><br />

      <button onClick={handleUpload} disabled={loading}>
        {loading ? 'Uploading...' : 'Upload'}
      </button>
    </div>
  )
}
