const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const code = fs.readFileSync('src/supabaseClient.js', 'utf8');
const urlMatch = code.match(/supabaseUrl\s*=\s*['"`](.*?)['"`]/);
const keyMatch = code.match(/supabaseAnonKey\s*=\s*['"`](.*?)['"`]/);
if(urlMatch && keyMatch) {
  const supabase = createClient(urlMatch[1], keyMatch[1]);
  supabase.from('raw_leads').select('id', {count: 'exact', head: true}).then(res => console.log('Total DB Leads:', res.count));
  supabase.from('raw_leads').select('*').not('claimed_by', 'is', null).then(res => console.log('Claimed size:', res.data.length));
}
