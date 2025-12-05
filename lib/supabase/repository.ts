/**
 * Supabase Repository
 * 
 * Implements the IDataRepository interface using Supabase as the backend.
 * Provides a drop-in replacement for the in-memory DataStore.
 */

import { createServerClient } from './client'
import type { Database } from './database.types'
import type {
  UserProfile,
  Group,
  GroupMember,
  Session,
  RSVP,
  Space,
  SpaceParticipant,
  SpaceInvitation,
  Notification,
  UserLevelData,
  UserPreferences,
  ChatRoom,
  ChatMessage,
} from '@/types'

type SupabaseClient = ReturnType<typeof createServerClient>

export class SupabaseRepository {
  private supabase: SupabaseClient

  constructor() {
    this.supabase = createServerClient()
  }

  // ============================================================================
  // USERS
  // ============================================================================

  async getUser(userId: string): Promise<UserProfile | undefined> {
    const { data: user, error: userError } = (await this.supabase
      .from('users')
      .select('*, user_profiles(*)')
      .eq('id', userId)
      .single()) as any

    if (userError || !user) return undefined

    const profile = user.user_profiles?.[0]

    return {
      id: user.id,
      username: user.username,
      email: user.email || undefined,
      role: user.role as 'user' | 'admin',
      name: profile?.name || user.username,
      avatar: profile?.avatar || undefined,
      bio: profile?.bio || undefined,
      major: profile?.major || undefined,
      year: profile?.year || undefined,
      topics: profile?.topics || [],
      squads: profile?.squads || [],
      createdAt: new Date(user.created_at),
      updatedAt: new Date(user.updated_at),
    }
  }

  async getUserByEmail(email: string): Promise<UserProfile | undefined> {
    const { data: user } = (await this.supabase
      .from('users')
      .select('*, user_profiles(*)')
      .eq('email', email)
      .single()) as any

    if (!user) return undefined

    const profile = user.user_profiles?.[0]

    return {
      id: user.id,
      username: user.username,
      email: user.email || undefined,
      role: user.role as 'user' | 'admin',
      name: profile?.name || user.username,
      avatar: profile?.avatar || undefined,
      bio: profile?.bio || undefined,
      major: profile?.major || undefined,
      year: profile?.year || undefined,
      topics: profile?.topics || [],
      squads: profile?.squads || [],
      createdAt: new Date(user.created_at),
      updatedAt: new Date(user.updated_at),
    }
  }

  async getAllUsers(): Promise<UserProfile[]> {
    const { data: users } = (await this.supabase
      .from('users')
      .select('*, user_profiles(*)')
      .order('created_at', { ascending: false })) as any

    if (!users) return []

    return users.map((user: any) => {
      const profile = user.user_profiles?.[0]
      return {
        id: user.id,
        username: user.username,
        email: user.email || undefined,
        role: user.role as 'user' | 'admin',
        name: profile?.name || user.username,
        avatar: profile?.avatar || undefined,
        bio: profile?.bio || undefined,
        major: profile?.major || undefined,
        year: profile?.year || undefined,
        topics: profile?.topics || [],
        squads: profile?.squads || [],
        createdAt: new Date(user.created_at),
        updatedAt: new Date(user.updated_at),
      }
    })
  }

  // ============================================================================
  // GROUPS
  // ============================================================================

  async getGroup(groupId: string): Promise<Group | undefined> {
    const { data: group } = (await this.supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single()) as any

    if (!group) return undefined

    return {
      id: group.id,
      title: group.title,
      description: group.description || '',
      ownerId: group.owner_id || '',
      privacy: group.privacy as any,
      topics: group.topics || [],
      location: group.location || undefined,
      avatar: group.avatar || undefined,
      memberCount: group.member_count,
      createdAt: new Date(group.created_at),
      updatedAt: new Date(group.updated_at),
    }
  }

  async getAllGroups(): Promise<Group[]> {
    const { data: groups } = (await this.supabase
      .from('groups')
      .select('*')
      .order('updated_at', { ascending: false })) as any

    if (!groups) return []

    return groups.map((g: any) => ({
      id: g.id,
      title: g.title,
      description: g.description || '',
      ownerId: g.owner_id || '',
      privacy: g.privacy as any,
      topics: g.topics || [],
      location: g.location || undefined,
      avatar: g.avatar || undefined,
      memberCount: g.member_count,
      createdAt: new Date(g.created_at),
      updatedAt: new Date(g.updated_at),
    }))
  }

  async getPublicGroups(): Promise<Group[]> {
    const { data: groups } = (await this.supabase
      .from('groups')
      .select(`
        *,
        group_members (
          user_id,
          role,
          joined_at
        )
      `)
      .eq('privacy', 'public')
      .order('updated_at', { ascending: false })) as any

    if (!groups) return []

    return groups.map((g: any) => ({
      id: g.id,
      title: g.title,
      description: g.description || '',
      ownerId: g.owner_id || '',
      privacy: g.privacy as any,
      topics: g.topics || [],
      location: g.location || undefined,
      avatar: g.avatar || undefined,
      memberCount: g.member_count,
      members: (g.group_members || []).map((m: any) => ({
        userId: m.user_id,
        role: m.role,
        joinedAt: new Date(m.joined_at),
      })),
      createdAt: new Date(g.created_at),
      updatedAt: new Date(g.updated_at),
    }))
  }

  async getUserGroups(userId: string): Promise<Group[]> {
    // Get all groups where user is a member (including owned groups)
    const { data: memberships } = (await this.supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId)) as any

    if (!memberships || memberships.length === 0) return []

    const groupIds = memberships.map((m: any) => m.group_id)

    const { data: groups } = (await this.supabase
      .from('groups')
      .select(`
        *,
        group_members (
          user_id,
          role,
          joined_at
        )
      `)
      .in('id', groupIds)
      .order('updated_at', { ascending: false })) as any

    if (!groups) return []

