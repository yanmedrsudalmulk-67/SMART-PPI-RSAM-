import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearBadData() {
  console.log('Clearing bad data for monitoring_fasilitas_hand_hygiene...');
  
  const { data, error } = await supabase
    .from('audit_sessions')
    .delete()
    .eq('indikator_id', 'monitoring_fasilitas_hand_hygiene');
    
  if (error) console.error('Error deleting from audit_sessions:', error);
  else console.log('Deleted from audit_sessions:', data);

  const { data: d2, error: e2 } = await supabase
    .from('monitoring_fasilitas_hand_hygiene')
    .delete()
    .neq('id', 'this-is-just-to-delete-all') // wait, delete() needs a filter.
    // .gte('created_at', '2020-01-01');

  if (e2) console.error('Error deleting from monitoring_fasilitas_hand_hygiene:', e2);
  else console.log('Deleted from monitoring_fasilitas_hand_hygiene:', d2);
}

clearBadData();
