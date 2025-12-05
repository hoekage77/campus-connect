/**
 * Repository interfaces for data access abstraction
 * Allows easy switching between localStorage and Supabase implementations
 */

import type {
  UserProfile,
  Group,
  Session,
  GroupMember,
  GroupMessage,
  RSVP,
  ChatRoom,
  ChatMessage,
  Notification,
  Squad,
  UserLevelData,
  UserPreferences,
} from "@/types"

// Input types for creating entities
export type CreateUserInput = {
  username: string
  password: string
  name?: string
  email?: string
  studentId?: string
  bio?: string
  avatar?: string
  major?: string
  year?: string
  topics?: string[]
  squads?: string[]
  id?: string
  createdAt?: Date
}

export type CreateGroupInput = {
  ownerId: string
  title: string
  description: string
  privacy?: "public" | "private" | "unlisted"
  topics?: string[]
  location?: string
  avatar?: string
  id?: string
  createdAt?: Date
  updatedAt?: Date
}

export type CreateSessionInput = {
  title: string
  description: string
  hostId: string
  groupId?: string
  location: string
  startAt: Date
  endAt: Date
  capacity?: number
  privacy: "public" | "private" | "unlisted"
  id?: string
  createdAt?: Date
}

export type CreateMessageInput = {
  groupId?: string
  sessionId?: string
  senderId: string
  content: string
  replyToId?: string
}

export type CreateChatMessageInput = {
  roomId: string
  userId: string
  content: string
}

export type CreateNotificationInput = {
  userId: string
  type: string
  title: string
  message: string
  actionUrl?: string
  relatedId?: string
}

// Base repository interface
export interface IRepository<T> {
  findById(id: string): Promise<T | null>
  findAll(): Promise<T[]>
  create(input: any): Promise<T>
  update(id: string, data: Partial<T>): Promise<T>
  delete(id: string): Promise<boolean>
}

// User repository
export interface IUserRepository extends IRepository<UserProfile> {
  create(input: CreateUserInput): Promise<UserProfile>
  findByEmail(email: string): Promise<UserProfile | null>
  findByUsername(username: string): Promise<UserProfile | null>
  findByStudentId(studentId: string): Promise<UserProfile | null>
  verifyPassword(userId: string, password: string): Promise<boolean>
  updatePassword(userId: string, newPassword: string): Promise<boolean>
  getUserLevel(userId: string): Promise<UserLevelData | null>
  updateUserLevel(userId: string, level: UserLevelData): Promise<void>
  getUserPreferences(userId: string): Promise<UserPreferences | null>
  updateUserPreferences(userId: string, prefs: UserPreferences): Promise<void>
}

// Group repository
export interface IGroupRepository extends IRepository<Group> {
  create(input: CreateGroupInput): Promise<Group>
  findByOwnerId(ownerId: string): Promise<Group[]>
  findPublic(): Promise<Group[]>
  search(query: string): Promise<Group[]>
  addMember(groupId: string, userId: string, role?: string): Promise<GroupMember>
  removeMember(groupId: string, userId: string): Promise<boolean>
  getMembers(groupId: string): Promise<GroupMember[]>
  getMembersByUserId(userId: string): Promise<GroupMember[]>
  isMember(groupId: string, userId: string): Promise<boolean>
  updateMemberCount(groupId: string): Promise<void>
}

// Session repository
export interface ISessionRepository extends IRepository<Session> {
  create(input: CreateSessionInput): Promise<Session>
  findByHostId(hostId: string): Promise<Session[]>
  findByGroupId(groupId: string): Promise<Session[]>
  findUpcoming(): Promise<Session[]>
  findByDateRange(start: Date, end: Date): Promise<Session[]>
  addRSVP(sessionId: string, userId: string, status: RSVP["status"]): Promise<RSVP>
  updateRSVP(sessionId: string, userId: string, status: RSVP["status"]): Promise<RSVP>
  getRSVPs(sessionId: string): Promise<RSVP[]>
  getUserRSVP(sessionId: string, userId: string): Promise<RSVP | null>
}

// Message repository
export interface IMessageRepository extends IRepository<GroupMessage> {
  create(input: CreateMessageInput): Promise<GroupMessage>
  findByGroupId(groupId: string): Promise<GroupMessage[]>
  findBySessionId(sessionId: string): Promise<GroupMessage[]>
  findBySenderId(senderId: string): Promise<GroupMessage[]>
  findReplies(messageId: string): Promise<GroupMessage[]>
}

// Chat repository
export interface IChatRepository {
  // Chat rooms
  createRoom(groupId: string, name: string, description?: string): Promise<ChatRoom>
  getRoom(roomId: string): Promise<ChatRoom | null>
  getRoomsByGroupId(groupId: string): Promise<ChatRoom[]>
  deleteRoom(roomId: string): Promise<boolean>
  
  // Chat messages
  sendMessage(input: CreateChatMessageInput): Promise<ChatMessage>
  getMessages(roomId: string, limit?: number): Promise<ChatMessage[]>
  deleteMessage(messageId: string): Promise<boolean>
  markMessageAsRead(messageId: string, userId: string): Promise<boolean>
}

// Notification repository
export interface INotificationRepository extends IRepository<Notification> {
  create(input: CreateNotificationInput): Promise<Notification>
  findByUserId(userId: string): Promise<Notification[]>
  findUnread(userId: string): Promise<Notification[]>
  markAsRead(notificationId: string): Promise<boolean>
  markAllAsRead(userId: string): Promise<boolean>
  deleteAllForUser(userId: string): Promise<boolean>
}

// Squad repository (synced with groups)
export interface ISquadRepository {
  getSquad(id: string): Promise<Squad | null>
  getAllSquads(): Promise<Squad[]>
  syncFromGroup(group: Group): Promise<Squad>
}

// Admin repository for database operations
export interface IAdminRepository {
  getStats(): Promise<{
    totalSize: number
    collections: Array<{ name: string; count: number; size: number }>
    lastModified: string
    version: string
  }>
  createBackup(): Promise<boolean>
  restoreFromBackup(): Promise<boolean>
  exportData(): Promise<string>
  importData(data: string): Promise<boolean>
  clearAllData(): Promise<boolean>
  validateIntegrity(): Promise<{ valid: boolean; errors: string[] }>
  optimize(): Promise<boolean>
}

// Collection repository for generic data access
export interface ICollectionRepository {
  getCollection(name: string, page?: number, limit?: number): Promise<{
    items: any[]
    total: number
    page: number
    pages: number
  }>
  getItem(collection: string, id: string): Promise<any>
  deleteItem(collection: string, id: string): Promise<boolean>
}
