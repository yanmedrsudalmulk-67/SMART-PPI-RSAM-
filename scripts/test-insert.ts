import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  console.log('Inserting test data...');
  
  const payload = {
    indikator_id: 'monitoring_fasilitas_hand_hygiene',
    nama_indikator: 'MONITORING FASILITAS KEBERSIHAN TANGAN',
    tanggal_waktu: new Date().toISOString(),
    observer: 'Test Observer',
    unit: 'IGD',
    jumlah_dinilai: 9,
    jumlah_patuh: 9,
    persentase: 100,
    status_kepatuhan: 'Patuh',
    data_indikator: {
        "1": "ya",
        "2": "ya",
        "3": "ya",
        "4": "ya",
        "5": "ya",
        "6": "ya",
        "7": "ya",
        "8": "ya",
        "9": "ya"
    }
  };

  const { data, error } = await supabase.from('audit_sessions').insert([payload]);
  console.log("Result:", data, error);
}

testInsert();
