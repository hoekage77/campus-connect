/**
 * Supabase Demo Data Seeder
 *
 * Seeds Supabase with realistic demo data for development and testing.
 * Run with: pnpm dlx tsx scripts/seed-supabase.ts
 */

// Load environment variables FIRST before any other imports
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

// Now safe to import modules that depend on env vars
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seedUsers() {
  console.log('🌱 Seeding users...')

  const users = [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      username: 'root',
      email: 'root@aun.edu.ng',
      role: 'user' as const,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      username: 'bob',
      email: 'bob@aun.edu.ng',
      role: 'user' as const,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      username: 'charlie',
      email: 'charlie@aun.edu.ng',
      role: 'user' as const,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440004',
      username: 'diana',
      email: 'diana@aun.edu.ng',
      role: 'user' as const,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440005',
      username: 'eve',
      email: 'eve@aun.edu.ng',
      role: 'user' as const,
    },
  ]

  const userProfiles = [
    {
      user_id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Alice Johnson',
      major: 'Computer Science',
      year: 'Senior',
      topics: ['Technology', 'AI', 'Web Development'],
      squads: ['550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440013'],
      bio: 'Full-stack developer passionate about building scalable web applications.',
      avatar: null,
    },
    {
      user_id: '550e8400-e29b-41d4-a716-446655440002',
      name: 'Bob Smith',
      major: 'Engineering',
      year: 'Junior',
      topics: ['Engineering', 'Gaming', 'Sports'],
      squads: ['550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440014'],
      bio: 'Mechanical engineering student who loves gaming and outdoor adventures.',
      avatar: null,
    },
    {
      user_id: '550e8400-e29b-41d4-a716-446655440003',
      name: 'Charlie Brown',
      major: 'Business',
      year: 'Sophomore',
      topics: ['Entrepreneurship', 'Finance', 'Social Events'],
      squads: ['550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440013'],
      bio: 'Business major with a passion for entrepreneurship and campus life.',
      avatar: null,
    },
    {
      user_id: '550e8400-e29b-41d4-a716-446655440004',
      name: 'Diana Prince',
      major: 'Design',
      year: 'Senior',
      topics: ['Design', 'Arts', 'Creative'],
      squads: ['550e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440012'],
      bio: 'Graphic design student creating beautiful digital experiences.',
      avatar: null,
    },
    {
      user_id: '550e8400-e29b-41d4-a716-446655440005',
      name: 'Eve Wilson',
      major: 'Psychology',
      year: 'Junior',
      topics: ['Psychology', 'Literature', 'Study Groups'],
      squads: ['550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440017'],
      bio: 'Psychology major who loves reading and helping others learn.',
      avatar: null,
    },
  ]

  // Insert users
  const { error: usersError } = await supabase
    .from('users')
    .upsert(users, { onConflict: 'id' })

  if (usersError) {
    console.error('Error seeding users:', usersError)
    throw usersError
  }

  // Insert profiles
  const { error: profilesError } = await supabase
    .from('user_profiles')
    .upsert(userProfiles, { onConflict: 'user_id' })

  if (profilesError) {
    console.error('Error seeding user profiles:', profilesError)
    throw profilesError
  }

  // Create Supabase Auth users (admin) for seeded accounts so sign-in works
  // Use the service role client (createServerClient uses service role key)
  try {
    for (const u of users) {
      try {
        // Create or update auth user with a default password for local development
        // NOTE: For production, never seed passwords like this! Use invites.
        const { error: authError } = await supabase.auth.admin.createUser({
          email: u.email,
          user_metadata: { username: u.username },
          password: 'password123',
          email_confirm: true,
          id: u.id,
        })
        // If user already exists, ignore error
        if (authError && !authError.message.includes('user already exists')) {
          console.warn('Failed to create auth user', u.email, authError)
        }
      } catch (e) {
        // Some supabase-js versions return errors differently; log and continue
        console.warn('Auth createUser error for', u.email, e)
      }
    }
  } catch (e) {
    console.warn('Failed to ensure Supabase auth users:', e)
  }

  console.log('✅ Seeded 5 users with profiles')
}

