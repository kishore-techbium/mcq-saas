'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../../../lib/supabase'

export default function ProctorReviewPage() {
  const { sessionId } = useParams()

  const [session, setSession] = useState(null)
  const [images, setImages] = useState([])
  const [student, setStudent] = useState(null)
  const [exam, setExam] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (sessionId) fetchData()
  }, [sessionId])

  async function fetchData() {
    setLoading(true)

    try {
      // 1️⃣ Get session
      const { data: sessionData, error: sessionError } =
        await supabase
          .from('exam_sessions')
          .select('*')
          .eq('id', sessionId)
          .single()

      if (sessionError) {
        console.error(sessionError)
        setLoading(false)
        return
      }

      setSession(sessionData)

      // 2️⃣ Get student
      const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .eq('id', sessionData.student_id)
        .single()

      setStudent(studentData)

      // 3️⃣ Get exam
      const { data: examData } = await supabase
        .from('exams')
        .select('*')
        .eq('id', sessionData.exam_id)
        .single()

      setExam(examData)

      // 4️⃣ Get images
      const { data: imageData } = await supabase
        .from('proctoring_images')
        .select('*')
        .eq('exam_session_id', sessionId)
        .order('capture_index', { ascending: true })

      setImages(imageData || [])
    } catch (err) {
      console.error('Review error:', err)
    }

    setLoading(false)
  }

  async function approve() {
    await supabase
  .from('exam_sessions')
  .update({
    score: session.original_score,
    is_rejected: false,
    rejection_reason: null,
    proctor_status: 'APPROVED'
  })
  .eq('id', sessionId)

    alert('Exam Approved')
    window.location.href = '/admin/proctoring'
  }

  async function reject() {
await supabase
  .from('exam_sessions')
  .update({
    original_score: session.score,   // save original
    score: 0,
    is_rejected: true,
    proctor_status: 'REJECTED'
  })
  .eq('id', sessionId)

    alert('Exam Rejected & Score set to 0')
    window.location.href = '/admin/proctoring'
  }

  if (loading)
    return <p style={{ padding: 40 }}>Loading...</p>

  if (!session)
    return <p style={{ padding: 40 }}>Session not found</p>

  return (
    <div style={{ padding: 40, background: '#f3f4f6', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: 20 }}>Proctor Review</h1>

      <div style={{
        background: '#fff',
        padding: 20,
        borderRadius: 12,
        marginBottom: 30
      }}>
        <p><strong>Student:</strong> {student?.first_name} {student?.last_name}</p>
        <p><strong>Email:</strong> {student?.email}</p>
        <p><strong>Exam:</strong> {exam?.title}</p>
        <p><strong>Score:</strong> {session.score}</p>
        <p><strong>Status:</strong> {session.proctor_status || 'PENDING'}</p>
      </div>

      <h3>Captured Images ({images.length})</h3>

      {images.length === 0 && (
        <p>No images found for this session.</p>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))',
        gap: 15,
        marginTop: 20
      }}>
        {images.map(img => (
          <img
            key={img.id}
            src={img.image_url}
            alt="Proctor"
            style={{
              width: '100%',
              borderRadius: 8,
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
            }}
          />
        ))}
      </div>

      <div style={{ marginTop: 40, display: 'flex', gap: 20 }}>
        <button
          onClick={approve}
          style={{
            padding: '10px 20px',
            background: '#16a34a',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer'
          }}
        >
          Approve
        </button>

        <button
          onClick={reject}
          style={{
            padding: '10px 20px',
            background: '#dc2626',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer'
          }}
        >
          Reject
        </button>
      </div>
    </div>
  )
}