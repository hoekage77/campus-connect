import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/client'
import { getSupabaseRepository } from '@/lib/supabase/repository'

/**
 * Test Supabase Connection
 * 
 * GET /api/test-supabase
 * 
 * Verifies:
 * - Supabase client can connect
 * - Database queries work
 * - Repository layer functions correctly
 */
export async function GET() {
  try {
    const supabase = createServerClient()
    const repo = getSupabaseRepository()

    // Test 1: Raw query
    const { data: usersCount, error: countError } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })

    if (countError) {
      throw new Error(`Count query failed: ${countError.message}`)
    }

    // Test 2: Repository query
    const groups = await repo.getAllGroups()

    // Test 3: Check tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('groups')
      .select('id')
      .limit(1)

    if (tablesError) {
      throw new Error(`Table query failed: ${tablesError.message}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful',
      tests: {
        rawQuery: { passed: true, userCount: usersCount || 0 },
        repository: { passed: true, groupCount: groups.length },
        tables: { passed: true, accessible: !!tables },
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Test Supabase] Connection test failed:', error)
    
    return NextResponse.json(
      {
        success: false,
        message: 'Supabase connection failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        hint: 'Check your NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables',
      },
      { status: 500 }
    )
  }
}
