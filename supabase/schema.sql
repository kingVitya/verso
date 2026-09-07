-- ==============================================================================
-- VERSO: Supabase Database Schema & Security Matrix
-- ==============================================================================
-- Architecture:
-- 1. Anonymous users can ONLY insert a new shared poem with strict length validation.
-- 2. Direct table SELECT is DENIED for anon (RLS enabled, 0 SELECT policies).
-- 3. Anonymous users can ONLY fetch a specific poem if they know its exact ID
--    via the SECURITY DEFINER RPC function `get_shared_poem(p_id)`.
-- 4. UPDATE and DELETE are DENIED for anonymous users.
-- ==============================================================================

-- 1. Table Definition with Strong Integrity Constraints
CREATE TABLE IF NOT EXISTS public.shared_poems (
  id text PRIMARY KEY,
  title text DEFAULT '',
  text text NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Constraints:
  -- - ID: 6 to 16 alphanumeric / underscore / hyphen characters (NanoID format)
  -- - Title: max 150 characters
  -- - Text: between 1 and 30,000 characters (~5,000 words, prevents spam / bloating)
  CONSTRAINT valid_id_format CHECK (id ~ '^[a-zA-Z0-9_-]{6,16}$'),
  CONSTRAINT title_length_limit CHECK (length(title) <= 150),
  CONSTRAINT text_length_limit CHECK (length(text) > 0 AND length(text) <= 30000)
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.shared_poems ENABLE ROW LEVEL SECURITY;

-- 3. Security Policies:
-- Allow anyone (anon) to insert a shared poem (guarded by check constraints)
DROP POLICY IF EXISTS "Allow anonymous insert on shared_poems" ON public.shared_poems;
CREATE POLICY "Allow anonymous insert on shared_poems"
  ON public.shared_poems
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Note: Because RLS is active and NO SELECT policy is defined for anon,
-- direct `SELECT * FROM shared_poems` returns [] (blocked) for anonymous users.

-- 4. Secure RPC Function for Retrieval by Exact ID
-- SECURITY DEFINER allows the function to read from public.shared_poems
-- while bypassing RLS only inside this strictly scoped query.
CREATE OR REPLACE FUNCTION public.get_shared_poem(p_id text)
RETURNS TABLE (
  id text,
  title text,
  text text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    sp.id,
    sp.title,
    sp.text
  FROM public.shared_poems sp
  WHERE sp.id = p_id
  LIMIT 1;
$$;

-- 5. Grant Execute Rights for the RPC function
REVOKE ALL ON FUNCTION public.get_shared_poem(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shared_poem(text) TO anon, authenticated, service_role;