async function seedGroups() {
  console.log('🌱 Seeding groups...')

  const groups = [
    {
      id: '550e8400-e29b-41d4-a716-446655440010',
      title: 'AUN Party Central',
      description: 'Campus parties, live music, and good vibes',
      privacy: 'public' as const,
      topics: ['Social Events', 'Music', 'Nightlife'],
      location: 'Student Union Hall',
      avatar: null,
      owner_id: '550e8400-e29b-41d4-a716-446655440003',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440011',
      title: 'Campus Gamers',
      description: 'All things gaming: tournaments, LAN nights, and streams',
      privacy: 'public' as const,
      topics: ['Gaming', 'Esports'],
      location: 'Game Lab',
      avatar: null,
      owner_id: '550e8400-e29b-41d4-a716-446655440002',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440012',
      title: 'The Reading Nook',
      description: 'Private space for literature lovers and poetry nights',
      privacy: 'private' as const,
      topics: ['Literature', 'Study Groups'],
      location: 'Library Quiet Room',
      avatar: null,
      owner_id: '550e8400-e29b-41d4-a716-446655440005',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440013',
      title: 'Tech Entrepreneurs',
      description: 'Startup builders, product people, and pitch practice',
      privacy: 'invite-only' as const,
      topics: ['Entrepreneurship', 'Career & Professional', 'Tech'],
      location: 'Innovation Hub',
      avatar: null,
      owner_id: '550e8400-e29b-41d4-a716-446655440001',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440014',
      title: 'Outdoor Adventures',
      description: 'Hiking, camping, and outdoor exploration',
      privacy: 'public' as const,
      topics: ['Sports & Recreation', 'Nature', 'Fitness'],
      location: 'Mountain Trails',
      avatar: null,
      owner_id: '550e8400-e29b-41d4-a716-446655440002',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440015',
      title: 'Code & Coffee',
      description: 'Coding sessions, hackathons, and tech discussions',
      privacy: 'public' as const,
      topics: ['Technology', 'Programming', 'AI'],
      location: 'Computer Lab',
      avatar: null,
      owner_id: '550e8400-e29b-41d4-a716-446655440001',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440016',
      title: 'Creative Collective',
      description: 'Artists, designers, and creative minds',
      privacy: 'public' as const,
      topics: ['Arts', 'Design', 'Creative'],
      location: 'Art Studio',
      avatar: null,
      owner_id: '550e8400-e29b-41d4-a716-446655440004',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440017',
      title: 'Study Buddies',
      description: 'Group study sessions and academic support',
      privacy: 'public' as const,
      topics: ['Academic', 'Study Groups', 'Tutoring'],
      location: 'Study Hall',
      avatar: null,
      owner_id: '550e8400-e29b-41d4-a716-446655440005',
    },
  ]

  // Insert groups
  const { error: groupsError } = await supabase
    .from('groups')
    .upsert(groups, { onConflict: 'id' })

  if (groupsError) {
    console.error('Error seeding groups:', groupsError)
    throw groupsError
  }

  console.log('✅ Seeded 8 groups')
}

