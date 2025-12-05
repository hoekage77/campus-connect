# Supabase Migration Plan

**Current:** Local PostgreSQL for development  
**Target:** Supabase for production deployment  
**Timeline:** After Phase 2 (E2EE) is complete

---

## Why Start Local?

1. **Faster iteration** — No network latency during development
2. **Offline development** — Work without internet
3. **No quotas** — Unlimited queries during development
4. **Easier debugging** — Direct database access
5. **Cost-free** — No usage costs during development

---

## Why Migrate to Supabase?

1. **Managed PostgreSQL** — No server maintenance
2. **Built-in Auth** — Can replace NextAuth if desired
3. **Real-time subscriptions** — Built-in WebSocket support
4. **Storage API** — For encrypted file uploads
5. **Row Level Security** — Additional security layer
6. **Free tier** — 500MB database, 1GB file storage, 2GB bandwidth
7. **Easy deployment** — No DevOps needed

---

## Migration Steps

### Phase 1: Preparation (Before Migration)
- [ ] Complete Phase 2 (E2EE implementation)
- [ ] Ensure all Prisma migrations are committed
- [ ] Test encryption locally with real data
- [ ] Document all environment variables
- [ ] Create data backup script

### Phase 2: Supabase Setup
- [ ] Create Supabase project
- [ ] Note connection strings (direct and pooled)
- [ ] Configure database settings
- [ ] Setup row level security (RLS) policies
- [ ] Create Supabase Storage buckets for encrypted files

### Phase 3: Database Migration
```bash
# 1. Export local schema
npx prisma db pull

# 2. Update DATABASE_URL to Supabase
# Use the "Connection Pooling" URL from Supabase dashboard
DATABASE_URL="postgresql://[user].[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# 3. Push schema to Supabase
npx prisma db push

# 4. Optional: Migrate existing data
# Create a script to export/import if you have test data
```

### Phase 4: Real-time Features (Optional)
If using Supabase Realtime instead of Socket.io:

```bash
# Install Supabase client
npm install @supabase/supabase-js

# Configure in lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

**Note:** E2EE messages will still be encrypted client-side. Supabase Realtime will only transport encrypted ciphertext.

### Phase 5: Storage Migration
For encrypted file attachments:

```typescript
// Replace S3/local storage with Supabase Storage
import { supabase } from '@/lib/supabase'

async function uploadEncryptedFile(
  encryptedBlob: Blob,
  filename: string
) {
  const { data, error } = await supabase.storage
    .from('encrypted-attachments')
    .upload(filename, encryptedBlob, {
      contentType: 'application/octet-stream',
      upsert: false,
    })
  
  return data?.path
}
```

### Phase 6: Testing
- [ ] Test all authentication flows
- [ ] Test group creation and joining
- [ ] Test E2EE messaging (encrypt/decrypt)
- [ ] Test file uploads (encrypted)
- [ ] Test real-time features
- [ ] Load testing with multiple users

### Phase 7: Deployment
- [ ] Deploy to Vercel with Supabase connection
- [ ] Update environment variables in Vercel
- [ ] Test production deployment
- [ ] Monitor error logs

---

## Configuration Checklist

### Environment Variables to Update

**Local Development:**
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/campus_connect"
NEXTAUTH_URL="http://localhost:3000"
```

**Production (Supabase):**
```bash
# Use Connection Pooling URL for serverless (Vercel)
DATABASE_URL="postgresql://[user].[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Use Direct Connection URL for migrations
DIRECT_URL="postgresql://[user].[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# Supabase client keys (for Storage and Realtime)
NEXT_PUBLIC_SUPABASE_URL="https://[project-ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[anon-key]"

NEXTAUTH_URL="https://campus-connect.vercel.app"
```

### Prisma Schema Update for Supabase

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL") // Add this for migrations
}
```

---

## Row Level Security (RLS) Policies

After migration, consider adding RLS policies in Supabase for additional security:

```sql
-- Example: Users can only read their own private groups
CREATE POLICY "Users can read their own groups"
  ON groups
  FOR SELECT
  USING (
    privacy = 'public' 
    OR id IN (
      SELECT group_id 
      FROM group_members 
      WHERE user_id = auth.uid()
    )
  );

-- Example: Only group members can read messages
CREATE POLICY "Only members can read messages"
  ON messages
  FOR SELECT
  USING (
    group_id IN (
      SELECT group_id 
      FROM group_members 
      WHERE user_id = auth.uid()
    )
  );
```

**Note:** Even with RLS, messages remain encrypted. Server never sees plaintext.

---

## Cost Estimation

### Supabase Free Tier (should be enough for school project)
- **Database:** 500 MB storage
- **Bandwidth:** 5 GB
- **Storage:** 1 GB files
- **Realtime:** Unlimited connections
- **Edge Functions:** 500,000 invocations/month

### If you exceed free tier:
- **Pro Plan:** $25/month
  - 8 GB database
  - 250 GB bandwidth
  - 100 GB storage

For a school project with ~50-100 active users, free tier should be plenty.

---

## Rollback Plan

If migration fails:

```bash
# 1. Revert DATABASE_URL to local
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/campus_connect"

# 2. Restore local database from backup
psql campus_connect < backup.sql

# 3. Continue development locally
npm run dev
```

---

## Alternative: Keep Local + Use Supabase Features À La Carte

You can also:
- Keep local PostgreSQL
- Use only Supabase Storage for files
- Use only Supabase Realtime for WebSockets
- Deploy database to Railway/Render instead

This hybrid approach gives you flexibility.

---

## Timeline

| When | Action |
|------|--------|
| **Now (Phase 0-1)** | Use local PostgreSQL |
| **Phase 2 (Week 2)** | Complete E2EE, test locally |
| **Phase 3 (Week 3)** | Migrate to Supabase for production |
| **Phase 4 (Week 3)** | Deploy to Vercel with Supabase |

---

## Questions Before Migration

- [ ] Do we need Supabase Auth or stick with NextAuth?
- [ ] Do we need Supabase Realtime or use Socket.io?
- [ ] Do we need Supabase Storage or use S3/local?
- [ ] What's our expected user count?
- [ ] Do we need RLS policies?

**Recommendation:** Migrate after Phase 2 is complete and working locally.

---

**Status:** 📝 Planning (will execute after Phase 2)  
**Last Updated:** November 10, 2025
