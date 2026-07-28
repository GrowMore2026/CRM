-- ============================================================
-- link_tasks_incentives.sql
-- Connects the `tasks` and `incentives` tables so that:
--   1. incentives.taskId references tasks.id (nullable — incentives
--      from client payments have no associated task)
--   2. A new incentive_type column distinguishes 'task' vs 'payment'
-- Run once in Supabase → SQL Editor.
-- ============================================================

-- 1. Add taskId column to incentives (nullable so existing rows are unaffected)
alter table public.incentives
  add column if not exists "taskId" uuid references public.tasks(id) on delete set null;

-- 2. Add incentive_type column so the UI can distinguish the source
alter table public.incentives
  add column if not exists incentive_type text not null default 'payment';

-- 3. Update any existing incentive rows to mark them as 'payment' type
update public.incentives set incentive_type = 'payment' where incentive_type is null or incentive_type = '';

-- 4. Notify PostgREST to reload the schema
notify pgrst, 'reload schema';

/*
  After running this script:
  - incentives rows from client payments  → taskId IS NULL,  incentive_type = 'payment'
  - incentives rows from task completion  → taskId = <uuid>, incentive_type = 'task'

  The app automatically creates a task-completion incentive when a sales
  employee marks a task as 'Completed' (configurable flat amount, default ₹500).
*/
