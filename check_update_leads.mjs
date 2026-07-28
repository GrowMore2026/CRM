import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const url = process.env.VITE_SUPABASE_URL || 'https://dbsfysddzwwshnuzemop.supabase.co';
const key = process.env.VITE_SUPABASE_ANON_KEY;
const envFile = fs.readFileSync('.env', 'utf-8');
const envUrl = envFile.match(/VITE_SUPABASE_URL=(.*)/)?.[1] || url;
const envKey = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1] || key;

const supabase = createClient(envUrl, envKey);

async function check() {
  const { error } = await supabase.from('leads').update({
    notes: 'Testing notes column',
    status: 'CONTACTED'
  }).eq('name', 'Nistha'); // Just try to update a known name
  
  if (error) {
    console.error('Update failed:', error);
  } else {
    console.log('Update succeeded?!');
  }
}
check();
