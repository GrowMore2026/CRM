-- =============================================================
-- create_app_tables.sql  —  Run ONCE in Supabase → SQL Editor
-- =============================================================
-- TABLE RELATIONSHIPS (all FKs enforced):
--
--   users
--     id (PK)
--     ↑         ↑         ↑
--   tasks     clients   incentives
--   assignedTo→users.id  employeeId→users.id
--   createdBy →users.id  clientId  →clients.id (nullable)
--              createdBy→users.id  taskId     →tasks.id   (nullable)
--              managedBy→users.id  incentive_type: 'payment'|'task'
-- =============================================================

create extension if not exists "pgcrypto";

-- ── 1. users ─────────────────────────────────────────────────
create table if not exists public.users (
  id       text primary key,
  password text not null default '',
  role     text not null default 'sales',
  name     text not null default ''
);

-- ── 2. tasks  (→ users) ──────────────────────────────────────
create table if not exists public.tasks (
  id           uuid primary key default gen_random_uuid(),
  title        text not null default '',
  description  text not null default '',
  "assignedTo" text not null default '' references public.users(id) on delete cascade,
  "createdBy"  text not null default '' references public.users(id) on delete cascade,
  status       text not null default 'Pending'
);

-- ── 3. clients  (→ users) ────────────────────────────────────
create table if not exists public.clients (
  id               uuid primary key default gen_random_uuid(),
  name             text not null default '',
  email            text not null default '',
  phone            text not null default '',
  interested       boolean not null default true,
  "createdBy"      text not null default '' references public.users(id) on delete cascade,
  "managedBy"      text not null default '' references public.users(id) on delete cascade,
  "paymentAmount"  numeric not null default 0,
  "paymentStatus"  text not null default 'Pending',
  "incentivePaid"  boolean not null default false,
  "paymentDate"    timestamptz,
  client_feedback  text
);

-- ── 4. incentives  (→ users + clients + tasks) ───────────────
create table if not exists public.incentives (
  id                    text primary key,
  "employeeId"          text not null references public.users(id) on delete cascade,
  "clientId"            uuid references public.clients(id) on delete set null,
  "clientName"          text not null default '',
  "clientPaymentAmount" numeric not null default 0,
  amount                numeric not null default 0,
  role                  text not null default '',
  status                text not null default 'Pending',
  "paidAt"              timestamptz,
  "createdAt"           timestamptz not null default now(),
  "taskId"              uuid references public.tasks(id) on delete set null,
  incentive_type        text not null default 'payment'
);

-- ── Indexes ──────────────────────────────────────────────────
create index if not exists idx_tasks_assignedTo    on public.tasks("assignedTo");
create index if not exists idx_tasks_createdBy     on public.tasks("createdBy");
create index if not exists idx_clients_managedBy   on public.clients("managedBy");
create index if not exists idx_clients_createdBy   on public.clients("createdBy");
create index if not exists idx_incentives_employee on public.incentives("employeeId");
create index if not exists idx_incentives_client   on public.incentives("clientId");
create index if not exists idx_incentives_task     on public.incentives("taskId");

-- ── RLS (open access — app uses its own login, not Supabase Auth) ─
alter table public.users       enable row level security;
alter table public.tasks       enable row level security;
alter table public.clients     enable row level security;
alter table public.incentives  enable row level security;

drop policy if exists "users_all"      on public.users;
drop policy if exists "tasks_all"      on public.tasks;
drop policy if exists "clients_all"    on public.clients;
drop policy if exists "incentives_all" on public.incentives;

create policy "users_all"      on public.users      for all using (true) with check (true);
create policy "tasks_all"      on public.tasks      for all using (true) with check (true);
create policy "clients_all"    on public.clients    for all using (true) with check (true);
create policy "incentives_all" on public.incentives for all using (true) with check (true);

notify pgrst, 'reload schema';
