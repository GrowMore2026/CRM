import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL     = 'https://aihtkoutuwechxocckia.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpaHRrb3V0dXdlY2h4b2Nja2lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2MjQ3NDMsImV4cCI6MjA5MzIwMDc0M30.9NhAOHRJiORlBDTh7eYqmyWQpUb9Ja-B44wK2YJlBmQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runMigration() {
  console.log('Running migration: adding totalDealAmount column...');

  const { error } = await supabase.rpc('exec_sql', {
    sql: `ALTER TABLE clients ADD COLUMN IF NOT EXISTS "totalDealAmount" numeric DEFAULT 0;`
  });

  if (error) {
    console.log('RPC not available, trying direct query approach...');
    // Try updating a test row to check if column exists
    const { data: testData, error: testError } = await supabase
      .from('clients')
      .select('id, "totalDealAmount"')
      .limit(1);

    if (testError && testError.code === 'PGRST204') {
      console.log('❌ Column "totalDealAmount" does NOT exist in clients table.');
      console.log('\n✅ Please run this SQL in Supabase → SQL Editor:\n');
      console.log('ALTER TABLE clients ADD COLUMN IF NOT EXISTS "totalDealAmount" numeric DEFAULT 0;');
      console.log('notify pgrst, \'reload schema\';');
    } else if (testError) {
      console.log('❌ Error:', testError.message);
    } else {
      console.log('✅ Column "totalDealAmount" already exists! Data:', testData);
    }
  } else {
    console.log('✅ Migration applied successfully!');
  }
}

runMigration();
