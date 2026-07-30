import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [key, value] = line.split('=');
  if (key && value) acc[key.trim()] = value.trim();
  return acc;
}, {});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function testClaimFull() {
  const userId = '1a6eb640-59f0-46eb-aff9-64491de50125'; // whatever

  const { data: loanCampaigns } = await supabase.from('loan_campaigns').select('*');
  
  const activeCampaigns = loanCampaigns.filter(c => 
    c.is_active && 
    (!c.assigned_to || c.assigned_to.split(',').includes(userId))
  );
  const activeCampaignIds = activeCampaigns.map(c => c.id);
  
  console.log('activeCampaignIds:', activeCampaignIds);
  
  if (activeCampaignIds.length === 0) return console.log('Empty active campaigns');

  const { data: unassignedLeads, error: selectErr } = await supabase
    .from('loan_raw_leads')
    .select('id')
    .is('claimed_by', null)
    .in('campaign_id', activeCampaignIds)
    .limit(5);
    
  console.log('unassignedLeads:', unassignedLeads, selectErr);
}
testClaimFull();
