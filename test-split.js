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
const clientsTable = env.VITE_SUPABASE_CLIENTS_TABLE || 'clients';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  console.log('Testing Split Incentive Generation...');

  // 1. Create a dummy client
  const { data: clientData, error: clientErr } = await supabase.from(clientsTable).insert([{
    name: 'Transfer Test Client',
    email: 'test@example.com',
    phone: '1234567890',
    interested: true,
    createdBy: 'GrowMore Admin',
    managedBy: '001', // Transferred to ajay
    paymentAmount: 0,
    paymentStatus: 'Pending',
    incentivePaid: false
  }]).select();

  if (clientErr) {
    console.error('Client Insert Error:', clientErr);
    return;
  }
  const client = clientData[0];
  console.log('Created Client:', client.id);

  // 2. Generate Split Incentives
  const paymentAmount = 10000;
  const totalCut = paymentAmount * 0.10;
  
  const newIncentives = [
    {
      id: `${Date.now()}-1`,
      employeeId: client.createdBy,
      clientId: client.id,
      clientName: client.name,
      clientPaymentAmount: paymentAmount,
      amount: totalCut * 0.5,
      role: 'Lead Generator (50% Split)',
      status: 'Pending',
      taskId: null,
      incentive_type: 'payment',
      createdAt: new Date().toISOString(),
    },
    {
      id: `${Date.now()}-2`,
      employeeId: client.managedBy,
      clientId: client.id,
      clientName: client.name,
      clientPaymentAmount: paymentAmount,
      amount: totalCut * 0.5,
      role: 'Closer (50% Split)',
      status: 'Pending',
      taskId: null,
      incentive_type: 'payment',
      createdAt: new Date().toISOString(),
    }
  ];

  const { data: incData, error: incErr } = await supabase.from('incentives').insert(newIncentives).select();
  
  if (incErr) {
    console.error('Incentive Insert Error:', JSON.stringify(incErr, null, 2));
  } else {
    console.log('Incentive Insert Success!');
    console.log(incData);
  }

  // Cleanup
  await supabase.from(clientsTable).delete().eq('id', client.id);
  for (const inc of newIncentives) {
    await supabase.from('incentives').delete().eq('id', inc.id);
  }
}

runTest();
