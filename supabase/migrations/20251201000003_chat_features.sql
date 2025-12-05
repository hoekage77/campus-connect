-- Chat Features Migration
-- Adds support for reactions, replies, mentions, read receipts, and pinned messages

-- ============================================================================
-- MESSAGE REACTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

CREATE INDEX idx_message_reactions_message ON message_reactions(message_id);
CREATE INDEX idx_message_reactions_user ON message_reactions(user_id);

-- ============================================================================
-- REPLIES / THREADING
-- ============================================================================

-- Add reply_to column to chat_messages
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL;

CREATE INDEX idx_chat_messages_reply_to ON chat_messages(reply_to_id) WHERE reply_to_id IS NOT NULL;

-- ============================================================================
-- MENTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS message_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  mentioned_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, mentioned_user_id)
);

CREATE INDEX idx_message_mentions_message ON message_mentions(message_id);
CREATE INDEX idx_message_mentions_user ON message_mentions(mentioned_user_id);

-- ============================================================================
-- READ RECEIPTS / UNREAD TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS message_reads (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chat_room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  last_read_message_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY(user_id, chat_room_id)
);

CREATE INDEX idx_message_reads_room ON message_reads(chat_room_id);

-- ============================================================================
-- PINNED MESSAGES
-- ============================================================================

CREATE TABLE IF NOT EXISTS pinned_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  pinned_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pinned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(chat_room_id, message_id)
);

CREATE INDEX idx_pinned_messages_room ON pinned_messages(chat_room_id);

-- ============================================================================
-- TYPING INDICATORS (stored in memory/realtime, but need table for presence)
-- ============================================================================

CREATE TABLE IF NOT EXISTS typing_indicators (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chat_room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY(user_id, chat_room_id)
);

-- Auto-delete stale typing indicators (older than 10 seconds)
CREATE OR REPLACE FUNCTION cleanup_stale_typing()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM typing_indicators 
  WHERE started_at < NOW() - INTERVAL '10 seconds';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cleanup_typing
AFTER INSERT ON typing_indicators
EXECUTE FUNCTION cleanup_stale_typing();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE pinned_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

-- Reactions: Anyone in the room can see, users can manage their own
CREATE POLICY "Users can view reactions in their rooms" ON message_reactions
  FOR SELECT USING (true);

CREATE POLICY "Users can add their own reactions" ON message_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own reactions" ON message_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- Mentions: Anyone can see mentions
CREATE POLICY "Users can view mentions" ON message_mentions
  FOR SELECT USING (true);

CREATE POLICY "Users can create mentions" ON message_mentions
  FOR INSERT WITH CHECK (true);

-- Read receipts: Users can see and manage their own
CREATE POLICY "Users can view their read status" ON message_reads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their read status" ON message_reads
  FOR ALL USING (auth.uid() = user_id);

-- Pinned messages: Anyone can see, moderators can manage
CREATE POLICY "Users can view pinned messages" ON pinned_messages
  FOR SELECT USING (true);

CREATE POLICY "Users can pin messages" ON pinned_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can unpin messages" ON pinned_messages
  FOR DELETE USING (auth.uid() = pinned_by);

-- Typing indicators: Anyone can see and manage their own
CREATE POLICY "Users can view typing indicators" ON typing_indicators
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their typing status" ON typing_indicators
  FOR ALL USING (auth.uid() = user_id);
