import type {
  UserLevelData,
  UserPreferences,
  ChatRoom,
  ChatMessage,
  Notification,
  Squad,
  UserProfile,
  UserLevel,
  Group,
  GroupMember,
  Session,
  RSVP,
  GroupMessage,
  GroupPrivacy,
  Space,
  SpaceParticipant,
  SpaceInvitation,
  SpaceType,
  SpacePrivacy,
} from "@/types"

export type CollectionsSnapshot = {
  generatedAt: string
  counts: Record<string, number>
  data: {
    users: UserProfile[]
    userPreferences: UserPreferences[]
    userLevels: UserLevelData[]
    groups: Group[]
    squads: Squad[]
    groupMembers: GroupMember[]
    sessions: Session[]
    rsvps: RSVP[]
    chatRooms: ChatRoom[]
    chatMessages: ChatMessage[]
    groupMessages: GroupMessage[]
    notifications: Notification[]
    spaces: Space[]
    spaceParticipants: SpaceParticipant[]
    spaceInvitations: SpaceInvitation[]
  }
}

type CreateUserInput = {
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
  role?: "user" | "admin"
  id?: string
  createdAt?: Date
}

type CreateGroupInput = {
  ownerId: string
  title: string
  description: string
  privacy?: GroupPrivacy
  topics?: string[]
  location?: string
  avatar?: string
  id?: string
  createdAt?: Date
  updatedAt?: Date
}

type AddGroupMemberInput = {
  groupId: string
  userId: string
  role?: GroupMember["role"]
}

type CreateSessionInput = {
  title: string
  description: string
  hostId: string
  groupId?: string
  location: string
  startAt: Date
  endAt: Date
  capacity?: number
  privacy: Session["privacy"]
  id?: string
  createdAt?: Date
}

type UpdateSessionInput = Partial<Omit<Session, "id" | "createdAt" | "hostId">>

type CreateMessageInput = {
  groupId?: string
  sessionId?: string
  senderId: string
  content: string
  replyToId?: string
}

type CreateRSVPInput = {
  sessionId: string
  userId: string
  status: RSVP["status"]
}

// In-memory data store
class DataStore {
  private userLevels = new Map<string, UserLevelData>()
  private userPreferences = new Map<string, UserPreferences>()
  private chatRooms = new Map<string, ChatRoom>()
  private chatMessages = new Map<string, ChatMessage[]>()
  private notifications = new Map<string, Notification[]>()
  private squads = new Map<string, Squad>()
  private users = new Map<string, UserProfile>()
  private usersByEmail = new Map<string, string>()
  private usersByStudentId = new Map<string, string>()
  private userPasswords = new Map<string, string>()
  private groups = new Map<string, Group>()
  private groupMembers = new Map<string, GroupMember>()
  private groupMembersByGroup = new Map<string, Set<string>>()
  private groupMembersByUser = new Map<string, Set<string>>()
  private sessions = new Map<string, Session>()
  private sessionsByGroup = new Map<string, Set<string>>()
  private messages = new Map<string, GroupMessage>()
  private messagesByGroup = new Map<string, string[]>()
  private messagesBySession = new Map<string, string[]>()
  private rsvps = new Map<string, RSVP>()
  private rsvpsBySession = new Map<string, Set<string>>()
  private spaces = new Map<string, Space>()
  private spacesByGroup = new Map<string, Set<string>>()
  private spaceParticipants = new Map<string, SpaceParticipant>()
  private participantsBySpace = new Map<string, Set<string>>()
  private participantsByUser = new Map<string, Set<string>>()
  private spaceInvitations = new Map<string, SpaceInvitation>()
  private invitationsBySpace = new Map<string, Set<string>>()
  private invitationsByUser = new Map<string, Set<string>>()
  private eventListeners = new Map<string, Set<(payload: unknown) => void>>()

  constructor() {
    this.seedDemoData()
  }

