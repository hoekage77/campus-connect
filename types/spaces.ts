/**
 * Comprehensive type definitions for Campus Connect Spaces feature
 * Supports 8 different space types with unique configurations and features
 */

// ============================================================================
// ENUMS & LITERALS
// ============================================================================

export type SpaceType = 
  | 'study-session'
  | 'office-hours'
  | 'social-hangout'
  | 'lecture'
  | 'project-collab'
  | 'mentorship'
  | 'debate'
  | 'peer-review'
  // Legacy compatibility aliases
  | 'study-sprint'
  | 'social'
  | 'collaboration'
  | 'tutoring'
  | 'general'

export type SpaceStatus = 
  | 'scheduled'
  | 'live'
  | 'paused'
  | 'ended'
  | 'cancelled'
  | 'archived'

export type SpacePrivacy = 
  | 'public'
  | 'private'
  | 'invite-only'
  | 'password-protected'

export type ParticipantRole = 
  | 'host'
  | 'co-host'
  | 'moderator'
  | 'speaker'
  | 'member'
  | 'observer'
  | 'listener'

export type ComplianceLevel = 
  | 'basic'
  | 'hipaa'
  | 'ferpa'
  | 'gdpr'
  | 'sox'

export type DataRetention = 
  | 'never'
  | '30d'
  | '90d'
  | '1y'
  | 'indefinite'

// ============================================================================
// FEATURE FLAGS
// ============================================================================

export interface SpaceFeatures {
  // Core features
  audio: boolean
  video: boolean
  chat: boolean
  screenshare: boolean
  recording: boolean
  
  // Study/Collab features
  whiteboard?: boolean
  codeEditor?: boolean
  documentSharing?: boolean
  
  // Office Hours features
  queueSystem?: boolean
  breakoutRooms?: boolean
  
  // Social features
  games?: boolean
  reactions?: boolean
  
  // Lecture features
  polls?: boolean
  slidePresentation?: boolean
  audience?: boolean
  
  // Project features
  projectBoard?: boolean
  fileStorage?: boolean
  versionControl?: boolean
  
  // Mentorship features
  agenda?: boolean
  goals?: boolean
  progressTracking?: boolean
  
  // Debate features
  timedSpeaks?: boolean
  voting?: boolean
  scoring?: boolean
  
  // Peer Review features
  rubrics?: boolean
  annotatePDF?: boolean
  feedbackForms?: boolean
}

// ============================================================================
// BASE SPACE CONFIGURATION
// ============================================================================

export interface BaseSpaceConfig {
  title: string
  description?: string
  type: SpaceType
  hostId: string
  groupId: string
  privacy: SpacePrivacy
  password?: string
  
  // Scheduling
  scheduledFor?: Date
  duration?: number // minutes
  recurring?: RecurrencePattern
  
  // Capacity
  maxParticipants: number
  
  // Access
  invitedMembers?: string[] // for private/invite-only
  requiresApproval?: boolean
  
  // Recording
  recordingEnabled: boolean
  recordingRetention?: DataRetention
  
  // Moderation
  moderators: string[]
  autoModerationRules?: ModerationRule[]
  
  // Compliance
  complianceLevel?: ComplianceLevel
  encryptionEnabled?: boolean
  
  // Metadata
  tags?: string[]
  materials?: Material[]
  agenda?: AgendaItem[]
}

// ============================================================================
// SPACE TYPE CONFIGURATIONS
// ============================================================================

export interface StudySessionConfig extends BaseSpaceConfig {
  type: 'study-session'
  topic: string
  courseCode?: string
  problemSets?: string[]
  focusMode?: {
    enabled: boolean
    durationMinutes?: number
  }
}

export interface OfficeHoursConfig extends BaseSpaceConfig {
  type: 'office-hours'
  instructor: string
  officeLocation?: string
  virtualLocation?: string
  maxWaitTime?: number
  breaktimeMinutes?: number
  queueSettings?: {
    priorityRules?: string[]
  }
}

export interface SocialHangoutConfig extends BaseSpaceConfig {
  type: 'social-hangout'
  icebreakers?: string[]
  games?: string[]
  ambientMode: boolean
  musicEnabled?: boolean
}

