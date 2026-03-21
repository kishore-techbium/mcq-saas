'use client'

import { supabase } from '../../../lib/supabase'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthCallback() {

  const router = useRouter()

  useEffect(() => {
    handleAuth()
  }, [])

  async function handleAuth() {

    console.log("🔵 CALLBACK START")

    // wait a bit for session hydration
    await new Promise(r => setTimeout(r, 500))

    const { data: userData } = await supabase.auth.getUser()

    console.log("🟢 USER DATA:", userData)

    if (!userData?.user) {
      console.log("🔴 NO USER → redirecting to login")
      router.replace('/')
      return
    }

    const email = userData.user.email
    console.log("🟢 EMAIL:", email)

    const { data: student, error } = await supabase
      .from('students')
      .select('exam_preference')
      .eq('email', email)
      .single()

    console.log("🟢 STUDENT:", student, "ERROR:", error)

    if (!student || !student.exam_preference) {
      console.log("🟡 NEW USER → signup")
      router.replace('/signup')
    } else {
      console.log("🟢 EXISTING USER → select-category")
      router.replace('/select-category')
    }
  }

  return (
    <div style={{
      height:'100vh',
      display:'flex',
      alignItems:'center',
      justifyContent:'center'
    }}>
      Callback loading...
    </div>
  )
}
