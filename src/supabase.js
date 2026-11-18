
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://xfzlnoncjoonbxribyhu.supabase.co'

const SUPABASE_ANON_KEY = 'sb_publishable_zVeYSm8fkJdhTSM6v9rjsA_4oUGlHLg'

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
)
