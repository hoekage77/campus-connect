# Campus Connect Database System (Supabase Edition)

**Updated:** 15 November 2025  
**Status:** Draft / v1  
**Audience:** Platform Engineering, Backend, Data Infra

---

## 1. Purpose

Campus Connect is leaving the in-memory `DataStore` (Maps + optional `localStorage`) and standardizing on Supabase (Postgres + Auth). This document captures the *authoritative* data model, table contracts, and migration/export approach so every squad can reason about persistence the same way. Treat this as the source of truth before touching schema files or data pipelines.

---

## 2. Domain Inventory → Supabase Mapping

| Domain | Source Collections (DataStore) | Supabase Tables | Notes |
| --- | --- | --- | --- |
| Identity & Profiles | `users`, `userPasswords`, `userPreferences`, `userLevels` | `users`, `user_profiles`, `user_preferences`, `user_levels`, `achievements` | Auth handled by Supabase Auth; passwords **not** migrated. `users` stores auth-linked fields, `user_profiles` handles extended metadata. |
| Communities | `groups`, `groupMembers`, `squads`, `squads.members` | `groups`, `group_members`, `squads`, `squad_members` (view) | We keep `groups` canonical and expose `squads` as curated view (same rows surfaced differently in UI). |
| Messaging | `chatRooms`, `chatMessages`, `messages` | `chat_rooms`, `chat_room_members`, `chat_messages`, `group_messages` | Group wall `messages` remain separate (`group_messages`). |
| Events | `sessions`, `rsvps` | `sessions`, `session_rsvps` | Future: `session_materials`, `session_feedback`. |
| Spaces | `spaces`, `spaceParticipants`, `spaceInvitations` | `spaces`, `space_participants`, `space_invitations`, `space_metrics` (materialized view) | Stores Daily room metadata (`room_name`, `room_url`). |
| Notifications | `notifications` | `notifications` | Add `read_at` timestamp + JSON payload for CTA metadata. |
| Engagement | `userLevels`, nested `achievements` | `user_levels`, `achievements` | `achievements` stored as JSONB array for now; can normalize later if querying per badge. |
| Misc Support | `eventListeners`, `localDB` snapshots | `audit_logs`, `export_snapshots` | `audit_logs` records dual-write comparisons during rollout. |

---

## 3. Core Schema Contracts

### 3.1 Users & Profiles
```sql
create table public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  username citext unique not null,
  role text not null default 'user',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.user_profiles (
  user_id uuid primary key references users on delete cascade,
  name text,
  avatar text,
  bio text,
  major text,
  year text,
  student_id text unique,
  topics text[] default '{}',
  squads text[] default '{}',
  discovery_enabled boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.user_preferences (
  user_id uuid primary key references users on delete cascade,
  interests text[] default '{}',
  preferred_event_types text[] default '{}',
  preferred_squad_topics text[] default '{}',
  notification_frequency text default 'instant',
  discovery_enabled boolean default true,
  last_updated timestamptz default now()
);

create table public.user_levels (
  user_id uuid primary key references users on delete cascade,
  total_points integer default 0,
  total_events_attended integer default 0,
  total_squads_created integer default 0,
  total_messages_count integer default 0,
  login_streak integer default 0,
  current_level text default 'Novice',
  achievements jsonb default '[]'::jsonb,
  updated_at timestamptz default now()
);
```

### 3.2 Groups, Members, Squads
```sql
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  owner_id uuid references users,
  privacy text not null default 'public',
  topics text[] default '{}',
  location text,
  avatar text,
  member_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups on delete cascade,
  user_id uuid references users on delete cascade,
  role text not null default 'member',
  joined_at timestamptz default now(),
  unique (group_id, user_id)
);

create table public.squads (
  id uuid primary key, -- matches groups.id for parity
  display_name text,
  description text,
  image text,
  location text,
  interests text[] default '{}',
  privacy text,
  member_count integer,
  created_at timestamptz,
  updated_at timestamptz
);
```
> Implementation detail: `squads` can be a materialized view joining `groups` so client code keeps using `/squads` endpoints without divergence.

### 3.3 Sessions & RSVPs
```sql
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  host_id uuid references users,
  group_id uuid references groups,
  location text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  capacity integer,
  privacy text default 'public',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.session_rsvps (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions on delete cascade,
  user_id uuid references users on delete cascade,
  status text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (session_id, user_id)
);
```

