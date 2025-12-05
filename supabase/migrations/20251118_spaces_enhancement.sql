-- Spaces Feature Enhancement Migration
-- Adds support for 8 space types, private spaces, and enhanced capabilities
-- Date: 2025-11-18

-- ============================================================================
-- 1. ALTER EXISTING SPACES TABLE
-- ============================================================================

ALTER TABLE spaces ADD COLUMN IF NOT EXISTS (
  space_type VARCHAR(50) DEFAULT 'general',
  max_participants INTEGER DEFAULT 10,
  feature_flags JSONB DEFAULT '{}',
  privacy_level VARCHAR(50) DEFAULT 'public',
  moderators UUID[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  compliance_level VARCHAR(50),
  encryption_enabled BOOLEAN DEFAULT false,
  auto_moderation_rules JSONB DEFAULT '{}',
  materials JSONB DEFAULT '{}',
  agenda_items JSONB DEFAULT '{}',
  recurring_pattern JSONB,
  duration_minutes INTEGER
);

-- ============================================================================
-- 2. CREATE NEW SUPPORTING TABLES
-- ============================================================================

-- Space Features Configuration
CREATE TABLE IF NOT EXISTS space_feature_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  space_type VARCHAR(50) NOT NULL,
  audio_enabled BOOLEAN DEFAULT true,
  video_enabled BOOLEAN DEFAULT false,
  chat_enabled BOOLEAN DEFAULT true,
  screenshare_enabled BOOLEAN DEFAULT true,
  recording_enabled BOOLEAN DEFAULT false,
  whiteboard_enabled BOOLEAN DEFAULT false,
  code_editor_enabled BOOLEAN DEFAULT false,
  document_sharing_enabled BOOLEAN DEFAULT false,
  queue_system_enabled BOOLEAN DEFAULT false,
  breakout_rooms_enabled BOOLEAN DEFAULT false,
  games_enabled BOOLEAN DEFAULT false,
  reactions_enabled BOOLEAN DEFAULT false,
  polls_enabled BOOLEAN DEFAULT false,
  slide_presentation_enabled BOOLEAN DEFAULT false,
  project_board_enabled BOOLEAN DEFAULT false,
  file_storage_enabled BOOLEAN DEFAULT false,
  version_control_enabled BOOLEAN DEFAULT false,
  agenda_enabled BOOLEAN DEFAULT false,
  goals_enabled BOOLEAN DEFAULT false,
  progress_tracking_enabled BOOLEAN DEFAULT false,
  timed_speaks_enabled BOOLEAN DEFAULT false,
  voting_enabled BOOLEAN DEFAULT false,
  scoring_enabled BOOLEAN DEFAULT false,
  rubrics_enabled BOOLEAN DEFAULT false,
  annotate_pdf_enabled BOOLEAN DEFAULT false,
  feedback_forms_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Space Materials/Resources
CREATE TABLE IF NOT EXISTS space_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  url VARCHAR(1024) NOT NULL,
  type VARCHAR(50), -- 'document', 'video', 'link', 'file'
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT now(),
  size_bytes BIGINT,
  mime_type VARCHAR(100)
);

-- Space Agenda Items
CREATE TABLE IF NOT EXISTS space_agenda_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  duration_minutes INTEGER,
  order_index INTEGER,
  speaker_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now()
);

-- Activity/Audit Log for Spaces
CREATE TABLE IF NOT EXISTS space_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(50) NOT NULL, -- 'created', 'joined', 'left', 'invited', 'removed', 'muted', 'recorded', etc.
  details JSONB, -- Additional metadata
  timestamp TIMESTAMP DEFAULT now()
);

-- Engagement Metrics per User
CREATE TABLE IF NOT EXISTS space_engagement_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  speaking_time_seconds INTEGER DEFAULT 0,
  reactions_count INTEGER DEFAULT 0,
  questions_asked INTEGER DEFAULT 0,
  hand_raises INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  shared_screen BOOLEAN DEFAULT false,
  camera_on_time_seconds INTEGER DEFAULT 0,
  microphone_on_time_seconds INTEGER DEFAULT 0,
  engagement_score NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Private Space Access Control
CREATE TABLE IF NOT EXISTS private_space_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  access_level VARCHAR(50) NOT NULL, -- 'host', 'moderator', 'member', 'observer'
  invited_at TIMESTAMP,
  invited_by UUID REFERENCES users(id),
  accepted_at TIMESTAMP,
  requires_approval BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);

