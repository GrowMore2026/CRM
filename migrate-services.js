import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL     = 'https://aihtkoutuwechxocckia.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpaHRrb3V0dXdlY2h4b2Nja2lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2MjQ3NDMsImV4cCI6MjA5MzIwMDc0M30.9NhAOHRJiORlBDTh7eYqmyWQpUb9Ja-B44wK2YJlBmQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function extractServicesFromFeedback(client) {
  const preferred = client.client_feedback;
  const raw = (typeof preferred === 'string' ? preferred : null) ?? client.client_feedback ?? client.feedback;
  const feedback = typeof raw === 'string' ? raw : '';
  
  if (!feedback.trim()) return [];

  const lines = feedback.split('\n');
  const services = [];
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    const sm = t.match(/^\[Services\]\s*(.+)$/);
    if (sm) {
      sm[1].split(';').forEach((s) => {
        const v = s.trim();
        if (v && !services.includes(v)) services.push(v);
      });
      break; // Only first match
    }
  }
  return services;
}

async function run() {
  console.log('Fetching clients...');
  const { data: clients, error } = await supabase.from('clients').select('*');
  if (error) {
    console.error('Error fetching clients:', error);
    return;
  }

  console.log(`Found ${clients.length} clients. Migrating services...`);
  
  let updatedCount = 0;
  for (const client of clients) {
    // 1. Get from existing service column if it's already an array
    let currentServices = [];
    try {
      if (Array.isArray(client.service)) currentServices = client.service;
      else if (typeof client.service === 'string') currentServices = JSON.parse(client.service);
    } catch(e) {}
    
    // 2. Extract from feedback
    const feedbackServices = extractServicesFromFeedback(client);
    
    // 3. Merge and deduplicate
    const merged = [...new Set([...currentServices, ...feedbackServices])];
    
    if (merged.length > 0) {
      console.log(`Updating client ${client.id} with services:`, merged);
      const { error: updateError } = await supabase
        .from('clients')
        .update({ service: merged })
        .eq('id', client.id);
        
      if (updateError) {
        console.error(`Failed to update client ${client.id}:`, updateError);
      } else {
        updatedCount++;
      }
    }
  }
  
  console.log(`Migration complete. Updated ${updatedCount} clients.`);
}

run();
