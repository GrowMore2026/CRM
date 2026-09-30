const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf8');
const env = envFile.split('\n').reduce((acc, line) => {
  const [key, ...value] = line.split('=');
  if (key && value.length > 0) acc[key.trim()] = value.join('=').trim();
  return acc;
}, {});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

async function run() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // 1. Find a sales user
  const { data: users } = await supabase.from('users').select('*').eq('role', 'sales').limit(1);
  if (!users || users.length === 0) return console.log('No sales user found');
  const salesUser = users[0];
  console.log('Sales user:', salesUser);

  // 2. Find a client managed by this sales user
  const { data: clients } = await supabase.from('clients').select('*').eq('managedBy', salesUser.id).limit(1);
  if (!clients || clients.length === 0) return console.log('No client found for this sales user');
  const client = clients[0];
  console.log('Client:', client.id);

  // 3. Try to authenticate as this user (we might not have password, so we can't get JWT easily)
  // Instead, let's just fetch policies
  const { data: policies, error: pErr } = await supabase.from('pg_policies').select('*').eq('tablename', 'clients');
  console.log("Policies on clients table:", policies, pErr);
}
run();
