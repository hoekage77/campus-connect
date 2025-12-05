# In-Memory Data Store Implementation Guide

**Current Approach:** Use JavaScript Maps and Sets for data storage  
**Later:** Migrate to Supabase (see MIGRATION_PLAN.md)

---

## Why In-Memory?

**Benefits:**
- ✅ Zero setup, no database configuration
- ✅ Instant iterations and testing
- ✅ No dependencies or migrations
- ✅ Perfect for prototyping E2EE features
- ✅ Easy to understand and debug
- ✅ Fast performance

**Trade-offs:**
- ⚠️ Data resets on server restart (expected for development)
- ⚠️ No persistence between sessions (can add localStorage for demos)
- ⚠️ Not production-ready (will migrate to Supabase later)

---

## Data Model (TypeScript Interfaces)

```typescript
// src/types/index.ts

export interface User {
  id: string;
  name: string;
  email: string;
  publicKey?: string;  // For E2EE
  avatarUrl?: string;
  year?: string;
  major?: string;
  topics: string[];
  createdAt: Date;
}

export interface Group {
  id: string;
  title: string;
  description: string;
  ownerId: string;
  privacy: 'public' | 'invite-only' | 'private';
  topics: string[];
  location?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: 'owner' | 'moderator' | 'member';
  encryptedGroupKey?: string;  // For E2EE
  joinedAt: Date;
}

export interface Session {
  id: string;
  title: string;
  description: string;
  hostId: string;
  groupId?: string;
  location: string;
  startAt: Date;
  endAt: Date;
  capacity?: number;
  privacy: 'public' | 'invite-only';
  createdAt: Date;
}

export interface Message {
  id: string;
  groupId?: string;
  sessionId?: string;
  senderId: string;
  ciphertext: string;  // Encrypted content
  iv: string;          // Initialization vector
  attachmentIds: string[];
  replyToId?: string;
  createdAt: Date;
}

export interface RSVP {
  id: string;
  sessionId: string;
  userId: string;
  status: 'yes' | 'no' | 'maybe';
  createdAt: Date;
}
```

---

## Core Data Store

