-- ============================================================
-- Trust Me — Initial Schema
-- Paste this into the Supabase SQL Editor in EACH environment
-- (staging first, then production)
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- fuzzy search (used later)

-- ─── TABLES ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.users (
  id                  UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  handle              TEXT        UNIQUE NOT NULL,
  full_name           TEXT        NOT NULL,
  bio                 TEXT        CHECK (char_length(bio) <= 150),
  avatar_url          TEXT,
  gender              TEXT        CHECK (gender IN ('woman', 'man', 'non-binary', 'prefer-not-to-say')),
  locations           JSONB       NOT NULL DEFAULT '[]'::jsonb,
  -- locations shape: [{ city: string, state: string, neighborhood?: string }]
  -- first element is primary location
  onboarding_complete BOOLEAN     NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.recommendations (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  business_name       TEXT        NOT NULL,
  service_provider    TEXT,
  category            TEXT        NOT NULL CHECK (category IN ('beauty', 'home', 'health', 'fitness', 'pets', 'other')),
  subcategory         TEXT,
  blurb               TEXT        NOT NULL,
  photo_url           TEXT,
  website             TEXT,
  phone               TEXT,
  address             TEXT,
  city                TEXT,
  neighborhood        TEXT,
  latitude            FLOAT,
  longitude           FLOAT,
  mapbox_place_id     TEXT,
  takes_appointments  BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.vouches (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  recommendation_id UUID        NOT NULL REFERENCES public.recommendations(id) ON DELETE CASCADE,
  chain_source      TEXT        CHECK (chain_source IN ('from_recommender', 'told_recommender', 'unrelated')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, recommendation_id)
);

CREATE TABLE IF NOT EXISTS public.likes (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  recommendation_id UUID        NOT NULL REFERENCES public.recommendations(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, recommendation_id)
);

CREATE TABLE IF NOT EXISTS public.saves (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  recommendation_id UUID        NOT NULL REFERENCES public.recommendations(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, recommendation_id)
);

CREATE TABLE IF NOT EXISTS public.disagreements (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  recommendation_id UUID        NOT NULL REFERENCES public.recommendations(id) ON DELETE CASCADE,
  comment           TEXT        NOT NULL CHECK (char_length(comment) >= 20),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.friendships (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a       UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_b       UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status       TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  requested_by UUID        NOT NULL REFERENCES public.users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (user_a <> user_b)
);
-- One row per pair regardless of who is user_a and who is user_b
CREATE UNIQUE INDEX IF NOT EXISTS friendships_pair_unique
  ON public.friendships (LEAST(user_a, user_b), GREATEST(user_a, user_b));

CREATE TABLE IF NOT EXISTS public.asks (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  question   TEXT        NOT NULL,
  category   TEXT        CHECK (category IN ('beauty', 'home', 'health', 'fitness', 'pets', 'other')),
  city       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ask_replies (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ask_id            UUID        NOT NULL REFERENCES public.asks(id) ON DELETE CASCADE,
  user_id           UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  recommendation_id UUID        REFERENCES public.recommendations(id) ON DELETE SET NULL,
  text              TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Invite codes are read/written server-side only (service role key, bypasses RLS)
CREATE TABLE IF NOT EXISTS public.invite_codes (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code       TEXT        UNIQUE NOT NULL,
  created_by UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  used_by    UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────────────────────

ALTER TABLE public.users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouches        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saves          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disagreements  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asks           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ask_replies    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_codes   ENABLE ROW LEVEL SECURITY;

-- users
CREATE POLICY "users: authenticated can read all"
  ON public.users FOR SELECT TO authenticated USING (true);

CREATE POLICY "users: insert own row"
  ON public.users FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "users: update own row"
  ON public.users FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- recommendations
CREATE POLICY "recs: authenticated can read all"
  ON public.recommendations FOR SELECT TO authenticated USING (true);

CREATE POLICY "recs: insert own"
  ON public.recommendations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "recs: update own"
  ON public.recommendations FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "recs: delete own"
  ON public.recommendations FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- vouches
CREATE POLICY "vouches: read all"
  ON public.vouches FOR SELECT TO authenticated USING (true);

CREATE POLICY "vouches: insert own"
  ON public.vouches FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "vouches: delete own"
  ON public.vouches FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- likes
CREATE POLICY "likes: read all"
  ON public.likes FOR SELECT TO authenticated USING (true);

CREATE POLICY "likes: insert own"
  ON public.likes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "likes: delete own"
  ON public.likes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- saves (private — only the owner sees their own saves)
CREATE POLICY "saves: read own"
  ON public.saves FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "saves: insert own"
  ON public.saves FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "saves: delete own"
  ON public.saves FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- disagreements
CREATE POLICY "disagreements: read all"
  ON public.disagreements FOR SELECT TO authenticated USING (true);

CREATE POLICY "disagreements: insert own"
  ON public.disagreements FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "disagreements: delete own"
  ON public.disagreements FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- friendships (readable/writable by either party)
CREATE POLICY "friendships: read as party"
  ON public.friendships FOR SELECT TO authenticated
  USING (auth.uid() = user_a OR auth.uid() = user_b);

CREATE POLICY "friendships: insert as party"
  ON public.friendships FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_a OR auth.uid() = user_b);

CREATE POLICY "friendships: update as party"
  ON public.friendships FOR UPDATE TO authenticated
  USING (auth.uid() = user_a OR auth.uid() = user_b);

CREATE POLICY "friendships: delete as party"
  ON public.friendships FOR DELETE TO authenticated
  USING (auth.uid() = user_a OR auth.uid() = user_b);

-- asks
CREATE POLICY "asks: read all"
  ON public.asks FOR SELECT TO authenticated USING (true);

CREATE POLICY "asks: insert own"
  ON public.asks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "asks: update own"
  ON public.asks FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "asks: delete own"
  ON public.asks FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ask_replies
CREATE POLICY "ask_replies: read all"
  ON public.ask_replies FOR SELECT TO authenticated USING (true);

CREATE POLICY "ask_replies: insert own"
  ON public.ask_replies FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ask_replies: delete own"
  ON public.ask_replies FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- invite_codes: NO policies for authenticated role
-- Service role key bypasses RLS — all invite operations go through server-side API routes
-- Authenticated clients have zero access by default (deny-by-default when RLS is on)

-- ─── TRIGGER: AUTO-CREATE USER ROW ON AUTH SIGNUP ─────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_handle  TEXT;
  final_handle TEXT;
  counter      INT := 0;
BEGIN
  -- Derive a handle from metadata or email prefix; strip non-alphanumeric
  base_handle := LOWER(
    REGEXP_REPLACE(
      COALESCE(
        NEW.raw_user_meta_data->>'handle',
        SPLIT_PART(NEW.email, '@', 1)
      ),
      '[^a-z0-9_]', '', 'g'
    )
  );

  IF base_handle IS NULL OR base_handle = '' THEN
    base_handle := 'user';
  END IF;

  -- Make it unique (append incrementing number if taken)
  final_handle := base_handle;
  WHILE EXISTS (SELECT 1 FROM public.users WHERE handle = final_handle) LOOP
    counter      := counter + 1;
    final_handle := base_handle || counter::text;
  END LOOP;

  INSERT INTO public.users (id, handle, full_name, avatar_url)
  VALUES (
    NEW.id,
    final_handle,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── STORAGE BUCKETS ─────────────────────────────────────────────────────────
-- Upload paths should follow the convention: {user_id}/{filename}
-- This lets the owner-scoped policies work correctly.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'avatars',
    'avatars',
    true,
    5242880,  -- 5 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  ),
  (
    'rec-photos',
    'rec-photos',
    true,
    10485760,  -- 10 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  )
ON CONFLICT (id) DO NOTHING;

-- avatars
CREATE POLICY "avatars: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars: authenticated upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "avatars: owner update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "avatars: owner delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- rec-photos
CREATE POLICY "rec-photos: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'rec-photos');

CREATE POLICY "rec-photos: authenticated upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'rec-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "rec-photos: owner delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'rec-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
