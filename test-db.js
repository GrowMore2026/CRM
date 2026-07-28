import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envFile = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
const env = envFile.split('\n').reduce((acc, line) => {
  const [key, ...value] = line.split('=');
  if (key && value.length > 0) {
    acc[key.trim()] = value.join('=').trim();
  }
  return acc;
}, {});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  const { data: users } = await supabase.from('users').select('*');
  const { data: incentives } = await supabase.from('incentives').select('*');
  
  console.log('Users:');
  users.forEach(u => console.log(`  ${u.id} - ${u.name} (${u.role})`));
  
  console.log('\nIncentives:');
  incentives.forEach(i => console.log(`  [${i.employeeId}] ${i.incentive_type}: ${i.role} - ₹${i.amount}`));
}

runTest();
