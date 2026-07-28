import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL     = 'https://aihtkoutuwechxocckia.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpaHRrb3V0dXdlY2h4b2Nja2lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2MjQ3NDMsImV4cCI6MjA5MzIwMDc0M30.9NhAOHRJiORlBDTh7eYqmyWQpUb9Ja-B44wK2YJlBmQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runMigration() {
  console.log('Running migration: adding service_stages column to clients table...');

  // Attempt using an RPC function if it exists
  const { error } = await supabase.rpc('exec_sql', {
    sql: `ALTER TABLE clients ADD COLUMN IF NOT EXISTS "service_stages" jsonb DEFAULT '{}'::jsonb;`
  });

  if (error) {
    console.log('RPC not available, checking if column is missing by attempting a select...');
    const { data: testData, error: testError } = await supabase
      .from('clients')
      .select('id, "service_stages"')
      .limit(1);

    if (testError && testError.code === 'PGRST204') {
      console.log('❌ Column "service_stages" does NOT exist in clients table.');
      console.log('\n✅ Please run this SQL in your Supabase dashboard → SQL Editor:\n');
      console.log('ALTER TABLE clients ADD COLUMN IF NOT EXISTS "service_stages" jsonb DEFAULT \'{}\'::jsonb;');
      console.log('notify pgrst, \'reload schema\';');
    } else if (testError) {
      console.log('❌ Error:', testError.message);
      console.log('Please add the column manually in Supabase SQL editor: ALTER TABLE clients ADD COLUMN "service_stages" jsonb DEFAULT \'{}\'::jsonb;');
    } else {
      console.log('✅ Column "service_stages" already exists! Data:', testData);
    }
  } else {
    console.log('✅ Migration applied successfully using RPC!');
  }
}

runMigration();
