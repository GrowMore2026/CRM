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

async function insertSuperAdmin() {
  const user = {
    id: 'SuperAdmin GrowMore',
    name: 'SuperAdmin',
    password: 'SuperAdmin@2026',
    role: 'superadmin'
  };

  const { data, error } = await supabase.from('users').upsert([user]).select();
  if (error) {
    console.error('Error inserting superadmin:', error);
  } else {
    console.log('Successfully inserted SuperAdmin:', data);
  }
}

insertSuperAdmin();
