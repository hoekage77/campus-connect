-- Seed: Live Spaces for All 8 Types
-- Description: Creates one live space for each space type to test layouts
-- Run after: 20251201000001_expand_space_types.sql migration

-- First, delete any existing test spaces and their participants
DELETE FROM public.space_participants WHERE space_id IN (
  '550e8400-e29b-41d4-a716-446655440030',
  '550e8400-e29b-41d4-a716-446655440031',
  '550e8400-e29b-41d4-a716-446655440032',
  '550e8400-e29b-41d4-a716-446655440033',
  '550e8400-e29b-41d4-a716-446655440034',
  '550e8400-e29b-41d4-a716-446655440035',
  '550e8400-e29b-41d4-a716-446655440036',
  '550e8400-e29b-41d4-a716-446655440037'
);

DELETE FROM public.spaces WHERE id IN (
  '550e8400-e29b-41d4-a716-446655440030',
  '550e8400-e29b-41d4-a716-446655440031',
  '550e8400-e29b-41d4-a716-446655440032',
  '550e8400-e29b-41d4-a716-446655440033',
  '550e8400-e29b-41d4-a716-446655440034',
  '550e8400-e29b-41d4-a716-446655440035',
  '550e8400-e29b-41d4-a716-446655440036',
  '550e8400-e29b-41d4-a716-446655440037'
);

-- Insert all 8 space types as LIVE spaces
INSERT INTO public.spaces (
  id, group_id, host_id, title, description, type, privacy, status,
  max_participants, audio_enabled, video_enabled, screenshare_enabled,
  started_at, peak_participants, total_joins, room_name, room_url,
  created_at, updated_at, scheduled_for
) VALUES
-- 1. STUDY SESSION (split-screen with whiteboard)
(
  '550e8400-e29b-41d4-a716-446655440030',
  '550e8400-e29b-41d4-a716-446655440015', -- CS Study Group
  '550e8400-e29b-41d4-a716-446655440001', -- Alex Chen
  'Algorithms Deep Dive',
  'Working through dynamic programming problems together. Bring your questions!',
  'study-session',
  'public',
  'live',
  15,
  true,
  true,
  true,
  NOW(),
  8,
  12,
  'study-algo-001',
  'https://daily.co/study-algo-001',
  NOW(),
  NOW(),
  NOW()
),

-- 2. OFFICE HOURS (speaker-focus with queue)
(
  '550e8400-e29b-41d4-a716-446655440031',
  '550e8400-e29b-41d4-a716-446655440015', -- CS Study Group
  '550e8400-e29b-41d4-a716-446655440004', -- Prof. Williams
  'Prof. Williams Office Hours',
  'Drop in for help with assignments, projects, or career advice.',
  'office-hours',
  'public',
  'live',
  30,
  true,
  true,
  true,
  NOW(),
  15,
  22,
  'office-prof-001',
  'https://daily.co/office-prof-001',
  NOW(),
  NOW(),
  NOW()
),

-- 3. SOCIAL HANGOUT (audio-only)
(
  '550e8400-e29b-41d4-a716-446655440032',
  '550e8400-e29b-41d4-a716-446655440010', -- Campus Life
  '550e8400-e29b-41d4-a716-446655440003', -- Jordan Lee
  'Late Night Chill & Chat',
  'Casual hangout for night owls. Come vent, share memes, or just vibe.',
  'social-hangout',
  'public',
  'live',
  25,
  true,
  false,
  false,
  NOW(),
  12,
  20,
  'social-chill-001',
  'https://daily.co/social-chill-001',
  NOW(),
  NOW(),
  NOW()
),

-- 4. LECTURE (stage-audience)
(
  '550e8400-e29b-41d4-a716-446655440033',
  '550e8400-e29b-41d4-a716-446655440015', -- CS Study Group
  '550e8400-e29b-41d4-a716-446655440001', -- Alex Chen
  'Guest Lecture: AI in Healthcare',
  'Dr. Chen presents cutting-edge applications of machine learning in medical diagnosis.',
  'lecture',
  'public',
  'live',
  100,
  true,
  true,
  true,
  NOW(),
  45,
  52,
  'lecture-ai-001',
  'https://daily.co/lecture-ai-001',
  NOW(),
  NOW(),
  NOW()
),

-- 5. PROJECT COLLAB (split-screen with project board)
(
  '550e8400-e29b-41d4-a716-446655440034',
  '550e8400-e29b-41d4-a716-446655440011', -- Game Dev Club
  '550e8400-e29b-41d4-a716-446655440002', -- Sam Rodriguez
  'Hackathon Team: EcoTrack App',
  'Building a sustainability tracking app. Sprint planning and pair programming.',
  'project-collab',
  'public',
  'live',
  8,
  true,
  true,
  true,
  NOW(),
  5,
  6,
  'collab-eco-001',
  'https://daily.co/collab-eco-001',
  NOW(),
  NOW(),
  NOW()
),

-- 6. MENTORSHIP (one-on-one)
(
  '550e8400-e29b-41d4-a716-446655440035',
  '550e8400-e29b-41d4-a716-446655440013', -- Research Network
  '550e8400-e29b-41d4-a716-446655440004', -- Prof. Williams
  'Career Coaching: Tech Interview Prep',
  'One-on-one session focusing on system design and behavioral questions.',
  'mentorship',
  'invite-only',
  'live',
  2,
  true,
  true,
  true,
  NOW(),
  2,
  2,
  'mentor-career-001',
  'https://daily.co/mentor-career-001',
  NOW(),
  NOW(),
  NOW()
),

