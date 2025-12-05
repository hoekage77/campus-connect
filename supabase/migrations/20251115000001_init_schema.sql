-- Campus Connect Initial Schema Migration
-- Generated: 2025-11-15
-- Description: Core tables for users, groups, sessions, spaces, messaging, and notifications

-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists "citext";

-- ============================================================================
-- USERS & PROFILES
-- ============================================================================

create table public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  username citext unique not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  name text,
  avatar text,
  bio text,
  major text,
  year text,
  student_id text unique,
  topics text[] default '{}',
  squads text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_preferences (
  user_id uuid primary key references public.users(id) on delete cascade,
  interests text[] default '{}',
  preferred_event_types text[] default '{}',
  preferred_squad_topics text[] default '{}',
  notification_frequency text not null default 'instant' check (notification_frequency in ('instant', 'daily', 'weekly', 'none')),
  discovery_enabled boolean default true,
  last_updated timestamptz not null default now()
);

create table public.user_levels (
  user_id uuid primary key references public.users(id) on delete cascade,
  total_points integer not null default 0,
  total_events_attended integer not null default 0,
  total_squads_created integer not null default 0,
  total_messages_count integer not null default 0,
  login_streak integer not null default 0,
  current_level text not null default 'Novice' check (current_level in ('Novice', 'Learner', 'Collaborator', 'Expert', 'Master')),
  achievements jsonb default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- GROUPS & COMMUNITIES
-- ============================================================================

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  owner_id uuid references public.users(id) on delete set null,
  privacy text not null default 'public' check (privacy in ('public', 'invite-only', 'private')),
  topics text[] default '{}',
  location text,
  avatar text,
  member_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'moderator', 'member')),
  joined_at timestamptz not null default now(),
  unique (group_id, user_id)
);

