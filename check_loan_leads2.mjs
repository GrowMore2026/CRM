import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [key, value] = line.split('=');
  if (key && value) acc[key.trim()] = value.trim();
  return acc;
}, {});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data: leads, error } = await supabase.from('loan_raw_leads').select('*').limit(2);
  console.log('Leads:', leads);
  
  const { data: camps } = await supabase.from('loan_campaigns').select('*');
  console.log('Campaigns:', camps);
}
check();
