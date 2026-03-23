'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function MapQuestionsFilteredPage() {

  const router = useRouter()
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  async function load() {

    // 1️⃣ Get user
    const { data: userData } = await supabase.auth.getUser()
    const email = userData?.user?.email

    if (!email) {
      setLoading(false)
      return
    }

    // 2️⃣ Get college
    const { data: student } = await supabase
      .from('students')
      .select('college_id')
      .eq('email', email)
      .single()

    const collegeId = student?.college_id

    // 3️⃣ Fetch ONLY that college exams
    const { data: examData } = await supabase
      .from('exams')
      .select('*')
      .eq('college_id', collegeId)

    setExams(examData || [])
    setLoading(false)
  }

  if (loading) return <div>Loading...</div>

  return (
    <div style={{ padding: 40 }}>
      <h2>Exam Mapping (Filtered)</h2>

      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>Exam</th>
            <th>Category</th>
            <th>Duration</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {exams.map(e => (
            <tr key={e.id}>
              <td>{e.title}</td>
              <td>{e.exam_category}</td>
              <td>{e.duration_minutes}</td>
              <td>
                <button
                  onClick={() =>
                    router.push(`/admin/map-questions?examId=${e.id}`)
                  }
                >
                  Map Questions
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  )
}