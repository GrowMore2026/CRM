-- ============================================================
--  SUPABASE RLS POLICIES — Task CMS App
--  Run this entire script in:
--  Supabase Dashboard → SQL Editor → New Query → Run
-- ============================================================

-- ─── STEP 1: Enable RLS on all tables ────────────────────────
ALTER TABLE public.users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incentives    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;


-- ─── STEP 2: Drop old policies (safe to re-run) ───────────────
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('users','clients','tasks','incentives','notifications')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;


-- ─── STEP 3: USERS table ──────────────────────────────────────
-- App reads all users for login and name lookups
CREATE POLICY "anon can read users"
  ON public.users FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "anon can insert users"
  ON public.users FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "anon can update users"
  ON public.users FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "anon can delete users"
  ON public.users FOR DELETE
  TO anon
  USING (true);


-- ─── STEP 4: CLIENTS table ────────────────────────────────────
CREATE POLICY "anon can read clients"
  ON public.clients FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "anon can insert clients"
  ON public.clients FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "anon can update clients"
  ON public.clients FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- ✅ This is the key policy that was missing — allows DELETE
CREATE POLICY "anon can delete clients"
  ON public.clients FOR DELETE
  TO anon
  USING (true);


-- ─── STEP 5: TASKS table ──────────────────────────────────────
CREATE POLICY "anon can read tasks"
  ON public.tasks FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "anon can insert tasks"
  ON public.tasks FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "anon can update tasks"
  ON public.tasks FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "anon can delete tasks"
  ON public.tasks FOR DELETE
  TO anon
  USING (true);


-- ─── STEP 6: INCENTIVES table ─────────────────────────────────
CREATE POLICY "anon can read incentives"
  ON public.incentives FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "anon can insert incentives"
  ON public.incentives FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "anon can update incentives"
  ON public.incentives FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "anon can delete incentives"
  ON public.incentives FOR DELETE
  TO anon
  USING (true);


-- ─── STEP 7: NOTIFICATIONS table ─────────────────────────────
CREATE POLICY "anon can read notifications"
  ON public.notifications FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "anon can insert notifications"
  ON public.notifications FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "anon can update notifications"
  ON public.notifications FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "anon can delete notifications"
  ON public.notifications FOR DELETE
  TO anon
  USING (true);


-- ─── DONE ─────────────────────────────────────────────────────
-- Verify with:
-- SELECT tablename, policyname, cmd FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, cmd;
