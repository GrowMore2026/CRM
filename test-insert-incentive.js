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
  console.log('\nTesting Incentive Insert...');
  const testIncentive = {
    id: `test-inc-${Date.now()}`,
    employeeId: '001',
    amount: 500,
    role: 'Task Completion',
    status: 'Pending',
    incentive_type: 'task',
    createdAt: new Date().toISOString()
  };

  const { data: incData, error: incError } = await supabase.from('incentives').insert([testIncentive]).select();
  if (incError) {
    console.error('Incentive Insert Error:', JSON.stringify(incError, null, 2));
  } else {
    console.log('Incentive Insert Success!');
    console.log(incData[0]);
    await supabase.from('incentives').delete().eq('id', incData[0].id);
  }
}

runTest();
