# Supabase Export & Migration Playbook

**Updated:** 15 November 2025  
**Owners:** Platform / Infra Guild  
**Scope:** Campus Connect data layer (localStorage → Supabase Postgres)

---

## 1. Current Data Surface (Local Database)
The product currently persists all state inside `lib/data/store.ts` (in-memory Maps with optional localStorage persistence via `lib/data/db.ts`). The collections we must migrate are:

| Domain | Collection (Map) | Description | Key Fields | Est. Rows |
| --- | --- | --- | --- | --- |
| Identity | `users`, `userPasswords`, `userPreferences`, `userLevels` | Core profiles, login secrets (dev only), preference flags, leveling data | `id`, `email`, `role`, `topics`, `totalPoints`, `notificationFrequency` | 10-100 |
| Communities | `groups`, `groupMembers`, `squads` | Groups/squads metadata plus membership edges | `groupId`, `ownerId`, `privacy`, `memberCount`, `role` | 20-50 groups / 500 memberships |
| Events | `sessions`, `rsvps` | Scheduled sessions + RSVP states | `sessionId`, `hostId`, `startAt`, `status` | 10-30 |
| Messaging | `chatRooms`, `chatMessages`, `messages` | Asynchronous chat rooms and group wall posts | `chatRoomId`, `senderId`, `content` | 1k+ messages |
| Notifications | `notifications` | User-targeted system messages | `userId`, `type`, `title`, `read` | 100-500 |
| Spaces | `spaces`, `spaceParticipants`, `spaceInvitations` | Audio rooms + participant state | `spaceId`, `hostId`, `roomName`, `status`, `role` | 5-20 live rooms |
| Engagement | `userLevels`, `achievements` (nested) | XP counts, streaks, achievements | `totalPoints`, `loginStreak`, `achievements[]` | per user |

> ✅ New helper: `dataStore.exportCollectionsSnapshot()` returns a structured snapshot (`generatedAt`, counts, and arrays for each collection) so we can export everything server-side, not only from the browser.

---

## 2. Target Supabase Schema Blueprint
Supabase (Postgres) will host a normalized version of the above collections. Recommended tables:

### Core Identity
```sql
create table public.users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  email text unique,
  student_id text unique,
  role text not null default 'user',
  name text,
  avatar text,
  bio text,
  major text,
  year text,
  topics text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

after insert or update on users
  for each row execute function trigger_set_timestamp();
```
- `user_preferences (user_id fk references users)` with JSONB `interests`, `preferred_event_types`, etc.
- `user_levels (user_id fk)` storing XP, totals, achievements JSONB.
- Authentication should migrate to **Supabase Auth** (email/password). The legacy `userPasswords` map should *not* be imported as-is; instead invite/create users via Auth admin API.

### Community + Events
- `groups`, `group_members`, `squads` (option: merge squads/groups or keep view).
- `sessions` (events) + `session_rsvps`.
- `chat_rooms`, `chat_messages`, `group_messages` for asynchronous chat feeds.

### Notifications & Spaces
- `notifications` table keyed by `user_id` with `read_at` timestamp.
- `spaces`, `space_participants`, `space_invitations` capturing Daily metadata (`room_name`, `room_url`, `status`).

### Recommended Indexes
- `group_members (group_id, user_id)` unique composite.
- `chat_messages (chat_room_id, created_at)` B-tree for fast queries.
- `space_participants (space_id, connection_status)` partial index on `left_at is null` for active participants.

### Row-Level Security
Enable RLS on every table with policies that mirror the current authorization checks, e.g.:
```sql
create policy "group-members can read" on group_members
  for select using ( user_id = auth.uid() );

create policy "group members read chat" on chat_messages
  for select using (
    chat_room_id in (
      select id from chat_rooms where group_id in (
        select group_id from group_members where user_id = auth.uid()
      )
    )
  );
```

---

## 3. Export Strategy
We now have two reliable export paths:

1. **Server / CLI snapshot**
   - Import `dataStore` in a Node context and call `const snapshot = dataStore.exportCollectionsSnapshot()`.
   - Write snapshot to `exports/campus-connect-<timestamp>.json`.
   - Transform JSON into per-table CSV/SQL using a conversion script (see below).

2. **Browser download (existing `localDB`)**
   - Call `localDB.exportToFile()` inside the admin UI to download `DatabaseBackup` JSON (includes checksum & metadata).
   - Feed the downloaded file into the same transform script.

