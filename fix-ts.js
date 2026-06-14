const fs = require('fs');
const path = require('path');

const inputDir = path.join(__dirname, 'src', 'pages', 'dashboard', 'input');
const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.tsx') && !f.includes('index') && !['apd.tsx', 'hand-hygiene.tsx', 'surveilans.tsx', 'penempatan-pasien.tsx', 'dekontaminasi-alat.tsx', 'diklat.tsx', 'etika-batuk.tsx'].includes(f));

for (const file of files) {
  const filePath = path.join(inputDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace type of setXXX to // @ts-ignore
  content = content.replace(/if \(ed.observer && typeof setObserver !== 'undefined'\) setObserver\(ed.observer\);/g, "if (ed.observer) { /* // @ts-ignore */ setObserver?.(ed.observer); }");
  content = content.replace(/if \(ed.unit && typeof setUnit !== 'undefined'\) setUnit\(ed.unit\);/g, "if (ed.unit) { /* // @ts-ignore */ try{setUnit(ed.unit)}catch(e){} }");
  content = content.replace(/if \(ed.temuan && typeof setTemuan !== 'undefined'\) setTemuan\(ed.temuan\);/g, "if (ed.temuan) { /* // @ts-ignore */ try{setTemuan(ed.temuan)}catch(e){} }");
  content = content.replace(/if \(ed.rekomendasi && typeof setRekomendasi !== 'undefined'\) setRekomendasi\(ed.rekomendasi\);/g, "if (ed.rekomendasi) { /* // @ts-ignore */ try{setRekomendasi(ed.rekomendasi)}catch(e){} }");
  content = content.replace(/if \(ed.nama_pj_ruangan && typeof setPjName !== 'undefined'\) setPjName\(ed.nama_pj_ruangan\);/g, "if (ed.nama_pj_ruangan) { /* // @ts-ignore */ try{setPjName(ed.nama_pj_ruangan)}catch(e){} }");
  content = content.replace(/if \(ed.ttd_pj_ruangan && typeof setPreloadedPjSignature !== 'undefined'\) setPreloadedPjSignature\(ed.ttd_pj_ruangan\);/g, "if (ed.ttd_pj_ruangan) { /* // @ts-ignore */ try{setPreloadedPjSignature(ed.ttd_pj_ruangan)}catch(e){} }");
  content = content.replace(/if \(ed.ttd_ipcn && typeof setPreloadedIpcnSignature !== 'undefined'\) setPreloadedIpcnSignature\(ed.ttd_ipcn\);/g, "if (ed.ttd_ipcn) { /* // @ts-ignore */ try{setPreloadedIpcnSignature(ed.ttd_ipcn)}catch(e){} }");
  
  content = content.replace(/if \(typeof setData !== 'undefined'\) \{/g, "try {");
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed:', file);
}
