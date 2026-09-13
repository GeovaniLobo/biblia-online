import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://apodufxahgxlghmlzagq.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_vDRu0b_QIKsCCqt7ZgPwdg_G0QTJ8Eo'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)