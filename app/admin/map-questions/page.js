'use client'

import { Suspense, useEffect, useState } from 'react'
import MapQuestionsClient from './MapQuestionsClient'
import { supabase } from '../../../lib/supabase'

export default function MapQuestionsPage() {

  const [filteredExams, setFilteredExams] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    init()
  }, [])

  async function init() {

    // 1️⃣ Get logged-in user
    const { data: userData } = await supabase.auth.getUser()
    const email = userData?.user?.email

    if (!email) {
      setLoading(false)
      return
    }

    // 2️⃣ Get user's college_id
    const { data: student } = await supabase
      .from('students')
      .select('college_id')
      .eq('email', email)
      .single()

    const collegeId = student?.college_id

    if (!collegeId) {
      setLoading(false)
      return
    }

    // 3️⃣ Fetch ONLY that college exams
    const { data: exams } = await supabase
      .from('exams')
      .select('*')
      .eq('college_id', collegeId)

    setFilteredExams(exams || [])
    setLoading(false)
  }

  if (loading) return <div>Loading...</div>

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MapQuestionsClient preloadedExams={filteredExams} />
    </Suspense>
  )
}
