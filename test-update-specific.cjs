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
  const { data, error } = await supabase.from('clients').select('*').eq('email', 'jaybahucharengineering01@gmail.com');
  console.log("Client:", data);
  if (data && data.length > 0) {
    const patch = { paymentAmount: data[0].paymentAmount + 1 };
    const { data: updated, error: uErr } = await supabase.from('clients').update(patch).eq('id', data[0].id).select();
    console.log("Update:", updated, "Error:", uErr);
  }
}
run();
