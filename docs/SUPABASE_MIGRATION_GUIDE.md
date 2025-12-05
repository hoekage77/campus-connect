# Supabase Migration Guide

**Last Updated:** 15 November 2025  
**Status:** Ready for execution

This guide walks you through migrating Campus Connect from the in-memory DataStore to Supabase.

---

## Prerequisites

1. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
2. **Node.js 18+** with pnpm installed
3. **Supabase CLI** (optional but recommended):
   ```bash
   npm install -g supabase
   supabase login
   ```

---

## Step 1: Create Supabase Project

1. Go to [app.supabase.com](https://app.supabase.com) and create a new project
2. Choose a region close to your users
3. Set a strong database password (save it securely)
4. Wait for project provisioning (~2 minutes)

Once ready, note down:
- **Project URL**: `https://your-project.supabase.co`
- **Anon Key**: Public key for client-side access
- **Service Role Key**: Secret key for server-side operations

---

## Step 2: Configure Environment Variables

Update `.env.local` with your Supabase credentials:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_DB_PASSWORD=your-database-password

# Keep existing keys
GOOGLE_GENERATIVE_AI_API_KEY=...
DAILY_API_KEY=...
DAILY_DOMAIN=...
```

---

## Step 3: Apply Database Schema

### Option A: Using Supabase Dashboard (Easiest)

1. Go to your project's SQL Editor
2. Open `supabase/migrations/20251115000001_init_schema.sql`
3. Copy the entire file contents
4. Paste into the SQL Editor and click "Run"
5. Verify tables were created in the Table Editor

### Option B: Using Supabase CLI

```bash
# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

---

## Step 4: Export Current Data

Run the export script to generate a snapshot of your current DataStore:

```bash
# Create exports directory
mkdir -p exports

# Generate snapshot
pnpm dlx tsx scripts/export-datastore.ts > exports/snapshot-$(date +%s).json

# Verify the export
cat exports/snapshot-*.json | jq '.counts'
```

Expected output shows counts for each collection:
```json
{
  "users": 15,
  "groups": 8,
  "spaces": 3,
  ...
}
```

---

## Step 5: Load Data into Supabase

### Manual Import (Recommended for Small Datasets)

For each table, you can insert via the Supabase dashboard or use the SQL editor:

```sql
-- Example: Insert users
insert into public.users (id, email, username, role, created_at, updated_at)
values
  ('user-123', 'alice@example.com', 'alice', 'user', now(), now()),
  ('user-456', 'bob@example.com', 'bob', 'user', now(), now());

-- Repeat for other tables following dependency order:
-- 1. users
-- 2. user_profiles, user_preferences, user_levels
-- 3. groups
-- 4. group_members
-- 5. sessions, spaces
-- 6. session_rsvps, space_participants, space_invitations
-- 7. chat_rooms, chat_messages, group_messages
-- 8. notifications
```

### Automated Import (For Larger Datasets)

A transform script (`scripts/transform-export.ts`) is planned to convert the JSON snapshot into SQL `INSERT` statements or CSV files. Check the roadmap in `docs/SUPABASE_DATABASE_SYSTEM.md`.

---

## Step 6: Test Supabase Connection

Create a test API route to verify connectivity:

```typescript
// app/api/test-supabase/route.ts
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/client'

export async function GET() {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase.from('users').select('count').single()
    
    if (error) throw error
    
    return NextResponse.json({ 
      success: true, 
      userCount: data?.count || 0 
    })
  } catch (error) {
    console.error('Supabase connection test failed:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
```

Test it:
```bash
curl http://localhost:3000/api/test-supabase
```

---

## Step 7: Implement Repository Layer

Start migrating API routes to use Supabase instead of DataStore:

```typescript
// Example: Update GET /api/groups route
import { createServerClient } from '@/lib/supabase/client'

export async function GET() {
  const supabase = createServerClient()
  
  const { data: groups, error } = await supabase
    .from('groups')
    .select('*')
    .eq('privacy', 'public')
    .order('created_at', { ascending: false })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(groups)
}
```

### Migration Strategy Options

**Option 1: Feature Flag (Dual-Write)**
- Add `DATABASE_PROVIDER` env var (`local` or `supabase`)
- Keep DataStore operational during transition
- Write to both, read from Supabase
- Compare results for correctness

**Option 2: Big Bang (Recommended for Small Apps)**
- Migrate all API routes in one go
- Update `lib/api-client.ts` if needed
- Test thoroughly in development
- Deploy and monitor

---

## Step 8: Update Authentication (Optional)

Campus Connect currently uses a dev-only auth system. To use Supabase Auth:

1. Enable Email provider in Supabase dashboard
2. Update `lib/auth.ts` to use Supabase session management
3. Migrate user passwords (or send password reset emails)
4. Update login/signup flows

For now, you can continue using the existing auth and just store users in Supabase.

---

## Step 9: Deploy & Monitor

1. **Update Production Environment Variables** in Vercel/deployment platform
2. **Deploy** the updated codebase
3. **Monitor** for errors via Supabase logs and application logs
4. **Verify** key flows: user registration, group creation, space joining

---

## Rollback Plan

If issues arise:

1. **Keep snapshot files** from Step 4
2. **Revert environment variables** to remove Supabase keys
3. **Redeploy previous commit** that uses DataStore
4. **Import snapshot** back into localStorage using admin tools

---

## Next Steps

- [ ] Set up Row Level Security (RLS) policies for production
- [ ] Create indexes for frequently queried columns
- [ ] Set up Supabase Realtime for live updates
- [ ] Add database backups and point-in-time recovery
- [ ] Implement audit logging for sensitive operations

---

## Troubleshooting

### "Missing NEXT_PUBLIC_SUPABASE_URL"
- Ensure `.env.local` is in the project root
- Restart Next.js dev server after adding variables

### "Relation does not exist"
- Verify schema migration was applied successfully
- Check table names match (e.g., `public.users` not `users`)

### "Invalid JWT"
- Double-check anon key and service role key
- Ensure keys match the correct project

### Connection timeouts
- Check network firewall rules
- Verify Supabase project is in active state (not paused)

---

## Support & Resources

- **Supabase Docs**: https://supabase.com/docs
- **Campus Connect Schema**: `supabase/migrations/20251115000001_init_schema.sql`
- **Database System Doc**: `docs/SUPABASE_DATABASE_SYSTEM.md`
- **Export Script**: `scripts/export-datastore.ts`

For questions, refer to the project's `docs/START_HERE.md` or consult the team.
