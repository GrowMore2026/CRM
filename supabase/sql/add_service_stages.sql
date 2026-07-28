-- =============================================================
-- add_service_stages.sql
-- Run this in your Supabase SQL Editor
-- =============================================================

-- Add the 'service_stages' column as JSONB to store individual service stages
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS service_stages jsonb DEFAULT '{}'::jsonb;

-- Notify PostgREST to reload the schema
NOTIFY pgrst, 'reload schema';