-- 7. DEBATE (stage-audience with voting/scoring)
(
  '550e8400-e29b-41d4-a716-446655440036',
  '550e8400-e29b-41d4-a716-446655440012', -- Philosophy Club
  '550e8400-e29b-41d4-a716-446655440005', -- Taylor Kim
  'Debate: Should AI Be Regulated?',
  'Two teams argue for and against government regulation of AI. Timed rounds with audience voting.',
  'debate',
  'public',
  'live',
  20,
  true,
  true,
  false,
  NOW(),
  14,
  18,
  'debate-ai-001',
  'https://daily.co/debate-ai-001',
  NOW(),
  NOW(),
  NOW()
),

-- 8. PEER REVIEW (split-screen with document viewer)
(
  '550e8400-e29b-41d4-a716-446655440037',
  '550e8400-e29b-41d4-a716-446655440017', -- Study Buddies
  '550e8400-e29b-41d4-a716-446655440003', -- Jordan Lee
  'Essay Workshop: Research Papers',
  'Peer review session for midterm research papers. Constructive feedback only!',
  'peer-review',
  'members-only',
  'live',
  10,
  true,
  true,
  true,
  NOW(),
  6,
  8,
  'review-essay-001',
  'https://daily.co/review-essay-001',
  NOW(),
  NOW(),
  NOW()
);

-- Add host as participant for each space
INSERT INTO public.space_participants (
  space_id, user_id, role, audio_muted, video_muted, hand_raised, screen_sharing, connection_status, joined_at
) VALUES
-- Study Session host
('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440001', 'host', false, false, false, false, 'connected', NOW()),
-- Office Hours host
('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440004', 'host', false, false, false, false, 'connected', NOW()),
-- Social Hangout host
('550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440003', 'host', false, true, false, false, 'connected', NOW()),
-- Lecture host
('550e8400-e29b-41d4-a716-446655440033', '550e8400-e29b-41d4-a716-446655440001', 'host', false, false, false, true, 'connected', NOW()),
-- Project Collab host
('550e8400-e29b-41d4-a716-446655440034', '550e8400-e29b-41d4-a716-446655440002', 'host', false, false, false, false, 'connected', NOW()),
-- Mentorship host
('550e8400-e29b-41d4-a716-446655440035', '550e8400-e29b-41d4-a716-446655440004', 'host', false, false, false, false, 'connected', NOW()),
-- Debate host
('550e8400-e29b-41d4-a716-446655440036', '550e8400-e29b-41d4-a716-446655440005', 'host', false, false, false, false, 'connected', NOW()),
-- Peer Review host
('550e8400-e29b-41d4-a716-446655440037', '550e8400-e29b-41d4-a716-446655440003', 'host', false, false, false, false, 'connected', NOW());

-- Add some additional participants to make spaces look active
INSERT INTO public.space_participants (
  space_id, user_id, role, audio_muted, video_muted, hand_raised, screen_sharing, connection_status, joined_at
) VALUES
-- Study Session participants
('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440002', 'speaker', true, false, false, false, 'connected', NOW()),
('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440003', 'listener', true, true, true, false, 'connected', NOW()),
-- Office Hours participants
('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440001', 'speaker', false, false, false, false, 'connected', NOW()),
('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440002', 'listener', true, true, true, false, 'connected', NOW()),
-- Social Hangout participants  
('550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440001', 'speaker', false, true, false, false, 'connected', NOW()),
('550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440005', 'speaker', false, true, false, false, 'connected', NOW()),
-- Lecture participants
('550e8400-e29b-41d4-a716-446655440033', '550e8400-e29b-41d4-a716-446655440002', 'listener', true, true, false, false, 'connected', NOW()),
('550e8400-e29b-41d4-a716-446655440033', '550e8400-e29b-41d4-a716-446655440003', 'listener', true, true, true, false, 'connected', NOW()),
('550e8400-e29b-41d4-a716-446655440033', '550e8400-e29b-41d4-a716-446655440005', 'listener', true, true, false, false, 'connected', NOW()),
-- Project Collab participants
('550e8400-e29b-41d4-a716-446655440034', '550e8400-e29b-41d4-a716-446655440001', 'speaker', false, false, false, true, 'connected', NOW()),
('550e8400-e29b-41d4-a716-446655440034', '550e8400-e29b-41d4-a716-446655440003', 'speaker', false, false, false, false, 'connected', NOW()),
-- Mentorship participant
('550e8400-e29b-41d4-a716-446655440035', '550e8400-e29b-41d4-a716-446655440002', 'speaker', false, false, false, false, 'connected', NOW()),
-- Debate participants
('550e8400-e29b-41d4-a716-446655440036', '550e8400-e29b-41d4-a716-446655440001', 'speaker', false, false, false, false, 'connected', NOW()),
('550e8400-e29b-41d4-a716-446655440036', '550e8400-e29b-41d4-a716-446655440002', 'speaker', false, false, false, false, 'connected', NOW()),
('550e8400-e29b-41d4-a716-446655440036', '550e8400-e29b-41d4-a716-446655440003', 'listener', true, true, false, false, 'connected', NOW()),
-- Peer Review participants
('550e8400-e29b-41d4-a716-446655440037', '550e8400-e29b-41d4-a716-446655440001', 'speaker', false, false, false, false, 'connected', NOW()),
('550e8400-e29b-41d4-a716-446655440037', '550e8400-e29b-41d4-a716-446655440004', 'speaker', false, false, false, true, 'connected', NOW());

-- Verify the spaces were created
SELECT id, title, type, status, max_participants FROM public.spaces 
WHERE type IN ('study-session', 'office-hours', 'social-hangout', 'lecture', 'project-collab', 'mentorship', 'debate', 'peer-review')
ORDER BY type;
