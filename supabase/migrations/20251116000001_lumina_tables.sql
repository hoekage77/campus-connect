-- Create lumina_video_cache table for storing rendered animations
CREATE TABLE IF NOT EXISTS lumina_video_cache (
  cache_key TEXT PRIMARY KEY,
  video_url TEXT NOT NULL,
  manim_spec JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accessed_at TIMESTAMPTZ DEFAULT NOW(),
  access_count INTEGER DEFAULT 0
);

-- Create index on created_at for cache expiry queries
CREATE INDEX IF NOT EXISTS idx_lumina_cache_created ON lumina_video_cache(created_at);

-- Create lumina_runs table for storing agent run history
CREATE TABLE IF NOT EXISTS lumina_runs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  query TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('explain', 'what-if', 'check')),
  context JSONB,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  stages JSONB NOT NULL,
  result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_lumina_runs_user ON lumina_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_lumina_runs_status ON lumina_runs(status);
CREATE INDEX IF NOT EXISTS idx_lumina_runs_created ON lumina_runs(created_at DESC);

-- Create storage bucket for videos if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('lumina-videos', 'lumina-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on lumina_video_cache
ALTER TABLE lumina_video_cache ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read cached videos
CREATE POLICY "Public read access for video cache"
ON lumina_video_cache FOR SELECT
TO public
USING (true);

-- Policy: Service role can insert/update cache
CREATE POLICY "Service role full access to cache"
ON lumina_video_cache FOR ALL
TO service_role
USING (true);

-- Enable RLS on lumina_runs
ALTER TABLE lumina_runs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own runs
CREATE POLICY "Users can view own runs"
ON lumina_runs FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id);

-- Policy: Service role has full access to runs
CREATE POLICY "Service role full access to runs"
ON lumina_runs FOR ALL
TO service_role
USING (true);

-- Function to update access stats on cache hit
CREATE OR REPLACE FUNCTION update_cache_access()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE lumina_video_cache
  SET 
    accessed_at = NOW(),
    access_count = access_count + 1
  WHERE cache_key = NEW.cache_key;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
