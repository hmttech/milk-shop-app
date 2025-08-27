import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Create a function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey)
}

// Create a function to get the configuration error message
export const getSupabaseConfigError = () => {
  if (!supabaseUrl && !supabaseAnonKey) {
    return 'Missing Supabase URL and API key. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  } else if (!supabaseUrl) {
    return 'Missing Supabase URL. Please set VITE_SUPABASE_URL in your .env file.'
  } else if (!supabaseAnonKey) {
    return 'Missing Supabase API key. Please set VITE_SUPABASE_ANON_KEY in your .env file.'
  }
  return null
}

// Only create the client if environment variables are available
export const supabase = isSupabaseConfigured() 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null