-- Space Recordings Metadata
CREATE TABLE IF NOT EXISTS space_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  recording_url VARCHAR(1024),
  transcript_url VARCHAR(1024),
  duration_seconds INTEGER,
  size_bytes BIGINT,
  retention_days INTEGER,
  expires_at TIMESTAMP,
  encryption_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  deleted_at TIMESTAMP
);

-- Space Transcripts with Timestamps
CREATE TABLE IF NOT EXISTS space_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  speaker_id UUID REFERENCES users(id),
  text TEXT NOT NULL,
  start_time_seconds INTEGER,
  end_time_seconds INTEGER,
  speaker_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT now()
);

-- Space Feedback/Survey
CREATE TABLE IF NOT EXISTS space_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comments TEXT,
  helpful_count INTEGER DEFAULT 0,
  tags TEXT[],
  created_at TIMESTAMP DEFAULT now()
);

-- Space Invitations (for private/invite-only spaces)
CREATE TABLE IF NOT EXISTS space_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  invited_user_id UUID NOT NULL REFERENCES users(id),
  invited_by_user_id UUID NOT NULL REFERENCES users(id),
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
  created_at TIMESTAMP DEFAULT now(),
  expires_at TIMESTAMP,
  responded_at TIMESTAMP
);

-- Private Space Session Instances (for recurring private spaces)
CREATE TABLE IF NOT EXISTS private_space_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  instance_number INTEGER,
  scheduled_for TIMESTAMP,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  status VARCHAR(50), -- 'scheduled', 'live', 'ended', 'cancelled'
  participant_count INTEGER,
  peak_participants INTEGER,
  created_at TIMESTAMP DEFAULT now()
);

-- ============================================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_spaces_type ON spaces(space_type);
CREATE INDEX IF NOT EXISTS idx_spaces_privacy ON spaces(privacy_level);
CREATE INDEX IF NOT EXISTS idx_spaces_group_type ON spaces(group_id, space_type);
CREATE INDEX IF NOT EXISTS idx_spaces_status ON spaces(status);

CREATE INDEX IF NOT EXISTS idx_space_activity_space_user ON space_activity_logs(space_id, user_id);
CREATE INDEX IF NOT EXISTS idx_space_activity_timestamp ON space_activity_logs(timestamp);

CREATE INDEX IF NOT EXISTS idx_space_engagement_space ON space_engagement_metrics(space_id);
CREATE INDEX IF NOT EXISTS idx_space_engagement_user ON space_engagement_metrics(user_id);

CREATE INDEX IF NOT EXISTS idx_private_space_access_space ON private_space_access(space_id);
CREATE INDEX IF NOT EXISTS idx_private_space_access_user ON private_space_access(user_id);

CREATE INDEX IF NOT EXISTS idx_space_invitations_space ON space_invitations(space_id);
CREATE INDEX IF NOT EXISTS idx_space_invitations_user ON space_invitations(invited_user_id);

CREATE INDEX IF NOT EXISTS idx_space_feedback_space ON space_feedback(space_id);

CREATE INDEX IF NOT EXISTS idx_space_materials_space ON space_materials(space_id);

-- ============================================================================
-- 4. CREATE TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_space_feature_configs_timestamp
BEFORE UPDATE ON space_feature_configs
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_space_engagement_metrics_timestamp
BEFORE UPDATE ON space_engagement_metrics
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- ============================================================================
-- 5. MIGRATE EXISTING DATA
-- ============================================================================

-- Map old space types to new types (if applicable)
UPDATE spaces SET space_type = 'office-hours' WHERE type = 'office-hours';
UPDATE spaces SET space_type = 'collaboration' WHERE type = 'collaboration';
UPDATE spaces SET space_type = 'social-hangout' WHERE type = 'social' OR type = 'hangout';
UPDATE spaces SET space_type = 'general' WHERE space_type IS NULL;

-- ============================================================================
-- 6. ADD CONSTRAINTS
-- ============================================================================

ALTER TABLE spaces ADD CONSTRAINT check_max_participants 
  CHECK (max_participants > 0 AND max_participants <= 500);

ALTER TABLE space_engagement_metrics ADD CONSTRAINT check_engagement_score
  CHECK (engagement_score >= 0 AND engagement_score <= 100);

-- ============================================================================
-- 7. MIGRATION VERIFICATION
-- ============================================================================

-- Verify all spaces have a type assigned
-- SELECT COUNT(*) FROM spaces WHERE space_type IS NULL; -- Should be 0

-- Verify table creation
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_name LIKE 'space_%' OR table_name = 'private_space_%';
