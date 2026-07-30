const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://aihtkoutuwechxocckia.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpaHRrb3V0dXdlY2h4b2Nja2lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2MjQ3NDMsImV4cCI6MjA5MzIwMDc0M30.9NhAOHRJiORlBDTh7eYqmyWQpUb9Ja-B44wK2YJlBmQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: users } = await supabase.from('users').select('*');
  console.log('Users:', JSON.stringify(users.map(u => ({ id: u.id, name: u.name, employeeId: u.employeeId })), null, 2));
}
test();
