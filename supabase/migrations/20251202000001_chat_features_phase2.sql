-- Chat Features Phase 2 Migration
-- Adds support for polls, GIF messages, and space launching from chat

-- ============================================================================
-- POLLS / VOTING
-- ============================================================================

CREATE TABLE IF NOT EXISTS chat_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  message_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  poll_type VARCHAR(20) DEFAULT 'single' CHECK (poll_type IN ('single', 'multiple')),
  anonymous BOOLEAN DEFAULT false,
  ends_at TIMESTAMP WITH TIME ZONE,
  closed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES chat_polls(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  option_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES chat_polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poll_id, option_id, user_id)
);

CREATE INDEX idx_chat_polls_room ON chat_polls(chat_room_id);
CREATE INDEX idx_chat_polls_message ON chat_polls(message_id);
CREATE INDEX idx_poll_options_poll ON poll_options(poll_id);
CREATE INDEX idx_poll_votes_poll ON poll_votes(poll_id);
CREATE INDEX idx_poll_votes_user ON poll_votes(user_id);

-- ============================================================================
-- GIF/MEDIA MESSAGES
-- ============================================================================

-- Add media fields to chat_messages
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS media_type VARCHAR(20) CHECK (media_type IN ('gif', 'image', 'video', 'audio', 'file', 'poll', 'space')),
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS media_thumbnail TEXT,
ADD COLUMN IF NOT EXISTS media_width INT,
ADD COLUMN IF NOT EXISTS media_height INT,
ADD COLUMN IF NOT EXISTS media_provider VARCHAR(50); -- 'tenor', 'giphy', 'upload', etc.

CREATE INDEX idx_chat_messages_media ON chat_messages(media_type) WHERE media_type IS NOT NULL;

-- ============================================================================
-- SPACES LAUNCHED FROM CHAT
-- ============================================================================

-- Add reference to originating chat room in spaces
ALTER TABLE spaces
ADD COLUMN IF NOT EXISTS source_chat_room_id UUID REFERENCES chat_rooms(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS source_message_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL;

CREATE INDEX idx_spaces_source_room ON spaces(source_chat_room_id) WHERE source_chat_room_id IS NOT NULL;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE chat_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

-- Polls: Anyone can view, creator can manage
CREATE POLICY "Users can view polls in their rooms" ON chat_polls
  FOR SELECT USING (true);

CREATE POLICY "Users can create polls" ON chat_polls
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Poll creators can update their polls" ON chat_polls
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Poll creators can delete their polls" ON chat_polls
  FOR DELETE USING (auth.uid() = created_by);

-- Poll options: Anyone can view, poll creator can manage
CREATE POLICY "Users can view poll options" ON poll_options
  FOR SELECT USING (true);

CREATE POLICY "Users can create poll options" ON poll_options
  FOR INSERT WITH CHECK (true);

-- Poll votes: Users can view (unless anonymous), users can manage their own votes
CREATE POLICY "Users can view votes" ON poll_votes
  FOR SELECT USING (true);

CREATE POLICY "Users can add their votes" ON poll_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their votes" ON poll_votes
  FOR DELETE USING (auth.uid() = user_id);
