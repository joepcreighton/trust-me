-- Staging invite codes — run in the STAGING Supabase SQL Editor
-- Use these when testing the invite flow end-to-end.

INSERT INTO public.invite_codes (code) VALUES
  ('TRUST-BBXVWR'),
  ('TRUST-BRVQAE'),
  ('TRUST-C8WEMN'),
  ('TRUST-HSDLND'),
  ('TRUST-VJ8KKK')
ON CONFLICT (code) DO NOTHING;
