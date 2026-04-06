import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { env } from '@/lib/env'

// Cliente singleton — uma única instância por ambiente.
// Tipado com Database gerado pelo Supabase CLI (Fase 3).
export const supabase = createClient<Database>(
    env.supabaseUrl,
    env.supabaseAnonKey,
    {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
            storageKey: 'genesis-nr01-auth',
        },
    }
)
