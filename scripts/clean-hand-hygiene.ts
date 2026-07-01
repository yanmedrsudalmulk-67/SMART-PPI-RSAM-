import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanData() {
  console.log('Cleaning all facilities hand hygiene data...');
  
  const { data: sessions, error: e1 } = await supabase
    .from('audit_sessions')
    .delete()
    .eq('indikator_id', 'monitoring_fasilitas_hand_hygiene');
  console.log("Deleted audit_sessions", e1);

  // We should also delete from monitoring_fasilitas_hand_hygiene table if it exists
  const { data: tData, error: e2 } = await supabase
    .from('monitoring_fasilitas_hand_hygiene')
    .delete()
    .not('id', 'is', null);
  console.log("Deleted fallback table", e2);
}

cleanData();
