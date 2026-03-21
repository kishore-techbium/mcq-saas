'use client'

import { supabase } from '../../../lib/supabase'
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthCallback() {

  const router = useRouter()
  const hasRun = useRef(false) // ✅ prevents re-run

 useEffect(() => {
  // ✅ VERY IMPORTANT: run ONLY on callback page
  if (window.location.pathname !== '/auth/callback') {
    return
  }

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

    const { data: user } = await supabase
      .from('students')
      .select('role')
      .eq('email', email)
      .single()

    console.log("🟢 USER ROLE:", user?.role)

    // ✅ SAFE REDIRECT (only once)
    if (user?.role === 'superadmin') {
      router.replace('/superadmin')
    }
    else if (user?.role === 'admin') {
      router.replace('/admin')
    }
    else {
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
      Signing you in...
    </div>
  )
}