export interface LectureConfig extends BaseSpaceConfig {
  type: 'lecture'
  courseName: string
  instructorName: string
  slideUrl?: string
  videoUrl?: string
  certificateGeneration?: boolean
}

export interface ProjectCollabConfig extends BaseSpaceConfig {
  type: 'project-collab'
  projectName: string
  projectDescription: string
  teamMembers: string[]
  deadline?: Date
  deliverables?: string[]
}

export interface MentorshipConfig extends BaseSpaceConfig {
  type: 'mentorship'
  mentorId: string
  menteeId: string
  focusArea: string
  goals?: string[]
  dayOfWeek?: string
}

export interface DebateConfig extends BaseSpaceConfig {
  type: 'debate'
  proposition: string
  format: 'formal' | 'informal' | 'roundtable'
  speakingTimeSeconds?: number
  moderator: string
}

export interface PeerReviewConfig extends BaseSpaceConfig {
  type: 'peer-review'
  reviewType: 'essay' | 'design' | 'code' | 'presentation' | 'other'
  presenterId: string
  reviewers: string[]
  rubric?: ReviewRubric
  documentsToReview?: string[]
  feedbackForm?: FeedbackForm
}

// Union type for all space configs
export type SpaceConfig = 
  | StudySessionConfig
  | OfficeHoursConfig
  | SocialHangoutConfig
  | LectureConfig
  | ProjectCollabConfig
  | MentorshipConfig
  | DebateConfig
  | PeerReviewConfig

// ============================================================================
// MAIN SPACE INTERFACE
// ============================================================================

export interface Space {
  id: string
  groupId: string
  hostId: string
  coHostIds?: string[]
  
  // Basic Info
  title: string
  description?: string
  type: SpaceType
  status: SpaceStatus
  privacy: SpacePrivacy
  
  // Configuration
  config?: SpaceConfig
  features?: SpaceFeatures
  
  // Media Settings (from DB)
  audioEnabled?: boolean
  videoEnabled?: boolean
  screenShareEnabled?: boolean
  
  // Scheduling
  scheduledFor?: Date
  duration?: number
  startedAt?: Date
  endedAt?: Date
  recurring?: RecurrencePattern
  
  // Participants
  maxParticipants: number
  participants: string[] // userIds
  moderators?: string[]
  hostName?: string
  
  // Recording & Data
  recordingEnabled?: boolean
  recordingUrl?: string
  recordingRetention?: DataRetention
  transcript?: string
  materials?: Material[]
  
  // Compliance & Privacy
  complianceLevel?: ComplianceLevel
  encryptionEnabled?: boolean
  invitedMembers?: string[]
  accessLog?: ParticipantActivity[]
  
  // Metadata & Analytics
  tags?: string[]
  attendanceCount?: number
  maxConcurrentParticipants?: number
  engagementScore?: number
  peakParticipants?: number
  totalJoins?: number
  
  // Daily.co Room
  roomName?: string
  roomUrl?: string
  roomToken?: string
  sessionId?: string
  chatRoomId?: string
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
  archivedAt?: Date
}

// ============================================================================
// PARTICIPANT & ACTIVITY
// ============================================================================

/**
 * SpaceParticipant - database representation of a participant in a space
 */
export interface SpaceParticipant {
  id: string
  spaceId: string
  userId: string
  role: ParticipantRole
  audioMuted: boolean
  videoMuted: boolean
  handRaised: boolean
  screenSharing: boolean
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting'
  joinedAt: Date
  leftAt?: Date
}

/**
 * SpaceLayoutParticipant - simplified participant for video layout components
 */
export interface SpaceLayoutParticipant {
  id: string
  name: string
  audioEnabled: boolean
  videoEnabled: boolean
  role?: ParticipantRole
  joinedAt?: Date
  isHost?: boolean
  isSpeaking?: boolean
  handRaised?: boolean
  avatarUrl?: string
}

export interface ParticipantActivity {
  userId: string
  username: string
  email?: string
  role: ParticipantRole
  joinedAt: Date
  leftAt?: Date
  duration: number // seconds
  
  // Activity tracking
  audioActive: boolean
  videoActive: boolean
  screenShared: boolean
  handRaised: boolean
  