```typescript
// src/lib/data/store.ts

import type { User, Group, GroupMember, Session, Message, RSVP } from '@/types';

class DataStore {
  // In-memory storage using Maps for O(1) lookups
  private users = new Map<string, User>();
  private groups = new Map<string, Group>();
  private groupMembers = new Map<string, GroupMember>();
  private sessions = new Map<string, Session>();
  private messages = new Map<string, Message>();
  private rsvps = new Map<string, RSVP>();

  // Index maps for faster queries
  private usersByEmail = new Map<string, string>(); // email -> userId
  private groupMembersByGroup = new Map<string, Set<string>>(); // groupId -> Set<memberId>
  private groupMembersByUser = new Map<string, Set<string>>(); // userId -> Set<memberId>
  private messagesByGroup = new Map<string, string[]>(); // groupId -> messageIds[]
  private messagesBySession = new Map<string, string[]>(); // sessionId -> messageIds[]
  private rsvpsBySession = new Map<string, Set<string>>(); // sessionId -> Set<rsvpId>

  constructor() {
    this.seedDemoData();
  }

  // User operations
  getUser(id: string): User | undefined {
    return this.users.get(id);
  }

  getUserByEmail(email: string): User | undefined {
    const userId = this.usersByEmail.get(email);
    return userId ? this.users.get(userId) : undefined;
  }

  createUser(user: Omit<User, 'id' | 'createdAt'>): User {
    const newUser: User = {
      ...user,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    this.users.set(newUser.id, newUser);
    this.usersByEmail.set(newUser.email, newUser.id);
    return newUser;
  }

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updated = { ...user, ...updates };
    this.users.set(id, updated);
    return updated;
  }

  // Group operations
  getGroup(id: string): Group | undefined {
    return this.groups.get(id);
  }

  getAllGroups(): Group[] {
    return Array.from(this.groups.values());
  }

  getPublicGroups(): Group[] {
    return Array.from(this.groups.values()).filter(
      g => g.privacy === 'public'
    );
  }

  createGroup(group: Omit<Group, 'id' | 'createdAt' | 'updatedAt'>): Group {
    const newGroup: Group = {
      ...group,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.groups.set(newGroup.id, newGroup);
    return newGroup;
  }

  updateGroup(id: string, updates: Partial<Group>): Group | undefined {
    const group = this.groups.get(id);
    if (!group) return undefined;
    
    const updated = { ...group, ...updates, updatedAt: new Date() };
    this.groups.set(id, updated);
    return updated;
  }

  deleteGroup(id: string): boolean {
    return this.groups.delete(id);
  }

  // Group Member operations
  getGroupMembers(groupId: string): GroupMember[] {
    const memberIds = this.groupMembersByGroup.get(groupId) || new Set();
    return Array.from(memberIds)
      .map(id => this.groupMembers.get(id))
      .filter((m): m is GroupMember => m !== undefined);
  }

  getUserGroups(userId: string): Group[] {
    const membershipIds = this.groupMembersByUser.get(userId) || new Set();
    const groupIds = Array.from(membershipIds)
      .map(id => this.groupMembers.get(id)?.groupId)
      .filter((id): id is string => id !== undefined);
    
    return groupIds
      .map(id => this.groups.get(id))
      .filter((g): g is Group => g !== undefined);
  }

  addGroupMember(
    member: Omit<GroupMember, 'id' | 'joinedAt'>
  ): GroupMember {
    const newMember: GroupMember = {
      ...member,
      id: crypto.randomUUID(),
      joinedAt: new Date(),
    };
    
    this.groupMembers.set(newMember.id, newMember);
    
    // Update indexes
    if (!this.groupMembersByGroup.has(member.groupId)) {
      this.groupMembersByGroup.set(member.groupId, new Set());
    }
    this.groupMembersByGroup.get(member.groupId)!.add(newMember.id);
    
    if (!this.groupMembersByUser.has(member.userId)) {
      this.groupMembersByUser.set(member.userId, new Set());
    }
    this.groupMembersByUser.get(member.userId)!.add(newMember.id);
    
    return newMember;
  }

  removeGroupMember(groupId: string, userId: string): boolean {
    const members = this.getGroupMembers(groupId);
    const member = members.find(m => m.userId === userId);
    if (!member) return false;
    
    this.groupMembers.delete(member.id);
    this.groupMembersByGroup.get(groupId)?.delete(member.id);
    this.groupMembersByUser.get(userId)?.delete(member.id);
    return true;
  }

  // Session operations
  getSession(id: string): Session | undefined {
    return this.sessions.get(id);
  }

  getAllSessions(): Session[] {
    return Array.from(this.sessions.values());
  }

  getPublicSessions(): Session[] {
    return Array.from(this.sessions.values()).filter(
      s => s.privacy === 'public'
    );
  }

  createSession(
    session: Omit<Session, 'id' | 'createdAt'>
  ): Session {
    const newSession: Session = {
      ...session,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    this.sessions.set(newSession.id, newSession);
    return newSession;
  }

  // Message operations
  getGroupMessages(groupId: string): Message[] {
    const messageIds = this.messagesByGroup.get(groupId) || [];
    return messageIds
      .map(id => this.messages.get(id))
      .filter((m): m is Message => m !== undefined)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  createMessage(
    message: Omit<Message, 'id' | 'createdAt'>
  ): Message {
    const newMessage: Message = {
      ...message,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    
    this.messages.set(newMessage.id, newMessage);
    
    // Update indexes
    if (message.groupId) {
      if (!this.messagesByGroup.has(message.groupId)) {
        this.messagesByGroup.set(message.groupId, []);
      }
      this.messagesByGroup.get(message.groupId)!.push(newMessage.id);
    }
    
    if (message.sessionId) {
      if (!this.messagesBySession.has(message.sessionId)) {
        this.messagesBySession.set(message.sessionId, []);
      }
      this.messagesBySession.get(message.sessionId)!.push(newMessage.id);
    }
    
    return newMessage;
  }

  // RSVP operations
  getSessionRSVPs(sessionId: string): RSVP[] {
    const rsvpIds = this.rsvpsBySession.get(sessionId) || new Set();
    return Array.from(rsvpIds)
      .map(id => this.rsvps.get(id))
      .filter((r): r is RSVP => r !== undefined);
  }

  createOrUpdateRSVP(
    rsvp: Omit<RSVP, 'id' | 'createdAt'>
  ): RSVP {
    // Check if RSVP already exists
    const existing = Array.from(this.rsvps.values()).find(
      r => r.sessionId === rsvp.sessionId && r.userId === rsvp.userId
    );
    
    if (existing) {
      const updated = { ...existing, status: rsvp.status };
      this.rsvps.set(existing.id, updated);
      return updated;
    }
    
    const newRSVP: RSVP = {
      ...rsvp,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    
    this.rsvps.set(newRSVP.id, newRSVP);
    
    if (!this.rsvpsBySession.has(rsvp.sessionId)) {
      this.rsvpsBySession.set(rsvp.sessionId, new Set());
    }
    this.rsvpsBySession.get(rsvp.sessionId)!.add(newRSVP.id);
    
    return newRSVP;
  }

  // Seed demo data
  private seedDemoData() {
    // Create demo users
    const alice = this.createUser({
      name: 'Alice Johnson',
      email: 'alice@example.com',
      topics: ['Computer Science', 'Math'],
      year: 'Junior',
      major: 'CS',
    });

    const bob = this.createUser({
      name: 'Bob Smith',
      email: 'bob@example.com',
      topics: ['Physics', 'Engineering'],
      year: 'Sophomore',
      major: 'Engineering',
    });

    // Create demo groups
    const csStudy = this.createGroup({
      title: 'CS 456 Study Group',
      description: 'Weekly study sessions for Computer Science 456',
      ownerId: alice.id,
      privacy: 'public',
      topics: ['Computer Science', 'Algorithms'],
      location: 'Library Room 201',
    });

    this.addGroupMember({
      groupId: csStudy.id,
      userId: alice.id,
      role: 'owner',
    });

    this.addGroupMember({
      groupId: csStudy.id,
      userId: bob.id,
      role: 'member',
    });

    // Create demo session
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);

    const sessionEnd = new Date(tomorrow);
    sessionEnd.setHours(16, 0, 0, 0);

    this.createSession({
      title: 'CS 456 Exam Review',
      description: 'Review session for upcoming midterm',
      hostId: alice.id,
      groupId: csStudy.id,
      location: 'Library Room 201',
      startAt: tomorrow,
      endAt: sessionEnd,
      capacity: 20,
      privacy: 'public',
    });

    console.log('✅ Demo data seeded:', {
      users: this.users.size,
      groups: this.groups.size,
      sessions: this.sessions.size,
    });
  }

  // Clear all data (useful for testing)
  clear() {
    this.users.clear();
    this.groups.clear();
    this.groupMembers.clear();
    this.sessions.clear();
    this.messages.clear();
    this.rsvps.clear();
    this.usersByEmail.clear();
    this.groupMembersByGroup.clear();
    this.groupMembersByUser.clear();
    this.messagesByGroup.clear();
    this.messagesBySession.clear();
    this.rsvpsBySession.clear();
  }
}

// Export singleton instance
export const dataStore = new DataStore();
```

