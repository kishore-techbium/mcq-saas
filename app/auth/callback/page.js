'use client'

import { supabase } from '../../../lib/supabase'
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthCallback() {

  const router = useRouter()
  const hasRun = useRef(false)

  useEffect(() => {
    if (window.location.pathname !== '/auth/callback') return
    if (hasRun.current) return

    hasRun.current = true
    handleAuth()
  }, [])

  async function handleAuth() {

    console.log("🔵 CALLBACK START")

    const { data: userData } = await supabase.auth.getUser()

    if (!userData?.user) {
      router.replace('/')
      return
    }

    const email = userData.user.email
    const userId = userData.user.id

    // ✅ FIX 1: use maybeSingle + fetch full row
    let { data: user, error } = await supabase
      .from('students')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (error) {
      console.error("Fetch error:", error)
    }

    // ✅ FIX 2: create user if not exists
    if (!user) {
      console.log("🟡 New user → creating profile")

      const { data: newUser, error: insertError } = await supabase
        .from('students')
        .insert({
          id: userId,
          email: email,
          role: 'student'
        })
        .select()
        .single()

      if (insertError) {
        console.error("Insert error:", insertError)
        router.replace('/')
        return
      }

      user = newUser

      // 👉 new users go to profile
      router.replace('/student/profile')
      return
    }

    console.log("🟢 USER ROLE:", user?.role)

    // ✅ ROLE BASED REDIRECT
    if (user.role === 'superadmin') {
      router.replace('/superadmin')
      return
    }

    if (user.role === 'admin') {
      router.replace('/admin')
      return
    }

    if (user.role === 'student') {

      const isProfileComplete =
        user.first_name &&
        user.phone

      if (!isProfileComplete) {
        console.log("🟡 Incomplete profile → profile page")
        router.replace('/student/profile')
      } else {
        console.log("🟢 Profile complete → dashboard")
        router.replace('/student/dashboard')
      }

      return
    }

    // fallback
    router.replace('/')
  }

  return (
    <div style={{
      height:'100vh',
      display:'flex',
      alignItems:'center',
      justifyContent:'center'
    }}>
      Signing you in...
    </div>
  )
}
