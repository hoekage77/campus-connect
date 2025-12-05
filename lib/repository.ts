/**
 * Unified Data Repository
 * 
 * Provides a single interface that routes to either DataStore or Supabase
 * based on the DATABASE_PROVIDER environment variable.
 * 
 * This allows gradual migration without changing API route code.
 */

import { DATABASE_PROVIDER, logDatabaseProvider } from './database-provider'
import { dataStore } from './data/store'
import { getSupabaseRepository } from './supabase/repository'
import type {
  UserProfile,
  Group,
  GroupMember,
  Space,
  SpaceParticipant,
  SpaceType,
  SpacePrivacy,
  Notification,
  UserLevelData,
} from '@/types'

class UnifiedRepository {
  private get backend() {
    if (DATABASE_PROVIDER === 'supabase') {
      return getSupabaseRepository()
    }
    return dataStore
  }

  // ============================================================================
  // USERS
  // ============================================================================

  async getUser(userId: string): Promise<UserProfile | undefined> {
    logDatabaseProvider('getUser')
    if (DATABASE_PROVIDER === 'supabase') {
      return this.backend.getUser(userId)
    }
    return dataStore.getUser(userId)
  }

  async getUserByEmail(email: string): Promise<UserProfile | undefined> {
    logDatabaseProvider('getUserByEmail')
    if (DATABASE_PROVIDER === 'supabase') {
      return this.backend.getUserByEmail(email)
    }
    return dataStore.getUserByEmail(email)
  }

  async getAllUsers(): Promise<UserProfile[]> {
    logDatabaseProvider('getAllUsers')
    if (DATABASE_PROVIDER === 'supabase') {
      return this.backend.getAllUsers()
    }
    return dataStore.getAllUsers()
  }

  // ============================================================================
  // GROUPS
  // ============================================================================

  getGroup(groupId: string): Promise<Group | undefined> | Group | undefined {
    logDatabaseProvider('getGroup')
    if (DATABASE_PROVIDER === 'supabase') {
      return this.backend.getGroup(groupId)
    }
    return dataStore.getGroup(groupId)
  }

  getAllGroups(): Promise<Group[]> | Group[] {
    logDatabaseProvider('getAllGroups')
    if (DATABASE_PROVIDER === 'supabase') {
      return this.backend.getAllGroups()
    }
    return dataStore.getAllGroups()
  }

  getPublicGroups(): Promise<Group[]> | Group[] {
    logDatabaseProvider('getPublicGroups')
    if (DATABASE_PROVIDER === 'supabase') {
      return this.backend.getPublicGroups()
    }
    return dataStore.getPublicGroups()
  }

  async createGroup(input: {
    ownerId: string
    title: string
    description: string
    privacy?: any
    topics?: string[]
    location?: string
    avatar?: string
  }): Promise<Group> {
    logDatabaseProvider('createGroup')
    if (DATABASE_PROVIDER === 'supabase') {
      return this.backend.createGroup(input)
    }
    return dataStore.createGroup(input)
  }

  getGroupMembers(groupId: string): Promise<GroupMember[]> | GroupMember[] {
    logDatabaseProvider('getGroupMembers')
    if (DATABASE_PROVIDER === 'supabase') {
      return this.backend.getGroupMembers(groupId)
    }
    return dataStore.getGroupMembers(groupId)
  }

  // ============================================================================
  // SPACES
  // ============================================================================

  getSpace(spaceId: string): Promise<Space | undefined> | Space | undefined {
    logDatabaseProvider('getSpace')
    if (DATABASE_PROVIDER === 'supabase') {
      return this.backend.getSpace(spaceId)
    }
    return dataStore.getSpace(spaceId)
  }

  getGroupSpaces(groupId: string, status?: 'live' | 'ended' | 'scheduled'): Promise<Space[]> | Space[] {
    logDatabaseProvider('getGroupSpaces')
    if (DATABASE_PROVIDER === 'supabase') {
      return this.backend.getGroupSpaces(groupId, status)
    }
    return dataStore.getGroupSpaces(groupId, status)
  }

