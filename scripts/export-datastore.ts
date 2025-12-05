#!/usr/bin/env tsx
/**
 * Export DataStore Snapshot
 * 
 * Usage:
 *   pnpm dlx tsx scripts/export-datastore.ts > exports/snapshot-$(date +%s).json
 * 
 * Generates a JSON snapshot of the in-memory DataStore suitable for migration.
 */

import { dataStore } from '../lib/data/store'

interface DataStoreSnapshot {
  generatedAt: string
  version: string
  counts: Record<string, number>
  users: any[]
  userProfiles: any[]
  userPreferences: any[]
  userLevels: any[]
  groups: any[]
  groupMembers: any[]
  sessions: any[]
  sessionRsvps: any[]
  spaces: any[]
  spaceParticipants: any[]
  spaceInvitations: any[]
  chatRooms: any[]
  chatMessages: any[]
  groupMessages: any[]
  notifications: any[]
}

async function exportDataStore(): Promise<DataStoreSnapshot> {
  console.error('[Export] Starting DataStore snapshot...')
  
  // Fetch all collections
  const users = dataStore.getAllUsers()
  const groups = dataStore.getAllGroups()
  const sessions = dataStore.getAllSessions()
  const spaces = dataStore.getAllSpaces()
  const notifications: any[] = []
  
  // Build user-related data
  const userProfiles: any[] = []
  const userPreferences: any[] = []
  const userLevels: any[] = []
  
  for (const user of users) {
    userProfiles.push({
      user_id: user.id,
      name: user.name,
      avatar: user.avatar,
      bio: user.bio,
      major: user.major,
      year: user.year,
      student_id: user.studentId,
      topics: user.topics || [],
      squads: user.squads || [],
      created_at: user.createdAt,
      updated_at: user.updatedAt,
    })
    
    const prefs = dataStore.getUserPreferences(user.id)
    if (prefs) {
      userPreferences.push({
        user_id: prefs.userId,
        interests: prefs.interests || [],
        preferred_event_types: prefs.preferredEventTypes || [],
        preferred_squad_topics: prefs.preferredSquadTopics || [],
        notification_frequency: prefs.notificationFrequency,
        discovery_enabled: prefs.discoveryEnabled,
        last_updated: prefs.lastUpdated,
      })
    }
    
    const level = dataStore.getUserLevel(user.id)
    if (level) {
      userLevels.push({
        user_id: level.userId,
        total_points: level.totalPoints,
        total_events_attended: level.totalEventsAttended,
        total_squads_created: level.totalSquadsCreated,
        total_messages_count: level.totalMessagesCount,
        login_streak: level.loginStreak,
        current_level: level.currentLevel,
        achievements: level.achievements,
        updated_at: new Date(),
      })
    }
    
    // Get user notifications
    const userNotifs = dataStore.getUserNotifications(user.id)
    notifications.push(...userNotifs.map(n => ({
      id: n.id,
      user_id: n.userId,
      type: n.type,
      title: n.title,
      message: n.message,
      action_url: n.actionUrl,
      related_id: n.relatedId,
      read_at: n.read ? new Date() : null,
      created_at: n.createdAt,
    })))
  }
  
  // Build group memberships
  const groupMembers: any[] = []
  for (const group of groups) {
    const members = dataStore.getGroupMembers(group.id)
    groupMembers.push(...members.map(m => ({
      id: m.id,
      group_id: m.groupId,
      user_id: m.userId,
      role: m.role,
      joined_at: m.joinedAt,
    })))
  }
  
  // Build session RSVPs
  const sessionRsvps: any[] = []
  for (const session of sessions) {
    const rsvps = dataStore.getSessionRSVPs(session.id)
    sessionRsvps.push(...rsvps.map(r => ({
      id: r.id,
      session_id: r.sessionId,
      user_id: r.userId,
      status: r.status,
      created_at: r.createdAt,
      updated_at: r.updatedAt,
    })))
  }
  
  // Build space participants & invitations
  const spaceParticipants: any[] = []
  const spaceInvitations: any[] = []
  for (const space of spaces) {
    const participants = dataStore.getSpaceParticipants(space.id)
    spaceParticipants.push(...participants.map(p => ({
      id: p.id,
      space_id: p.spaceId,
      user_id: p.userId,
      role: p.role,
      audio_muted: p.audioMuted,
      video_muted: p.videoMuted,
      hand_raised: p.handRaised,
      screen_sharing: p.screenSharing,
      connection_status: p.connectionStatus,
      joined_at: p.joinedAt,
      left_at: p.leftAt,
    })))
    
    const invitations = dataStore.getSpaceInvitations(space.id)
    spaceInvitations.push(...invitations.map(i => ({
      id: i.id,
      space_id: i.spaceId,
      invited_user_id: i.invitedUserId,
      invited_by_user_id: i.invitedByUserId,
      status: i.status,
      created_at: i.createdAt,
      expires_at: i.expiresAt,
    })))
  }
  
  // Stub collections (extend as needed)
  const chatRooms: any[] = []
  const chatMessages: any[] = []
  const groupMessages: any[] = []
  
  const snapshot: DataStoreSnapshot = {
    generatedAt: new Date().toISOString(),
    version: '1.0.0',
    counts: {
      users: users.length,
      userProfiles: userProfiles.length,
      userPreferences: userPreferences.length,
      userLevels: userLevels.length,
      groups: groups.length,
      groupMembers: groupMembers.length,
      sessions: sessions.length,
      sessionRsvps: sessionRsvps.length,
      spaces: spaces.length,
      spaceParticipants: spaceParticipants.length,
      spaceInvitations: spaceInvitations.length,
      chatRooms: chatRooms.length,
      chatMessages: chatMessages.length,
      groupMessages: groupMessages.length,
      notifications: notifications.length,
    },
    users: users.map(u => ({
      id: u.id,
      email: u.email,
      username: u.username,
      role: u.role,
      created_at: u.createdAt,
      updated_at: u.updatedAt,
    })),
    userProfiles,
    userPreferences,
    userLevels,
    groups: groups.map(g => ({
      id: g.id,
      title: g.title,
      description: g.description,
      owner_id: g.ownerId,
      privacy: g.privacy,
      topics: g.topics || [],
      location: g.location,
      avatar: g.avatar,
      member_count: g.memberCount,
      created_at: g.createdAt,
      updated_at: g.updatedAt,
    })),
    groupMembers,
    sessions: sessions.map(s => ({
      id: s.id,
      title: s.title,
      description: s.description,
      host_id: s.hostId,
      group_id: s.groupId,
      location: s.location,
      start_at: s.startAt,
      end_at: s.endAt,
      capacity: s.capacity,
      privacy: s.privacy,
      created_at: s.createdAt,
      updated_at: s.updatedAt,
    })),
    sessionRsvps,
    spaces: spaces.map(sp => ({
      id: sp.id,
      group_id: sp.groupId,
      host_id: sp.hostId,
      title: sp.title,
      description: sp.description,
      type: sp.type,
      privacy: sp.privacy,
      status: sp.status,
      max_participants: sp.maxParticipants,
      audio_enabled: sp.audioEnabled,
      video_enabled: sp.videoEnabled,
      screenshare_enabled: sp.screenShareEnabled,
      started_at: sp.startedAt,
      ended_at: sp.endedAt,
      scheduled_for: sp.scheduledFor,
      session_id: sp.sessionId,
      chat_room_id: sp.chatRoomId,
      peak_participants: sp.peakParticipants,
      total_joins: sp.totalJoins,
      room_name: sp.roomName,
      room_url: sp.roomUrl,
      created_at: sp.createdAt,
      updated_at: sp.updatedAt,
    })),
    spaceParticipants,
    spaceInvitations,
    chatRooms,
    chatMessages,
    groupMessages,
    notifications,
  }
  
  console.error('[Export] Snapshot complete:', snapshot.counts)
  return snapshot
}

// Execute if run as script
if (require.main === module) {
  exportDataStore()
    .then(snapshot => {
      console.log(JSON.stringify(snapshot, null, 2))
      console.error('[Export] Success! Pipe stdout to a file.')
    })
    .catch(err => {
      console.error('[Export] Failed:', err)
      process.exit(1)
    })
}

export { exportDataStore }
