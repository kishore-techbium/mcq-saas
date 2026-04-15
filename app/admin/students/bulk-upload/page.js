'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../../lib/supabase'

export default function BulkUpload() {
  const [file, setFile] = useState(null)
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(false)

  /* ================= FETCH ADMIN ================= */

  useEffect(() => {
    fetchAdmin()
  }, [])

  async function fetchAdmin() {
    try {
      const { data } = await supabase.auth.getUser()

      if (!data?.user) {
        alert('Not logged in')
        return
      }

      const email = data.user.email

      const { data: user, error } = await supabase
        .from('students')
        .select('*')
        .eq('email', email)
        .single()

      if (error || !user) {
        alert('Admin not found')
        return
      }

      if (user.role !== 'admin') {
        alert('Access denied')
        return
      }

      setAdmin(user)

    } catch (err) {
      console.error(err)
      alert('Error loading admin')
    }
  }

  /* ================= UPLOAD ================= */

  async function handleUpload() {
    if (!file) {
      alert('Please select a file')
      return
    }

    if (!admin) {
      alert('Admin not loaded yet')
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('adminCollegeId', admin.college_id)
      formData.append('adminCollegeName', admin.college_name)

      const res = await fetch('/api/admin/bulk-students', {
        method: 'POST',
        body: formData
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || 'Upload failed')
        return
      }

      alert(`✅ Inserted: ${data.inserted}\n❌ Failed: ${data.failed}`)

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
