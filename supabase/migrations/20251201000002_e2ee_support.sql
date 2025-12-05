-- E2EE (End-to-End Encryption) Support Migration
-- Generated: 2025-12-01
-- Description: Adds tables for public keys and wrapped group keys

-- ============================================================================
-- USER PUBLIC KEYS
-- ============================================================================
-- Stores the X25519 public key for each user who has enabled E2EE

CREATE TABLE IF NOT EXISTS public.user_public_keys (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  public_key TEXT NOT NULL,           -- Base64 encoded X25519 public key
  key_id TEXT NOT NULL,               -- Fingerprint for verification (e.g., "AB:CD:EF:...")
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_user_public_keys_key_id ON public.user_public_keys(key_id);

-- Auto-update timestamp trigger
CREATE TRIGGER set_timestamp_user_public_keys 
  BEFORE UPDATE ON public.user_public_keys
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ============================================================================
-- GROUP KEY BUNDLES
-- ============================================================================
-- Stores wrapped (encrypted) group keys for each chat room member
-- Each member gets a copy of the group key, encrypted with their public key

CREATE TABLE IF NOT EXISTS public.group_key_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  wrapped_key TEXT NOT NULL,          -- Base64 sealed box containing the group key
  key_version INTEGER NOT NULL DEFAULT 1,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- One wrapped key per user per version
  UNIQUE(chat_room_id, user_id, key_version)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_group_key_bundles_room ON public.group_key_bundles(chat_room_id);
CREATE INDEX IF NOT EXISTS idx_group_key_bundles_user ON public.group_key_bundles(user_id);
CREATE INDEX IF NOT EXISTS idx_group_key_bundles_room_version 
  ON public.group_key_bundles(chat_room_id, key_version DESC);

-- ============================================================================
-- MODIFY CHAT MESSAGES
-- ============================================================================
-- Add encryption metadata to messages

ALTER TABLE public.chat_messages 
  ADD COLUMN IF NOT EXISTS encrypted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS nonce TEXT,              -- Base64 nonce for decryption
  ADD COLUMN IF NOT EXISTS key_version INTEGER DEFAULT 1;

-- Note: The 'content' column now stores ciphertext when encrypted=true
-- Create index for encrypted messages
CREATE INDEX IF NOT EXISTS idx_chat_messages_encrypted 
  ON public.chat_messages(chat_room_id, encrypted) WHERE encrypted = TRUE;

-- ============================================================================
-- MODIFY CHAT ROOMS
-- ============================================================================
-- Add E2EE settings to chat rooms

ALTER TABLE public.chat_rooms
  ADD COLUMN IF NOT EXISTS encryption_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS current_key_version INTEGER DEFAULT 1;

-- ============================================================================
-- GROUP MESSAGES E2EE SUPPORT
-- ============================================================================
-- Add encryption fields to legacy group_messages table too

ALTER TABLE public.group_messages
  ADD COLUMN IF NOT EXISTS encrypted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS nonce TEXT,
  ADD COLUMN IF NOT EXISTS key_version INTEGER DEFAULT 1;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE public.user_public_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_key_bundles ENABLE ROW LEVEL SECURITY;

-- User public keys: anyone can read (needed for encryption), only owner can write
CREATE POLICY "Public keys are viewable by all authenticated users"
  ON public.user_public_keys FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own public key"
  ON public.user_public_keys FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own public key"
  ON public.user_public_keys FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Group key bundles: only the target user can read their wrapped key
CREATE POLICY "Users can read their own wrapped keys"
  ON public.group_key_bundles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Room members can insert wrapped keys for others"
  ON public.group_key_bundles FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Must be a member of the chat room's group
    EXISTS (
      SELECT 1 FROM public.chat_rooms cr
      JOIN public.group_members gm ON gm.group_id = cr.group_id
      WHERE cr.id = chat_room_id AND gm.user_id = auth.uid()
    )
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.user_public_keys IS 'X25519 public keys for E2EE key exchange';
COMMENT ON TABLE public.group_key_bundles IS 'Wrapped (encrypted) group symmetric keys per user';
COMMENT ON COLUMN public.chat_messages.encrypted IS 'True if content is ciphertext';
COMMENT ON COLUMN public.chat_messages.nonce IS 'Base64 nonce used for encryption';
COMMENT ON COLUMN public.chat_messages.key_version IS 'Which version of group key was used';