  getLiveSpaces(): Promise<Space[]> | Space[] {
    logDatabaseProvider('getLiveSpaces')
    if (DATABASE_PROVIDER === 'supabase') {
      return this.backend.getLiveSpaces()
    }
    return dataStore.getLiveSpaces()
  }

  getSpaceParticipants(spaceId: string): Promise<SpaceParticipant[]> | SpaceParticipant[] {
    logDatabaseProvider('getSpaceParticipants')
    if (DATABASE_PROVIDER === 'supabase') {
      return this.backend.getSpaceParticipants(spaceId)
    }
    return dataStore.getSpaceParticipants(spaceId)
  }

  getActiveSpaceParticipants(spaceId: string): Promise<SpaceParticipant[]> | SpaceParticipant[] {
    logDatabaseProvider('getActiveSpaceParticipants')
    if (DATABASE_PROVIDER === 'supabase') {
      return this.backend.getActiveSpaceParticipants(spaceId)
    }
    return dataStore.getActiveSpaceParticipants(spaceId)
  }

  createSpace(input: {
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
  }): Promise<Space | undefined> | Space | undefined {
    logDatabaseProvider('createSpace')
    if (DATABASE_PROVIDER === 'supabase') {
      return this.backend.createSpace(input)
    }
    return dataStore.createSpace(input)
  }

  updateSpace(
    spaceId: string,
    updates: {
      title?: string
      description?: string
      maxParticipants?: number
      audioEnabled?: boolean
      videoEnabled?: boolean
      screenShareEnabled?: boolean
    }
  ): Promise<Space | undefined> | Space | undefined {
    logDatabaseProvider('updateSpace')
    if (DATABASE_PROVIDER === 'supabase') {
      return this.backend.updateSpace(spaceId, updates)
    }
    return dataStore.updateSpace(spaceId, updates)
  }

  endSpace(spaceId: string): Promise<Space | undefined> | Space | undefined {
    logDatabaseProvider('endSpace')
    if (DATABASE_PROVIDER === 'supabase') {
      return this.backend.endSpace(spaceId)
    }
    return dataStore.endSpace(spaceId)
  }

  deleteSpace(spaceId: string): Promise<boolean> | boolean {
    logDatabaseProvider('deleteSpace')
    if (DATABASE_PROVIDER === 'supabase') {
      return this.backend.deleteSpace(spaceId)
    }
    return dataStore.deleteSpace(spaceId)
  }

  joinSpace(
    spaceId: string,
    userId: string,
    role?: 'host' | 'co-host' | 'speaker' | 'listener'
  ): Promise<SpaceParticipant | undefined> | SpaceParticipant | undefined {
    logDatabaseProvider('joinSpace')
    if (DATABASE_PROVIDER === 'supabase') {
      return this.backend.joinSpace(spaceId, userId, role)
    }
    return dataStore.joinSpace(spaceId, userId, role)
  }

  leaveSpace(spaceId: string, userId: string): Promise<boolean> | boolean {
    logDatabaseProvider('leaveSpace')
    if (DATABASE_PROVIDER === 'supabase') {
      return this.backend.leaveSpace(spaceId, userId)
    }
    return dataStore.leaveSpace(spaceId, userId)
  }

  // ============================================================================
  // NOTIFICATIONS
  // ============================================================================

  getUserNotifications(userId: string, limit?: number): Promise<Notification[]> | Notification[] {
    logDatabaseProvider('getUserNotifications')
    if (DATABASE_PROVIDER === 'supabase') {
      return this.backend.getUserNotifications(userId, limit)
    }
    return dataStore.getUserNotifications(userId, limit)
  }

  // ============================================================================
  // USER LEVELS
  // ============================================================================

  getUserLevel(userId: string): Promise<UserLevelData | undefined> | UserLevelData | undefined {
    logDatabaseProvider('getUserLevel')
    if (DATABASE_PROVIDER === 'supabase') {
      return this.backend.getUserLevel(userId)
    }
    return dataStore.getUserLevel(userId)
  }
}

// Singleton instance
export const repository = new UnifiedRepository()
