// Input validation schemas using Zod
// Used across API routes to validate request bodies

import { z } from 'zod';

// === GROUP SCHEMAS ===

export const createGroupSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(500),
  privacy: z.enum(['public', 'invite-only', 'private']),
  topics: z.array(z.string()).min(1, 'At least one topic required').max(10),
  location: z.string().optional(),
});

export const updateGroupSchema = createGroupSchema.partial();

// === SESSION SCHEMAS ===

export const createSessionSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(500),
  groupId: z.string().uuid().optional(),
  location: z.string().min(1, 'Location is required'),
  startAt: z.string().datetime(), // ISO 8601 string
  endAt: z.string().datetime(),
  capacity: z.number().int().positive().optional(),
  privacy: z.enum(['public', 'invite-only']),
});

export const updateSessionSchema = createSessionSchema.partial();

// === MESSAGE SCHEMAS ===

export const createMessageSchema = z.object({
  groupId: z.string().uuid().optional(),
  sessionId: z.string().uuid().optional(),
  content: z.string().min(1, 'Message cannot be empty').max(2000),
  replyToId: z.string().uuid().optional(),
}).refine(
  data => data.groupId || data.sessionId,
  { message: 'Either groupId or sessionId must be provided' }
);

// === RSVP SCHEMAS ===

export const createRSVPSchema = z.object({
  status: z.enum(['yes', 'no', 'maybe']),
});

// === USER PREFERENCE SCHEMAS ===

export const createUserPreferenceSchema = z.object({
  interests: z.array(z.string()).min(1, 'At least one interest required'),
  preferredEventTypes: z.array(z.string()),
  preferredSquadTopics: z.array(z.string()).optional(),
  notificationFrequency: z.enum(['instant', 'daily', 'weekly', 'none']),
  discoveryEnabled: z.boolean(),
});

export const updateUserPreferenceSchema = createUserPreferenceSchema.partial();

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  topics: z.array(z.string()).max(10).optional(),
  year: z.string().max(20).optional(),
  major: z.string().max(50).optional(),
});

// === SPACE SCHEMAS ===

export const createSpaceSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().max(500).optional(),
  type: z.enum([
    'study-session',
    'office-hours',
    'social-hangout',
    'lecture',
    'project-collab',
    'mentorship',
    'debate',
    'peer-review',
  ]),
  groupId: z.string().uuid(),
  privacy: z.enum(['public', 'private', 'invite-only', 'password-protected']).default('private'),
  password: z.string().min(4).max(50).optional(),
  maxParticipants: z.number().int().positive().min(2).max(500).optional(),
  scheduledFor: z.string().datetime().optional(),
  duration: z.number().int().positive().optional(),
  recordingEnabled: z.boolean().default(false),
  recordingRetention: z.enum(['never', '30d', '90d', '1y', 'indefinite']).optional(),
  moderators: z.array(z.string().uuid()).optional(),
  complianceLevel: z.enum(['basic', 'hipaa', 'ferpa', 'gdpr', 'sox']).optional(),
  encryptionEnabled: z.boolean().optional(),
  tags: z.array(z.string()).max(10).optional(),
});

export const updateSpaceSchema = createSpaceSchema.partial();

export const toggleSpaceFeatureSchema = z.object({
  feature: z.string().min(1),
  enabled: z.boolean(),
});

export const inviteToPrivateSpaceSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1, 'At least one user must be invited'),
  role: z.enum(['moderator', 'member', 'observer']).default('member'),
});

export const raiseHandSchema = z.object({
  handRaised: z.boolean(),
});

// Type exports for use in API routes
export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;
export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type CreateRSVPInput = z.infer<typeof createRSVPSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateSpaceInput = z.infer<typeof createSpaceSchema>;
export type UpdateSpaceInput = z.infer<typeof updateSpaceSchema>;
export type ToggleSpaceFeatureInput = z.infer<typeof toggleSpaceFeatureSchema>;
export type InviteToPrivateSpaceInput = z.infer<typeof inviteToPrivateSpaceSchema>