### 3.4 Spaces & Realtime Participation
```sql
create table public.spaces (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups on delete cascade,
  host_id uuid references users,
  title text not null,
  description text,
  type text not null,
  privacy text not null,
  status text not null default 'live',
  max_participants integer default 10,
  audio_enabled boolean default true,
  video_enabled boolean default false,
  screenshare_enabled boolean default false,
  started_at timestamptz default now(),
  ended_at timestamptz,
  scheduled_for timestamptz,
  session_id uuid references sessions,
  chat_room_id uuid references chat_rooms,
  peak_participants integer default 1,
  total_joins integer default 1,
  room_name text,
  room_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.space_participants (
  id uuid primary key default gen_random_uuid(),
  space_id uuid references spaces on delete cascade,
  user_id uuid references users,
  role text not null default 'listener',
  audio_muted boolean default true,
  video_muted boolean default true,
  hand_raised boolean default false,
  screen_sharing boolean default false,
  connection_status text default 'connected',
  joined_at timestamptz default now(),
  left_at timestamptz,
  unique (space_id, user_id, joined_at)
);

create table public.space_invitations (
  id uuid primary key default gen_random_uuid(),
  space_id uuid references spaces on delete cascade,
  invited_user_id uuid references users,
  invited_by_user_id uuid references users,
  status text default 'pending',
  created_at timestamptz default now(),
  expires_at timestamptz
);
```

### 3.5 Messaging & Notifications
```sql
create table public.chat_rooms (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups,
  name text,
  topic text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  chat_room_id uuid references chat_rooms on delete cascade,
  sender_id uuid references users,
  content text not null,
  reactions jsonb default '{}',
  created_at timestamptz default now()
);

create table public.group_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups,
  session_id uuid references sessions,
  sender_id uuid references users,
  content text,
  reply_to_id uuid references group_messages,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  action_url text,
  related_id uuid,
  metadata jsonb,
  read_at timestamptz,
  created_at timestamptz default now()
);
```

### 3.6 Analytics & Audit
- `user_activity_log` for XP events (mirrors `addActivityPoints`).
- `export_snapshots` stores metadata for every export (`source`, `checksum`, `path`).
- `audit_logs` for dual-write diffing (columns: `entity`, `entity_id`, `operation`, `local_payload`, `supabase_payload`, `status`).

---

## 4. Relationships Overview

- Users ↔ Groups: many-to-many via `group_members` with role metadata.
- Groups ↔ Spaces: one-to-many (space belongs to a group).
- Spaces ↔ Participants: one-to-many with `role` + connection state.
- Groups ↔ Sessions ↔ RSVPs chain ensures we can query cohorts.
- Chat rooms belong to groups; participants gleaned from `group_members`. We enforce RLS so only members access messages.
- Notifications always tied to a single user; `related_id` stores optional space/session reference.

Represented as adjacency matrix $A$ where $A_{ij} = 1$ if entity $i$ references entity $j$. This helps reason about migration ordering (topological sort of dependency graph).

---

## 5. Migration / Export Strategy

1. **Snapshot**: use `dataStore.exportCollectionsSnapshot()` (already landed) to dump JSON with collection arrays + metadata.
2. **Transform**: run `scripts/transform-export.ts` (to be authored) that:
   - Normalizes keys to snake_case.
   - Resolves foreign keys by mapping old IDs → UUIDs (or reuse existing `id` if they already look like UUID v4).
   - Emits CSV per table plus `manifest.json` describing dependency order.
3. **Load**: use Supabase CLI/psql `COPY` commands in dependency order (users → groups → ... → notifications).
4. **Verify**: compare counts + random sample of relationships. Add SQL checks, e.g.:
   ```sql
   select count(*) from groups where member_count != (
     select count(*) from group_members where group_members.group_id = groups.id
   );
   ```
5. **Dual-write**: wrap `dataStore` mutations with hooks that also `insert`/`update` Supabase tables. Log mismatches to `audit_logs`.
6. **Cutover**: introduce `SupabaseStore` implementing the same interface, flip feature flag, remove legacy store after burn-in.

Rollback = re-import snapshot JSON to `localDB`, toggle flag back to `local`.

---

## 6. Security & RLS Guidelines

- Enable RLS on every table.
- Policy primitives:
  - `auth.uid()` must match `user_id` for profile/preferences/notifications.
  - For group-scoped entities, require membership via subqueries.
  - Spaces: allow hosts/co-hosts to mutate; allow members to read; allow participants to insert themselves into `space_participants` if group membership holds.
- Service role key used only inside server actions/API routes.

---

## 7. Operational Playbook

1. **Environment**: set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_PASSWORD`.
2. **Local Dev**: run `supabase start`, apply schema via `supabase db reset` using `/supabase/migrations`.
3. **CI**: add migration verification step (`supabase db lint && supabase test migrations`).
4. **Monitoring**: create Supabase Log Drains to Datadog/Seq; add scheduled job to detect drift (counts vs snapshot manifest).

---

## 8. Next Steps

- [ ] Author `scripts/export-datastore.ts` + `scripts/transform-export.ts`.
- [ ] Scaffold Supabase client/service modules and begin dual-write.
- [ ] Backfill docs with ER diagram (Mermaid) and include in `docs/ARCHITECTURE.md`.
- [ ] Update onboarding guide (`docs/START_HERE.md`) with Supabase dev setup instructions.

Once these are complete we can formally mark the “Document database system” task as done and proceed to carousels + actual data migrations.
