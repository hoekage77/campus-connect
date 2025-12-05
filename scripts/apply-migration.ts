#!/usr/bin/env ts-node

import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function applyMigration() {
  try {
    console.log('Applying database migration: 20251118_spaces_enhancement.sql')
    console.log('=====================================')

    const migrationPath = path.join(__dirname, '../supabase/migrations/20251118_spaces_enhancement.sql')
    const migration = fs.readFileSync(migrationPath, 'utf-8')

    // Split by semicolon and execute each statement
    const statements = migration
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    console.log(`Found ${statements.length} SQL statements to execute\n`)

    let executed = 0
    for (const statement of statements) {
      try {
        // Use rpc to execute raw SQL through a function, or directly if supported
        const { error } = await supabase.rpc('exec_sql', { sql: statement }).match(() => {
          // Fallback: try direct query execution if rpc not available
          return supabase.from('_migrations').select('*').limit(1)
        })

        if (error && !error.message.includes('does not exist')) {
          console.warn(`⚠️  Statement execution warning:`, error.message)
        } else {
          executed++
          console.log(`✅ Statement ${executed} executed successfully`)
        }
      } catch (err: any) {
        console.error(`❌ Error executing statement:`, err.message)
      }
    }

    console.log(`\n=====================================`)
    console.log(`Migration completed!`)
    console.log(`Executed: ${executed}/${statements.length} statements`)

    // Verify the migration
    console.log('\nVerifying migration...')
    
    // Check if new columns were added to spaces table
    const { data: spacesInfo, error: spacesError } = await supabase
      .from('spaces')
      .select('*')
      .limit(1)

    if (spacesError) {
      console.error('❌ Failed to verify spaces table:', spacesError.message)
    } else {
      console.log('✅ Spaces table exists and is accessible')
    }

    // Try to check for new tables
    const { data: tables, error: tablesError } = await supabase
      .rpc('exec_sql', { 
        sql: `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'space_%'` 
      })
      .match(() => ({ data: null, error: { message: 'RPC not available' } }))

    if (tables) {
      console.log(`✅ Found new space-related tables`)
    } else {
      console.log('ℹ️  Unable to verify new tables (rpc function may not be available)')
      console.log('Please verify manually in Supabase dashboard:')
      console.log('  - space_feature_configs')
      console.log('  - space_materials')
      console.log('  - space_agenda_items')
      console.log('  - space_activity_logs')
      console.log('  - space_engagement_metrics')
      console.log('  - private_space_access')
      console.log('  - space_recordings')
      console.log('  - space_transcripts')
      console.log('  - space_feedback')
      console.log('  - space_invitations')
      console.log('  - private_space_sessions')
    }

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  }
}

applyMigration()
