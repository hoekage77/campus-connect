/**
 * Space Components Index
 * 
 * Central export for all space-related components
 */

// Layout Configuration
export {
  SPACE_LAYOUT_CONFIG,
  LAYOUT_BY_TYPE,
  FEATURES_BY_TYPE,
  VIDEO_ENABLED_BY_TYPE,
  LAYOUT_DISPLAY_NAMES,
  getLayoutConfigForType,
  getLayoutForType,
  getFeaturesForType,
  isVideoEnabledByDefault,
  type SpaceType,
  type SpaceLayoutMode,
  type SpaceFeaturePanel,
  type SpaceLayoutConfig,
} from './layouts'

// Layout Components
export { AudioOnlyLayout } from './layouts/audio-only-layout'
export { VideoGridLayout } from './layouts/video-grid-layout'
export { SplitScreenLayout } from './layouts/split-screen-layout'
export { SpeakerFocusLayout } from './layouts/speaker-focus-layout'
export { StageAudienceLayout } from './layouts/stage-audience-layout'
export { OneOnOneLayout } from './layouts/one-on-one-layout'

// Feature Components
export { SpaceJumbotron, type FeaturedContent } from './jumbotron'
export { PinContentDialog } from './pin-content-dialog'
export { SpaceControlBar } from './control-bar'