async function seedGroupMemberships() {
  console.log('🌱 Seeding group memberships...')

  const memberships = [
    // squad-party (charlie-789 owner)
    { group_id: '550e8400-e29b-41d4-a716-446655440010', user_id: '550e8400-e29b-41d4-a716-446655440003', role: 'owner' as const },
    { group_id: '550e8400-e29b-41d4-a716-446655440010', user_id: '550e8400-e29b-41d4-a716-446655440002', role: 'member' as const },
    { group_id: '550e8400-e29b-41d4-a716-446655440010', user_id: '550e8400-e29b-41d4-a716-446655440005', role: 'member' as const },

    // squad-gamers (bob-456 owner)
    { group_id: '550e8400-e29b-41d4-a716-446655440011', user_id: '550e8400-e29b-41d4-a716-446655440002', role: 'owner' as const },
    { group_id: '550e8400-e29b-41d4-a716-446655440011', user_id: '550e8400-e29b-41d4-a716-446655440001', role: 'member' as const },
    { group_id: '550e8400-e29b-41d4-a716-446655440011', user_id: '550e8400-e29b-41d4-a716-446655440003', role: 'member' as const },

    // squad-reading (eve-202 owner) - private
    { group_id: '550e8400-e29b-41d4-a716-446655440012', user_id: '550e8400-e29b-41d4-a716-446655440005', role: 'owner' as const },
    { group_id: '550e8400-e29b-41d4-a716-446655440012', user_id: '550e8400-e29b-41d4-a716-446655440004', role: 'member' as const },

    // squad-startups (alice-123 owner) - invite-only
    { group_id: '550e8400-e29b-41d4-a716-446655440013', user_id: '550e8400-e29b-41d4-a716-446655440001', role: 'owner' as const },
    { group_id: '550e8400-e29b-41d4-a716-446655440013', user_id: '550e8400-e29b-41d4-a716-446655440003', role: 'member' as const },

    // squad-hiking (bob-456 owner)
    { group_id: '550e8400-e29b-41d4-a716-446655440014', user_id: '550e8400-e29b-41d4-a716-446655440002', role: 'owner' as const },
    { group_id: '550e8400-e29b-41d4-a716-446655440014', user_id: '550e8400-e29b-41d4-a716-446655440001', role: 'member' as const },
    { group_id: '550e8400-e29b-41d4-a716-446655440014', user_id: '550e8400-e29b-41d4-a716-446655440004', role: 'member' as const },

    // squad-coding (alice-123 owner)
    { group_id: '550e8400-e29b-41d4-a716-446655440015', user_id: '550e8400-e29b-41d4-a716-446655440001', role: 'owner' as const },
    { group_id: '550e8400-e29b-41d4-a716-446655440015', user_id: '550e8400-e29b-41d4-a716-446655440002', role: 'member' as const },
    { group_id: '550e8400-e29b-41d4-a716-446655440015', user_id: '550e8400-e29b-41d4-a716-446655440005', role: 'member' as const },

    // squad-art (diana-101 owner)
    { group_id: '550e8400-e29b-41d4-a716-446655440016', user_id: '550e8400-e29b-41d4-a716-446655440004', role: 'owner' as const },
    { group_id: '550e8400-e29b-41d4-a716-446655440016', user_id: '550e8400-e29b-41d4-a716-446655440003', role: 'member' as const },
    { group_id: '550e8400-e29b-41d4-a716-446655440016', user_id: '550e8400-e29b-41d4-a716-446655440005', role: 'member' as const },

    // squad-study (eve-202 owner)
    { group_id: '550e8400-e29b-41d4-a716-446655440017', user_id: '550e8400-e29b-41d4-a716-446655440005', role: 'owner' as const },
    { group_id: '550e8400-e29b-41d4-a716-446655440017', user_id: '550e8400-e29b-41d4-a716-446655440001', role: 'member' as const },
    { group_id: '550e8400-e29b-41d4-a716-446655440017', user_id: '550e8400-e29b-41d4-a716-446655440002', role: 'member' as const },
    { group_id: '550e8400-e29b-41d4-a716-446655440017', user_id: '550e8400-e29b-41d4-a716-446655440003', role: 'member' as const },
  ]

  const { error } = await supabase
    .from('group_members')
    .upsert(memberships, { onConflict: 'group_id,user_id' })

  if (error) {
    console.error('Error seeding group memberships:', error)
    throw error
  }

  console.log('✅ Seeded group memberships')
}

