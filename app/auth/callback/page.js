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

    // small delay to allow session
    await new Promise(r => setTimeout(r, 500))

    const { data: userData } = await supabase.auth.getUser()

    if (!userData?.user) {
      console.log("❌ No user")
      router.replace('/')
      return
    }

    const email = userData.user.email
    console.log("✅ Logged in:", email)

    // 🔥 FETCH USER ROLE
    const { data: user, error } = await supabase
      .from('students')
      .select('role')
      .eq('email', email)
      .single()

    console.log("🟢 USER RECORD:", user)

    // 🚨 If user not found → signup
    if (!user) {
      console.log("🟡 New user → signup")
      router.replace('/signup')
      return
    }

    // 🎯 ROLE-BASED REDIRECT

    if (user.role === 'superadmin') {
      console.log("👑 Superadmin")
      router.replace('/superadmin')
    }

    else if (user.role === 'admin') {
      console.log("🏫 Admin")
      router.replace('/admin')
    }

    else {
      console.log("🎓 Student")
      router.replace('/select-category')
    }
  }

  return (
    <div style={{
      height:'100vh',
      display:'flex',
      alignItems:'center',
      justifyContent:'center',
      fontFamily:'system-ui'
    }}>
      Signing you in...
    </div>
  )
}
