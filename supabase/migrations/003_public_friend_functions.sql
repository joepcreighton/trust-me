-- ============================================================
-- Trust Me — Public friend helper functions
-- Apply in Supabase SQL Editor (Dashboard → SQL Editor)
-- These use SECURITY DEFINER to bypass RLS so other users'
-- friend counts/lists are readable (accepted friendships only).
-- ============================================================

-- Returns accepted friend count for any user
CREATE OR REPLACE FUNCTION public.get_friend_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.friendships
  WHERE (user_a = p_user_id OR user_b = p_user_id)
    AND status = 'accepted';
$$;

-- Returns the friend list for any user (accepted friendships only)
CREATE OR REPLACE FUNCTION public.get_user_friends(p_user_id UUID)
RETURNS TABLE(id UUID, handle TEXT, full_name TEXT, avatar_url TEXT, locations JSONB)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id, u.handle, u.full_name, u.avatar_url, u.locations
  FROM public.friendships f
  JOIN public.users u
    ON CASE WHEN f.user_a = p_user_id THEN f.user_b ELSE f.user_a END = u.id
  WHERE (f.user_a = p_user_id OR f.user_b = p_user_id)
    AND f.status = 'accepted'
  ORDER BY u.full_name;
$$;

GRANT EXECUTE ON FUNCTION public.get_friend_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_friends(UUID) TO authenticated;
