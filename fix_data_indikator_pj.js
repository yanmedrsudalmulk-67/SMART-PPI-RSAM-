const fs = require('fs');
const glob = require('glob');

const files = glob.sync('./app/dashboard/input/**/*.tsx');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Let's replace the data_indikator line in sessionPayload building logic
  // It looks like: data_indikator: { ...(data_indikator || checklist_json || {}), nama_pj_ruangan: ... }
  // or something similar.
  // I will replace `nama_pj_ruangan: headerData?.nama_pj_ruangan || payload?.nama_pj_ruangan || null`
  // with `nama_pj_ruangan: typeof pjName !== 'undefined' ? pjName : (typeof namaPj !== 'undefined' ? namaPj : null)`
  
  content = content.replace(/nama_pj_ruangan:\s*headerData\?\.nama_pj_ruangan[^\}]*/g, 
    "nama_pj_ruangan: (typeof pjName !== 'undefined' ? pjName : (typeof namaPj !== 'undefined' ? namaPj : null)) "
  );
  
  // also check if any data_indikator is missing it.
  
  // What about files where we didn't have the fallback? Like monitoring-tunggu/page.tsx
  // In monitoring-tunggu:
  // It has: data_indikator: { ...(data_indikator || checklist_json || {}) }
  // We can just add it blindly if it's there.
  
  content = content.replace(/data_indikator:\s*\{\s*\.\.\.\(checklistJson(?: \|\| \w+)?\)\s*\}|data_indikator:\s*\{\s*\.\.\.\((?:data_indikator \|\| checklist_json \|\| \{\}|checklist_json \|\| data_indikator \|\| \{\})\)\s*\}/g, (match) => {
	if (match.includes("nama_pj_ruangan")) return match; // already fixed
	return match.replace("}", ", nama_pj_ruangan: (typeof pjName !== 'undefined' ? pjName : (typeof namaPj !== 'undefined' ? namaPj : null)) }");
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
