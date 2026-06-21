const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

const badKeys = [
  "temuan,",
  "rekomendasi,",
  "nama_pj_ruangan: pjName.trim(),",
  "nama_pj_ruangan: pjName,",
  "tanda_tangan_pj: pjSig,",
  "tanda_tangan_ipcn: ipcnSig,",
  "ttd_pj_ruangan: pjSig,",
  "ttd_pj_ruangan: ttd_pj,",
  "ttd_ipcn: ipcnSig,",
  "ttd_ipcn: ttd_ipcn,",
  "nama_pj: pjName.trim(),",
  "nama_pj: pjName,",
  "dokumentasi: uploadedUrls,",
  "dokumentasi: uploadedImages,",
  "kategori:", // wait, kategori might be allowed but let's check
];

const dir = path.join(__dirname, 'pages/dashboard/input');

let count = 0;
walkDir(dir, (filePath) => {
  if (!filePath.endsWith('.tsx')) return;
  let content = fs.readFileSync(filePath, 'utf8');

  let original = content;

  // Let's use string replacement for the common mistake where these fields are repeated right after `data_indikator: { ... },` block.
  // Actually, we can just replace lines that are exactly matching one of the bad keys, BUT ONLY IF they are in a session payload context.
  // Instead of complex AST, let's look for payload definitions.
  
  // They are typically at the end of the `sessionPayload = { ... }` or `const payload = { ... }`.
  // If we just remove them from the entire file when they have exactly that spacing, we might break the `data_indikator: { ... }` block where they ARE supposed to be.
  // So we need to parse it slightly.

  // Let's find occurrences of `audit_sessions` insertions and their payloads.
  // The simplest way:
  // if `data_indikator: {` is followed by its closing `},`, then anything after it before the next `}` might be the bad keys!
  
  const regex = /data_indikator:\s*\{[^}]+\},\s*([\s\S]*?)\}/g;
  content = content.replace(regex, (match, p1) => {
    // p1 contains the lines after data_indikator but before the closing brace of the payload (or array)
    let newP1 = p1.split('\n').filter(line => {
      const trimmed = line.trim();
      return !badKeys.some(bk => trimmed.startsWith(bk) || trimmed === bk.slice(0,-1));
    }).join('\n');
    return match.replace(p1, newP1);
  });
  
  // also handle "data_indikator: data," or "data_indikator: checklist," followed by bad keys
  const regex2 = /data_indikator:\s*(?:data|checklist|indicatorsData),?\s*([\s\S]*?)\}/g;
  content = content.replace(regex2, (match, p1) => {
    let newP1 = p1.split('\n').filter(line => {
      const trimmed = line.trim();
      return !badKeys.some(bk => trimmed.startsWith(bk) || trimmed === bk.slice(0,-1));
    }).join('\n');
    return match.replace(p1, newP1);
  });
  
  // what if they are before data_indikator? E.g., `temuan, \n rekomendasi, ... data_indikator: {`
  const regex3 = /status_kepatuhan:([^,]+),\s*([\s\S]*?)data_indikator:/g;
  content = content.replace(regex3, (match, p1, p2) => {
    let newP2 = p2.split('\n').filter(line => {
      const trimmed = line.trim();
      return !badKeys.some(bk => trimmed.startsWith(bk) || trimmed === bk.slice(0,-1));
    }).join('\n');
    return match.replace(p2, newP2);
  });

  if (original !== content) {
    fs.writeFileSync(filePath, content);
    count++;
    console.log("Fixed", filePath);
  }
});
console.log("Total files fixed:", count);
