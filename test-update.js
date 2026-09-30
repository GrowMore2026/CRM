import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envFile = fs.readFileSync('.env', 'utf8');
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

async function run() {
  const { data: clients } = await supabase.from('clients').select('*').limit(1);
  if (!clients || clients.length === 0) return console.log('No clients found');
  
  const client = clients[0];
  console.log('Original client:', client.id, client.client_feedback);
  
  const patch = {
    client_feedback: (client.client_feedback || '') + '\n\n[Payment ₹1 on 2026-09-30]',
    paymentAmount: (client.paymentAmount || 0) + 1
  };
  
  const { data, error } = await supabase.from('clients').update(patch).eq('id', client.id).select();
  console.log('Update error:', error);
  console.log('Updated client:', data && data[0] ? data[0].client_feedback : null);
}
run();