-- ============================================================================
-- SESSIONS & EVENTS
-- ============================================================================

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  host_id uuid references public.users(id) on delete set null,
  group_id uuid references public.groups(id) on delete cascade,
  location text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  capacity integer,
  privacy text not null default 'public' check (privacy in ('public', 'invite-only')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.session_rsvps (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  status text not null check (status in ('yes', 'no', 'maybe')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, user_id)
);

-- ============================================================================
-- SPACES (Real-time audio/video rooms)
-- ============================================================================

create table public.spaces (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  host_id uuid references public.users(id) on delete set null,
  title text not null,
  description text,
  type text not null check (type in ('study-sprint', 'office-hours', 'social', 'collaboration', 'tutoring', 'general')),
  privacy text not null check (privacy in ('public', 'members-only', 'invite-only')),
  status text not null default 'live' check (status in ('live', 'ended', 'scheduled')),
  max_participants integer not null default 10 check (max_participants between 2 and 25),
  audio_enabled boolean not null default true,
  video_enabled boolean not null default false,
  screenshare_enabled boolean not null default false,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  scheduled_for timestamptz,
  session_id uuid references public.sessions(id) on delete set null,
  chat_room_id uuid,
  peak_participants integer not null default 1,
  total_joins integer not null default 1,
  room_name text,
  room_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.space_participants (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'listener' check (role in ('host', 'co-host', 'speaker', 'listener')),
  audio_muted boolean not null default true,
  video_muted boolean not null default true,
  hand_raised boolean not null default false,
  screen_sharing boolean not null default false,
  connection_status text not null default 'connected' check (connection_status in ('connected', 'reconnecting', 'disconnected')),
  joined_at timestamptz not null default now(),
  left_at timestamptz
);

create table public.space_invitations (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  invited_user_id uuid not null references public.users(id) on delete cascade,
  invited_by_user_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

-- ============================================================================
-- MESSAGING
-- ============================================================================

create table public.chat_rooms (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups(id) on delete cascade,
  name text not null,
  topic text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  chat_room_id uuid not null references public.chat_rooms(id) on delete cascade,
  sender_id uuid references public.users(id) on delete set null,
  content text not null,
  reactions jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.group_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups(id) on delete cascade,
  session_id uuid references public.sessions(id) on delete cascade,
  sender_id uuid references public.users(id) on delete set null,
  content text not null,
  reply_to_id uuid references public.group_messages(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (type in ('level-up', 'interest-match', 'event-reminder', 'squad-invite', 'message', 'space-started', 'space-invitation', 'hand-raised')),
  title text not null,
  message text not null,
  action_url text,
  related_id uuid,
  metadata jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- User lookups
create index idx_users_email on public.users(email);
create index idx_users_username on public.users(username);

-- Group memberships
create index idx_group_members_user on public.group_members(user_id);
create index idx_group_members_group on public.group_members(group_id);

-- Sessions
create index idx_sessions_start on public.sessions(start_at);
create index idx_sessions_group on public.sessions(group_id);
create index idx_sessions_host on public.sessions(host_id);

-- RSVPs
create index idx_rsvps_user on public.session_rsvps(user_id);
create index idx_rsvps_session on public.session_rsvps(session_id);

-- Spaces
create index idx_spaces_group on public.spaces(group_id);
create index idx_spaces_status on public.spaces(status);
create index idx_spaces_started on public.spaces(started_at desc);

-- Space participants (partial index for active only)
create index idx_space_participants_active on public.space_participants(space_id, user_id) where left_at is null;
create index idx_space_participants_user on public.space_participants(user_id);

-- Chat messages
create index idx_chat_messages_room on public.chat_messages(chat_room_id, created_at desc);
create index idx_group_messages_group on public.group_messages(group_id, created_at desc);

-- Notifications
create index idx_notifications_user on public.notifications(user_id, created_at desc);
create index idx_notifications_unread on public.notifications(user_id) where read_at is null;

-- ============================================================================
-- TRIGGERS (auto-update timestamps)
-- ============================================================================

create or replace function trigger_set_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_timestamp before update on public.users
  for each row execute function trigger_set_timestamp();

create trigger set_timestamp before update on public.user_profiles
  for each row execute function trigger_set_timestamp();

create trigger set_timestamp before update on public.groups
  for each row execute function trigger_set_timestamp();

create trigger set_timestamp before update on public.sessions
  for each row execute function trigger_set_timestamp();

create trigger set_timestamp before update on public.spaces
  for each row execute function trigger_set_timestamp();

create trigger set_timestamp before update on public.chat_rooms
  for each row execute function trigger_set_timestamp();

create trigger set_timestamp before update on public.user_levels
  for each row execute function trigger_set_timestamp();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - Enable but policies TBD
-- ============================================================================

alter table public.users enable row level security;
alter table public.user_profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.user_levels enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.sessions enable row level security;
alter table public.session_rsvps enable row level security;
alter table public.spaces enable row level security;
alter table public.space_participants enable row level security;
alter table public.space_invitations enable row level security;
alter table public.chat_rooms enable row level security;
alter table public.chat_messages enable row level security;
alter table public.group_messages enable row level security;
alter table public.notifications enable row level security;

-- Basic policies (allow service role full access, user policies to be added incrementally)
create policy "Service role full access" on public.users for all using (true);
create policy "Service role full access" on public.user_profiles for all using (true);
create policy "Service role full access" on public.user_preferences for all using (true);
create policy "Service role full access" on public.user_levels for all using (true);
create policy "Service role full access" on public.groups for all using (true);
create policy "Service role full access" on public.group_members for all using (true);
create policy "Service role full access" on public.sessions for all using (true);
create policy "Service role full access" on public.session_rsvps for all using (true);
create policy "Service role full access" on public.spaces for all using (true);
create policy "Service role full access" on public.space_participants for all using (true);
create policy "Service role full access" on public.space_invitations for all using (true);
create policy "Service role full access" on public.chat_rooms for all using (true);
create policy "Service role full access" on public.chat_messages for all using (true);
create policy "Service role full access" on public.group_messages for all using (true);
create policy "Service role full access" on public.notifications for all using (true);

-- ============================================================================
-- VIEWS & MATERIALIZED VIEWS (Optional - for squads parity)
-- ============================================================================

-- Squads view (maps groups to squad interface for backward compat)
create or replace view public.squads as
select
  g.id,
  g.title as name,
  g.description,
  g.owner_id as creator_id,
  g.topics as interests,
  g.avatar as image,
  g.location,
  g.privacy,
  g.member_count,
  g.created_at,
  g.updated_at
from public.groups g;

comment on view public.squads is 'Backward-compatible view mapping groups to squad interface';
