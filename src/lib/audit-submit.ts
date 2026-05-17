import { getSupabase } from './supabase';

export async function saveAuditData(params: {
  indikator_id: string;
  nama_indikator: string;
  kategori?: string;
  tanggal_waktu: string;
  observer: string;
  unit: string;
  profesi?: string;
  jenis_tindakan?: string;
  data_indikator: Record<string, string | null>;
  checklist_items?: { id: string; label: string }[];
  jumlah_dinilai: number;
  jumlah_patuh: number;
  persentase: number;
  status_kepatuhan: string;
  temuan?: string;
  rekomendasi?: string;
  nama_pj?: string | null;
  nama_pj_ruangan?: string | null;
  ttd_pj?: string | null;
  ttd_pj_ruangan?: string | null;
  ttd_ipcn?: string | null;
  dokumentasi: string[];
}) {
  const supabase = getSupabase();

  const { data_indikator, checklist_items, ...headerPayload } = params;
  
  // 1. Simpan ke tabel utama (header)
  const { data: sessionData, error: sessionError } = await supabase
    .from('audit_sessions')
    .insert([{
      ...headerPayload,
      kategori: headerPayload.kategori || 'General',
      nama_pj: headerPayload.nama_pj || headerPayload.nama_pj_ruangan || null,
      nama_pj_ruangan: headerPayload.nama_pj_ruangan || headerPayload.nama_pj || null,
      data_indikator: data_indikator // Keep JSONB for backward compatibility of simple UI
    }])
    .select()
    .single();

  if (sessionError) {
    throw sessionError;
  }

  // 2. Simpan details
  const details: any[] = [];
  for (const [key, val] of Object.entries(data_indikator)) {
    if (val !== null && val !== undefined) {
      let label = key;
      if (checklist_items) {
        const found = checklist_items.find(i => i.id === key);
        if (found) label = found.label;
      }
      details.push({
        session_id: sessionData.id,
        pertanyaan_id: key,
        pertanyaan: label,
        jawaban: val
      });
    }
  }

  if (details.length > 0) {
    const { error: detailError } = await supabase
      .from('audit_details')
      .insert(details);
      
    if (detailError) {
      console.warn("Details partial failure", detailError);
    }
  }

  return sessionData;
}
