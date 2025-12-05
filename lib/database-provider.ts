/**
 * Database Provider Configuration
 * 
 * Feature flag to control which database backend to use:
 * - 'local': In-memory DataStore (default, existing behavior)
 * - 'supabase': Supabase Postgres (new, for migration)
 * 
 * Set DATABASE_PROVIDER=supabase in .env.local to enable Supabase mode.
 */

export type DatabaseProvider = 'local' | 'supabase'

export const DATABASE_PROVIDER = (process.env.DATABASE_PROVIDER || 'local') as DatabaseProvider

export const isSupabaseEnabled = DATABASE_PROVIDER === 'supabase'
export const isLocalEnabled = DATABASE_PROVIDER === 'local'

/**
 * Dual-write mode: write to both databases for data verification
 * Enable with DATABASE_DUAL_WRITE=true in .env.local
 */
export const isDualWriteEnabled = process.env.DATABASE_DUAL_WRITE === 'true'

/**
 * Helper to log which database is being used (useful for debugging during migration)
 */
export function logDatabaseProvider(context: string) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[${context}] Using database provider: ${DATABASE_PROVIDER}${isDualWriteEnabled ? ' (dual-write enabled)' : ''}`)
  }
}
