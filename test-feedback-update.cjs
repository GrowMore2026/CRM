const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envFile = fs.readFileSync('.env', 'utf8');
const env = envFile.split('\n').reduce((acc, line) => {
  const [key, ...value] = line.split('=');
  if (key && value.length > 0) acc[key.trim()] = value.join('=').trim();
  return acc;
}, {});
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const patch = { 
    client_feedback: '[Company] SANJAY PATEL\n\n[Budget ₹22000]\n\n[PAN] BHOPP4791B\n\n[Payment ₹12980 on 2026-09-02] [Verified]\n\n[Payment ₹3000 on 2026-09-30]' 
  };
  const { data: updated, error: uErr } = await supabase.from('clients').update(patch).eq('id', '6a5e4d07-8301-42a0-a436-96f042e17459').select();
  console.log("Update Feedback:", updated, "Error:", uErr);
}
run();
