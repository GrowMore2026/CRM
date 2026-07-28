-- Fixes: PGRST204 "Could not find the 'assigned_to' column of 'tasks'"
-- Run in Supabase SQL Editor if your `tasks` table has no assignee columns yet.

alter table public.tasks add column if not exists assigned_to text default '';
alter table public.tasks add column if not exists created_by text default '';

notify pgrst, 'reload schema';
