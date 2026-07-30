import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data: leads, error } = await supabase.from('loan_raw_leads').select('*').limit(5);
  console.log(leads);
  
  const { data: camps } = await supabase.from('loan_campaigns').select('*');
  console.log(camps);
}
check();