  // Engagement
  messagesCount: number
  reactionsCount: number
  questionsAsked: number
  
  // Recording
  recordedVideo: boolean
  recordedAudio: boolean
}

// ============================================================================
// INVITATIONS
// ============================================================================

export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired'

export interface SpaceInvitation {
  id: string
  spaceId: string
  invitedUserId: string
  invitedByUserId: string
  status: InvitationStatus
  invitedAt?: Date
  respondedAt?: Date
  createdAt?: Date
  expiresAt?: Date
}

export interface EngagementMetrics {
  totalParticipants: number
  activeParticipants: number
  averageSessionDuration: number
  engagementScore: number
  mostActive: string[] // userIds
  conversationTopics: string[]
  questionsAsked: number
  answers: number
}

// ============================================================================
// SCHEDULING
// ============================================================================

export interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly'
  interval: number
  daysOfWeek?: number[] // 0-6
  endDate?: Date
  maxOccurrences?: number
}

// ============================================================================
// MODERATION
// ============================================================================

export interface ModerationRule {
  id: string
  type: 'keyword-filter' | 'user-restriction' | 'time-limit'
  action: 'warn' | 'mute' | 'kick'
  value: string | string[]
}

export interface ModerationLog {
  id: string
  spaceId: string
  moderatorId: string
  action: 'mute' | 'kick' | 'warn' | 'remove-message'
  userId?: string
  reason?: string
  timestamp: Date
}

// ============================================================================
// MATERIALS & RESOURCES
// ============================================================================

export interface Material {
  id: string
  title: string
  url: string
  type: 'document' | 'video' | 'code' | 'other'
  uploadedAt: Date
  uploadedBy: string
}

export interface AgendaItem {
  id: string
  title: string
  duration?: number
  description?: string
  order: number
}

// ============================================================================
// REVIEW & FEEDBACK
// ============================================================================

export interface ReviewRubric {
  id: string
  name: string
  criteria: RubricCriterion[]
}

export interface RubricCriterion {
  id: string
  name: string
  description?: string
  maxPoints: number
  levels: {
    name: string
    points: number
  }[]
}

export interface FeedbackForm {
  id: string
  questions: FeedbackQuestion[]
}

export interface FeedbackQuestion {
  id: string
  question: string
  type: 'text' | 'rating' | 'multiple-choice'
  required: boolean
}

export interface SpaceFeedback {
  spaceId: string
  userId: string
  rating: number // 1-5
  comments?: string
  responses?: Record<string, string | number>
  submittedAt: Date
}

// ============================================================================
// PRIVATE SPACE & COMPLIANCE
// ============================================================================

export interface PrivateSpaceAccess {
  spaceId: string
  userId: string
  accessLevel: 'owner' | 'moderator' | 'member' | 'observer' | 'denied'
  grantedAt: Date
  grantedBy: string
  expiresAt?: Date
}

export interface PrivateSpaceSettings {
  encryptionEnabled: boolean
  requiresApproval: boolean
  dataRetention: DataRetention
  deleteTranscriptOnly?: boolean
  keepMetadataOnly?: boolean
  complianceHold?: boolean
  dataResidency?: string // e.g., 'US-ONLY', 'EU'
}

export interface DataDeletionLog {
  spaceId: string
  userId?: string
  deletedAt: Date
  dataType: 'recording' | 'transcript' | 'participant-data' | 'all'
  reason?: string
  complianceReference?: string
}

// ============================================================================
// VALIDATION & HELPER TYPES
// ============================================================================

export interface CreateSpaceInput {
  title: string
  description?: string
  type: SpaceType
  groupId: string
  hostId: string
  config: Partial<SpaceConfig>
  privacy?: SpacePrivacy
  maxParticipants?: number
  scheduledFor?: Date
  duration?: number
  recordingEnabled?: boolean
}

export interface UpdateSpaceInput {
  title?: string
  description?: string
  status?: SpaceStatus
  config?: Partial<SpaceConfig>
  features?: Partial<SpaceFeatures>
  maxParticipants?: number
  moderators?: string[]
}

