-- Enable Realtime for tables that need live updates in the feed
-- Run in Supabase SQL Editor after 001_initial_schema.sql

ALTER PUBLICATION supabase_realtime ADD TABLE public.recommendations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.asks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vouches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.likes;
