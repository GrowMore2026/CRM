import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const url = process.env.VITE_SUPABASE_URL || 'https://dbsfysddzwwshnuzemop.supabase.co';
const key = process.env.VITE_SUPABASE_ANON_KEY;

const envFile = fs.readFileSync('.env', 'utf-8');
const envUrl = envFile.match(/VITE_SUPABASE_URL=(.*)/)?.[1] || url;
const envKey = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1] || key;

const supabase = createClient(envUrl, envKey);

async function check() {
  const { data, error } = await supabase.from('leads').select('*').limit(1);
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Columns:', data && data.length > 0 ? Object.keys(data[0]) : 'No data, but query succeeded');
    if (data && data.length > 0) {
      // Check if status is there
      console.log('Has status:', 'status' in data[0]);
      console.log('Has notes:', 'notes' in data[0]);
    }
  }
}
check();
