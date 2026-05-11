export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'
import {
  calculateExamMetrics
} from '../../../../lib/anseexamMetrics'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
