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
localStorage.removeItem('student')
    const { data: userData } = await supabase.auth.getUser()

    if (!userData?.user) {
      router.replace('/')
      return
    }

    const email = userData.user.email
    const userId = userData.user.id

    // 🔍 FETCH USER
    let { data: user, error } = await supabase
      .from('students')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (error) {
      console.error("Fetch error:", error)
    }

    // 🟡 NEW USER → CREATE
    if (!user) {
      console.log("🟡 New user → creating profile")

      const { data: newUser, error: insertError } = await supabase
        .from('students')
        .insert({
          id: userId,
          email: email,
          role: 'student',
          user_id: userId   // 🔥 IMPORTANT
        })
        .select()
        .single()

      if (insertError) {
        console.error("Insert error:", insertError)
        router.replace('/')
        return
      }

      user = newUser

      router.replace('/student/profile')
      return
    }

    // 🔥 AUTO-FIX OLD USERS (CRITICAL)
    if (!user.user_id) {
      console.log("🟡 Fixing missing user_id")

      await supabase
        .from('students')
        .update({ user_id: userId })
        .eq('email', email)
    }

    console.log("🟢 USER ROLE:", user?.role)

    // 👑 SUPERADMIN
    if (user.role === 'superadmin') {
      router.replace('/superadmin')
      return
    }

    // 👨‍💼 ADMIN
    if (user.role === 'admin') {
      router.replace('/admin')
      return
    }
    // 👨‍💼 SCHOOL ADMIN
    if (user.role === 'school_admin') {
      router.replace('/admin')
      return
    }

    
    // 👨‍🎓 STUDENT
    if (user.role === 'student') {

      const isProfileComplete =
        user.first_name &&
        user.phone &&
        user.college_id

      if (!isProfileComplete) {
        console.log("🟡 Incomplete profile → profile page")
        router.replace('/student/profile')
      } else {
        console.log("🟢 Profile complete → dashboard")
        router.replace('/select-category')
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
