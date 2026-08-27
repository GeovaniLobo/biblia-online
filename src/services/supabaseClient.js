import { createClient } from '@supabase/supabase-js'

// Substitua pela sua URL do projeto e pela Publishable key do Supabase
const supabaseUrl = 'https://dttuprbwfvehrrlmsbsq.supabase.co'
const supabaseKey = 'sb_publishable_L924KJOuXUBko-Av9UJgCg_53qbu...' // cole a sua chave inteira aqui

export const supabase = createClient(supabaseUrl, supabaseKey)