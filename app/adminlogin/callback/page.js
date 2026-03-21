'use client'

import { supabase } from '../../../lib/supabase'
import { isAdmin } from '../../../lib/isAdmin'
import { useEffect } from 'react'

export default function AdminCallback() {
  useEffect(() => {
    async function finalizeLogin() {
      const { data } = await supabase.auth.getUser()

      if (!data.user || !isAdmin(data.user)) {
        await supabase.auth.signOut()
        alert('You are not authorized as admin')
        window.location.href = '/'
        return
      }

      // 🔐 Persist admin authority
      localStorage.setItem('is_admin', 'true')

      window.location.href = '/admin'
    }

    finalizeLogin()
  }, [])

  return <p style={{ padding: 30 }}>Finalizing admin login…</p>
}
