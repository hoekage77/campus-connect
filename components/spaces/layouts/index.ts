/**
 * Space Layout Configuration
 * 
 * Maps space types to their appropriate layout modes and feature panels.
 * Each space type has a specific presentation optimized for its use case.
 */

// Using union types to support both types/spaces.ts and types/index.ts
export type SpaceType = 
  // From types/spaces.ts (8-type system)
  | 'study-session'
  | 'office-hours'
  | 'social-hangout'
  | 'lecture'
  | 'project-collab'
  | 'mentorship'
  | 'debate'
  | 'peer-review'
  // From types/index.ts (6-type system) - compatibility aliases
  | 'study-sprint'
  | 'social'
  | 'collaboration'
  | 'tutoring'
  | 'general'

export type SpaceLayoutMode = 
  | 'video-grid'       // Default grid of video tiles
  | 'audio-only'       // Avatar circles with audio indicators (no video)
  | 'speaker-focus'    // Large speaker + small thumbnails + optional queue
  | 'split-screen'     // Video + content panel side-by-side
  | 'stage-audience'   // Speaker(s) on stage, audience below
  | 'one-on-one'       // Two equal-sized video panels

export type SpaceFeaturePanel = 
  | 'whiteboard'
  | 'timer'
  | 'documents'
  | 'queue'
  | 'breakout-rooms'
  | 'reactions'
  | 'games'
  | 'slides'
  | 'polls'
  | 'qa'
  | 'board'
  | 'files'
  | 'agenda'
  | 'goals'
  | 'notes'
  | 'scoring'
  | 'voting'
  | 'pdf-viewer'
  | 'rubric'
  | 'feedback'

/**
 * Layout configuration for each space type
 */
export interface SpaceLayoutConfig {
  defaultLayout: SpaceLayoutMode
  label: string
  description: string
  features: {
    video: boolean
    audio: boolean
    screenShare: boolean
    handRaise: boolean
    chat: boolean
    pinContent: boolean
    breakoutRooms: boolean
  }
  panels: SpaceFeaturePanel[]
}

/**
 * Full layout configuration for all space types
 */
export const SPACE_LAYOUT_CONFIG: Record<string, SpaceLayoutConfig> = {
  // 8-type system (types/spaces.ts)
  'study-session': {
    defaultLayout: 'split-screen',
    label: 'Study Session',
    description: 'Focused study with collaboration tools',
    features: { video: true, audio: true, screenShare: true, handRaise: false, chat: true, pinContent: true, breakoutRooms: false },
    panels: ['whiteboard', 'timer', 'documents'],
  },
  'office-hours': {
    defaultLayout: 'speaker-focus',
    label: 'Office Hours',
    description: 'Q&A sessions with queue management',
    features: { video: true, audio: true, screenShare: true, handRaise: true, chat: true, pinContent: true, breakoutRooms: true },
    panels: ['queue', 'breakout-rooms'],
  },
  'social-hangout': {
    defaultLayout: 'audio-only',
    label: 'Social Hangout',
    description: 'Casual conversation with friends',
    features: { video: false, audio: true, screenShare: false, handRaise: false, chat: true, pinContent: false, breakoutRooms: false },
    panels: ['reactions', 'games'],
  },
  'lecture': {
    defaultLayout: 'stage-audience',
    label: 'Lecture',
    description: 'Instructor-led presentation mode',
    features: { video: true, audio: true, screenShare: true, handRaise: true, chat: true, pinContent: true, breakoutRooms: false },
    panels: ['slides', 'polls', 'qa'],
  },
  'project-collab': {
    defaultLayout: 'split-screen',
    label: 'Project Collaboration',
    description: 'Team collaboration with shared workspace',
    features: { video: true, audio: true, screenShare: true, handRaise: false, chat: true, pinContent: true, breakoutRooms: true },
    panels: ['board', 'files'],
  },
  'mentorship': {
    defaultLayout: 'one-on-one',
    label: 'Mentorship',
    description: 'One-on-one mentoring session',
    features: { video: true, audio: true, screenShare: true, handRaise: false, chat: true, pinContent: true, breakoutRooms: false },
    panels: ['agenda', 'goals', 'notes'],
  },
  'debate': {
    defaultLayout: 'stage-audience',
    label: 'Debate',
    description: 'Structured debate with scoring',
    features: { video: true, audio: true, screenShare: false, handRaise: true, chat: true, pinContent: true, breakoutRooms: false },
    panels: ['timer', 'scoring', 'voting'],
  },
  'peer-review': {
    defaultLayout: 'split-screen',
    label: 'Peer Review',
    description: 'Document review with feedback tools',
    features: { video: true, audio: true, screenShare: true, handRaise: false, chat: true, pinContent: true, breakoutRooms: false },
    panels: ['pdf-viewer', 'rubric', 'feedback'],
  },
  
  // 6-type system (types/index.ts) - compatibility mappings
  'study-sprint': {
    defaultLayout: 'split-screen',
    label: 'Study Sprint',
    description: 'Silent coworking with accountability',
    features: { video: true, audio: true, screenShare: true, handRaise: false, chat: true, pinContent: true, breakoutRooms: false },
    panels: ['whiteboard', 'timer', 'documents'],
  },
  'social': {
    defaultLayout: 'audio-only',
    label: 'Social',
    description: 'Casual hangout',
    features: { video: false, audio: true, screenShare: false, handRaise: false, chat: true, pinContent: false, breakoutRooms: false },
    panels: ['reactions', 'games'],
  },
  'collaboration': {
    defaultLayout: 'split-screen',
    label: 'Collaboration',
    description: 'Active group work',
    features: { video: true, audio: true, screenShare: true, handRaise: false, chat: true, pinContent: true, breakoutRooms: true },
    panels: ['board', 'files'],
  },
  'tutoring': {
    defaultLayout: 'one-on-one',
    label: 'Tutoring',
    description: 'One teaches, others learn',
    features: { video: true, audio: true, screenShare: true, handRaise: true, chat: true, pinContent: true, breakoutRooms: false },
    panels: ['agenda', 'goals', 'notes'],
  },
  'general': {
    defaultLayout: 'video-grid',
    label: 'General',
    description: 'Unstructured space',
    features: { video: true, audio: true, screenShare: true, handRaise: true, chat: true, pinContent: true, breakoutRooms: false },
    panels: [],
  },
}

