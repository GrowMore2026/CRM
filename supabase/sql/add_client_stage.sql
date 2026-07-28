-- =============================================================
-- add_client_stage.sql
-- Run this in your Supabase SQL Editor
-- =============================================================

-- Add the 'stage' column with a default value of the first stage
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS stage text NOT NULL DEFAULT '1. Welcome Mail';

-- Notify PostgREST to reload the schema
NOTIFY pgrst, 'reload schema';