  on(event: string, handler: (payload: unknown) => void): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }
    this.eventListeners.get(event)!.add(handler)
    return () => this.off(event, handler)
  }

  off(event: string, handler: (payload: unknown) => void): void {
    this.eventListeners.get(event)?.delete(handler)
  }

  emitEvent(event: string, payload: unknown): void {
    const listeners = this.eventListeners.get(event)
    if (!listeners) return
    listeners.forEach((listener) => {
      try {
        listener(payload)
      } catch (error) {
        console.error(`[DataStore] listener for ${event} failed`, error)
      }
    })
  }

  private ensureSquadFromGroup(group: Group): Squad {
    const existing = this.squads.get(group.id)
    if (existing) {
      const synced: Squad = {
        ...existing,
        name: group.title,
        description: group.description,
        interests: [...group.topics],
        image: group.avatar,
        memberCount: group.memberCount,
        privacy: group.privacy,
        location: group.location,
      }
      this.squads.set(group.id, synced)
      return synced
    }

    const created: Squad = {
      id: group.id,
      name: group.title,
      description: group.description,
      creatorId: group.ownerId,
      members: [],
      interests: [...group.topics],
      image: group.avatar,
      createdAt: group.createdAt,
      memberCount: group.memberCount,
      chatRooms: [],
      privacy: group.privacy,
      location: group.location,
    }
    this.squads.set(group.id, created)
    return created
  }

  private syncSquadFromGroup(group: Group): void {
    const squad = this.ensureSquadFromGroup(group)
    this.squads.set(group.id, {
      ...squad,
      name: group.title,
      description: group.description,
      interests: [...group.topics],
      image: group.avatar,
      memberCount: group.memberCount,
      privacy: group.privacy,
      location: group.location,
    })
  }

  private updateGroupMemberCount(groupId: string): void {
    const group = this.groups.get(groupId)
    if (!group) return
    const memberSet = this.groupMembersByGroup.get(groupId)
    const memberCount = memberSet ? memberSet.size : 0
    const updated: Group = { ...group, memberCount, updatedAt: new Date() }
    this.groups.set(groupId, updated)
    this.syncSquadFromGroup(updated)
  }

  private addUserToSquadMembership(userId: string, groupId: string): void {
    const user = this.users.get(userId)
    if (user && !user.squads.includes(groupId)) {
      const updatedUser: UserProfile = {
        ...user,
        squads: [...user.squads, groupId],
        updatedAt: new Date(),
      }
      this.users.set(userId, updatedUser)
      this.indexUser(updatedUser)
    }

    const group = this.groups.get(groupId)
    if (group) {
      const squad = this.ensureSquadFromGroup(group)
      if (!squad.members.includes(userId)) {
        const updatedMembers = [...squad.members, userId]
        const updatedSquad: Squad = {
          ...squad,
          members: updatedMembers,
          memberCount: updatedMembers.length,
        }
        this.squads.set(groupId, updatedSquad)
      }
    }
  }

  private removeUserFromSquadMembership(userId: string, groupId: string): void {
    const user = this.users.get(userId)
    if (user && user.squads.includes(groupId)) {
      const updatedUser: UserProfile = {
        ...user,
        squads: user.squads.filter((id) => id !== groupId),
        updatedAt: new Date(),
      }
      this.users.set(userId, updatedUser)
      this.indexUser(updatedUser)
    }

    const squad = this.squads.get(groupId)
    if (squad && squad.members.includes(userId)) {
      const remaining = squad.members.filter((id) => id !== userId)
      this.squads.set(groupId, {
        ...squad,
        members: remaining,
        memberCount: remaining.length,
      })
    }
  }

  private generateId(prefix: string): string {
    const globalCrypto = typeof globalThis !== "undefined" ? (globalThis.crypto as Crypto | undefined) : undefined
    if (globalCrypto?.randomUUID) {
      return `${prefix}-${globalCrypto.randomUUID()}`
    }
    return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
  }

  private indexUser(user: UserProfile): void {
    if (user.email) {
      this.usersByEmail.set(user.email, user.id)
    }
    if (user.studentId) {
      this.usersByStudentId.set(user.studentId, user.id)
    }
  }

  // USER LEVEL METHODS
  getUserLevel(userId: string): UserLevelData | undefined {
    return this.userLevels.get(userId)
  }

  calculateLevel(points: number): UserLevel {
    if (points >= 1500) return "Master"
    if (points >= 700) return "Expert"
    if (points >= 300) return "Collaborator"
    if (points >= 100) return "Learner"
    return "Novice"
  }

  addActivityPoints(userId: string, points: number, activityType: string): void {
    let levelData = this.userLevels.get(userId)
    if (!levelData) {
      levelData = {
        userId,
        currentLevel: "Novice",
        totalPoints: 0,
        totalEventsAttended: 0,
        totalSquadsCreated: 0,
        totalMessagesCount: 0,
        loginStreak: 0,
        achievements: [],
      }
    }

    levelData.totalPoints += points

    if (activityType === "message") levelData.totalMessagesCount++
    if (activityType === "event" || activityType === "event-attended") levelData.totalEventsAttended++
    if (activityType === "squad" || activityType === "squad-created") levelData.totalSquadsCreated++

    levelData.currentLevel = this.calculateLevel(levelData.totalPoints)

    this.userLevels.set(userId, levelData)
    this.saveToLocalStorage()
  }

  // USER PREFERENCES METHODS
  getUserPreferences(userId: string): UserPreferences | undefined {
    return this.userPreferences.get(userId)
  }

  createOrUpdatePreferences(data: Partial<UserPreferences> & { userId: string }): UserPreferences {
    const existing = this.userPreferences.get(data.userId)
    const updated: UserPreferences = {
      userId: data.userId,
      interests: data.interests ?? existing?.interests ?? [],
      preferredEventTypes: data.preferredEventTypes ?? existing?.preferredEventTypes ?? [],
      preferredSquadTopics: data.preferredSquadTopics ?? existing?.preferredSquadTopics,
      notificationFrequency: data.notificationFrequency ?? existing?.notificationFrequency ?? "instant",
      discoveryEnabled: data.discoveryEnabled ?? existing?.discoveryEnabled ?? true,
      lastUpdated: new Date(),
    }
    this.userPreferences.set(data.userId, updated)
    this.saveToLocalStorage()
    return updated
  }

  getLeaderboard(limit: number = 50): Array<{
    userId: string
    username: string
    currentLevel: string
    totalPoints: number
    totalEventsAttended: number
    totalSquadsCreated: number
  }> {
    const leaderboardData = Array.from(this.userLevels.values())
      .map((levelData) => {
        const user = this.users.get(levelData.userId)
        return {
          userId: levelData.userId,
          username: user?.username || "Unknown User",
          currentLevel: levelData.currentLevel,
          totalPoints: levelData.totalPoints,
          totalEventsAttended: levelData.totalEventsAttended,
          totalSquadsCreated: levelData.totalSquadsCreated,
        }
      })
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, limit)

    return leaderboardData
  }

  // GROUP METHODS
  getGroup(groupId: string): Group | undefined {
    return this.groups.get(groupId)
  }

  getAllGroups(): Group[] {
    return Array.from(this.groups.values()).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  }

  getPublicGroups(): Group[] {
    return this.getAllGroups().filter((group) => group.privacy === "public")
  }

  createGroup(input: CreateGroupInput): Group {
    const now = input.createdAt ?? new Date()
    const id = input.id ?? this.generateId("group")
    const group: Group = {
      id,
      title: input.title,
      description: input.description,
      ownerId: input.ownerId,
      privacy: input.privacy ?? "public",
      topics: [...(input.topics ?? [])],
      location: input.location,
      avatar: input.avatar,
      createdAt: now,
      updatedAt: input.updatedAt ?? now,
      memberCount: 0,
    }

    this.groups.set(id, group)
    this.syncSquadFromGroup(group)
    this.saveToLocalStorage()
    return group
  }

  updateGroup(groupId: string, updates: Partial<Omit<Group, "id" | "ownerId" | "createdAt" | "memberCount">>): Group | undefined {
    const existing = this.groups.get(groupId)
    if (!existing) return undefined

    const updated: Group = {
      ...existing,
      ...updates,
      topics: updates.topics ? [...updates.topics] : existing.topics,
      updatedAt: new Date(),
    }

    this.groups.set(groupId, updated)
    this.syncSquadFromGroup(updated)
    this.saveToLocalStorage()
    return updated
  }

  deleteGroup(groupId: string): boolean {
    if (!this.groups.has(groupId)) return false

    const memberIds = this.groupMembersByGroup.get(groupId)
    if (memberIds) {
      for (const memberId of memberIds) {
        const member = this.groupMembers.get(memberId)
        if (member) {
          this.removeUserFromSquadMembership(member.userId, groupId)
          this.groupMembers.delete(memberId)
          this.groupMembersByUser.get(member.userId)?.delete(memberId)
        }
      }
      this.groupMembersByGroup.delete(groupId)
    }

    // Remove sessions, messages, and RSVPs tied to this group
    const sessionIds = this.sessionsByGroup.get(groupId)
    if (sessionIds) {
      for (const sessionId of Array.from(sessionIds)) {
        this.deleteSession(sessionId)
      }
      this.sessionsByGroup.delete(groupId)
    }

    const messageIds = this.messagesByGroup.get(groupId)
    if (messageIds) {
      for (const messageId of messageIds) {
        this.messages.delete(messageId)
      }
      this.messagesByGroup.delete(groupId)
    }

    for (const [roomId, room] of Array.from(this.chatRooms.entries())) {
      if (room.groupId === groupId) {
        this.chatRooms.delete(roomId)
        this.chatMessages.delete(roomId)
      }
    }

    this.squads.delete(groupId)
    const deleted = this.groups.delete(groupId)
    this.saveToLocalStorage()
    return deleted
  }

  getGroupMembers(groupId: string): GroupMember[] {
    const memberIds = this.groupMembersByGroup.get(groupId)
    if (!memberIds) return []
    return Array.from(memberIds)
      .map((id) => this.groupMembers.get(id))
      .filter((member): member is GroupMember => Boolean(member))
      .sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime())
  }

  addGroupMember(input: AddGroupMemberInput): GroupMember {
    const group = this.groups.get(input.groupId)
    if (!group) {
      throw new Error(`Group ${input.groupId} not found`)
    }

    const existingMembers = this.groupMembersByGroup.get(input.groupId)
    if (existingMembers) {
      for (const memberId of existingMembers) {
        const member = this.groupMembers.get(memberId)
        if (member?.userId === input.userId) {
          return member
        }
      }
    }

    const member: GroupMember = {
      id: this.generateId("member"),
      groupId: input.groupId,
      userId: input.userId,
      role: input.role ?? "member",
      joinedAt: new Date(),
    }

    this.groupMembers.set(member.id, member)
    if (!this.groupMembersByGroup.has(input.groupId)) {
      this.groupMembersByGroup.set(input.groupId, new Set())
    }
    this.groupMembersByGroup.get(input.groupId)!.add(member.id)

    if (!this.groupMembersByUser.has(input.userId)) {
      this.groupMembersByUser.set(input.userId, new Set())
    }
    this.groupMembersByUser.get(input.userId)!.add(member.id)

    this.addUserToSquadMembership(input.userId, input.groupId)
    this.updateGroupMemberCount(input.groupId)
    if (member.role !== "owner") {
      this.addActivityPoints(input.userId, 5, "group-joined")
      // Notify group owner via API (server-side only)
      try {
        if (group.ownerId !== input.userId && typeof window !== 'undefined') {
          fetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: group.ownerId,
              type: 'squad-invite',
              title: 'New Member Joined',
              message: `User joined your group "${group.title}"`,
              actionUrl: `/groups/${group.id}`,
              relatedId: group.id
            })
          }).catch(err => console.warn('[Group Join] Notification API error', err))
        }
      } catch (notifyErr) {
        console.warn('[Group Join] Notification error', notifyErr)
      }
    }
    this.saveToLocalStorage()
    return member
  }

  removeGroupMember(groupId: string, userId: string): boolean {
    const memberIds = this.groupMembersByGroup.get(groupId)
    if (!memberIds) return false

    let memberIdToRemove: string | undefined
    for (const memberId of memberIds) {
      const member = this.groupMembers.get(memberId)
      if (member?.userId === userId) {
        memberIdToRemove = memberId
        break
      }
    }

    if (!memberIdToRemove) return false

    memberIds.delete(memberIdToRemove)
    this.groupMembers.delete(memberIdToRemove)
    const userMembership = this.groupMembersByUser.get(userId)
    userMembership?.delete(memberIdToRemove)

    this.removeUserFromSquadMembership(userId, groupId)
    this.updateGroupMemberCount(groupId)
    // Notify group owner via API
    try {
      const group = this.groups.get(groupId)
      if (group && group.ownerId !== userId && typeof window !== 'undefined') {
        fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: group.ownerId,
            type: 'squad-invite',
            title: 'Member Left',
            message: `User left your group "${group.title}"`,
            actionUrl: `/groups/${group.id}`,
            relatedId: group.id
          })
        }).catch(err => console.warn('[Group Leave] Notification API error', err))
      }
    } catch (notifyErr) {
      console.warn('[Group Leave] Notification error', notifyErr)
    }
    this.saveToLocalStorage()
    return true
  }

  getUserGroups(userId: string): Group[] {
    const membershipIds = this.groupMembersByUser.get(userId)
    if (!membershipIds) return []
    const groupIds = Array.from(membershipIds)
      .map((membershipId) => this.groupMembers.get(membershipId)?.groupId)
      .filter((groupId): groupId is string => Boolean(groupId))
    const uniqueGroupIds = Array.from(new Set(groupIds))
    return uniqueGroupIds
      .map((groupId) => this.groups.get(groupId))
      .filter((group): group is Group => Boolean(group))
  }

  // SESSION METHODS
  getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId)
  }

  getAllSessions(): Session[] {
    return Array.from(this.sessions.values()).sort((a, b) => a.startAt.getTime() - b.startAt.getTime())
  }

  getPublicSessions(): Session[] {
    return this.getAllSessions().filter((session) => session.privacy === "public")
  }

  createSession(input: CreateSessionInput): Session {
    const now = input.createdAt ?? new Date()
    const session: Session = {
      id: input.id ?? this.generateId("session"),
      title: input.title,
      description: input.description,
      hostId: input.hostId,
      groupId: input.groupId,
      location: input.location,
      startAt: input.startAt,
      endAt: input.endAt,
      capacity: input.capacity,
      privacy: input.privacy,
      createdAt: now,
      updatedAt: now,
    }

    this.sessions.set(session.id, session)
    if (session.groupId) {
      if (!this.sessionsByGroup.has(session.groupId)) {
        this.sessionsByGroup.set(session.groupId, new Set())
      }
      this.sessionsByGroup.get(session.groupId)!.add(session.id)
    }

    this.saveToLocalStorage()
    return session
  }

  updateSession(sessionId: string, updates: UpdateSessionInput): Session | undefined {
    const existing = this.sessions.get(sessionId)
    if (!existing) return undefined
    const updated: Session = {
      ...existing,
      ...updates,
      startAt: updates.startAt ?? existing.startAt,
      endAt: updates.endAt ?? existing.endAt,
      updatedAt: new Date(),
    }
    this.sessions.set(sessionId, updated)
    this.saveToLocalStorage()
    return updated
  }

  deleteSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId)
    if (!session) return false

    if (session.groupId) {
      this.sessionsByGroup.get(session.groupId)?.delete(sessionId)
    }

    const messageIds = this.messagesBySession.get(sessionId)
    if (messageIds) {
      for (const messageId of messageIds) {
        this.messages.delete(messageId)
      }
      this.messagesBySession.delete(sessionId)
    }

    const rsvpIds = this.rsvpsBySession.get(sessionId)
    if (rsvpIds) {
      for (const rsvpId of rsvpIds) {
        this.rsvps.delete(rsvpId)
      }
      this.rsvpsBySession.delete(sessionId)
    }

    const deleted = this.sessions.delete(sessionId)
    this.saveToLocalStorage()
    return deleted
  }

  // RSVP METHODS
  getSessionRSVPs(sessionId: string): RSVP[] {
    const rsvpIds = this.rsvpsBySession.get(sessionId)
    if (!rsvpIds) return []
    return Array.from(rsvpIds)
      .map((id) => this.rsvps.get(id))
      .filter((rsvp): rsvp is RSVP => Boolean(rsvp))
  }

  createOrUpdateRSVP(input: CreateRSVPInput): RSVP {
    let existing: RSVP | undefined
    const rsvpIds = this.rsvpsBySession.get(input.sessionId)
    if (rsvpIds) {
      for (const rsvpId of rsvpIds) {
        const rsvp = this.rsvps.get(rsvpId)
        if (rsvp?.userId === input.userId) {
          existing = rsvp
          break
        }
      }
    }

    if (existing) {
      const updated: RSVP = { ...existing, status: input.status, updatedAt: new Date() }
      this.rsvps.set(existing.id, updated)
      this.saveToLocalStorage()
      return updated
    }

    const created: RSVP = {
      id: this.generateId("rsvp"),
      sessionId: input.sessionId,
      userId: input.userId,
      status: input.status,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.rsvps.set(created.id, created)
    if (!this.rsvpsBySession.has(input.sessionId)) {
      this.rsvpsBySession.set(input.sessionId, new Set())
    }
    this.rsvpsBySession.get(input.sessionId)!.add(created.id)
    this.saveToLocalStorage()
    return created
  }

  // Helper: attendees with affirmative RSVP
  private getSessionAttendees(sessionId: string): string[] {
    return this.getSessionRSVPs(sessionId)
      .filter(r => r.status === 'yes')
      .map(r => r.userId)
  }

  // INVITES & REMINDERS
  inviteUserToGroup(userId: string, groupId: string, inviterId: string): void {
    // Basic duplicate prevention: if already member, skip
    const already = this.getGroupMembers(groupId).some(m => m.userId === userId)
    if (already) return
    try {
      if (typeof window !== 'undefined') {
        fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            type: 'squad-invite',
            title: 'Group Invite',
            message: `You were invited to join a group by ${inviterId}.`,
            actionUrl: `/groups/${groupId}`,
            relatedId: groupId
          })
        }).catch(err => console.warn('[Group Invite] Notification API error', err))
      }
    } catch (notifyErr) {
      console.warn('[Group Invite] Notification error', notifyErr)
    }
  }

  inviteUserToSession(userId: string, sessionId: string, inviterId: string): void {
    const session = this.getSession(sessionId)
    if (!session) return
    // If user already RSVP'd, skip
    const existing = this.getSessionRSVPs(sessionId).some(r => r.userId === userId)
    if (existing) return
    try {
      if (typeof window !== 'undefined') {
        fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            type: 'event-reminder',
            title: 'Session Invite',
            message: `You were invited to session "${session.title}" by ${inviterId}.`,
            actionUrl: `/sessions/${sessionId}`,
            relatedId: sessionId
          })
        }).catch(err => console.warn('[Session Invite] Notification API error', err))
      }
    } catch (notifyErr) {
      console.warn('[Session Invite] Notification error', notifyErr)
    }
  }

  notifySessionStartingSoon(sessionId: string): void {
    const session = this.getSession(sessionId)
    if (!session) return
    const attendees = this.getSessionAttendees(sessionId)
    for (const attendeeId of attendees) {
      try {
        if (typeof window !== 'undefined') {
          fetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: attendeeId,
              type: 'event-reminder',
              title: 'Session Starting Soon',
              message: `Session "${session.title}" is about to start!`,
              actionUrl: `/sessions/${sessionId}`,
              relatedId: sessionId
            })
          }).catch(err => console.warn('[Session Reminder] Notification API error', err))
        }
      } catch (notifyErr) {
        console.warn('[Session Reminder] Notification error', notifyErr)
      }
    }
  }

  // GROUP & SESSION MESSAGE METHODS
  getGroupMessages(groupId: string): GroupMessage[] {
    const messageIds = this.messagesByGroup.get(groupId) ?? []
    return messageIds
      .map((id) => this.messages.get(id))
      .filter((message): message is GroupMessage => Boolean(message))
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
  }

  getSessionMessages(sessionId: string): GroupMessage[] {
    const messageIds = this.messagesBySession.get(sessionId) ?? []
    return messageIds
      .map((id) => this.messages.get(id))
      .filter((message): message is GroupMessage => Boolean(message))
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
  }

  createMessage(input: CreateMessageInput): GroupMessage {
    if (!input.groupId && !input.sessionId) {
      throw new Error("groupId or sessionId required to create a message")
    }

    const now = new Date()
    const message: GroupMessage = {
      id: this.generateId("message"),
      groupId: input.groupId,
      sessionId: input.sessionId,
      senderId: input.senderId,
      content: input.content,
      replyToId: input.replyToId,
      createdAt: now,
      updatedAt: now,
    }

    this.messages.set(message.id, message)

    if (message.groupId) {
      if (!this.messagesByGroup.has(message.groupId)) {
        this.messagesByGroup.set(message.groupId, [])
      }
      this.messagesByGroup.get(message.groupId)!.push(message.id)
    }

    if (message.sessionId) {
      if (!this.messagesBySession.has(message.sessionId)) {
        this.messagesBySession.set(message.sessionId, [])
      }
      this.messagesBySession.get(message.sessionId)!.push(message.id)
    }

    this.addActivityPoints(input.senderId, 1, "message")
    this.saveToLocalStorage()
    return message
  }

  // CHAT ROOM METHODS
  getChatRoom(roomId: string): ChatRoom | undefined {
    return this.chatRooms.get(roomId)
  }

  getChatRoomsByGroup(groupId: string): ChatRoom[] {
    return Array.from(this.chatRooms.values()).filter((room) => room.groupId === groupId)
  }

  createChatRoom(data: ChatRoom): void {
    const entry: ChatRoom = {
      ...data,
      members: data.members ?? [],
      messageCount: data.messageCount ?? 0,
    }
    this.chatRooms.set(entry.id, entry)
    if (!this.chatMessages.has(entry.id)) {
      this.chatMessages.set(entry.id, [])
    }
    this.saveToLocalStorage()
  }

  addChatRoomMember(roomId: string, userId: string): void {
    const room = this.chatRooms.get(roomId)
    if (room && !room.members.includes(userId)) {
      room.members.push(userId)
      room.messageCount = room.messageCount ?? 0
      this.chatRooms.set(roomId, { ...room })
      this.saveToLocalStorage()
    }
  }

  // CHAT MESSAGE METHODS
  getChatMessages(roomId: string): ChatMessage[] {
    return this.chatMessages.get(roomId) || []
  }

  createChatMessage(data: ChatMessage): void {
    const messages = this.chatMessages.get(data.chatRoomId) || []
    messages.push(data)
    this.chatMessages.set(data.chatRoomId, messages)

    // Auto-award points for message
    this.addActivityPoints(data.senderId, 1, "message")

    // Update message count in room
    const room = this.chatRooms.get(data.chatRoomId)
    if (room) {
      room.messageCount = (room.messageCount ?? 0) + 1
      room.lastMessageDate = data.createdAt
      this.chatRooms.set(room.id, { ...room })
    }
    
    this.saveToLocalStorage()
  }

  // NOTIFICATION METHODS
  getUserNotifications(userId: string): Notification[] {
    return this.notifications.get(userId) || []
  }

  createNotification(data: Notification): void {
    const notifications = this.notifications.get(data.userId) || []
    notifications.push(data)
    this.notifications.set(data.userId, notifications)
    this.saveToLocalStorage()
  }

  markNotificationAsRead(userId: string, notificationId: string): void {
    const notifications = this.notifications.get(userId) || []
    const notification = notifications.find((n) => n.id === notificationId)
    if (notification) {
      notification.read = true
      this.saveToLocalStorage()
    }
  }

  // SQUAD METHODS
  getAllSquads(): Squad[] {
    return Array.from(this.squads.values())
  }

  getSquad(squadId: string): Squad | undefined {
    return this.squads.get(squadId)
  }

  getUserSquads(userId: string): Squad[] {
    return Array.from(this.squads.values()).filter((squad) => squad.members.includes(userId))
  }

  createSquad(squad: Squad): void {
    const group = this.createGroup({
      id: squad.id,
      ownerId: squad.creatorId,
      title: squad.name,
      description: squad.description,
      privacy: squad.privacy ?? "public",
      topics: squad.interests ?? [],
      location: squad.location,
      avatar: squad.image,
      createdAt: squad.createdAt,
    })

    const memberSet = new Set(squad.members)
    memberSet.add(squad.creatorId)
    const orderedMembers = [
      squad.creatorId,
      ...Array.from(memberSet).filter((memberId) => memberId !== squad.creatorId),
    ]

    orderedMembers.forEach((memberId) => {
      const role: GroupMember["role"] = memberId === squad.creatorId ? "owner" : "member"
      this.addGroupMember({ groupId: group.id, userId: memberId, role })
    })

    const syncedSquad = this.squads.get(group.id)
    if (syncedSquad) {
      this.squads.set(group.id, {
        ...syncedSquad,
        chatRooms: squad.chatRooms ?? syncedSquad.chatRooms,
      })
    }

    this.addActivityPoints(squad.creatorId, 50, "squad-created")
  }

  joinSquad(squadId: string, userId: string): void {
    const members = this.getGroupMembers(squadId)
    if (members.some((member) => member.userId === userId)) {
      return
    }
    this.addGroupMember({ groupId: squadId, userId, role: "member" })
  }

  // USER METHODS
  createUser(input: CreateUserInput): UserProfile {
    const now = input.createdAt ?? new Date()
    const id = input.id ?? this.generateId("user")
    const email = input.email?.trim().toLowerCase()
    const studentId = input.studentId?.trim().toUpperCase()

    const user: UserProfile = {
      id,
      name: input.name ?? input.username,
      username: input.username,
      role: input.role ?? "user",
      email,
      studentId,
      avatar: input.avatar,
      bio: input.bio,
      major: input.major,
      year: input.year,
      topics: input.topics ?? [],
      squads: input.squads ?? [],
      createdAt: now,
      updatedAt: now,
    }

    this.users.set(id, user)
    this.indexUser(user)
    this.userPasswords.set(id, input.password)
    this.saveToLocalStorage()
    return user
  }

  updateUser(id: string, updates: Partial<Omit<UserProfile, "id" | "createdAt">>) {
    const current = this.users.get(id)
    if (!current) return undefined

    const email = updates.email?.trim().toLowerCase()
    const studentId = updates.studentId?.trim().toUpperCase()

    const updated: UserProfile = {
      ...current,
      ...updates,
      email: email ?? current.email,
      studentId: studentId ?? current.studentId,
      updatedAt: new Date(),
    }

    this.users.set(id, updated)
    this.indexUser(updated)
    this.saveToLocalStorage()
    return updated
  }

  setUserPassword(id: string, password: string): void {
    this.userPasswords.set(id, password)
    this.saveToLocalStorage()
  }

  verifyUserPassword(id: string, password: string): boolean {
    return this.userPasswords.get(id) === password
  }

  getUserByEmail(email: string): UserProfile | undefined {
    const key = email.trim().toLowerCase()
    const userId = this.usersByEmail.get(key)
    return userId ? this.users.get(userId) : undefined
  }

  getUserByStudentId(studentId: string): UserProfile | undefined {
    const key = studentId.trim().toUpperCase()
    const userId = this.usersByStudentId.get(key)
    return userId ? this.users.get(userId) : undefined
  }

  getUser(userId: string): UserProfile | undefined {
    return this.users.get(userId)
  }

  getAllUsers(): UserProfile[] {
    return Array.from(this.users.values())
  }

  clearPersistedData(): void {
    this.clear()
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('campusConnect_dataStore')
        console.log('[DataStore] Cleared persisted data from localStorage')
      } catch (error) {
        console.error('[DataStore] Failed to clear persisted data:', error)
      }
    }
  }

  resetToDefaults(): void {
    this.clearPersistedData()
    this.seedDemoData()
    this.saveToLocalStorage()
  }

  exportCollectionsSnapshot(): CollectionsSnapshot {
    const values = <T>(map: Map<string, T>): T[] => Array.from(map.values())
    const flatten = <T>(map: Map<string, T[]>): T[] => Array.from(map.values()).flat()

    const data = {
      users: values(this.users),
      userPreferences: values(this.userPreferences),
      userLevels: values(this.userLevels),
      groups: values(this.groups),
      squads: values(this.squads),
      groupMembers: values(this.groupMembers),
      sessions: values(this.sessions),
      rsvps: values(this.rsvps),
      chatRooms: values(this.chatRooms),
      chatMessages: flatten(this.chatMessages),
      groupMessages: values(this.messages),
      notifications: flatten(this.notifications),
      spaces: values(this.spaces),
      spaceParticipants: values(this.spaceParticipants),
      spaceInvitations: values(this.spaceInvitations),
    }

    const counts = Object.fromEntries(
      Object.entries(data).map(([key, list]) => [key, Array.isArray(list) ? list.length : 0])
    )

    return {
      generatedAt: new Date().toISOString(),
      counts,
      data,
    }
  }

  private applyPostLoadMigrations(): void {
    let updatedUsers = false
    for (const [id, profile] of this.users.entries()) {
      const user = { ...profile }
      if (!user.role) {
        user.role = "user"
        updatedUsers = true
      }

      const isSeedAdmin =
        user.email === "alice@aun.edu.ng" ||
        user.studentId === "A00012345" ||
        id === "alice-123"

      if (isSeedAdmin && user.role !== "admin") {
        user.role = "admin"
        updatedUsers = true
      }

      this.users.set(id, user)
    }

    if (updatedUsers) {
      this.usersByEmail = new Map()
      this.usersByStudentId = new Map()
      for (const [, user] of this.users.entries()) {
        this.indexUser(user)
      }
      this.saveToLocalStorage()
    }
  }

  // SEED DATA
  private seedDemoData(): void {
    const alice = this.createUser({
      id: "alice-123",
      username: "alice",
      role: "admin",
      name: "Alice Johnson",
      email: "alice@aun.edu.ng",
      studentId: "A00012345",
      password: "password123",
      bio: "Computer Science enthusiast and study group organizer",
      major: "Computer Science",
      year: "Junior",
      topics: ["Study Groups", "Computer Science", "Career & Professional"],
    })

    const bob = this.createUser({
      id: "bob-456",
      username: "bob",
      name: "Bob Smith",
      email: "bob@aun.edu.ng",
      studentId: "A00067890",
      password: "password123",
      bio: "Always up for a good study session!",
      major: "Software Engineering",
      year: "Sophomore",
      topics: ["Study Groups", "Sports & Fitness", "Social Events"],
    })

    this.createOrUpdatePreferences({
      userId: alice.id,
      interests: ["Study Groups", "Computer Science", "Career & Professional"],
      preferredEventTypes: ["Study Session", "Hackathon", "Workshop"],
      notificationFrequency: "daily",
      discoveryEnabled: true,
    })

    this.createOrUpdatePreferences({
      userId: bob.id,
      interests: ["Study Groups", "Sports & Fitness", "Social Events"],
      preferredEventTypes: ["Study Session", "Sports", "Meetup"],
      notificationFrequency: "weekly",
      discoveryEnabled: true,
    })

    const csGroup = this.createGroup({
      id: "squad-1",
      ownerId: alice.id,
      title: "CS 456 Study Squad",
      description: "A collaborative study group for advanced algorithms",
      privacy: "public",
      topics: ["Computer Science", "Study Groups"],
      location: "Library Room 201",
      createdAt: new Date("2024-01-20"),
    })

    this.addGroupMember({ groupId: csGroup.id, userId: alice.id, role: "owner" })
    this.addGroupMember({ groupId: csGroup.id, userId: bob.id, role: "member" })

    const room1: ChatRoom = {
      id: "room-1",
      groupId: csGroup.id,
      name: "general",
      topic: "General discussion",
      members: [alice.id, bob.id],
      messageCount: 0,
      createdAt: new Date("2024-01-20"),
    }

    const room2: ChatRoom = {
      id: "room-2",
      groupId: csGroup.id,
      name: "resources",
      topic: "Share study materials",
      members: [alice.id, bob.id],
      messageCount: 0,
      createdAt: new Date("2024-01-20"),
    }

    this.createChatRoom(room1)
    this.createChatRoom(room2)

    const seededSquad = this.squads.get(csGroup.id)
    if (seededSquad) {
      this.squads.set(csGroup.id, {
        ...seededSquad,
        chatRooms: [room1, room2],
      })
    }

    const msg1: ChatMessage = {
      id: "msg-1",
      chatRoomId: room1.id,
      senderId: alice.id,
      senderName: "Alice Johnson",
      senderLevel: "Expert",
      content: "Hey everyone! Welcome to our study group 📚",
      reactions: {},
      createdAt: new Date("2024-01-20T10:00:00"),
    }

    const msg2: ChatMessage = {
      id: "msg-2",
      chatRoomId: room1.id,
      senderId: bob.id,
      senderName: "Bob Smith",
      senderLevel: "Learner",
      content: "Thanks for organizing this! Excited to learn together",
      reactions: { "👍": [alice.id] },
      createdAt: new Date("2024-01-20T10:05:00"),
    }

    this.chatMessages.set(room1.id, [msg1, msg2])
    const generalRoom = this.chatRooms.get(room1.id)
    if (generalRoom) {
      generalRoom.messageCount = 2
      generalRoom.lastMessageDate = msg2.createdAt
      this.chatRooms.set(generalRoom.id, { ...generalRoom })
    }

    const studySession = this.createSession({
      id: "session-1",
      title: "Algorithms Deep Dive",
      description: "Weekly review session covering advanced algorithms problems.",
      hostId: alice.id,
      groupId: csGroup.id,
      location: "Library Room 201",
      startAt: new Date("2024-01-22T14:00:00"),
      endAt: new Date("2024-01-22T15:30:00"),
      capacity: 20,
      privacy: "public",
      createdAt: new Date("2024-01-18"),
    })

    this.createOrUpdateRSVP({ sessionId: studySession.id, userId: bob.id, status: "yes" })

    this.userLevels.set(alice.id, {
      userId: alice.id,
      currentLevel: "Expert",
      totalPoints: 370,
      totalEventsAttended: 8,
      totalSquadsCreated: 1,
      totalMessagesCount: 120,
      loginStreak: 15,
      achievements: [
        {
          id: "ach-1",
          name: "First Squad",
          description: "Created your first squad",
          unlockedAt: new Date("2024-01-20"),
        },
      ],
    })

    this.userLevels.set(bob.id, {
      userId: bob.id,
      currentLevel: "Learner",
      totalPoints: 150,
      totalEventsAttended: 3,
      totalSquadsCreated: 0,
      totalMessagesCount: 42,
      loginStreak: 5,
      achievements: [],
    })

    // --- Additional demo users ---
    const carol = this.createUser({
      id: "carol-789",
      username: "carol",
      name: "Carol Danvers",
      email: "carol@aun.edu.ng",
      studentId: "A00013579",
      password: "password123",
      bio: "Event organizer and community builder",
      major: "Business Administration",
      year: "Senior",
      topics: ["Social Events", "Career & Professional", "Entrepreneurship"],
    })

    const dave = this.createUser({
      id: "dave-321",
      username: "dave",
      name: "Dave Lee",
      email: "dave@aun.edu.ng",
      studentId: "A00024680",
      password: "password123",
      bio: "Gamer and esports enthusiast",
      major: "Information Systems",
      year: "Freshman",
      topics: ["Gaming", "Esports", "Tech"],
    })

    const eve = this.createUser({
      id: "eve-654",
      username: "eve",
      name: "Eve Torres",
      email: "eve@aun.edu.ng",
      studentId: "A00011223",
      password: "password123",
      bio: "Book lover and poetry fan",
      major: "Literature",
      year: "Junior",
      topics: ["Literature", "Study Groups", "Social Events"],
    })

    const frank = this.createUser({
      id: "frank-987",
      username: "frank",
      name: "Frank Ocean",
      email: "frank@aun.edu.ng",
      studentId: "A00088990",
      password: "password123",
      bio: "Music head. If there’s a party, I’m there.",
      major: "Media & Communication",
      year: "Sophomore",
      topics: ["Music", "Nightlife", "Social Events"],
    })

    const grace = this.createUser({
      id: "grace-246",
      username: "grace",
      name: "Grace Hopper",
      email: "grace@aun.edu.ng",
      studentId: "A00033445",
      password: "password123",
      bio: "Robotics and algorithms are my thing.",
      major: "Computer Engineering",
      year: "Senior",
      topics: ["Robotics", "Computer Science", "Hackathons"],
    })

    const heidi = this.createUser({
      id: "heidi-135",
      username: "heidi",
      name: "Heidi Klum",
      email: "heidi@aun.edu.ng",
      studentId: "A00055667",
      password: "password123",
      bio: "Design, fashion, and great meetups.",
      major: "Design",
      year: "Senior",
      topics: ["Design", "Social Events", "Entrepreneurship"],
    })

    const ivan = this.createUser({
      id: "ivan-579",
      username: "ivan",
      name: "Ivan Petrov",
      email: "ivan@aun.edu.ng",
      studentId: "A00066778",
      password: "password123",
      bio: "Competitive gamer. Always up for a tournament!",
      major: "Computer Science",
      year: "Junior",
      topics: ["Gaming", "Esports", "Tech"],
    })

    const judy = this.createUser({
      id: "judy-864",
      username: "judy",
      name: "Judy Alvarez",
      email: "judy@aun.edu.ng",
      studentId: "A00077889",
      password: "password123",
      bio: "Startup junkie and product tinkerer.",
      major: "Software Engineering",
      year: "Senior",
      topics: ["Entrepreneurship", "Career & Professional", "Tech"],
    })

    // --- Additional groups/squads ---
    const partyCentral = this.createGroup({
      id: "squad-party",
      ownerId: carol.id,
      title: "AUN Party Central",
      description: "Campus parties, live music, and good vibes ",
      privacy: "public",
      topics: ["Social Events", "Music", "Nightlife"],
      location: "Student Union Hall",
      createdAt: new Date("2024-02-10"),
    })
    this.addGroupMember({ groupId: partyCentral.id, userId: carol.id, role: "owner" })
    ;[frank, heidi, bob, alice].forEach((u) => this.addGroupMember({ groupId: partyCentral.id, userId: u.id, role: "member" }))

    // Rooms and messages for Party Central
    const partyGeneral: ChatRoom = {
      id: "room-party-general",
      groupId: partyCentral.id,
      name: "general",
      topic: "Announcements and plans",
      members: [carol.id, frank.id, heidi.id, bob.id, alice.id],
      messageCount: 0,
      createdAt: new Date("2024-02-10"),
    }
    this.createChatRoom(partyGeneral)
    this.createChatMessage({
      id: this.generateId("msg"),
      chatRoomId: partyGeneral.id,
      senderId: carol.id,
      senderName: carol.name,
      senderLevel: "Collaborator",
      content: "Welcome to Party Central! Friday Night Mixer details dropping soon 🎉",
      reactions: {},
      createdAt: new Date("2024-02-10T18:00:00"),
    })

    const fridayMixer = this.createSession({
      id: "session-mixer",
      title: "Friday Night Mixer",
      description: "Meet new people, groove to good music, and unwind.",
      hostId: carol.id,
      groupId: partyCentral.id,
      location: "Student Union Hall",
      startAt: new Date("2024-02-16T19:30:00"),
      endAt: new Date("2024-02-16T22:00:00"),
      capacity: 100,
      privacy: "public",
      createdAt: new Date("2024-02-12"),
    })
    this.createOrUpdateRSVP({ sessionId: fridayMixer.id, userId: frank.id, status: "yes" })
    this.createOrUpdateRSVP({ sessionId: fridayMixer.id, userId: heidi.id, status: "maybe" })

    const readingNook = this.createGroup({
      id: "squad-reading",
      ownerId: eve.id,
      title: "The Reading Nook",
      description: "Private space for literature lovers and poetry nights",
      privacy: "private",
      topics: ["Literature", "Study Groups"],
      location: "Library Quiet Room",
      createdAt: new Date("2024-03-01"),
    })
    this.addGroupMember({ groupId: readingNook.id, userId: eve.id, role: "owner" })
    ;[alice, judy].forEach((u) => this.addGroupMember({ groupId: readingNook.id, userId: u.id, role: "member" }))

    const poetryNight = this.createSession({
      id: "session-poetry",
      title: "Poetry Night",
      description: "Share your favorite poems or original work. Invite-only.",
      hostId: eve.id,
      groupId: readingNook.id,
      location: "Library Quiet Room",
      startAt: new Date("2024-03-07T18:00:00"),
      endAt: new Date("2024-03-07T20:00:00"),
      capacity: 25,
      privacy: "invite-only",
      createdAt: new Date("2024-03-02"),
    })
    this.createOrUpdateRSVP({ sessionId: poetryNight.id, userId: alice.id, status: "yes" })

    const techEntrepreneurs = this.createGroup({
      id: "squad-startups",
      ownerId: judy.id,
      title: "Tech Entrepreneurs",
      description: "Startup builders, product people, and pitch practice",
      privacy: "invite-only",
      topics: ["Entrepreneurship", "Career & Professional", "Tech"],
      location: "Innovation Hub",
      createdAt: new Date("2024-02-20"),
    })
    this.addGroupMember({ groupId: techEntrepreneurs.id, userId: judy.id, role: "owner" })
    ;[carol, grace, alice].forEach((u) => this.addGroupMember({ groupId: techEntrepreneurs.id, userId: u.id, role: "member" }))

    const pitchPractice = this.createSession({
      id: "session-pitch",
      title: "Startup Pitch Practice",
      description: "Friendly feedback on your 3-minute pitch.",
      hostId: judy.id,
      groupId: techEntrepreneurs.id,
      location: "Innovation Hub Stage",
      startAt: new Date("2024-02-24T16:00:00"),
      endAt: new Date("2024-02-24T17:30:00"),
      capacity: 30,
      privacy: "invite-only",
      createdAt: new Date("2024-02-21"),
    })
    this.createOrUpdateRSVP({ sessionId: pitchPractice.id, userId: grace.id, status: "maybe" })

    const campusGamers = this.createGroup({
      id: "squad-gamers",
      ownerId: dave.id,
      title: "Campus Gamers",
      description: "All things gaming: tournaments, LAN nights, and streams",
      privacy: "public",
      topics: ["Gaming", "Esports"],
      location: "Game Lab",
      createdAt: new Date("2024-02-05"),
    })
    this.addGroupMember({ groupId: campusGamers.id, userId: dave.id, role: "owner" })
    ;[ivan, bob, alice].forEach((u) => this.addGroupMember({ groupId: campusGamers.id, userId: u.id, role: "member" }))

    const mkTournament = this.createSession({
      id: "session-mk",
      title: "Mario Kart Tournament",
      description: "Single-elimination tourney. Prizes for top 3!",
      hostId: dave.id,
      groupId: campusGamers.id,
      location: "Game Lab",
      startAt: new Date("2024-02-14T17:00:00"),
      endAt: new Date("2024-02-14T20:00:00"),
      capacity: 48,
      privacy: "public",
      createdAt: new Date("2024-02-06"),
    })
    this.createOrUpdateRSVP({ sessionId: mkTournament.id, userId: ivan.id, status: "yes" })
    this.createOrUpdateRSVP({ sessionId: mkTournament.id, userId: bob.id, status: "maybe" })
  }
  // ===== SPACE METHODS =====

  createSpace(input: {
    groupId: string
    hostId: string
    title: string
    description?: string
    type: SpaceType
    privacy: SpacePrivacy
    maxParticipants?: number
    audioEnabled?: boolean
    videoEnabled?: boolean
    screenShareEnabled?: boolean
    sessionId?: string
    roomName?: string
    roomUrl?: string
    roomToken?: string
  }): Space {
    const now = new Date()
    const space: Space = {
      id: this.generateId("space"),
      groupId: input.groupId,
      title: input.title,
      description: input.description,
      type: input.type,
      privacy: input.privacy,
      status: "live",
      hostId: input.hostId,
      coHostIds: [],
      participants: [input.hostId], // Host is first participant
      maxParticipants: input.maxParticipants ?? 10,
      audioEnabled: input.audioEnabled ?? true,
      videoEnabled: input.videoEnabled ?? false,
      screenShareEnabled: input.screenShareEnabled ?? false,
      startedAt: now,
      sessionId: input.sessionId,
  roomName: input.roomName,
      roomUrl: input.roomUrl,
      roomToken: input.roomToken,
      peakParticipants: 1,
      totalJoins: 1,
      createdAt: now,
      updatedAt: now,
    }

    this.spaces.set(space.id, space)
    
    if (!this.spacesByGroup.has(input.groupId)) {
      this.spacesByGroup.set(input.groupId, new Set())
    }
    this.spacesByGroup.get(input.groupId)!.add(space.id)

    // Create host participant
    const hostParticipant: SpaceParticipant = {
      id: this.generateId("participant"),
      spaceId: space.id,
      userId: input.hostId,
      role: "host",
      audioMuted: false,
      videoMuted: !input.videoEnabled,
      screenSharing: false,
      handRaised: false,
      joinedAt: now,
      connectionStatus: "connected",
    }

    this.spaceParticipants.set(hostParticipant.id, hostParticipant)
    
    if (!this.participantsBySpace.has(space.id)) {
      this.participantsBySpace.set(space.id, new Set())
    }
    this.participantsBySpace.get(space.id)!.add(hostParticipant.id)

    if (!this.participantsByUser.has(input.hostId)) {
      this.participantsByUser.set(input.hostId, new Set())
    }
    this.participantsByUser.get(input.hostId)!.add(hostParticipant.id)

    this.saveToLocalStorage()
    return space
  }

  getSpace(spaceId: string): Space | undefined {
    return this.spaces.get(spaceId)
  }

  getAllSpaces(): Space[] {
    return Array.from(this.spaces.values())
  }

  getGroupSpaces(groupId: string, status?: "live" | "ended" | "scheduled"): Space[] {
    const spaceIds = this.spacesByGroup.get(groupId)
    if (!spaceIds) return []
    
    const spaces = Array.from(spaceIds)
      .map(id => this.spaces.get(id))
      .filter((space): space is Space => Boolean(space))

    if (status) {
      return spaces.filter(s => s.status === status)
    }
    return spaces
  }

  getLiveSpaces(): Space[] {
    return Array.from(this.spaces.values()).filter(s => s.status === "live")
  }

  updateSpace(spaceId: string, updates: {
    title?: string
    description?: string
    maxParticipants?: number
    audioEnabled?: boolean
    videoEnabled?: boolean
    screenShareEnabled?: boolean
  }): Space | undefined {
    const space = this.spaces.get(spaceId)
    if (!space) return undefined

    const updated: Space = {
      ...space,
      ...updates,
      updatedAt: new Date(),
    }

    this.spaces.set(spaceId, updated)
    this.saveToLocalStorage()
    return updated
  }

  endSpace(spaceId: string): Space | undefined {
    const space = this.spaces.get(spaceId)
    if (!space) return undefined

    const ended: Space = {
      ...space,
      status: "ended",
      endedAt: new Date(),
      updatedAt: new Date(),
    }

    this.spaces.set(spaceId, ended)

    // End all participant connections
    const participantIds = this.participantsBySpace.get(spaceId)
    if (participantIds) {
      const now = new Date()
      for (const participantId of participantIds) {
        const participant = this.spaceParticipants.get(participantId)
        if (participant && !participant.leftAt) {
          participant.leftAt = now
          participant.connectionStatus = "disconnected"
          this.spaceParticipants.set(participantId, participant)
        }
      }
    }

    this.saveToLocalStorage()
    return ended
  }

  deleteSpace(spaceId: string): boolean {
    const space = this.spaces.get(spaceId)
    if (!space) return false

    this.spaces.delete(spaceId)
    
    // Clean up references
    const groupSpaces = this.spacesByGroup.get(space.groupId)
    if (groupSpaces) {
      groupSpaces.delete(spaceId)
    }

    // Remove all participants
    const participantIds = this.participantsBySpace.get(spaceId)
    if (participantIds) {
      for (const participantId of participantIds) {
        const participant = this.spaceParticipants.get(participantId)
        if (participant) {
          const userParticipants = this.participantsByUser.get(participant.userId)
          if (userParticipants) {
            userParticipants.delete(participantId)
          }
          this.spaceParticipants.delete(participantId)
        }
      }
      this.participantsBySpace.delete(spaceId)
    }

    // Remove all invitations
    const invitationIds = this.invitationsBySpace.get(spaceId)
    if (invitationIds) {
      for (const invitationId of invitationIds) {
        const invitation = this.spaceInvitations.get(invitationId)
        if (invitation) {
          const userInvitations = this.invitationsByUser.get(invitation.invitedUserId)
          if (userInvitations) {
            userInvitations.delete(invitationId)
          }
          this.spaceInvitations.delete(invitationId)
        }
      }
      this.invitationsBySpace.delete(spaceId)
    }

    this.saveToLocalStorage()
    return true
  }

  // Space Participant Methods
  joinSpace(spaceId: string, userId: string, role: SpaceParticipant["role"] = "listener"): SpaceParticipant | undefined {
    const space = this.spaces.get(spaceId)
    if (!space || space.status !== "live") return undefined

    // Check if already a participant
    const existingParticipants = this.getSpaceParticipants(spaceId)
    const existing = existingParticipants.find(p => p.userId === userId && !p.leftAt)
    if (existing) return existing

    // Check capacity
    if (space.participants.length >= space.maxParticipants) {
      return undefined
    }

    const now = new Date()
    const participant: SpaceParticipant = {
      id: this.generateId("participant"),
      spaceId,
      userId,
      role,
      audioMuted: true, // Start muted by default
      videoMuted: true,
      screenSharing: false,
      handRaised: false,
      joinedAt: now,
      connectionStatus: "connected",
    }

    this.spaceParticipants.set(participant.id, participant)

    if (!this.participantsBySpace.has(spaceId)) {
      this.participantsBySpace.set(spaceId, new Set())
    }
    this.participantsBySpace.get(spaceId)!.add(participant.id)

    if (!this.participantsByUser.has(userId)) {
      this.participantsByUser.set(userId, new Set())
    }
    this.participantsByUser.get(userId)!.add(participant.id)

    // Update space participant list and stats
    space.participants.push(userId)
    space.totalJoins = (space.totalJoins ?? 0) + 1
    if (space.participants.length > (space.peakParticipants ?? 0)) {
      space.peakParticipants = space.participants.length
    }
    this.spaces.set(spaceId, space)

    this.saveToLocalStorage()
    return participant
  }

  leaveSpace(spaceId: string, userId: string): boolean {
    const participants = this.getSpaceParticipants(spaceId)
    const participant = participants.find(p => p.userId === userId && !p.leftAt)
    
    if (!participant) return false

    const now = new Date()
    participant.leftAt = now
    participant.connectionStatus = "disconnected"
    this.spaceParticipants.set(participant.id, participant)

    // Remove from space participant list
    const space = this.spaces.get(spaceId)
    if (space) {
      space.participants = space.participants.filter((id: string) => id !== userId)
      this.spaces.set(spaceId, space)
    }

    this.saveToLocalStorage()
    return true
  }

  getSpaceParticipants(spaceId: string): SpaceParticipant[] {
    const participantIds = this.participantsBySpace.get(spaceId)
    if (!participantIds) return []

    return Array.from(participantIds)
      .map(id => this.spaceParticipants.get(id))
      .filter((p): p is SpaceParticipant => Boolean(p))
  }

  getActiveSpaceParticipants(spaceId: string): SpaceParticipant[] {
    return this.getSpaceParticipants(spaceId).filter(p => !p.leftAt)
  }

  updateSpaceParticipant(participantId: string, updates: {
    role?: SpaceParticipant["role"]
    audioMuted?: boolean
    videoMuted?: boolean
    screenSharing?: boolean
    handRaised?: boolean
    connectionStatus?: SpaceParticipant["connectionStatus"]
  }): SpaceParticipant | undefined {
    const participant = this.spaceParticipants.get(participantId)
    if (!participant) return undefined

    const updated: SpaceParticipant = {
      ...participant,
      ...updates,
    }

    this.spaceParticipants.set(participantId, updated)
    this.saveToLocalStorage()
    return updated
  }

  updateSpaceParticipantRole(spaceId: string, userId: string, role: SpaceParticipant["role"]): SpaceParticipant | undefined {
    const participants = this.getActiveSpaceParticipants(spaceId)
    const participant = participants.find(p => p.userId === userId)
    
    if (!participant) return undefined

    return this.updateSpaceParticipant(participant.id, { role })
  }

  raiseHand(spaceId: string, userId: string, handRaised: boolean): SpaceParticipant | undefined {
    const participants = this.getActiveSpaceParticipants(spaceId)
    const participant = participants.find(p => p.userId === userId)
    
    if (!participant) return undefined

    return this.updateSpaceParticipant(participant.id, { handRaised })
  }

  // Space Invitation Methods
  createSpaceInvitation(spaceId: string, invitedUserId: string, invitedByUserId: string): SpaceInvitation {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000) // 1 hour

    const invitation: SpaceInvitation = {
      id: this.generateId("invitation"),
      spaceId,
      invitedUserId,
      invitedByUserId,
      status: "pending",
      createdAt: now,
      expiresAt,
    }

    this.spaceInvitations.set(invitation.id, invitation)

    if (!this.invitationsBySpace.has(spaceId)) {
      this.invitationsBySpace.set(spaceId, new Set())
    }
    this.invitationsBySpace.get(spaceId)!.add(invitation.id)

    if (!this.invitationsByUser.has(invitedUserId)) {
      this.invitationsByUser.set(invitedUserId, new Set())
    }
    this.invitationsByUser.get(invitedUserId)!.add(invitation.id)

    this.saveToLocalStorage()
    return invitation
  }

  getSpaceInvitations(spaceId: string): SpaceInvitation[] {
    const invitationIds = this.invitationsBySpace.get(spaceId)
    if (!invitationIds) return []

    return Array.from(invitationIds)
      .map(id => this.spaceInvitations.get(id))
      .filter((inv): inv is SpaceInvitation => Boolean(inv))
  }

  getUserSpaceInvitations(userId: string, status?: SpaceInvitation["status"]): SpaceInvitation[] {
    const invitationIds = this.invitationsByUser.get(userId)
    if (!invitationIds) return []

    const invitations = Array.from(invitationIds)
      .map(id => this.spaceInvitations.get(id))
      .filter((inv): inv is SpaceInvitation => Boolean(inv))

    if (status) {
      return invitations.filter(inv => inv.status === status)
    }
    return invitations
  }

  updateSpaceInvitation(invitationId: string, status: SpaceInvitation["status"]): SpaceInvitation | undefined {
    const invitation = this.spaceInvitations.get(invitationId)
    if (!invitation) return undefined

    const updated: SpaceInvitation = {
      ...invitation,
      status,
    }

    this.spaceInvitations.set(invitationId, updated)
    this.saveToLocalStorage()
    return updated
  }

  clear(): void {
    this.userLevels.clear()
    this.userPreferences.clear()
    this.chatRooms.clear()
    this.chatMessages.clear()
    this.notifications.clear()
    this.squads.clear()
    this.users.clear()
    this.usersByEmail.clear()
    this.usersByStudentId.clear()
    this.userPasswords.clear()
    this.groups.clear()
    this.groupMembers.clear()
    this.groupMembersByGroup.clear()
    this.groupMembersByUser.clear()
    this.sessions.clear()
    this.sessionsByGroup.clear()
    this.messages.clear()
    this.messagesByGroup.clear()
    this.messagesBySession.clear()
    this.rsvps.clear()
    this.rsvpsBySession.clear()
    this.spaces.clear()
    this.spacesByGroup.clear()
    this.spaceParticipants.clear()
    this.participantsBySpace.clear()
    this.participantsByUser.clear()
    this.spaceInvitations.clear()
    this.invitationsBySpace.clear()
    this.invitationsByUser.clear()
  }

  // PERSISTENCE METHODS
  saveToLocalStorage(): void {
    if (typeof window === 'undefined') {
      // Server-side: save to a global variable that persists across requests
      if (typeof globalThis !== 'undefined') {
        ;(globalThis as any).__campusConnect_persistedData = this.getSerializableData()
      }
      return
    }

    try {
      const data = this.getSerializableData()
      localStorage.setItem('campusConnect_dataStore', JSON.stringify(data))
      console.log('[DataStore] Saved to localStorage')
    } catch (error) {
      console.error('[DataStore] Failed to save to localStorage:', error)
    }
  }

  loadFromLocalStorage(): boolean {
    if (typeof window === 'undefined') {
      // Server-side: load from global variable
      if (typeof globalThis !== 'undefined') {
        const persisted = (globalThis as any).__campusConnect_persistedData
        if (persisted) {
          this.loadSerializableData(persisted)
          this.applyPostLoadMigrations()
          console.log('[DataStore] Loaded from global variable')
          return true
        }
      }
      return false
    }

    try {
      const stored = localStorage.getItem('campusConnect_dataStore')
      if (!stored) return false

      const data = JSON.parse(stored)
      this.loadSerializableData(data)
  this.applyPostLoadMigrations()
      console.log('[DataStore] Loaded from localStorage')
      return true
    } catch (error) {
      console.error('[DataStore] Failed to load from localStorage:', error)
      return false
    }
  }

  private getSerializableData() {
    return {
      userLevels: Array.from(this.userLevels.entries()),
      userPreferences: Array.from(this.userPreferences.entries()),
      chatRooms: Array.from(this.chatRooms.entries()),
      chatMessages: Array.from(this.chatMessages.entries()),
      notifications: Array.from(this.notifications.entries()),
      squads: Array.from(this.squads.entries()),
      users: Array.from(this.users.entries()),
      usersByEmail: Array.from(this.usersByEmail.entries()),
      usersByStudentId: Array.from(this.usersByStudentId.entries()),
      userPasswords: Array.from(this.userPasswords.entries()),
      groups: Array.from(this.groups.entries()),
      groupMembers: Array.from(this.groupMembers.entries()),
      groupMembersByGroup: Array.from(this.groupMembersByGroup.entries()).map(([key, set]) => [key, Array.from(set)]),
      groupMembersByUser: Array.from(this.groupMembersByUser.entries()).map(([key, set]) => [key, Array.from(set)]),
      sessions: Array.from(this.sessions.entries()),
      sessionsByGroup: Array.from(this.sessionsByGroup.entries()).map(([key, set]) => [key, Array.from(set)]),
      messages: Array.from(this.messages.entries()),
      messagesByGroup: Array.from(this.messagesByGroup.entries()).map(([key, set]) => [key, Array.from(set)]),
      messagesBySession: Array.from(this.messagesBySession.entries()).map(([key, set]) => [key, Array.from(set)]),
      rsvps: Array.from(this.rsvps.entries()),
      rsvpsBySession: Array.from(this.rsvpsBySession.entries()).map(([key, set]) => [key, Array.from(set)]),
      spaces: Array.from(this.spaces.entries()),
      spacesByGroup: Array.from(this.spacesByGroup.entries()).map(([key, set]) => [key, Array.from(set)]),
      spaceParticipants: Array.from(this.spaceParticipants.entries()),
      participantsBySpace: Array.from(this.participantsBySpace.entries()).map(([key, set]) => [key, Array.from(set)]),
      participantsByUser: Array.from(this.participantsByUser.entries()).map(([key, set]) => [key, Array.from(set)]),
      spaceInvitations: Array.from(this.spaceInvitations.entries()),
      invitationsBySpace: Array.from(this.invitationsBySpace.entries()).map(([key, set]) => [key, Array.from(set)]),
      invitationsByUser: Array.from(this.invitationsByUser.entries()).map(([key, set]) => [key, Array.from(set)]),
    }
  }

  private loadSerializableData(data: any) {
    this.userLevels = new Map(data.userLevels)
    this.userPreferences = new Map(data.userPreferences)
    this.chatRooms = new Map(data.chatRooms)
    this.chatMessages = new Map(data.chatMessages)
    this.notifications = new Map(data.notifications)
    this.squads = new Map(data.squads)
    this.users = new Map(data.users)
    this.usersByEmail = new Map(data.usersByEmail)
    this.usersByStudentId = new Map(data.usersByStudentId)
    this.userPasswords = new Map(data.userPasswords)
    this.groups = new Map(data.groups)
    this.groupMembers = new Map(data.groupMembers)
    this.groupMembersByGroup = new Map(data.groupMembersByGroup.map(([key, arr]: [string, string[]]) => [key, new Set(arr)]))
    this.groupMembersByUser = new Map(data.groupMembersByUser.map(([key, arr]: [string, string[]]) => [key, new Set(arr)]))
    this.sessions = new Map(data.sessions)
    this.sessionsByGroup = new Map(data.sessionsByGroup.map(([key, arr]: [string, string[]]) => [key, new Set(arr)]))
    this.messages = new Map(data.messages)
    this.messagesByGroup = new Map(data.messagesByGroup.map(([key, arr]: [string, string[]]) => [key, new Set(arr)]))
    this.messagesBySession = new Map(data.messagesBySession.map(([key, arr]: [string, string[]]) => [key, new Set(arr)]))
    this.rsvps = new Map(data.rsvps)
    this.rsvpsBySession = new Map(data.rsvpsBySession.map(([key, arr]: [string, string[]]) => [key, new Set(arr)]))
    this.spaces = new Map(data.spaces)
    this.spacesByGroup = new Map(data.spacesByGroup.map(([key, arr]: [string, string[]]) => [key, new Set(arr)]))
    this.spaceParticipants = new Map(data.spaceParticipants)
    this.participantsBySpace = new Map(data.participantsBySpace.map(([key, arr]: [string, string[]]) => [key, new Set(arr)]))
    this.participantsByUser = new Map(data.participantsByUser.map(([key, arr]: [string, string[]]) => [key, new Set(arr)]))
    this.spaceInvitations = new Map(data.spaceInvitations)
    this.invitationsBySpace = new Map(data.invitationsBySpace.map(([key, arr]: [string, string[]]) => [key, new Set(arr)]))
    this.invitationsByUser = new Map(data.invitationsByUser.map(([key, arr]: [string, string[]]) => [key, new Set(arr)]))
  }

}

// Export a singleton instance that survives hot reloads in dev and
// avoids re-initialization across module reloads in the same runtime.
// Note: In serverless environments, memory is not shared across lambdas,
// but this greatly improves consistency in dev and Node runtime.
declare global {
  // eslint-disable-next-line no-var
  var __campusConnect_dataStore: DataStore | undefined
}

const instance: DataStore = (globalThis as any).__campusConnect_dataStore ?? new DataStore()
if (process.env.NODE_ENV !== "production") {
  ;(globalThis as any).__campusConnect_dataStore = instance
}

export const dataStore = instance
export const store = dataStore

// Load persisted data on initialization (both client and server)
const loaded = dataStore.loadFromLocalStorage()
if (!loaded) {
  // No persisted data, initialize with demo data
  dataStore.resetToDefaults()
}
