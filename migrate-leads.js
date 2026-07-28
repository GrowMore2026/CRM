import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL     = 'https://aihtkoutuwechxocckia.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpaHRrb3V0dXdlY2h4b2Nja2lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2MjQ3NDMsImV4cCI6MjA5MzIwMDc0M30.9NhAOHRJiORlBDTh7eYqmyWQpUb9Ja-B44wK2YJlBmQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runMigration() {
  console.log('Running migration: adding notes and dynamic_data to leads...');

  const { error } = await supabase.rpc('exec_sql', {
    sql: `ALTER TABLE public.leads 
          ADD COLUMN IF NOT EXISTS notes TEXT, 
          ADD COLUMN IF NOT EXISTS dynamic_data JSONB, 
          ADD COLUMN IF NOT EXISTS list_id UUID;`
  });

  if (error) {
    console.log('Error executing SQL via RPC:', error.message);
  } else {
    console.log('Migration applied successfully!');
  }
}

runMigration();