---

## API Route Example

```typescript
// src/app/api/groups/route.ts

import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/data/store';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const privacy = searchParams.get('privacy');

    const groups = privacy === 'public' 
      ? dataStore.getPublicGroups()
      : dataStore.getAllGroups();

    return NextResponse.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch groups' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // TODO: Get current user from session
    const body = await request.json();

    const group = dataStore.createGroup({
      title: body.title,
      description: body.description,
      ownerId: body.ownerId, // From session
      privacy: body.privacy || 'public',
      topics: body.topics || [],
      location: body.location,
    });

    // Add creator as owner
    dataStore.addGroupMember({
      groupId: group.id,
      userId: body.ownerId,
      role: 'owner',
    });

    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json(
      { error: 'Failed to create group' },
      { status: 500 }
    );
  }
}
```

---

## Migration to Supabase (Later)

When ready to migrate:

1. Keep the same TypeScript interfaces
2. Replace `dataStore` methods with Supabase queries
3. All API routes remain the same (just swap implementation)
4. See `MIGRATION_PLAN.md` for detailed guide

Example:
```typescript
// Before (in-memory)
const groups = dataStore.getPublicGroups();

// After (Supabase)
const { data: groups } = await supabase
  .from('groups')
  .select('*')
  .eq('privacy', 'public');
```

---

## Optional: Add localStorage Persistence

For demo purposes, you can persist data to localStorage:

```typescript
// Add to DataStore class
saveToLocalStorage() {
  if (typeof window !== 'undefined') {
    localStorage.setItem('campus-connect-data', JSON.stringify({
      users: Array.from(this.users.entries()),
      groups: Array.from(this.groups.entries()),
      // ... etc
    }));
  }
}

loadFromLocalStorage() {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem('campus-connect-data');
    if (data) {
      const parsed = JSON.parse(data);
      this.users = new Map(parsed.users);
      this.groups = new Map(parsed.groups);
      // ... etc
    }
  }
}
```

---

**Status:** Ready to implement  
**Effort:** ~1-2 hours to create all stores  
**Migration:** Easy swap to Supabase later