### Transform Script (planned)
Create `scripts/transform-export.ts` (future work) that:
1. Accepts a snapshot JSON (from either path).
2. Normalizes camelCase to snake_case.
3. Emits `<table>.csv` files plus a `manifest.json` describing counts and FK order.
4. Optional: generates `COPY` commands for `psql` or `supabase db remote commit`.

Example transformation pipeline:
```bash
pnpm dlx tsx scripts/export-datastore.ts > exports/raw.json
pnpm dlx tsx scripts/transform-export.ts exports/raw.json --out exports/csv
psql "$SUPABASE_MIGRATION_URL" -c "\copy public.users FROM 'exports/csv/users.csv' WITH CSV HEADER"
```

---

## 4. Migration Phases

### Phase 0 – Readiness
- [ ] Freeze schema changes in `lib/data/store.ts` (document via CHANGELOG).
- [ ] Capture baseline snapshot via `exportCollectionsSnapshot()`.
- [ ] Ensure admin dashboard can trigger exports (UI button calling new helper).

### Phase 1 – Supabase Project Setup
1. Create Supabase project, enable email auth.
2. Configure environment variables (see §6).
3. Install Supabase CLI locally (`pnpm dlx supabase login`).
4. Create initial schema using SQL blueprint above (see `/docs/sql/supabase-init.sql` placeholder).
5. Enable RLS + default policies.

### Phase 2 – Data Load
1. Transform snapshot JSON into import-ready CSV/SQL.
2. Load tables in dependency order: `users → groups → group_members → sessions → rsvps → chat_rooms → chat_messages → spaces → space_participants`.
3. Verify counts with `select count(*)` per table.
4. Backfill derived columns (e.g., `groups.member_count` via `group_members`).

### Phase 3 – Application Cutover
1. Create `lib/supabase/client.ts` and typed repositories mirroring `DataStore` APIs.
2. Update API routes to read/write from Supabase instead of Maps. Suggested approach:
   - Build `SupabaseStore` implementing the same interface as `dataStore` (see `lib/data/repository.interface.ts`).
   - Introduce feature flag `DATABASE_PROVIDER` to toggle between Local and Supabase for staged rollout.
3. Migrate auth to Supabase (or federate with existing auth provider).
4. Run dual-write shadowing for 1 sprint: write to Supabase while still serving reads from the local store, compare diffs using audit jobs.
5. Flip reads to Supabase, monitor error budgets, then remove old store.

### Phase 4 – Validation & Rollback
- Automated cypress/API suite should run against Supabase staging.
- Keep snapshot + `DatabaseBackup` files for rollback. To revert, rehydrate `lib/data/store.ts` via `localDB.importFromFile()` and redeploy local mode.

---

## 5. Data Quality & Integrity Checklist
- **Counts match:** `snapshot.counts.users === (select count(*) from users)` etc.
- **Spot check relationships:** For 10 random `group_id`s ensure memberships imported.
- **Temporal fidelity:** `createdAt/updatedAt` preserved (timezone aware). Use `timestamptz` columns and convert ISO strings via `new Date(value)` before insert.
- **JSON columns:** For `achievements`, store as `jsonb` to avoid join explosion.
- **Media URLs:** `roomUrl` and avatar URLs remain unchanged; store as `text`.
- **Sensitive data:** Do **not** copy `userPasswords`; rely on Supabase Auth invites.

---

## 6. Environment Variables (add to `.env.local` and deployment targets)
```bash
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="public-anon-key"
SUPABASE_SERVICE_ROLE_KEY="service-role-key" # server-side only
SUPABASE_DB_PASSWORD="postgres-password"     # optional client pooling
```
During migration keep `DAILY_*` and other existing keys. Production deploys will also need pooling URLs for direct SQL migrations.

---

## 7. Action Items / Next Steps
1. **Implement export command**: wire a CLI script that calls `dataStore.exportCollectionsSnapshot()` and writes JSON.
2. **Draft Supabase schema file**: check in `/docs/sql/supabase-init.sql` with CREATE TABLE + RLS policies.
3. **Add Supabase client module**: `lib/supabase/client.ts` + typed repository skeletons.
4. **Dual-write plan**: design instrumentation to compare Map writes vs Supabase inserts.
5. **Admin tooling**: add "Export Snapshot" button leveraging new helper + download.

Refer to `docs/MIGRATION_PLAN.md` for the legacy Prisma-first strategy. This playbook supersedes it for the current localStorage datastore.