async function seedSpaces() {
  console.log('🌱 Seeding spaces...')

  const now = new Date()
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  const spaces = [
    // ========================================
    // LIVE SPACES - One for each of the 8 types
    // ========================================
    
    // 1. Study Session (split-screen layout with whiteboard/timer)
    {
      id: '550e8400-e29b-41d4-a716-446655440030',
      group_id: '550e8400-e29b-41d4-a716-446655440015',
      host_id: '550e8400-e29b-41d4-a716-446655440001',
      title: 'Finals Prep: Data Structures',
      description: 'Focused study session with pomodoro breaks. Reviewing trees, graphs, and dynamic programming.',
      type: 'study-session' as const,
      privacy: 'public' as const,
      status: 'live' as const,
      max_participants: 12,
      audio_enabled: true,
      video_enabled: true,
      screenshare_enabled: true,
      started_at: now.toISOString(),
      peak_participants: 4,
      total_joins: 6,
      room_name: 'study-ds-001',
      room_url: 'https://daily.co/study-ds-001',
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      scheduled_for: now.toISOString(),
    },
    
    // 2. Office Hours (speaker-focus layout with queue)
    {
      id: '550e8400-e29b-41d4-a716-446655440031',
      group_id: '550e8400-e29b-41d4-a716-446655440015',
      host_id: '550e8400-e29b-41d4-a716-446655440002',
      title: 'Prof. Smith Office Hours',
      description: 'Drop in for help with CS101 homework, project questions, or career advice.',
      type: 'office-hours' as const,
      privacy: 'public' as const,
      status: 'live' as const,
      max_participants: 30,
      audio_enabled: true,
      video_enabled: true,
      screenshare_enabled: true,
      started_at: now.toISOString(),
      peak_participants: 8,
      total_joins: 15,
      room_name: 'office-hours-001',
      room_url: 'https://daily.co/office-hours-001',
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      scheduled_for: now.toISOString(),
    },
    
    // 3. Social Hangout (audio-only layout)
    {
      id: '550e8400-e29b-41d4-a716-446655440032',
      group_id: '550e8400-e29b-41d4-a716-446655440010',
      host_id: '550e8400-e29b-41d4-a716-446655440003',
      title: 'Late Night Chill & Chat',
      description: 'Casual hangout for night owls. Come vent, share memes, or just vibe.',
      type: 'social-hangout' as const,
      privacy: 'public' as const,
      status: 'live' as const,
      max_participants: 25,
      audio_enabled: true,
      video_enabled: false,
      screenshare_enabled: false,
      started_at: now.toISOString(),
      peak_participants: 12,
      total_joins: 20,
      room_name: 'social-chill-001',
      room_url: 'https://daily.co/social-chill-001',
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      scheduled_for: now.toISOString(),
    },
    
    // 4. Lecture (stage-audience layout)
    {
      id: '550e8400-e29b-41d4-a716-446655440033',
      group_id: '550e8400-e29b-41d4-a716-446655440015',
      host_id: '550e8400-e29b-41d4-a716-446655440001',
      title: 'Guest Lecture: AI in Healthcare',
      description: 'Dr. Chen presents cutting-edge applications of machine learning in medical diagnosis.',
      type: 'lecture' as const,
      privacy: 'public' as const,
      status: 'live' as const,
      max_participants: 100,
      audio_enabled: true,
      video_enabled: true,
      screenshare_enabled: true,
      started_at: now.toISOString(),
      peak_participants: 45,
      total_joins: 52,
      room_name: 'lecture-ai-001',
      room_url: 'https://daily.co/lecture-ai-001',
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      scheduled_for: now.toISOString(),
    },
    
    // 5. Project Collab (split-screen with project board)
    {
      id: '550e8400-e29b-41d4-a716-446655440034',
      group_id: '550e8400-e29b-41d4-a716-446655440011',
      host_id: '550e8400-e29b-41d4-a716-446655440002',
      title: 'Hackathon Team: EcoTrack App',
      description: 'Building a sustainability tracking app. Sprint planning and pair programming.',
      type: 'project-collab' as const,
      privacy: 'public' as const,
      status: 'live' as const,
      max_participants: 8,
      audio_enabled: true,
      video_enabled: true,
      screenshare_enabled: true,
      started_at: now.toISOString(),
      peak_participants: 5,
      total_joins: 6,
      room_name: 'collab-eco-001',
      room_url: 'https://daily.co/collab-eco-001',
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      scheduled_for: now.toISOString(),
    },
    
    // 6. Mentorship (one-on-one layout)
    {
      id: '550e8400-e29b-41d4-a716-446655440035',
      group_id: '550e8400-e29b-41d4-a716-446655440013',
      host_id: '550e8400-e29b-41d4-a716-446655440004',
      title: 'Career Coaching: Tech Interview Prep',
      description: 'One-on-one session focusing on system design and behavioral questions.',
      type: 'mentorship' as const,
      privacy: 'invite-only' as const,
      status: 'live' as const,
      max_participants: 2,
      audio_enabled: true,
      video_enabled: true,
      screenshare_enabled: true,
      started_at: now.toISOString(),
      peak_participants: 2,
      total_joins: 2,
      room_name: 'mentor-career-001',
      room_url: 'https://daily.co/mentor-career-001',
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      scheduled_for: now.toISOString(),
    },
    
    // 7. Debate (stage-audience with voting/scoring)
    {
      id: '550e8400-e29b-41d4-a716-446655440036',
      group_id: '550e8400-e29b-41d4-a716-446655440012',
      host_id: '550e8400-e29b-41d4-a716-446655440005',
      title: 'Debate: AI Regulation',
      description: 'Should AI development be regulated by governments? Two teams, timed rounds.',
      type: 'debate' as const,
      privacy: 'public' as const,
      status: 'live' as const,
      max_participants: 20,
      audio_enabled: true,
      video_enabled: true,
      screenshare_enabled: false,
      started_at: now.toISOString(),
      peak_participants: 14,
      total_joins: 18,
      room_name: 'debate-ai-001',
      room_url: 'https://daily.co/debate-ai-001',
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      scheduled_for: now.toISOString(),
    },
    
    // 8. Peer Review (split-screen with document viewer/rubric)
    {
      id: '550e8400-e29b-41d4-a716-446655440037',
      group_id: '550e8400-e29b-41d4-a716-446655440017',
      host_id: '550e8400-e29b-41d4-a716-446655440003',
      title: 'Essay Workshop: Research Papers',
      description: 'Peer review session for midterm research papers. Constructive feedback only!',
      type: 'peer-review' as const,
      privacy: 'members-only' as const,
      status: 'live' as const,
      max_participants: 10,
      audio_enabled: true,
      video_enabled: true,
      screenshare_enabled: true,
      started_at: now.toISOString(),
      peak_participants: 6,
      total_joins: 8,
      room_name: 'review-essay-001',
      room_url: 'https://daily.co/review-essay-001',
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      scheduled_for: now.toISOString(),
    },

    // ========================================
    // LEGACY LIVE SPACES (keeping for backwards compat)
    // ========================================
    {
      id: '550e8400-e29b-41d4-a716-446655440020',
      group_id: '550e8400-e29b-41d4-a716-446655440015',
      host_id: '550e8400-e29b-41d4-a716-446655440001',
      title: 'React Workshop: Building Modern UIs',
      description: 'Learn React hooks, context, and best practices for building scalable UIs',
      type: 'collaboration' as const,
      privacy: 'public' as const,
      status: 'live' as const,
      max_participants: 20,
      audio_enabled: true,
      video_enabled: false,
      screenshare_enabled: false,
      started_at: now.toISOString(),
      peak_participants: 3,
      total_joins: 3,
      room_name: 'react-workshop-001',
      room_url: 'https://daily.co/react-workshop-001',
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      scheduled_for: now.toISOString(),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440021',
      group_id: '550e8400-e29b-41d4-a716-446655440011',
      host_id: '550e8400-e29b-41d4-a716-446655440002',
      title: 'Game Jam: 48-Hour Challenge',
      description: 'Build a game in 48 hours! Join our live coding session',
      type: 'collaboration' as const,
      privacy: 'public' as const,
      status: 'live' as const,
      max_participants: 15,
      audio_enabled: true,
      video_enabled: false,
      screenshare_enabled: true,
      started_at: now.toISOString(),
      peak_participants: 3,
      total_joins: 3,
      room_name: 'game-jam-001',
      room_url: 'https://daily.co/game-jam-001',
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      scheduled_for: now.toISOString(),
    },

    // Upcoming spaces
    {
      id: '550e8400-e29b-41d4-a716-446655440022',
      group_id: '550e8400-e29b-41d4-a716-446655440010',
      host_id: '550e8400-e29b-41d4-a716-446655440003',
      title: 'Friday Night Social',
      description: 'Campus mixer with music, games, and great company',
      type: 'social' as const,
      privacy: 'public' as const,
      status: 'scheduled' as const,
      max_participants: 25,
      audio_enabled: true,
      video_enabled: true,
      screenshare_enabled: false,
      started_at: tomorrow.toISOString(),
      peak_participants: 2,
      total_joins: 2,
      room_name: null,
      room_url: null,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      scheduled_for: tomorrow.toISOString(),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440023',
      group_id: '550e8400-e29b-41d4-a716-446655440014',
      host_id: '550e8400-e29b-41d4-a716-446655440002',
      title: 'Mountain Sunrise Hike',
      description: 'Early morning hike to watch the sunrise from the peak',
      type: 'social' as const,
      privacy: 'public' as const,
      status: 'scheduled' as const,
      max_participants: 12,
      audio_enabled: true,
      video_enabled: false,
      screenshare_enabled: false,
      started_at: tomorrow.toISOString(),
      peak_participants: 3,
      total_joins: 3,
      room_name: null,
      room_url: null,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      scheduled_for: tomorrow.toISOString(),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440024',
      group_id: '550e8400-e29b-41d4-a716-446655440016',
      host_id: '550e8400-e29b-41d4-a716-446655440004',
      title: 'Digital Art Workshop',
      description: 'Learn digital illustration techniques with Procreate',
      type: 'tutoring' as const,
      privacy: 'public' as const,
      status: 'scheduled' as const,
      max_participants: 10,
      audio_enabled: true,
      video_enabled: true,
      screenshare_enabled: true,
      started_at: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      peak_participants: 0,
      total_joins: 0,
      room_name: null,
      room_url: null,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      scheduled_for: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000).toISOString(),
    },

    // Ended spaces
    {
      id: '550e8400-e29b-41d4-a716-446655440025',
      group_id: '550e8400-e29b-41d4-a716-446655440017',
      host_id: '550e8400-e29b-41d4-a716-446655440005',
      title: 'Calculus Study Session',
      description: 'Group study for upcoming calculus exam',
      type: 'study-sprint' as const,
      privacy: 'public' as const,
      status: 'ended' as const,
      max_participants: 8,
      audio_enabled: true,
      video_enabled: false,
      screenshare_enabled: false,
      started_at: yesterday.toISOString(),
      ended_at: new Date(yesterday.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      peak_participants: 3,
      total_joins: 3,
      room_name: 'calc-study-001',
      room_url: 'https://daily.co/calc-study-001',
      created_at: yesterday.toISOString(),
      updated_at: new Date(yesterday.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      scheduled_for: yesterday.toISOString(),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440026',
      group_id: '550e8400-e29b-41d4-a716-446655440013',
      host_id: '550e8400-e29b-41d4-a716-446655440001',
      title: 'Pitch Practice: Startup Ideas',
      description: 'Practice pitching your startup ideas to investors',
      type: 'office-hours' as const,
      privacy: 'members-only' as const,
      status: 'ended' as const,
      max_participants: 6,
      audio_enabled: true,
      video_enabled: true,
      screenshare_enabled: true,
      started_at: yesterday.toISOString(),
      ended_at: new Date(yesterday.getTime() + 1 * 60 * 60 * 1000).toISOString(),
      peak_participants: 2,
      total_joins: 2,
      room_name: 'pitch-practice-001',
      room_url: 'https://daily.co/pitch-practice-001',
      created_at: yesterday.toISOString(),
      updated_at: new Date(yesterday.getTime() + 1 * 60 * 60 * 1000).toISOString(),
      scheduled_for: yesterday.toISOString(),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440027',
      group_id: '550e8400-e29b-41d4-a716-446655440012',
      host_id: '550e8400-e29b-41d4-a716-446655440005',
      title: 'Book Club: The Midnight Library',
      description: 'Discussing Matt Haig\'s The Midnight Library',
      type: 'social' as const,
      privacy: 'public' as const,
      status: 'ended' as const,
      max_participants: 12,
      audio_enabled: true,
      video_enabled: false,
      screenshare_enabled: false,
      started_at: new Date(yesterday.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      ended_at: yesterday.toISOString(),
      peak_participants: 2,
      total_joins: 2,
      room_name: 'book-club-001',
      room_url: 'https://daily.co/book-club-001',
      created_at: new Date(yesterday.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      updated_at: yesterday.toISOString(),
      scheduled_for: new Date(yesterday.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    },
  ]

  const { error } = await supabase
    .from('spaces')
    .upsert(spaces, { onConflict: 'id' })

  if (error) {
    console.error('Error seeding spaces:', error)
    throw error
  }

  console.log('✅ Seeded 8 spaces (2 live, 3 upcoming, 3 ended)')
}

async function seedSpaceParticipants() {
  console.log('🌱 Seeding space participants...')

  const participants = [
    // Live React workshop
    { space_id: '550e8400-e29b-41d4-a716-446655440020', user_id: '550e8400-e29b-41d4-a716-446655440001', joined_at: new Date().toISOString() },
    { space_id: '550e8400-e29b-41d4-a716-446655440020', user_id: '550e8400-e29b-41d4-a716-446655440002', joined_at: new Date().toISOString() },
    { space_id: '550e8400-e29b-41d4-a716-446655440020', user_id: '550e8400-e29b-41d4-a716-446655440005', joined_at: new Date().toISOString() },

    // Live game jam
    { space_id: '550e8400-e29b-41d4-a716-446655440021', user_id: '550e8400-e29b-41d4-a716-446655440002', joined_at: new Date().toISOString() },
    { space_id: '550e8400-e29b-41d4-a716-446655440021', user_id: '550e8400-e29b-41d4-a716-446655440001', joined_at: new Date().toISOString() },
    { space_id: '550e8400-e29b-41d4-a716-446655440021', user_id: '550e8400-e29b-41d4-a716-446655440003', joined_at: new Date().toISOString() },

    // Upcoming party
    { space_id: '550e8400-e29b-41d4-a716-446655440022', user_id: '550e8400-e29b-41d4-a716-446655440003', joined_at: new Date().toISOString() },
    { space_id: '550e8400-e29b-41d4-a716-446655440022', user_id: '550e8400-e29b-41d4-a716-446655440002', joined_at: new Date().toISOString() },

    // Upcoming hike
    { space_id: '550e8400-e29b-41d4-a716-446655440023', user_id: '550e8400-e29b-41d4-a716-446655440002', joined_at: new Date().toISOString() },
    { space_id: '550e8400-e29b-41d4-a716-446655440023', user_id: '550e8400-e29b-41d4-a716-446655440001', joined_at: new Date().toISOString() },
    { space_id: '550e8400-e29b-41d4-a716-446655440023', user_id: '550e8400-e29b-41d4-a716-446655440004', joined_at: new Date().toISOString() },

    // Ended study session
    { space_id: '550e8400-e29b-41d4-a716-446655440025', user_id: '550e8400-e29b-41d4-a716-446655440005', joined_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
    { space_id: '550e8400-e29b-41d4-a716-446655440025', user_id: '550e8400-e29b-41d4-a716-446655440001', joined_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
    { space_id: '550e8400-e29b-41d4-a716-446655440025', user_id: '550e8400-e29b-41d4-a716-446655440002', joined_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },

    // Ended pitch practice
    { space_id: '550e8400-e29b-41d4-a716-446655440026', user_id: '550e8400-e29b-41d4-a716-446655440001', joined_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
    { space_id: '550e8400-e29b-41d4-a716-446655440026', user_id: '550e8400-e29b-41d4-a716-446655440003', joined_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },

    // Ended book club
    { space_id: '550e8400-e29b-41d4-a716-446655440027', user_id: '550e8400-e29b-41d4-a716-446655440005', joined_at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString() },
    { space_id: '550e8400-e29b-41d4-a716-446655440027', user_id: '550e8400-e29b-41d4-a716-446655440004', joined_at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString() },
  ]

  const { error } = await supabase
    .from('space_participants')
    .insert(participants)

  if (error) {
    console.error('Error seeding space participants:', error)
    throw error
  }

  console.log('✅ Seeded space participants')
}

async function updateGroupMemberCounts() {
  console.log('🔄 Updating group member counts...')

  // Manually calculate and update member counts for each group
  const groups = [
    '550e8400-e29b-41d4-a716-446655440010',
    '550e8400-e29b-41d4-a716-446655440011',
    '550e8400-e29b-41d4-a716-446655440012',
    '550e8400-e29b-41d4-a716-446655440013',
    '550e8400-e29b-41d4-a716-446655440014',
    '550e8400-e29b-41d4-a716-446655440015',
    '550e8400-e29b-41d4-a716-446655440016',
    '550e8400-e29b-41d4-a716-446655440017',
  ]

  for (const groupId of groups) {
    // Get count of members in this group
    const { count, error: countError } = await supabase
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId)

    if (countError) {
      console.error(`Error counting members for group ${groupId}:`, countError)
      continue
    }

    // Update the group's member_count
    const { error: updateError } = await supabase
      .from('groups')
      .update({ member_count: count || 0 })
      .eq('id', groupId)

    if (updateError) {
      console.error(`Error updating member count for group ${groupId}:`, updateError)
    }
  }

  console.log('✅ Updated group member counts')
}

async function main() {
  try {
    console.log('🚀 Starting Supabase demo data seeding...\n')

    await seedUsers()
    await seedGroups()
    await seedGroupMemberships()
    await seedSpaces()
    await seedSpaceParticipants()
    await updateGroupMemberCounts()

    console.log('\n🎉 Demo data seeding completed successfully!')
    console.log('\n📊 Summary:')
    console.log('- 5 users with profiles')
    console.log('- 8 groups (public/private/invite-only)')
    console.log('- 18 group memberships')
    console.log('- 8 spaces (live/upcoming/ended)')
    console.log('- 15 space participants')

  } catch (error) {
    console.error('\n❌ Seeding failed:', error)
    process.exit(1)
  }
}

// Run the seeder
main()