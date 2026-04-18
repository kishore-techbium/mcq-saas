import { exec } from 'child_process'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {
  try {
    const { workers } = await req.json()

    if (!workers || workers < 1 || workers > 6) {
      return Response.json({ error: 'Invalid worker count' }, { status: 400 })
    }

    // 🔐 SECURITY: check superadmin
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')

    const { data: userData } = await supabase.auth.getUser(token)

    if (!userData?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: user } = await supabase
      .from('students')
      .select('role')
      .eq('user_id', userData.user.id)
      .maybeSingle()

    if (!user || user.role !== 'superadmin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 🚀 SCALE PM2
    exec(`pm2 scale worker ${workers}`, (err, stdout, stderr) => {
      if (err) {
        console.error(err)
        return
      }
      console.log(stdout)
    })

    return Response.json({ success: true })
  } catch (err) {
    console.error(err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}