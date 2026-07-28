import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envFile = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
const env = envFile.split('\n').reduce((acc, line) => {
  const [key, ...value] = line.split('=');
  if (key && value.length > 0) acc[key.trim()] = value.join('=').trim();
  return acc;
}, {});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
const TABLE = env.VITE_SUPABASE_CLIENTS_TABLE || 'clients';

async function run() {
  // Get a non-superadmin user
  const { data: users } = await supabase.from('users').select('id,name,role').neq('role','superadmin').limit(3);
  console.log('Users:', users?.map(u => `${u.id}: ${u.name} (${u.role})`));

  const target = users?.[0];
  if (!target) { console.log('No non-superadmin users found.'); return; }

  console.log(`\nTrying to delete user id="${target.id}" name="${target.name}"...`);

  // Try delete and capture full error
  const { data, error, status, statusText } = await supabase
    .from('users').delete().eq('id', target.id).select();

  console.log('Status:', status, statusText);
  if (error) {
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error details:', error.details);
  } else {
    console.log('Deleted:', data);
  }
}

run().catch(console.error);
