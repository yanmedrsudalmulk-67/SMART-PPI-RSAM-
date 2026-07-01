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

  const { data: sessionData, error } = await supabase.from('audit_sessions').insert([payload]).select('id').single();
  console.log("Session:", sessionData, error);

  if (sessionData) {
      const checklistItems = [
        { id: "1", label: "Tersedia Handrub di koridor ruang perawatan" },
        { id: "2", label: "Tersedia Handrub di tempat tidur pasien" },
        { id: "3", label: "Tersedia Handrub di setiap troli tindakan" },
        { id: "4", label: "Tersedia wastafel di setiap ruangan dengan kondisi baik" },
        { id: "5", label: "Tersedia sabun antiseptik di setiap ruangan" },
        { id: "6", label: "Tersedia tempat sampah non medis untuk tissue" },
        { id: "7", label: "Tersedia tissue di setiap ruangan" },
        { id: "8", label: "Tersedia poster handrub dan hand hygiene" },
        { id: "9", label: "Wastafel dalam kondisi bersih" },
      ];

      const detailPayloads = checklistItems.map((item) => ({
        session_id: sessionData.id,
        pertanyaan_id: item.id,
        pertanyaan: item.label,
        jawaban: "ya",
      }));
      const { data: dData, error: dError } = await supabase.from("audit_details").insert(detailPayloads);
      console.log("Details:", dData, dError);
  }
}

testInsert();
