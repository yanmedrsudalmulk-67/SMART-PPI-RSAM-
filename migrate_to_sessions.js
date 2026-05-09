const fs = require('fs');
const glob = require('glob');

const files = glob.sync('app/dashboard/input/**/page.tsx');

let updatedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Check if it's already using saveAuditData
  if (content.includes('saveAuditData')) return;

  // Find the supabase insert block
  // E.g., await supabase.from('...').insert([payload]);
  const insertRegex = /const\s+\{\s*error\s*\}\s*=\s*await\s+supabase\s*\.from\(["'](.+?)["']\)\s*\.insert\(\[\s*([a-zA-Z0-9_]+)\s*\]\)/g;
  
  let match = insertRegex.exec(content);
  if (match) {
    const tableName = match[1];
    const payloadVar = match[2];

    const replacement = `
      // Modifikasi untuk menggunakan audit_sessions sesuai instruksi
      const { data_indikator, checklist_json, ...headerData } = ${payloadVar};
      
      const sessionPayload = {
        indikator_id: '${tableName}', // Menggunakan nama tabel sebagai indikator ID
        nama_indikator: '${tableName.replace(/_/g, ' ').toUpperCase()}',
        tanggal_waktu: headerData.tanggal_waktu || headerData.waktu || headerData.start_time || new Date().toISOString(),
        observer: headerData.observer || observer,
        unit: headerData.unit || unit,
        profesi: headerData.profesi || null,
        jenis_tindakan: headerData.jenis_tindakan || null,
        jumlah_dinilai: headerData.jumlah_dinilai || stats?.dinilai || 0,
        jumlah_patuh: headerData.jumlah_patuh || stats?.patuh || 0,
        persentase: headerData.persentase || stats?.persentase || 0,
        status_kepatuhan: headerData.status_kepatuhan || stats?.status || stats?.statusText || 'Belum Dinilai',
        temuan: headerData.temuan || '',
        rekomendasi: headerData.rekomendasi || '',
        ttd_pj_ruangan: headerData.ttd_pj_ruangan || null,
        ttd_ipcn: headerData.ttd_ipcn || null,
        dokumentasi: headerData.foto || headerData.dokumentasi || [],
        data_indikator: data_indikator || checklist_json || data // Tetap simpan raw JSON
      };

      const { data: sessionData, error: sessionError } = await supabase
        .from('audit_sessions')
        .insert([sessionPayload])
        .select('*')
        .single();

      if (sessionError) {
        console.error("Kesalahan Supabase Simpan Session:", sessionError);
        throw sessionError;
      }
      
      // Simpan details (checklist item answers)
      const auditData = data_indikator || checklist_json || data || {};
      const detailPayloads = Object.keys(auditData).map(key => ({
        session_id: sessionData.id,
        pertanyaan_id: key,
        pertanyaan: key,
        jawaban: String(auditData[key])
      }));

      if (detailPayloads.length > 0) {
        const { error: detailError } = await supabase.from('audit_details').insert(detailPayloads);
        if (detailError) {
          console.warn("Kesalahan Supabase Simpan Details:", detailError);
        }
      }

      // Pastikan tabel lama tetap terisi agar backward compatibility
      const { error } = await supabase.from('${tableName}').insert([${payloadVar}]);
      // Jika terjadi error pada table lama (mungkin karena skema tidak sesuai), kita hiraukan karena data sudah aman di audit_sessions
      if (error) {
        console.warn("Kesalahan saat menyimpan fallback table (hiraukan jika skema lama un-matched):", error);
      }
    `;

    content = content.replace(match[0], replacement);
    fs.writeFileSync(file, content);
    updatedFiles++;
    console.log('Updated ' + file);
  }
});

console.log('Updated files:', updatedFiles);
