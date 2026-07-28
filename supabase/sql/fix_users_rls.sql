-- Run this in your Supabase SQL Editor to fix the UPDATE and DELETE permissions for users.
-- Currently, the Row Level Security (RLS) policy is blocking password updates and user deletion.

alter table public.users enable row level security;

drop policy if exists "users_all" on public.users;

-- Create a policy that allows ALL operations (SELECT, INSERT, UPDATE, DELETE)
create policy "users_all" on public.users for all using (true) with check (true);

-- Reload schema cache
notify pgrst, 'reload schema';
