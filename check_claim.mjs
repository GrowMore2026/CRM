import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [key, value] = line.split('=');
  if (key && value) acc[key.trim()] = value.trim();
  return acc;
}, {});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function testClaim() {
  const activeCampaignIds = ['cfe0df3d-f30b-4cda-a315-0b27dbc90ccf']; // The one campaign

  const { data: unassignedLeads, error } = await supabase
    .from('loan_raw_leads')
    .select('id, status, claimed_by')
    .is('claimed_by', null)
    .in('campaign_id', activeCampaignIds)
    .limit(5);
    
  console.log('Unassigned Leads Query:', unassignedLeads, error);
}
testClaim();
