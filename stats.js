import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const code = fs.readFileSync('src/supabaseClient.js', 'utf8');
const urlMatch = code.match(/supabaseUrl\s*=\s*['"`](.*?)['"`]/);
const keyMatch = code.match(/supabaseAnonKey\s*=\s*['"`](.*?)['"`]/);
if(urlMatch && keyMatch) {
  const supabase = createClient(urlMatch[1], keyMatch[1]);
  supabase.from('raw_leads').select('campaign_id, status').then(res => {
    console.log('Total raw leads returned:', res.data ? res.data.length : 'error', res.error);
  });
}