    return groups.map((g: any) => ({
      id: g.id,
      title: g.title,
      description: g.description || '',
      ownerId: g.owner_id || '',
      privacy: g.privacy as any,
      topics: g.topics || [],
      location: g.location || undefined,
      avatar: g.avatar || undefined,
      memberCount: g.member_count,
      members: (g.group_members || []).map((m: any) => ({
        userId: m.user_id,
        role: m.role,
        joinedAt: new Date(m.joined_at),
      })),
      createdAt: new Date(g.created_at),
      updatedAt: new Date(g.updated_at),
    }))
  }

  async createGroup(input: {
    ownerId: string
    title: string
    description: string
    privacy?: string
    topics?: string[]
    location?: string
    avatar?: string
  }): Promise<Group> {
    const { data: group, error } = (await ((this.supabase as any)
      .from('groups')
      .insert({
        title: input.title,
        description: input.description,
        owner_id: input.ownerId,
        privacy: input.privacy || 'public',
        topics: input.topics || [],
        location: input.location,
        avatar: input.avatar,
      })
      .select()
      .single())) as any

    if (error || !group) {
      throw new Error(`Failed to create group: ${error?.message}`)
    }

    // Add owner as first member
    await ((this.supabase as any).from('group_members').insert({
      group_id: group.id,
      user_id: input.ownerId,
      role: 'owner',
    }))

    return {
      id: group.id,
      title: group.title,
      description: group.description || '',
      ownerId: group.owner_id || '',
      privacy: group.privacy as any,
      topics: group.topics || [],
      location: group.location || undefined,
      avatar: group.avatar || undefined,
      memberCount: 1,
      createdAt: new Date(group.created_at),
      updatedAt: new Date(group.updated_at),
    }
  }

  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    const { data: members } = (await this.supabase
      .from('group_members')
      .select('*')
      .eq('group_id', groupId)
      .order('joined_at', { ascending: true })) as any

    if (!members) return []

    return members.map((m: any) => ({
      id: m.id,
      groupId: m.group_id,
      userId: m.user_id,
      role: m.role as any,
      joinedAt: new Date(m.joined_at),
    }))
  }

  async addGroupMember(groupId: string, userId: string, role: 'owner' | 'moderator' | 'member' = 'member'): Promise<GroupMember | undefined> {
    const { data: member, error } = await ((this.supabase as any)
      .from('group_members')
      .insert({
        group_id: groupId,
        user_id: userId,
        role,
        joined_at: new Date().toISOString(),
      })
      .select()
      .single()) as any

    if (error || !member) {
      console.error('Error adding group member:', error)
      return undefined
    }

    // Update group member count - fetch current count and increment
    const { data: group } = await ((this.supabase as any)
      .from('groups')
      .select('member_count')
      .eq('id', groupId)
      .single()) as any
    
    if (group) {
      await ((this.supabase as any)
        .from('groups')
        .update({ member_count: (group.member_count || 0) + 1 })
        .eq('id', groupId))
    }

    return {
      id: member.id,
      groupId: member.group_id,
      userId: member.user_id,
      role: member.role as any,
      joinedAt: new Date(member.joined_at),
    }
  }

  // ============================================================================
  // SPACES
  // ============================================================================

  async getSpace(spaceId: string): Promise<Space | undefined> {
    const { data: space } = (await this.supabase
      .from('spaces')
      .select('*')
      .eq('id', spaceId)
      .single()) as any

    if (!space) return undefined

    return this.mapSpaceFromDb(space)
  }

  async getGroupSpaces(groupId: string, status?: 'live' | 'ended' | 'scheduled'): Promise<Space[]> {
    let query = this.supabase
      .from('spaces')
      .select('*')
      .eq('group_id', groupId)

    if (status) {
      query = query.eq('status', status)
    }

    const { data: spaces } = (await query.order('started_at', { ascending: false })) as any

    if (!spaces) return []

    return spaces.map((s: any) => this.mapSpaceFromDb(s))
  }

  async getLiveSpaces(): Promise<Space[]> {
    const { data: spaces } = (await this.supabase
      .from('spaces')
      .select('*')
      .eq('status', 'live')
      .order('started_at', { ascending: false })) as any

    if (!spaces) return []

    return spaces.map((s: any) => this.mapSpaceFromDb(s))
  }

  async getSpaceParticipants(spaceId: string): Promise<SpaceParticipant[]> {
    const { data: participants } = (await this.supabase
      .from('space_participants')
      .select('*')
      .eq('space_id', spaceId)
      .order('joined_at', { ascending: true })) as any

    if (!participants) return []

    return participants.map((p: any) => ({
      id: p.id,
      spaceId: p.space_id,
      userId: p.user_id,
      role: p.role as any,
      audioMuted: p.audio_muted,
      videoMuted: p.video_muted,
      handRaised: p.hand_raised,
      screenSharing: p.screen_sharing,
      connectionStatus: p.connection_status as any,
      joinedAt: new Date(p.joined_at),
      leftAt: p.left_at ? new Date(p.left_at) : undefined,
    }))
  }

  async getActiveSpaceParticipants(spaceId: string): Promise<SpaceParticipant[]> {
    const { data: participants } = (await this.supabase
      .from('space_participants')
      .select('*')
      .eq('space_id', spaceId)
      .is('left_at', null)
      .order('joined_at', { ascending: true })) as any

    if (!participants) return []

    return participants.map((p: any) => ({
      id: p.id,
      spaceId: p.space_id,
      userId: p.user_id,
      role: p.role as any,
      audioMuted: p.audio_muted,
      videoMuted: p.video_muted,
      handRaised: p.hand_raised,
      screenSharing: p.screen_sharing,
      connectionStatus: p.connection_status as any,
      joinedAt: new Date(p.joined_at),
      leftAt: p.left_at ? new Date(p.left_at) : undefined,
    }))
  }

  async createSpace(input: {
    groupId: string
    hostId: string
    title: string
    description?: string
    type: string
    privacy: string
    maxParticipants: number
    audioEnabled: boolean
    videoEnabled: boolean
    screenShareEnabled: boolean
    roomName?: string
    roomUrl?: string
  }): Promise<Space | undefined> {
    const { data: space, error } = (await ((this.supabase as any)
      .from('spaces')
      .insert([
        {
          group_id: input.groupId,
          host_id: input.hostId,
          title: input.title,
          description: input.description || null,
          type: input.type,
          privacy: input.privacy,
          status: 'live',
          max_participants: input.maxParticipants,
          audio_enabled: input.audioEnabled,
          video_enabled: input.videoEnabled,
          screenshare_enabled: input.screenShareEnabled,
          started_at: new Date().toISOString(),
          peak_participants: 1,
          total_joins: 1,
          room_name: input.roomName || null,
          room_url: input.roomUrl || null,
        },
      ])
      .select()
      .single())) as any

    if (error || !space) {
      console.error('Error creating space:', error)
      return undefined
    }

    // Add host as first participant
    await ((this.supabase as any)
      .from('space_participants')
      .insert([
        {
          space_id: space.id,
          user_id: input.hostId,
          role: 'host',
          audio_muted: false,
          video_muted: false,
          hand_raised: false,
          screen_sharing: false,
          connection_status: 'connected',
          joined_at: new Date().toISOString(),
        },
      ]))

    return this.mapSpaceFromDb(space)
  }

  async updateSpace(
    spaceId: string,
    updates: {
      title?: string
      description?: string
      maxParticipants?: number
      audioEnabled?: boolean
      videoEnabled?: boolean
      screenShareEnabled?: boolean
    }
  ): Promise<Space | undefined> {
    const updateData: any = {}
    if (updates.title !== undefined) updateData.title = updates.title
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.maxParticipants !== undefined) updateData.max_participants = updates.maxParticipants
    if (updates.audioEnabled !== undefined) updateData.audio_enabled = updates.audioEnabled
    if (updates.videoEnabled !== undefined) updateData.video_enabled = updates.videoEnabled
    if (updates.screenShareEnabled !== undefined) updateData.screenshare_enabled = updates.screenShareEnabled
    updateData.updated_at = new Date().toISOString()

    const { data: space, error } = (await ((this.supabase as any)
      .from('spaces')
      .update(updateData)
      .eq('id', spaceId)
      .select()
      .single())) as any

    if (error || !space) {
      console.error('Error updating space:', error)
      return undefined
    }

    return this.mapSpaceFromDb(space)
  }

  async endSpace(spaceId: string): Promise<Space | undefined> {
    const { data: space, error } = (await ((this.supabase as any)
      .from('spaces')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', spaceId)
      .select()
      .single())) as any

    if (error || !space) {
      console.error('Error ending space:', error)
      return undefined
    }

    return this.mapSpaceFromDb(space)
  }

  async startSpace(spaceId: string, roomName?: string, roomUrl?: string): Promise<Space | undefined> {
    const updateData: any = {
      status: 'live',
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    
    if (roomName) updateData.room_name = roomName
    if (roomUrl) updateData.room_url = roomUrl

    const { data: space, error } = (await ((this.supabase as any)
      .from('spaces')
      .update(updateData)
      .eq('id', spaceId)
      .select()
      .single())) as any

    if (error || !space) {
      console.error('Error starting space:', error)
      return undefined
    }

    return this.mapSpaceFromDb(space)
  }

  async deleteSpace(spaceId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('spaces')
      .delete()
      .eq('id', spaceId)

    if (error) {
      console.error('Error deleting space:', error)
      return false
    }

    return true
  }

  async joinSpace(
    spaceId: string,
    userId: string,
    role: 'host' | 'co-host' | 'speaker' | 'listener' = 'listener'
  ): Promise<SpaceParticipant | undefined> {
    // Check if user already in space
    const { data: existing } = (await this.supabase
      .from('space_participants')
      .select('*')
      .eq('space_id', spaceId)
      .eq('user_id', userId)
      .is('left_at', null)
      .maybeSingle()) as any

    if (existing) {
      return {
        id: existing.id,
        spaceId: existing.space_id,
        userId: existing.user_id,
        role: existing.role as any,
        audioMuted: existing.audio_muted,
        videoMuted: existing.video_muted,
        handRaised: existing.hand_raised,
        screenSharing: existing.screen_sharing,
        connectionStatus: existing.connection_status as any,
        joinedAt: new Date(existing.joined_at),
        leftAt: existing.left_at ? new Date(existing.left_at) : undefined,
      }
    }

    // Add as new participant
    const { data: participant, error } = await ((this.supabase as any)
      .from('space_participants')
      .insert([
        {
          space_id: spaceId,
          user_id: userId,
          role,
          audio_muted: true,
          video_muted: true,
          hand_raised: false,
          screen_sharing: false,
          connection_status: 'connected',
          joined_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()) as any

    if (error || !participant) {
      console.error('Error joining space:', error)
      return undefined
    }

    return {
      id: participant.id,
      spaceId: participant.space_id,
      userId: participant.user_id,
      role: participant.role as any,
      audioMuted: participant.audio_muted,
      videoMuted: participant.video_muted,
      handRaised: participant.hand_raised,
      screenSharing: participant.screen_sharing,
      connectionStatus: participant.connection_status as any,
      joinedAt: new Date(participant.joined_at),
      leftAt: participant.left_at ? new Date(participant.left_at) : undefined,
    }
  }

  async leaveSpace(spaceId: string, userId: string): Promise<boolean> {
    const { error } = await ((this.supabase as any)
      .from('space_participants')
      .update({ left_at: new Date().toISOString() })
      .eq('space_id', spaceId)
      .eq('user_id', userId)
      .is('left_at', null))

    if (error) {
      console.error('Error leaving space:', error)
      return false
    }

    return true
  }

  async setParticipantHand(spaceId: string, userId: string, handRaised: boolean): Promise<SpaceParticipant | undefined> {
    const { data: updated, error } = await ((this.supabase as any)
      .from('space_participants')
      .update({ hand_raised: handRaised, updated_at: new Date().toISOString() })
      .eq('space_id', spaceId)
      .eq('user_id', userId)
      .is('left_at', null)
      .select('*')
      .single()) as any

    if (error || !updated) {
      console.error('Error updating hand status:', error)
      return undefined
    }

    return {
      id: updated.id,
      spaceId: updated.space_id,
      userId: updated.user_id,
      role: updated.role as any,
      audioMuted: updated.audio_muted,
      videoMuted: updated.video_muted,
      handRaised: updated.hand_raised,
      screenSharing: updated.screen_sharing,
      connectionStatus: updated.connection_status as any,
      joinedAt: new Date(updated.joined_at),
      leftAt: updated.left_at ? new Date(updated.left_at) : undefined,
    }
  }

  async updateSpaceParticipantRole(
    spaceId: string,
    userId: string,
    role: 'host' | 'co-host' | 'speaker' | 'listener'
  ): Promise<SpaceParticipant | undefined> {
    const { data: updated, error } = await ((this.supabase as any)
      .from('space_participants')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('space_id', spaceId)
      .eq('user_id', userId)
      .is('left_at', null)
      .select('*')
      .single()) as any

    if (error || !updated) {
      console.error('Error updating participant role:', error)
      return undefined
    }

    return {
      id: updated.id,
      spaceId: updated.space_id,
      userId: updated.user_id,
      role: updated.role as any,
      audioMuted: updated.audio_muted,
      videoMuted: updated.video_muted,
      handRaised: updated.hand_raised,
      screenSharing: updated.screen_sharing,
      connectionStatus: updated.connection_status as any,
      joinedAt: new Date(updated.joined_at),
      leftAt: updated.left_at ? new Date(updated.left_at) : undefined,
    }
  }

  // ============================================================================
  // NOTIFICATIONS
  // ============================================================================

  async getUserNotifications(userId: string, limit?: number): Promise<Notification[]> {
    let query = (this.supabase as any)
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    const { data: notifications } = await query as any

    if (!notifications) return []

    return notifications.map((n: any) => ({
      id: n.id,
      userId: n.user_id,
      type: n.type as any,
      title: n.title,
      message: n.message,
      read: !!n.read_at,
      actionUrl: n.action_url || undefined,
      relatedId: n.related_id || undefined,
      createdAt: new Date(n.created_at),
    }))
  }

  async createNotification(input: {
    userId: string
    type: string
    title: string
    message: string
    actionUrl?: string
    relatedId?: string
  }): Promise<Notification> {
    // Build insert object, only including optional fields if they have values
    const insertData: Record<string, any> = {
      user_id: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      read_at: null,
    }
    
    if (input.actionUrl) {
      insertData.action_url = input.actionUrl
    }
    
    if (input.relatedId) {
      insertData.related_id = input.relatedId
    }

    const { data: notification, error } = await ((this.supabase as any)
      .from('notifications')
      .insert(insertData)
      .select()
      .single()) as any

    if (error || !notification) {
      throw new Error(`Failed to create notification: ${error?.message}`)
    }

    return {
      id: notification.id,
      userId: notification.user_id,
      type: notification.type as any,
      title: notification.title,
      message: notification.message,
      read: !!notification.read_at,
      actionUrl: notification.action_url || undefined,
      relatedId: notification.related_id || undefined,
      createdAt: new Date(notification.created_at),
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    const { error } = await ((this.supabase as any)
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId))

    if (error) {
      console.error('Error marking notification as read:', error)
      throw new Error(`Failed to mark notification as read: ${error.message}`)
    }
  }

  // ============================================================================
  // USER LEVELS
  // ============================================================================

  async getUserLevel(userId: string): Promise<UserLevelData | undefined> {
    const { data: level } = await this.supabase
      .from('user_levels')
      .select('*')
      .eq('user_id', userId)
      .single() as any

    if (!level) return undefined

    return {
      userId: level.user_id,
      currentLevel: level.current_level as any,
      totalPoints: level.total_points,
      totalEventsAttended: level.total_events_attended,
      totalSquadsCreated: level.total_squads_created,
      totalMessagesCount: level.total_messages_count,
      loginStreak: level.login_streak,
      achievements: (level.achievements as any) || [],
    }
  }

  async updateUserLevel(userId: string, data: Partial<UserLevelData>): Promise<void> {
    const updateData: any = {}
    if (data.currentLevel !== undefined) updateData.current_level = data.currentLevel
    if (data.totalPoints !== undefined) updateData.total_points = data.totalPoints
    if (data.totalEventsAttended !== undefined) updateData.total_events_attended = data.totalEventsAttended
    if (data.totalSquadsCreated !== undefined) updateData.total_squads_created = data.totalSquadsCreated
    if (data.totalMessagesCount !== undefined) updateData.total_messages_count = data.totalMessagesCount
    if (data.loginStreak !== undefined) updateData.login_streak = data.loginStreak
    if (data.achievements !== undefined) updateData.achievements = data.achievements
    
    updateData.updated_at = new Date().toISOString()

    const { error } = await ((this.supabase as any)
      .from('user_levels')
      .update(updateData)
      .eq('user_id', userId))

    if (error) {
      console.error('Error updating user level:', error)
      throw new Error(`Failed to update user level: ${error.message}`)
    }
  }

  async getLeaderboard(limit: number = 50): Promise<UserLevelData[]> {
    const { data: levels } = await this.supabase
      .from('user_levels')
      .select('*')
      .order('total_points', { ascending: false })
      .limit(limit) as any

    if (!levels) return []

    return levels.map((level: any) => ({
      userId: level.user_id,
      currentLevel: level.current_level as any,
      totalPoints: level.total_points,
      totalEventsAttended: level.total_events_attended,
      totalSquadsCreated: level.total_squads_created,
      totalMessagesCount: level.total_messages_count,
      loginStreak: level.login_streak,
      achievements: (level.achievements as any) || [],
    }))
  }

  // ============================================================================
  // SESSIONS
  // ============================================================================

  async getGroupSessions(groupId: string): Promise<Session[]> {
    const { data: sessions } = (await this.supabase
      .from('sessions')
      .select('*')
      .eq('group_id', groupId)
      .order('start_at', { ascending: false })) as any

    if (!sessions) return []

    return sessions.map((s: any) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      hostId: s.host_id,
      groupId: s.group_id || undefined,
      location: s.location,
      startAt: new Date(s.start_at),
      endAt: new Date(s.end_at),
      capacity: s.capacity || undefined,
      privacy: s.privacy as any,
      createdAt: new Date(s.created_at),
      updatedAt: new Date(s.updated_at),
    }))
  }

  async createSession(input: {
    title: string
    description: string
    hostId: string
    groupId?: string
    location: string
    startAt: Date
    endAt: Date
    capacity?: number
    privacy: 'public' | 'invite-only'
  }): Promise<Session> {
    const { data: session, error } = await ((this.supabase as any)
      .from('sessions')
      .insert({
        title: input.title,
        description: input.description,
        host_id: input.hostId,
        group_id: input.groupId || null,
        location: input.location,
        start_at: input.startAt.toISOString(),
        end_at: input.endAt.toISOString(),
        capacity: input.capacity || null,
        privacy: input.privacy,
      })
      .select()
      .single()) as any

    if (error || !session) {
      console.error('Error creating session:', error)
      throw new Error('Failed to create session')
    }

    return {
      id: session.id,
      title: session.title,
      description: session.description,
      hostId: session.host_id,
      groupId: session.group_id || undefined,
      location: session.location,
      startAt: new Date(session.start_at),
      endAt: new Date(session.end_at),
      capacity: session.capacity || undefined,
      privacy: session.privacy as any,
      createdAt: new Date(session.created_at),
      updatedAt: new Date(session.updated_at),
    }
  }

  // ============================================================================
  // CHAT ROOMS
  // ============================================================================

  async getChatRoom(roomId: string): Promise<ChatRoom | undefined> {
    const { data: room } = await this.supabase
      .from('chat_rooms')
      .select('*')
      .eq('id', roomId)
      .single() as any

    if (!room) return undefined

    // For now, get members from group membership
    // TODO: Consider adding a chat_room_members table if needed
    const members: string[] = []
    if (room.group_id) {
      const groupMembers = await this.getGroupMembers(room.group_id)
      members.push(...groupMembers.map(m => m.userId))
    }

    return {
      id: room.id,
      groupId: room.group_id || '',
      name: room.name,
      topic: room.topic || undefined,
      members,
      messageCount: 0, // TODO: count messages
      createdAt: new Date(room.created_at),
      lastMessageDate: undefined, // TODO: get last message date
    }
  }

  async getChatRoomsByGroup(groupId: string): Promise<ChatRoom[]> {
    const { data: rooms } = await this.supabase
      .from('chat_rooms')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false }) as any

    if (!rooms) return []

    // Get group members for all rooms
    const groupMembers = await this.getGroupMembers(groupId)
    const memberIds = groupMembers.map(m => m.userId)

    return rooms.map((room: any) => ({
      id: room.id,
      groupId: room.group_id || '',
      name: room.name,
      topic: room.topic || undefined,
      members: [...memberIds], // All group members can access
      messageCount: 0, // TODO: count messages for each room
      createdAt: new Date(room.created_at),
      lastMessageDate: undefined, // TODO: get last message date
    }))
  }

  async createChatRoom(input: {
    groupId: string
    name: string
    topic?: string
  }): Promise<ChatRoom> {
    const { data: room, error } = await ((this.supabase as any)
      .from('chat_rooms')
      .insert({
        group_id: input.groupId,
        name: input.name,
        topic: input.topic || null,
      })
      .select()
      .single()) as any

    if (error || !room) {
      throw new Error(`Failed to create chat room: ${error?.message}`)
    }

    // Get group members
    const groupMembers = await this.getGroupMembers(input.groupId)
    const memberIds = groupMembers.map(m => m.userId)

    return {
      id: room.id,
      groupId: room.group_id || '',
      name: room.name,
      topic: room.topic || undefined,
      members: memberIds,
      messageCount: 0,
      createdAt: new Date(room.created_at),
    }
  }

  // ============================================================================
  // CHAT MESSAGES
  // ============================================================================

  async getChatMessages(roomId: string, limit: number = 50, offset: number = 0): Promise<ChatMessage[]> {
    const { data: messages } = await this.supabase
      .from('chat_messages')
      .select(`
        *,
        users (
          username,
          user_levels (
            current_level
          )
        )
      `)
      .eq('chat_room_id', roomId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1) as any

    if (!messages) return []

    // Collect all reply_to_ids to fetch in one query
    const replyToIds = messages
      .filter((msg: any) => msg.reply_to_id)
      .map((msg: any) => msg.reply_to_id)
    
    // Fetch all replied messages in one query
    let replyMap: Record<string, any> = {}
    if (replyToIds.length > 0) {
      const { data: replyMessages } = await this.supabase
        .from('chat_messages')
        .select(`id, sender_id, content, encrypted, users(username)`)
        .in('id', replyToIds)
      
      if (replyMessages) {
        replyMap = Object.fromEntries(
          replyMessages.map((rm: any) => [rm.id, {
            id: rm.id,
            senderId: rm.sender_id,
            senderName: rm.users?.username || 'Unknown',
            content: rm.content,
            encrypted: rm.encrypted || false,
          }])
        )
      }
    }

    return messages.map((msg: any) => ({
      id: msg.id,
      chatRoomId: msg.chat_room_id,
      senderId: msg.sender_id || '',
      senderName: msg.users?.username || 'Unknown',
      senderLevel: (msg.users?.user_levels?.[0]?.current_level as any) || 'Novice',
      content: msg.content,
      reactions: (msg.reactions as any) || {},
      createdAt: new Date(msg.created_at),
      // E2EE fields
      encrypted: msg.encrypted || false,
      nonce: msg.nonce || null,
      keyVersion: msg.key_version || 1,
      // Reply fields
      replyToId: msg.reply_to_id || null,
      replyTo: msg.reply_to_id ? (replyMap[msg.reply_to_id] || null) : null,
      // Media fields
      mediaType: msg.media_type || null,
      mediaUrl: msg.media_url || null,
      mediaThumbnail: msg.media_thumbnail || null,
      mediaWidth: msg.media_width || null,
      mediaHeight: msg.media_height || null,
      mediaProvider: msg.media_provider || null,
    })).reverse() // Reverse to get chronological order
  }

  async createChatMessage(input: {
    chatRoomId: string
    senderId: string
    content: string
    encrypted?: boolean
    nonce?: string
    keyVersion?: number
    replyToId?: string
    mediaType?: 'gif' | 'image' | 'video' | 'audio' | 'file' | 'poll' | 'space'
    mediaUrl?: string
    mediaThumbnail?: string
    mediaWidth?: number
    mediaHeight?: number
    mediaProvider?: string
  }): Promise<ChatMessage> {
    const insertData: any = {
      chat_room_id: input.chatRoomId,
      sender_id: input.senderId,
      content: input.content,
      reactions: {},
      encrypted: input.encrypted || false,
      nonce: input.nonce || null,
      key_version: input.keyVersion || 1,
    }
    
    // Only add reply_to_id if provided
    if (input.replyToId) {
      insertData.reply_to_id = input.replyToId
    }

    // Media fields
    if (input.mediaType) {
      insertData.media_type = input.mediaType
    }
    if (input.mediaUrl) {
      insertData.media_url = input.mediaUrl
    }
    if (input.mediaThumbnail) {
      insertData.media_thumbnail = input.mediaThumbnail
    }
    if (input.mediaWidth) {
      insertData.media_width = input.mediaWidth
    }
    if (input.mediaHeight) {
      insertData.media_height = input.mediaHeight
    }
    if (input.mediaProvider) {
      insertData.media_provider = input.mediaProvider
    }

    const { data: message, error } = await ((this.supabase as any)
      .from('chat_messages')
      .insert(insertData)
      .select(`
        *,
        users (
          username,
          user_levels (
            current_level
          )
        )
      `)
      .single()) as any

    if (error || !message) {
      throw new Error(`Failed to create chat message: ${error?.message}`)
    }

    // Fetch reply_to separately if needed (Supabase self-join can be unreliable)
    let replyToData = null
    if (message.reply_to_id) {
      const { data: replyMsg } = await this.supabase
        .from('chat_messages')
        .select(`id, sender_id, content, encrypted, users(username)`)
        .eq('id', message.reply_to_id)
        .single()
      
      if (replyMsg) {
        replyToData = {
          id: replyMsg.id,
          senderId: replyMsg.sender_id,
          senderName: (replyMsg as any).users?.username || 'Unknown',
          content: replyMsg.content,
          encrypted: replyMsg.encrypted || false,
        }
      }
    }

    return {
      id: message.id,
      chatRoomId: message.chat_room_id,
      senderId: message.sender_id || '',
      senderName: message.users?.username || 'Unknown',
      senderLevel: (message.users?.user_levels?.[0]?.current_level as any) || 'Novice',
      content: message.content,
      reactions: (message.reactions as any) || {},
      createdAt: new Date(message.created_at),
      // E2EE fields
      encrypted: message.encrypted || false,
      nonce: message.nonce || null,
      keyVersion: message.key_version || 1,
      // Reply fields
      replyToId: message.reply_to_id || null,
      replyTo: replyToData,
      // Media fields
      mediaType: message.media_type || null,
      mediaUrl: message.media_url || null,
      mediaThumbnail: message.media_thumbnail || null,
      mediaWidth: message.media_width || null,
      mediaHeight: message.media_height || null,
      mediaProvider: message.media_provider || null,
    }
  }

  // ============================================================================
  // SPACE TYPE QUERIES
  // ============================================================================

  async getSpacesByType(type: string, groupId?: string): Promise<Space[]> {
    let query = this.supabase
      .from('spaces')
      .select('*')
      .eq('type', type)

    if (groupId) {
      query = query.eq('group_id', groupId)
    }

    const { data: spaces } = (await query.order('created_at', { ascending: false })) as any

    if (!spaces) return []

    return spaces.map((s: any) => this.mapSpaceFromDb(s))
  }

  async getPublicSpaces(groupId?: string): Promise<Space[]> {
    let query = this.supabase
      .from('spaces')
      .select('*')
      .eq('privacy', 'public')

    if (groupId) {
      query = query.eq('group_id', groupId)
    }

    const { data: spaces } = (await query.order('created_at', { ascending: false })) as any

    if (!spaces) return []

    return spaces.map((s: any) => this.mapSpaceFromDb(s))
  }

  async getPrivateSpaces(groupId: string): Promise<Space[]> {
    const { data: spaces } = (await this.supabase
      .from('spaces')
      .select('*')
      .eq('group_id', groupId)
      .eq('privacy', 'private')
      .order('created_at', { ascending: false })) as any

    if (!spaces) return []

    return spaces.map((s: any) => this.mapSpaceFromDb(s))
  }

  async getScheduledSpaces(groupId?: string): Promise<Space[]> {
    let query = this.supabase
      .from('spaces')
      .select('*')
      .eq('status', 'scheduled')

    if (groupId) {
      query = query.eq('group_id', groupId)
    }

    const { data: spaces } = (await query.order('scheduled_for', { ascending: true })) as any

    if (!spaces) return []

    return spaces.map((s: any) => this.mapSpaceFromDb(s))
  }

  async getSpacesByHost(hostId: string): Promise<Space[]> {
    const { data: spaces } = (await this.supabase
      .from('spaces')
      .select('*')
      .eq('host_id', hostId)
      .order('created_at', { ascending: false })) as any

    if (!spaces) return []

    return spaces.map((s: any) => this.mapSpaceFromDb(s))
  }

  async getUpcomingSpaces(groupId?: string, hoursAhead: number = 24): Promise<Space[]> {
    const now = new Date()
    const futureTime = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000)

    let query = this.supabase
      .from('spaces')
      .select('*')
      .eq('status', 'scheduled')
      .gte('scheduled_for', now.toISOString())
      .lte('scheduled_for', futureTime.toISOString())

    if (groupId) {
      query = query.eq('group_id', groupId)
    }

    const { data: spaces } = (await query.order('scheduled_for', { ascending: true })) as any

    if (!spaces) return []

    return spaces.map((s: any) => this.mapSpaceFromDb(s))
  }

  // ============================================================================
  // SPACE ENGAGEMENT
  // ============================================================================

  async trackEngagement(spaceId: string, userId: string, data: {
    speakingTime?: number
    reactions?: number
    questionsAsked?: number
    questionsAnswered?: number
    handsRaised?: number
    screenShareTime?: number
  }): Promise<boolean> {
    const { error } = await ((this.supabase as any)
      .from('space_engagement_metrics')
      .insert({
        space_id: spaceId,
        user_id: userId,
        speaking_time: data.speakingTime || 0,
        reactions_count: data.reactions || 0,
        questions_asked: data.questionsAsked || 0,
        questions_answered: data.questionsAnswered || 0,
        hands_raised: data.handsRaised || 0,
        screenshare_time: data.screenShareTime || 0,
      }))

    if (error) {
      console.error('Error tracking engagement:', error)
      return false
    }

    return true
  }

  async logSpaceActivity(spaceId: string, userId: string, action: string, metadata?: any): Promise<boolean> {
    const { error } = await ((this.supabase as any)
      .from('space_activity_logs')
      .insert({
        space_id: spaceId,
        user_id: userId,
        action,
        metadata: metadata || {},
      }))

    if (error) {
      console.error('Error logging space activity:', error)
      return false
    }

    return true
  }

  // ============================================================================
  // PRIVATE SPACE ACCESS
  // ============================================================================

  async getPrivateSpaceAccess(spaceId: string, userId: string): Promise<boolean> {
    const { data: access } = (await this.supabase
      .from('private_space_access')
      .select('*')
      .eq('space_id', spaceId)
      .eq('user_id', userId)
      .single()) as any

    if (!access) return false

    // Check if access has expired
    if (access.expires_at && new Date(access.expires_at) < new Date()) {
      return false
    }

    return access.access_level === 'approved'
  }

  async grantPrivateSpaceAccess(
    spaceId: string,
    userId: string,
    accessLevel: 'pending' | 'approved' | 'denied',
    expiresAt?: Date
  ): Promise<boolean> {
    const { error } = await ((this.supabase as any)
      .from('private_space_access')
      .insert({
        space_id: spaceId,
        user_id: userId,
        access_level: accessLevel,
        expires_at: expiresAt?.toISOString() || null,
      }))

    if (error) {
      console.error('Error granting private space access:', error)
      return false
    }

    return true
  }

  async revokePrivateSpaceAccess(spaceId: string, userId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('private_space_access')
      .delete()
      .eq('space_id', spaceId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error revoking private space access:', error)
      return false
    }

    return true
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  private mapSpaceFromDb(space: any): Space {
    return {
      id: space.id,
      groupId: space.group_id,
      hostId: space.host_id || '',
      title: space.title,
      description: space.description || undefined,
      type: space.type as any,
      privacy: space.privacy as any,
      status: space.status as any,
      coHostIds: [], // TODO: implement co-hosts
      participants: [], // TODO: populate from participants
      maxParticipants: space.max_participants,
      audioEnabled: space.audio_enabled,
      videoEnabled: space.video_enabled,
      screenShareEnabled: space.screenshare_enabled,
      startedAt: new Date(space.started_at),
      endedAt: space.ended_at ? new Date(space.ended_at) : undefined,
      scheduledFor: space.scheduled_for ? new Date(space.scheduled_for) : undefined,
      sessionId: space.session_id || undefined,
      chatRoomId: space.chat_room_id || undefined,
      peakParticipants: space.peak_participants,
      totalJoins: space.total_joins,
      roomName: space.room_name || undefined,
      roomUrl: space.room_url || undefined,
      createdAt: new Date(space.created_at),
      updatedAt: new Date(space.updated_at),
    }
  }

  async getSpaceInvitations(spaceId: string): Promise<SpaceInvitation[]> {
    const { data: invitations } = (await this.supabase
      .from('space_invitations')
      .select('*')
      .eq('space_id', spaceId)) as any

    if (!invitations) return []

    return invitations.map((inv: any) => ({
      id: inv.id,
      spaceId: inv.space_id,
      invitedUserId: inv.invited_user_id,
      invitedByUserId: inv.invited_by_user_id,
      status: inv.status as any,
      invitedAt: new Date(inv.invited_at),
      respondedAt: inv.responded_at ? new Date(inv.responded_at) : undefined,
    }))
  }

  // ============================================================================
  // E2EE - PUBLIC KEYS
  // ============================================================================

  async getUserPublicKey(userId: string): Promise<{ publicKey: string; keyId: string; createdAt: string } | null> {
    const { data, error } = await this.supabase
      .from('user_public_keys' as any)
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !data) return null
    
    const d = data as any
    return {
      publicKey: d.public_key,
      keyId: d.key_id,
      createdAt: d.created_at,
    }
  }

  async upsertUserPublicKey(userId: string, publicKey: string, keyId: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await this.supabase
      .from('user_public_keys' as any)
      .upsert({
        user_id: userId,
        public_key: publicKey,
        key_id: keyId,
        updated_at: new Date().toISOString(),
      } as any, { onConflict: 'user_id' })

    if (error) return { success: false, error: error.message }
    return { success: true }
  }

  // ============================================================================
  // E2EE - GROUP KEYS
  // ============================================================================

  async getGroupKey(roomId: string, userId: string): Promise<{ wrappedKey: string; keyVersion: number; createdAt: string } | null> {
    const { data, error } = await this.supabase
      .from('group_key_bundles' as any)
      .select('*')
      .eq('chat_room_id', roomId)
      .eq('user_id', userId)
      .order('key_version', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) return null
    
    const d = data as any
    return {
      wrappedKey: d.wrapped_key,
      keyVersion: d.key_version,
      createdAt: d.created_at,
    }
  }

  async upsertGroupKeys(records: Array<{
    chatRoomId: string
    userId: string
    wrappedKey: string
    keyVersion: number
    createdBy: string
  }>): Promise<{ success: boolean; error?: string }> {
    const { error } = await this.supabase
      .from('group_key_bundles' as any)
      .upsert(
        records.map(r => ({
          chat_room_id: r.chatRoomId,
          user_id: r.userId,
          wrapped_key: r.wrappedKey,
          key_version: r.keyVersion,
          created_by: r.createdBy,
        })) as any,
        { onConflict: 'chat_room_id,user_id,key_version' }
      )

    if (error) return { success: false, error: error.message }
    return { success: true }
  }

  async enableRoomEncryption(roomId: string, keyVersion: number): Promise<{ success: boolean; error?: string }> {
    const { error } = (await ((this.supabase as any)
      .from('chat_rooms')
      .update({
        encryption_enabled: true,
        current_key_version: keyVersion,
      })
      .eq('id', roomId))) as any

    if (error) return { success: false, error: error.message }
    return { success: true }
  }

  // ============================================================================
  // E2EE - ROOM INFO
  // ============================================================================

  async getChatRoomWithEncryption(roomId: string): Promise<{
    id: string
    groupId: string
    name: string
    topic?: string
    encryptionEnabled: boolean
    currentKeyVersion: number
    createdAt: string
    updatedAt: string
  } | null> {
    const { data: room, error } = await this.supabase
      .from('chat_rooms')
      .select('*')
      .eq('id', roomId)
      .single()

    if (error || !room) return null
    
    const r = room as any
    return {
      id: r.id,
      groupId: r.group_id,
      name: r.name,
      topic: r.topic,
      encryptionEnabled: r.encryption_enabled || false,
      currentKeyVersion: r.current_key_version || 1,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }
  }

  async getRoomMemberPublicKeys(roomId: string): Promise<Array<{
    userId: string
    publicKey: string
    keyId: string
  }>> {
    // First get the room to find the group
    const { data: room } = await this.supabase
      .from('chat_rooms')
      .select('group_id')
      .eq('id', roomId)
      .single()

    if (!room) return []

    const r = room as any
    
    // Get all members of the group
    const members = await this.getGroupMembers(r.group_id)
    const memberIds = members.map(m => m.userId)

    if (memberIds.length === 0) return []

    // Get public keys for those members
    const { data: keys } = await this.supabase
      .from('user_public_keys' as any)
      .select('*')
      .in('user_id', memberIds)

    if (!keys) return []

    return (keys as any[]).map((k: any) => ({
      userId: k.user_id,
      publicKey: k.public_key,
      keyId: k.key_id,
    }))
  }

  async updateChatRoom(roomId: string, userId: string, updates: { name?: string; topic?: string }): Promise<{ success: boolean; error?: string }> {
    // Get room to verify group membership
    const { data: room, error: roomError } = await this.supabase
      .from('chat_rooms')
      .select('group_id')
      .eq('id', roomId)
      .single()

    if (roomError || !room) {
      return { success: false, error: 'Room not found' }
    }

    const r = room as any
    
    // Check if user is member of the group
    const members = await this.getGroupMembers(r.group_id)
    const isMember = members.some(m => m.userId === userId)
    const isOwnerOrModerator = members.some(
      m => m.userId === userId && (m.role === 'owner' || m.role === 'moderator')
    )

    if (!isMember) {
      return { success: false, error: 'Not a member of this room' }
    }

    if (!isOwnerOrModerator) {
      return { success: false, error: 'Only owners or moderators can update room settings' }
    }

    const updatePayload: any = { updated_at: new Date().toISOString() }
    if (updates.name) updatePayload.name = updates.name
    if (updates.topic !== undefined) updatePayload.topic = updates.topic

    const { error: updateError } = (await ((this.supabase as any)
      .from('chat_rooms')
      .update(updatePayload)
      .eq('id', roomId))) as any

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    return { success: true }
  }

  // ============================================================================
  // MESSAGE REACTIONS
  // ============================================================================

  async getMessageReactions(messageId: string): Promise<Record<string, string[]>> {
    const { data } = (await this.supabase
      .from('message_reactions')
      .select('emoji, user_id')
      .eq('message_id', messageId)) as any

    if (!data) return {}

    // Group by emoji -> userIds
    const reactions: Record<string, string[]> = {}
    for (const r of data) {
      if (!reactions[r.emoji]) {
        reactions[r.emoji] = []
      }
      reactions[r.emoji].push(r.user_id)
    }
    return reactions
  }

  async addMessageReaction(messageId: string, userId: string, emoji: string): Promise<{ success: boolean; error?: string }> {
    const { error } = (await ((this.supabase as any)
      .from('message_reactions')
      .upsert({
        message_id: messageId,
        user_id: userId,
        emoji,
      }, { onConflict: 'message_id,user_id,emoji' }))) as any

    if (error) return { success: false, error: error.message }
    return { success: true }
  }

  async removeMessageReaction(messageId: string, userId: string, emoji: string): Promise<{ success: boolean; error?: string }> {
    const { error } = (await this.supabase
      .from('message_reactions')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', userId)
      .eq('emoji', emoji)) as any

    if (error) return { success: false, error: error.message }
    return { success: true }
  }

  // ============================================================================
  // TYPING INDICATORS
  // ============================================================================

  async getTypingUsers(roomId: string): Promise<Array<{ userId: string; userName: string; startedAt: string }>> {
    const { data } = (await this.supabase
      .from('typing_indicators')
      .select('user_id, started_at, users(username, user_profiles(name))')
      .eq('chat_room_id', roomId)
      .gt('started_at', new Date(Date.now() - 10000).toISOString())) as any

    if (!data) return []

    return data.map((t: any) => ({
      userId: t.user_id,
      userName: t.users?.user_profiles?.[0]?.name || t.users?.username || 'Unknown',
      startedAt: t.started_at,
    }))
  }

  async setTyping(roomId: string, userId: string, isTyping: boolean): Promise<void> {
    if (isTyping) {
      await ((this.supabase as any)
        .from('typing_indicators')
        .upsert({
          chat_room_id: roomId,
          user_id: userId,
          started_at: new Date().toISOString(),
        }, { onConflict: 'user_id,chat_room_id' }))
    } else {
      await this.supabase
        .from('typing_indicators')
        .delete()
        .eq('chat_room_id', roomId)
        .eq('user_id', userId)
    }
  }

  // ============================================================================
  // READ RECEIPTS / UNREAD TRACKING
  // ============================================================================

  async getReadStatus(roomId: string, userId: string): Promise<{ lastReadMessageId: string | null; lastReadAt: string | null; unreadCount: number }> {
    // Get last read message
    const { data: readData } = (await this.supabase
      .from('message_reads')
      .select('last_read_message_id, last_read_at')
      .eq('chat_room_id', roomId)
      .eq('user_id', userId)
      .single()) as any

    const lastReadMessageId = readData?.last_read_message_id || null
    const lastReadAt = readData?.last_read_at || null

    // Count unread messages
    let unreadCount = 0
    if (lastReadMessageId) {
      const { count } = (await this.supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('chat_room_id', roomId)
        .gt('created_at', lastReadAt)) as any
      unreadCount = count || 0
    } else {
      // Never read - count all messages
      const { count } = (await this.supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('chat_room_id', roomId)) as any
      unreadCount = count || 0
    }

    return { lastReadMessageId, lastReadAt, unreadCount }
  }

  async markAsRead(roomId: string, userId: string, messageId: string): Promise<void> {
    await ((this.supabase as any)
      .from('message_reads')
      .upsert({
        chat_room_id: roomId,
        user_id: userId,
        last_read_message_id: messageId,
        last_read_at: new Date().toISOString(),
      }, { onConflict: 'user_id,chat_room_id' }))
  }

  async getUnreadCounts(userId: string, roomIds: string[]): Promise<Record<string, number>> {
    const counts: Record<string, number> = {}
    
    for (const roomId of roomIds) {
      const { unreadCount } = await this.getReadStatus(roomId, userId)
      counts[roomId] = unreadCount
    }
    
    return counts
  }

  // ============================================================================
  // PINNED MESSAGES
  // ============================================================================

  async getPinnedMessages(roomId: string): Promise<Array<{
    id: string
    messageId: string
    pinnedBy: string
    pinnedAt: string
    message: any
  }>> {
    const { data } = (await this.supabase
      .from('pinned_messages')
      .select(`
        id,
        message_id,
        pinned_by,
        pinned_at,
        chat_messages (
          id,
          content,
          sender_id,
          created_at,
          encrypted,
          users (username, user_profiles(name))
        )
      `)
      .eq('chat_room_id', roomId)
      .order('pinned_at', { ascending: false })) as any

    if (!data) return []

    return data.map((p: any) => ({
      id: p.id,
      messageId: p.message_id,
      pinnedBy: p.pinned_by,
      pinnedAt: p.pinned_at,
      message: p.chat_messages ? {
        id: p.chat_messages.id,
        content: p.chat_messages.content,
        senderId: p.chat_messages.sender_id,
        senderName: p.chat_messages.users?.user_profiles?.[0]?.name || p.chat_messages.users?.username,
        createdAt: p.chat_messages.created_at,
        encrypted: p.chat_messages.encrypted,
      } : null,
    }))
  }

  async pinMessage(roomId: string, messageId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    const { error } = (await ((this.supabase as any)
      .from('pinned_messages')
      .upsert({
        chat_room_id: roomId,
        message_id: messageId,
        pinned_by: userId,
      }, { onConflict: 'chat_room_id,message_id' }))) as any

    if (error) return { success: false, error: error.message }
    return { success: true }
  }

  async unpinMessage(roomId: string, messageId: string): Promise<{ success: boolean; error?: string }> {
    const { error } = (await this.supabase
      .from('pinned_messages')
      .delete()
      .eq('chat_room_id', roomId)
      .eq('message_id', messageId)) as any

    if (error) return { success: false, error: error.message }
    return { success: true }
  }

  // ============================================================================
  // MENTIONS
  // ============================================================================

  async createMentions(messageId: string, mentionedUserIds: string[]): Promise<void> {
    if (mentionedUserIds.length === 0) return

    const records = mentionedUserIds.map(userId => ({
      message_id: messageId,
      mentioned_user_id: userId,
    }))

    await ((this.supabase as any)
      .from('message_mentions')
      .insert(records))
  }

  async getUserMentions(userId: string, limit: number = 50): Promise<Array<{
    messageId: string
    roomId: string
    senderId: string
    senderName: string
    content: string
    createdAt: string
  }>> {
    const { data } = (await this.supabase
      .from('message_mentions')
      .select(`
        message_id,
        chat_messages (
          id,
          chat_room_id,
          sender_id,
          content,
          created_at,
          users (username, user_profiles(name))
        )
      `)
      .eq('mentioned_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)) as any

    if (!data) return []

    return data.map((m: any) => ({
      messageId: m.message_id,
      roomId: m.chat_messages?.chat_room_id,
      senderId: m.chat_messages?.sender_id,
      senderName: m.chat_messages?.users?.user_profiles?.[0]?.name || m.chat_messages?.users?.username,
      content: m.chat_messages?.content,
      createdAt: m.chat_messages?.created_at,
    })).filter((m: any) => m.roomId)
  }

  // ============================================================================
  // POLLS
  // ============================================================================

  async getRoomPolls(roomId: string): Promise<any[]> {
    const { data } = (await (this.supabase as any)
      .from('chat_polls')
      .select(`
        *,
        poll_options (
          id,
          option_text,
          option_order,
          poll_votes (user_id)
        )
      `)
      .eq('chat_room_id', roomId)
      .order('created_at', { ascending: false })) as any

    if (!data) return []

    return data.map((poll: any) => this.formatPoll(poll))
  }

  async getPoll(pollId: string): Promise<any | null> {
    const { data } = (await (this.supabase as any)
      .from('chat_polls')
      .select(`
        *,
        poll_options (
          id,
          option_text,
          option_order,
          poll_votes (user_id)
        )
      `)
      .eq('id', pollId)
      .single()) as any

    if (!data) return null

    return this.formatPoll(data)
  }

  private formatPoll(poll: any): any {
    const options = (poll.poll_options || [])
      .sort((a: any, b: any) => a.option_order - b.option_order)
      .map((opt: any) => ({
        id: opt.id,
        text: opt.option_text,
        votes: (opt.poll_votes || []).map((v: any) => v.user_id),
      }))

    const totalVotes = options.reduce((sum: number, opt: any) => sum + opt.votes.length, 0)

    return {
      id: poll.id,
      question: poll.question,
      options,
      type: poll.poll_type,
      anonymous: poll.anonymous,
      endsAt: poll.ends_at,
      closed: poll.closed,
      createdBy: poll.created_by,
      createdAt: poll.created_at,
      totalVotes,
    }
  }

  async createPoll(data: {
    chatRoomId: string
    createdBy: string
    question: string
    options: string[]
    pollType: 'single' | 'multiple'
    anonymous: boolean
    endsAt?: string
  }): Promise<any> {
    // Create poll
    const { data: poll, error: pollError } = (await (this.supabase as any)
      .from('chat_polls')
      .insert({
        chat_room_id: data.chatRoomId,
        created_by: data.createdBy,
        question: data.question,
        poll_type: data.pollType,
        anonymous: data.anonymous,
        ends_at: data.endsAt,
      })
      .select()
      .single()) as any

    if (pollError) throw new Error(pollError.message)

    // Create options
    const optionRecords = data.options.map((text, index) => ({
      poll_id: poll.id,
      option_text: text,
      option_order: index,
    }))

    const { error: optionsError } = (await (this.supabase as any)
      .from('poll_options')
      .insert(optionRecords)) as any

    if (optionsError) throw new Error(optionsError.message)

    // Return full poll
    return this.getPoll(poll.id)
  }

  async togglePollVote(pollId: string, optionId: string, userId: string): Promise<{ voted: boolean }> {
    // Check if vote exists
    const { data: existing } = (await (this.supabase as any)
      .from('poll_votes')
      .select('id')
      .eq('poll_id', pollId)
      .eq('option_id', optionId)
      .eq('user_id', userId)
      .single()) as any

    if (existing) {
      // Remove vote
      await (this.supabase as any)
        .from('poll_votes')
        .delete()
        .eq('id', existing.id)
      return { voted: false }
    } else {
      // Add vote
      await (this.supabase as any)
        .from('poll_votes')
        .insert({
          poll_id: pollId,
          option_id: optionId,
          user_id: userId,
        })
      return { voted: true }
    }
  }

  async closePoll(pollId: string): Promise<any> {
    const { error } = (await (this.supabase as any)
      .from('chat_polls')
      .update({ closed: true })
      .eq('id', pollId)) as any

    if (error) throw new Error(error.message)

    return this.getPoll(pollId)
  }
}

// Singleton instance
let supabaseRepo: SupabaseRepository | null = null

export function getSupabaseRepository(): SupabaseRepository {
  if (!supabaseRepo) {
    supabaseRepo = new SupabaseRepository()
  }
  return supabaseRepo
}