/**
 * Legacy: Default layout mode for each space type
 */
export const LAYOUT_BY_TYPE: Record<string, SpaceLayoutMode> = {
  'study-session': 'split-screen',
  'office-hours': 'speaker-focus',
  'social-hangout': 'audio-only',
  'lecture': 'stage-audience',
  'project-collab': 'split-screen',
  'mentorship': 'one-on-one',
  'debate': 'stage-audience',
  'peer-review': 'split-screen',
  // Compatibility aliases
  'study-sprint': 'split-screen',
  'social': 'audio-only',
  'collaboration': 'split-screen',
  'tutoring': 'one-on-one',
  'general': 'video-grid',
}

/**
 * Legacy: Feature panels available for each space type
 */
export const FEATURES_BY_TYPE: Record<string, SpaceFeaturePanel[]> = {
  'study-session': ['whiteboard', 'timer', 'documents'],
  'office-hours': ['queue', 'breakout-rooms'],
  'social-hangout': ['reactions', 'games'],
  'lecture': ['slides', 'polls', 'qa'],
  'project-collab': ['board', 'files'],
  'mentorship': ['agenda', 'goals', 'notes'],
  'debate': ['timer', 'scoring', 'voting'],
  'peer-review': ['pdf-viewer', 'rubric', 'feedback'],
  // Compatibility aliases
  'study-sprint': ['whiteboard', 'timer', 'documents'],
  'social': ['reactions', 'games'],
  'collaboration': ['board', 'files'],
  'tutoring': ['agenda', 'goals', 'notes'],
  'general': [],
}

/**
 * Legacy: Whether video is enabled by default for each space type
 */
export const VIDEO_ENABLED_BY_TYPE: Record<string, boolean> = {
  'study-session': true,
  'office-hours': true,
  'social-hangout': false,
  'lecture': true,
  'project-collab': true,
  'mentorship': true,
  'debate': true,
  'peer-review': true,
  // Compatibility aliases
  'study-sprint': true,
  'social': false,
  'collaboration': true,
  'tutoring': true,
  'general': true,
}

/**
 * Layout display names for UI
 */
export const LAYOUT_DISPLAY_NAMES: Record<SpaceLayoutMode, string> = {
  'video-grid': 'Grid View',
  'audio-only': 'Audio Only',
  'speaker-focus': 'Speaker Focus',
  'split-screen': 'Split Screen',
  'stage-audience': 'Stage View',
  'one-on-one': '1:1 View',
}

/**
 * Get the recommended layout configuration for a space type
 */
export function getLayoutConfigForType(type: string): SpaceLayoutConfig {
  return SPACE_LAYOUT_CONFIG[type] || SPACE_LAYOUT_CONFIG['general']
}

/**
 * Get the recommended layout for a space type
 */
export function getLayoutForType(type: string): SpaceLayoutMode {
  return LAYOUT_BY_TYPE[type] || 'video-grid'
}

/**
 * Get available feature panels for a space type
 */
export function getFeaturesForType(type: string): SpaceFeaturePanel[] {
  return FEATURES_BY_TYPE[type] || []
}

/**
 * Check if video should be enabled by default for a space type
 */
export function isVideoEnabledByDefault(type: string): boolean {
  return VIDEO_ENABLED_BY_TYPE[type] ?? true
}
