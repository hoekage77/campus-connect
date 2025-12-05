-- Migration: Expand Space Types
-- Description: Add new space types for the 8-type system and increase max participants

-- Drop the existing constraint and add the new one with expanded types
ALTER TABLE public.spaces 
DROP CONSTRAINT IF EXISTS spaces_type_check;

ALTER TABLE public.spaces 
ADD CONSTRAINT spaces_type_check 
CHECK (type IN (
  -- New 8-type system
  'study-session',
  'office-hours', 
  'social-hangout',
  'lecture',
  'project-collab',
  'mentorship',
  'debate',
  'peer-review',
  -- Legacy types (for backwards compatibility)
  'study-sprint',
  'social',
  'collaboration',
  'tutoring',
  'general'
));

-- Also update max_participants to allow larger spaces like lectures
ALTER TABLE public.spaces 
DROP CONSTRAINT IF EXISTS spaces_max_participants_check;

ALTER TABLE public.spaces 
ADD CONSTRAINT spaces_max_participants_check 
CHECK (max_participants BETWEEN 2 AND 200);

-- Add comment
COMMENT ON COLUMN public.spaces.type IS 'Space type: study-session, office-hours, social-hangout, lecture, project-collab, mentorship, debate, peer-review (or legacy: study-sprint, social, collaboration, tutoring, general)';
