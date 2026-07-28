-- Run in Supabase → SQL Editor (public.clients). Safe to re-run (IF NOT EXISTS).

alter table public.clients
  add column if not exists company text;

alter table public.clients
  add column if not exists budget numeric;

-- App default column name is `client_feedback` (matches this project). Must be TEXT, not BIGINT.
alter table public.clients
  add column if not exists client_feedback text;

-- If you already have client_feedback as bigint and inserts fail with 22P02, run:
-- supabase/sql/fix_client_feedback_type.sql

-- Only if your app uses `.env`: VITE_SUPABASE_CLIENT_FEEDBACK_COLUMN=feedback
-- alter table public.clients add column if not exists feedback text;

-- Only if you want a native array column instead of `[Services]` in feedback text:
-- alter table public.clients add column if not exists service text[];

-- Refresh PostgREST schema cache so new columns stop causing PGRST204:
notify pgrst, 'reload schema';
