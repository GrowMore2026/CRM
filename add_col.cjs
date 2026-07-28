const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://aihtkoutuwechxocckia.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpaHRrb3V0dXdlY2h4b2Nja2lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2MjQ3NDMsImV4cCI6MjA5MzIwMDc0M30.9NhAOHRJiORlBDTh7eYqmyWQpUb9Ja-B44wK2YJlBmQ');

async function run() {
  const { data, error } = await supabase.rpc('execute_sql', {
    sql: 'ALTER TABLE public.lead_lists ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;'
  });
  console.log('Done', error || data);
}

run();
