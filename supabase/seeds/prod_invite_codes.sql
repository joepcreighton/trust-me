-- Production invite codes — run in the PRODUCTION Supabase SQL Editor
-- These are one-time use; used_by and used_at are set by the API on redemption.

INSERT INTO public.invite_codes (code) VALUES
  ('TRUST-4WGFFK'),
  ('TRUST-S5PNL5'),
  ('TRUST-RQ85XY'),
  ('TRUST-UZS3JU'),
  ('TRUST-KYVDVS'),
  ('TRUST-88B25X'),
  ('TRUST-JY9W6E'),
  ('TRUST-GN3Z4T'),
  ('TRUST-P5LYAL'),
  ('TRUST-3EWN6C'),
  ('TRUST-82B998'),
  ('TRUST-65VYF8'),
  ('TRUST-TXBP8V'),
  ('TRUST-76HZSL'),
  ('TRUST-YVDE7V'),
  ('TRUST-AJUZ57'),
  ('TRUST-7UVATR'),
  ('TRUST-QR3BAY'),
  ('TRUST-EBANPN'),
  ('TRUST-75EPPR')
ON CONFLICT (code) DO NOTHING;
