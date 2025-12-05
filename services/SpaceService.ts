/**
 * SpaceService
 * 
 * Handles all space-related operations including creation, validation,
 * access control, and type-specific configurations.
 */

import type {
  Space,
  SpaceParticipant,
  SpaceInvitation,
} from '@/types'
import type {
  SpaceType,
  SpaceStatus,
  SpacePrivacy,
  BaseSpaceConfig,
  StudySessionConfig,
  OfficeHoursConfig,
  SocialHangoutConfig,
  LectureConfig,
  ProjectCollabConfig,
  MentorshipConfig,
  DebateConfig,
  PeerReviewConfig,
  SpaceFeatures,
} from '@/types/spaces'
import { getSupabaseRepository } from '@/lib/supabase/repository'

/**
 * Default feature flags for each space type
 */
export const DEFAULT_FEATURES: Record<SpaceType, SpaceFeatures> = {
  'study-session': {
    audio: true,
    video: true,
    chat: true,
    screenshare: true,
    recording: true,
    whiteboard: true,
    codeEditor: false,
    documentSharing: true,
  },
  'office-hours': {
    audio: true,
    video: true,
    chat: true,
    screenshare: true,
    recording: false,
    queueSystem: true,
    breakoutRooms: true,
  },
  'social-hangout': {
    audio: true,
    video: false,
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
    versionControl: false,
  },
  'mentorship': {
    audio: true,
    video: true,
    chat: true,
    screenshare: true,
    recording: false,
    agenda: true,
    goals: true,
    progressTracking: true,
  },
  'debate': {
    audio: true,
    video: true,
    chat: false,
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
  // Legacy compatibility aliases
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
    video: false,
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
  },
  'tutoring': {
    audio: true,
    video: true,
    chat: true,
    screenshare: true,
    recording: false,
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

/**
 * Default capacity limits for each space type
 */
export const CAPACITY_LIMITS: Record<SpaceType, { min: number; max: number; default: number }> = {
  'study-session': { min: 2, max: 15, default: 5 },
  'office-hours': { min: 2, max: 50, default: 20 },
  'social-hangout': { min: 2, max: 30, default: 10 },
  'lecture': { min: 5, max: 500, default: 100 },
  'project-collab': { min: 2, max: 10, default: 5 },
  'mentorship': { min: 2, max: 5, default: 2 },
  'debate': { min: 4, max: 20, default: 8 },
  'peer-review': { min: 3, max: 8, default: 5 },
  // Legacy compatibility
  'study-sprint': { min: 2, max: 15, default: 5 },
  'social': { min: 2, max: 30, default: 10 },
  'collaboration': { min: 2, max: 10, default: 5 },
  'tutoring': { min: 2, max: 5, default: 2 },
  'general': { min: 2, max: 20, default: 10 },
}

/**
 * SpaceService
 */
export class SpaceService {
  private static repo = getSupabaseRepository()

  /**
   * Get default features for a space type
   */
  static getDefaultFeatures(type: SpaceType): SpaceFeatures {
    return DEFAULT_FEATURES[type]
  }

  /**
   * Get capacity limits for a space type
   */
  static getCapacityLimits(type: SpaceType) {
    return CAPACITY_LIMITS[type]
  }

  /**
   * Validate base space configuration
   */
  static validateBaseConfig(config: BaseSpaceConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Required fields
    if (!config.title || config.title.trim().length === 0) {
      errors.push('Space title is required')
    }
    if (config.title && config.title.length > 200) {
      errors.push('Space title cannot exceed 200 characters')
    }

    if (!config.type) {
      errors.push('Space type is required')
    }

    if (!config.hostId) {
      errors.push('Host ID is required')
    }

    if (!config.groupId) {
      errors.push('Group ID is required')
    }

    // Capacity validation
    const limits = CAPACITY_LIMITS[config.type as SpaceType]
    if (limits) {
      if (config.maxParticipants < limits.min) {
        errors.push(`Max participants must be at least ${limits.min}`)
      }
      if (config.maxParticipants > limits.max) {
        errors.push(`Max participants cannot exceed ${limits.max}`)
      }
    }

    // Privacy validation
    if (!['public', 'private', 'invite-only', 'password-protected'].includes(config.privacy)) {
      errors.push('Invalid privacy setting')
    }

    // Recording retention validation
    if (config.recordingRetention && !['never', '30d', '90d', '1y', 'indefinite'].includes(config.recordingRetention)) {
      errors.push('Invalid recording retention period')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Validate Study Session specific config
   */
  static validateStudySession(config: StudySessionConfig): { valid: boolean; errors: string[] } {
    const baseValidation = this.validateBaseConfig(config)
    const errors = [...baseValidation.errors]

    // Study-specific validation
    if (config.topic && config.topic.length > 100) {
      errors.push('Topic cannot exceed 100 characters')
    }

    if (config.focusMode === undefined || config.focusMode === null) {
      errors.push('Focus mode setting is required')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Validate Office Hours specific config
   */
  static validateOfficeHours(config: OfficeHoursConfig): { valid: boolean; errors: string[] } {
    const baseValidation = this.validateBaseConfig(config)
    const errors = [...baseValidation.errors]

    if (!config.recurring) {
      errors.push('Office hours must have a recurring schedule')
    }

    if (config.maxWaitTime !== undefined && config.maxWaitTime < 5) {
      errors.push('Max wait time must be at least 5 minutes')
    }

    if (config.breaktimeMinutes !== undefined && config.breaktimeMinutes < 0) {
      errors.push('Break time cannot be negative')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Validate Live Lecture specific config
   */
  static validateLecture(config: LectureConfig): { valid: boolean; errors: string[] } {
    const baseValidation = this.validateBaseConfig(config)
    const errors = [...baseValidation.errors]

    if (!config.scheduledFor) {
      errors.push('Lecture must have a scheduled start time')
    }

    if (!config.recordingEnabled) {
      errors.push('Lecture recording must be enabled')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Validate Project Collaboration specific config
   */
  static validateProjectCollab(config: ProjectCollabConfig): { valid: boolean; errors: string[] } {
    const baseValidation = this.validateBaseConfig(config)
    const errors = [...baseValidation.errors]

    if (!config.projectName || config.projectName.trim().length === 0) {
      errors.push('Project name is required')
    }

    if (!config.teamMembers || config.teamMembers.length < 2) {
      errors.push('Project must have at least 2 team members')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Validate Mentorship specific config
   */
  static validateMentorship(config: MentorshipConfig): { valid: boolean; errors: string[] } {
    const baseValidation = this.validateBaseConfig(config)
    const errors = [...baseValidation.errors]

    if (!config.mentorId) {
      errors.push('Mentor ID is required')
    }

    if (!config.menteeId) {
      errors.push('Mentee ID is required')
    }

    if (config.recurring && !config.dayOfWeek) {
      errors.push('Day of week must be specified for recurring mentorship')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Validate Debate specific config
   */
  static validateDebate(config: DebateConfig): { valid: boolean; errors: string[] } {
    const baseValidation = this.validateBaseConfig(config)
    const errors = [...baseValidation.errors]

    if (!config.format) {
      errors.push('Debate format is required')
    }

    if (!config.proposition || config.proposition.trim().length === 0) {
      errors.push('Debate proposition/topic is required')
    }

    if (config.speakingTimeSeconds && config.speakingTimeSeconds < 30) {
      errors.push('Speaking time must be at least 30 seconds')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Validate Peer Review specific config
   */
  static validatePeerReview(config: PeerReviewConfig): { valid: boolean; errors: string[] } {
    const baseValidation = this.validateBaseConfig(config)
    const errors = [...baseValidation.errors]

    if (!config.presenterId) {
      errors.push('Presenter ID is required')
    }

    if (!config.reviewers || config.reviewers.length < 2) {
      errors.push('Peer review must have at least 2 reviewers')
    }

    if (!config.rubric || Object.keys(config.rubric).length === 0) {
      errors.push('Rubric/criteria is required')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  

  /**
   * Check if user has access to space
   */
  static async checkSpaceAccess(userId: string, spaceId: string, space: Space): Promise<boolean> {
    // Host always has access
    if (space.hostId === userId) {
      return true
    }

    // Co-hosts have access
    if (space.coHostIds && space.coHostIds.includes(userId)) {
      return true
    }

    // Public spaces: allow access if user is in group
    if (space.privacy === 'public') {
      const groupMembers = await this.repo.getGroupMembers(space.groupId)
      return groupMembers.some(m => m.userId === userId)
    }

    // Invite-only: check if invited
    if (space.privacy === 'invite-only') {
      const invitations = await this.repo.getSpaceInvitations(spaceId)
      const userInvitation = invitations.find(
        inv => inv.invitedUserId === userId && inv.status === 'accepted'
      )
      return !!userInvitation
    }

    // Private spaces: stricter checks needed
    if (space.privacy === 'private') {
      const groupMembers = await this.repo.getGroupMembers(space.groupId)
      const isMember = groupMembers.some(m => m.userId === userId)
      if (!isMember) return false

      // Additional private space checks if implemented
      // const privateAccess = await this.repo.getPrivateSpaceAccess(spaceId, userId)
      // return !!privateAccess
      return true
    }

    return false
  }

  /**
   * Get type-specific validator
   */
  static getValidator(type: SpaceType) {
    switch (type) {
      case 'study-session':
        return this.validateStudySession.bind(this)
      case 'office-hours':
        return this.validateOfficeHours.bind(this)
      case 'lecture':
        return this.validateLecture.bind(this)
      case 'project-collab':
        return this.validateProjectCollab.bind(this)
      case 'mentorship':
        return this.validateMentorship.bind(this)
      case 'debate':
        return this.validateDebate.bind(this)
      case 'peer-review':
        return this.validatePeerReview.bind(this)
      default:
        return this.validateBaseConfig.bind(this)
    }
  }

  /**
   * Create a new space
   */
  static async createSpace(config: BaseSpaceConfig): Promise<Space | null> {
    // Validate config
    const validator = this.getValidator(config.type as SpaceType)
    const validation = validator(config)

    if (!validation.valid) {
      console.error('[SpaceService] Validation failed:', validation.errors)
      throw new Error(`Invalid space configuration: ${validation.errors.join('; ')}`)
    }

    try {
      // Create space via repository
      const space = await this.repo.createSpace({
        groupId: config.groupId,
        hostId: config.hostId,
        title: config.title,
        description: config.description,
        type: config.type,
        privacy: config.privacy,
        maxParticipants: config.maxParticipants,
        audioEnabled: true,
        videoEnabled: false,
        screenShareEnabled: true,
      })

      return space || null
    } catch (error) {
      console.error('[SpaceService] Failed to create space:', error)
      throw error
    }
  }

  /**
   * Get spaces by type
   */
  static async getSpacesByType(type: SpaceType, groupId?: string): Promise<Space[]> {
    // This will be implemented in repository
    // For now, return filtered from all spaces
    const spaces = groupId 
      ? await this.repo.getGroupSpaces(groupId)
      : []
    
    return spaces.filter(s => (s as any).spaceType === type || (s as any).type === type)
  }

  /**
   * Get active spaces for a group
   */
  static async getActiveSpaces(groupId: string): Promise<Space[]> {
    return await this.repo.getGroupSpaces(groupId, 'live')
  }

  /**
   * Format space config for type
   */
  static formatSpaceConfig(type: SpaceType, baseConfig: BaseSpaceConfig): Record<string, any> {
    const features = this.getDefaultFeatures(type)

    return {
      ...baseConfig,
      features,
      type,
      createdAt: new Date(),
    }
  }
}

export default SpaceService