export interface ValidationResult {
  valid: boolean
  errors?: string[]
  warnings?: string[]
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isSpaceType(value: unknown): value is SpaceType {
  const types: SpaceType[] = [
    'study-session',
    'office-hours',
    'social-hangout',
    'lecture',
    'project-collab',
    'mentorship',
    'debate',
    'peer-review',
  ]
  return typeof value === 'string' && types.includes(value as SpaceType)
}

export function isStudySession(config: SpaceConfig): config is StudySessionConfig {
  return config.type === 'study-session'
}

export function isOfficeHours(config: SpaceConfig): config is OfficeHoursConfig {
  return config.type === 'office-hours'
}

export function isLecture(config: SpaceConfig): config is LectureConfig {
  return config.type === 'lecture'
}

export function isProjectCollab(config: SpaceConfig): config is ProjectCollabConfig {
  return config.type === 'project-collab'
}

export function isMentorship(config: SpaceConfig): config is MentorshipConfig {
  return config.type === 'mentorship'
}

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

export const DEFAULT_SPACE_FEATURES: Record<SpaceType, Partial<SpaceFeatures>> = {
  'study-session': {
    audio: true,
    video: true,
    chat: true,
    screenshare: true,
    recording: true,
    whiteboard: true,
    codeEditor: true,
    documentSharing: true,
  },
  'office-hours': {
    audio: true,
    video: true,
    chat: true,
    screenshare: true,
    recording: true,
    queueSystem: true,
    breakoutRooms: true,
  },
  'social-hangout': {
    audio: true,
    video: true,
    chat: true,
    screenshare: false,
    recording: false,
    games: true,
    reactions: true,
  },
  'lecture': {
    audio: true,
    video: true,
    chat: true,
    screenshare: true,
    recording: true,
    polls: true,
    slidePresentation: true,
    audience: true,
  },
  'project-collab': {
    audio: true,
    video: true,
    chat: true,
    screenshare: true,
    recording: true,
    projectBoard: true,
    fileStorage: true,
    codeEditor: true,
  },
  'mentorship': {
    audio: true,
    video: true,
    chat: true,
    screenshare: true,
    recording: true,
    goals: true,
    progressTracking: true,
  },
  'debate': {
    audio: true,
    video: true,
    chat: true,
    screenshare: false,
    recording: true,
    timedSpeaks: true,
    voting: true,
    scoring: true,
  },
  'peer-review': {
    audio: true,
    video: true,
    chat: true,
    screenshare: true,
    recording: false,
    rubrics: true,
    annotatePDF: true,
    feedbackForms: true,
  },
  // Legacy compatibility aliases - map to similar types
  'study-sprint': {
    audio: true,
    video: true,
    chat: true,
    screenshare: true,
    recording: true,
    whiteboard: true,
  },
  'social': {
    audio: true,
    video: true,
    chat: true,
    screenshare: false,
    recording: false,
    reactions: true,
  },
  'collaboration': {
    audio: true,
    video: true,
    chat: true,
    screenshare: true,
    recording: true,
    projectBoard: true,
    codeEditor: true,
  },
  'tutoring': {
    audio: true,
    video: true,
    chat: true,
    screenshare: true,
    recording: true,
    whiteboard: true,
  },
  'general': {
    audio: true,
    video: true,
    chat: true,
    screenshare: true,
    recording: false,
  },
}

export const DEFAULT_CAPACITIES: Record<SpaceType, number> = {
  'study-session': 15,
  'office-hours': 50,
  'social-hangout': 30,
  'lecture': 200,
  'project-collab': 10,
  'mentorship': 5,
  'debate': 20,
  'peer-review': 8,
  // Legacy compatibility
  'study-sprint': 15,
  'social': 30,
  'collaboration': 10,
  'tutoring': 5,
  'general': 20,
}

export const DEFAULT_DURATIONS: Record<SpaceType, number> = {
  'study-session': 90, // minutes
  'office-hours': 60,
  'social-hangout': 120,
  'lecture': 60,
  'project-collab': 60,
  'mentorship': 30,
  'debate': 90,
  'peer-review': 45,
  // Legacy compatibility
  'study-sprint': 60,
  'social': 120,
  'collaboration': 60,
  'tutoring': 45,
  'general': 60,
}
