-- Fixes: 22P02 bigint vs text when saving client notes.
-- Supabase → SQL Editor → Run. Check the NOTICES in the Messages tab (not only "Success. No rows returned").

do $$
declare
  -- EDIT THIS LINE to match Table Editor exactly (same as .env VITE_SUPABASE_CLIENTS_TABLE if set):
  tbl text := 'clients';
  -- Use: tbl text := 'client';

  col_type text;
begin
  select c.data_type into col_type
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = tbl
    and c.column_name = 'client_feedback';

  if col_type is null then
    execute format(
      'alter table public.%I add column if not exists client_feedback text',
      tbl
    );
    raise notice 'public.%: added client_feedback (text)', tbl;
  elsif col_type in ('text', 'character varying') then
    raise notice 'public.%: client_feedback already text (%) — ok', tbl, col_type;
  else
    execute format(
      'alter table public.%I alter column client_feedback type text using (client_feedback::text)',
      tbl
    );
    raise notice 'public.%: client_feedback converted from % to text', tbl, col_type;
  end if;
end $$;

notify pgrst, 'reload schema';
