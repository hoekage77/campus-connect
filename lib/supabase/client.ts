/**
 * Supabase Client
 * 
 * Provides typed client instances for browser (anon key) and server (service role).
 * Use createClient() in client components and createServerClient() in API routes.
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types.ts'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

/**
 * Client-side Supabase client (uses anon key, respects RLS)
 */
// Browser singleton to avoid multiple GoTrueClient instances warning
let browserSupabaseClient: ReturnType<typeof createSupabaseClient> | null = null

export function createClient() {
  // In a browser context, reuse a single client instance so the auth
  // storage key isn't managed by multiple GoTrue instances. This avoids
  // the runtime warning about multiple GoTrueClient instances.
  if (typeof window !== 'undefined') {
    if (browserSupabaseClient) return browserSupabaseClient
    browserSupabaseClient = createSupabaseClient<Database>(supabaseUrl!, supabaseAnonKey!)
    return browserSupabaseClient
  }

  // Server-side: return a fresh client per call (safe for SSR/API usages)
  return createSupabaseClient<Database>(supabaseUrl!, supabaseAnonKey!)
}

/**
 * Server-side Supabase client (uses service role key, bypasses RLS)
 * Only use in API routes or server actions where you control authorization.
 */
export function createServerClient() {
  if (!supabaseServiceKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY for server client')
  }
  return createSupabaseClient<Database>(supabaseUrl!, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

// Re-export types for convenience
export type { Database }
