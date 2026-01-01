import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Only create client if env vars are provided
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null

// Helper to check if Supabase is configured
export const isSupabaseConfigured = !!supabase

// Auth helper functions
export const signInWithMagicLink = async (email: string) => {
  if (!supabase) throw new Error('Supabase not configured')

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  return { error }
}

export const signOut = async () => {
  if (!supabase) throw new Error('Supabase not configured')

  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  if (!supabase) throw new Error('Supabase not configured')

  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

export const getSession = async () => {
  if (!supabase) throw new Error('Supabase not configured')

  const { data: { session }, error } = await supabase.auth.getSession()
  return { session, error }
}
