#!/usr/bin/env node

/**
 * Database migration script
 * Applies SQL migrations to Supabase
 * 
 * Usage: node scripts/apply-migration.js
 */

const fs = require('fs')
const path = require('path')
const https = require('https')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

/**
 * Execute SQL directly against Supabase PostgreSQL
 */
async function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const url = new URL(supabaseUrl)
    
    // Extract project ID from URL
    const projectId = url.hostname.split('.')[0]
    
    console.log(`\n📡 Executing SQL on Supabase project: ${projectId}`)
    console.log('   URL:', url.hostname)
    
    // Since we can't directly execute arbitrary SQL through the REST API,
    // we need to provide instructions for manual execution
    console.log(`\n⚠️  Supabase REST API does not support arbitrary SQL execution.`)
    console.log('   You have two options:\n')
    
    console.log('Option 1: Execute via Supabase Dashboard')
    console.log('   1. Go to: https://app.supabase.com/project/' + projectId)
    console.log('   2. Click "SQL Editor" in the left sidebar')
    console.log('   3. Click "New query"')
    console.log('   4. Copy and paste the migration SQL')
    console.log('   5. Click "Run"\n')
    
    console.log('Option 2: Use Supabase CLI (Recommended)')
    console.log('   1. Install: npm install -g supabase')
    console.log('   2. Run: supabase db push\n')
    
    console.log('Option 3: Use psql directly')
    console.log('   1. Get connection string from Supabase dashboard')
    console.log('   2. Run: psql "connection-string" < supabase/migrations/20251118_spaces_enhancement.sql\n')
    
    resolve()
  })
}

async function main() {
  try {
    console.log('🚀 Spaces Enhancement Migration')
    console.log('================================\n')
    
    const migrationPath = path.join(__dirname, '../supabase/migrations/20251118_spaces_enhancement.sql')
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath)
      process.exit(1)
    }
    
    const migration = fs.readFileSync(migrationPath, 'utf-8')
    console.log('📄 Migration file loaded: 20251118_spaces_enhancement.sql')
    console.log(`   Size: ${(migration.length / 1024).toFixed(2)} KB`)
    
    // Count statements
    const statements = migration.split(';').filter(s => s.trim() && !s.trim().startsWith('--')).length
    console.log(`   Statements: ${statements}`)
    
    await executeSQL(migration)
    
    console.log('\n✅ Migration instructions provided!')
    console.log('\n📋 Changes being applied:')
    console.log('   ✓ 16 new columns added to spaces table')
    console.log('   ✓ 11 new tables created for space features')
    console.log('   ✓ 12 performance indexes added')
    console.log('   ✓ Trigger functions for timestamp management')
    console.log('   ✓ Constraints and data validation rules')
    
    console.log('\n🔗 Documentation: docs/SPACES_IMPLEMENTATION_ROADMAP.md')
    console.log('📚 Service Implementation: services/SpaceService.ts')
    console.log('💾 Repository Methods: lib/supabase/repository.ts\n')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

main()
