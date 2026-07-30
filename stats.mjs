import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const code = fs.readFileSync('src/supabaseClient.js', 'utf8');
const urlMatch = code.match(/supabaseUrl\s*=\s*['"`](.*?)['"`]/);
const keyMatch = code.match(/supabaseAnonKey\s*=\s*['"`](.*?)['"`]/);
if(urlMatch && keyMatch) {
  const supabase = createClient(urlMatch[1], keyMatch[1]);
  async function test() {
    try {
      const { count, error } = await supabase.from('raw_leads').select('*', { count: 'exact', head: true });
      console.log('Total raw leads in DB:', count, 'Error:', error);
    } catch(e) {
      console.error(e);
    }
  }
  test();
} else { console.log('no match'); }
