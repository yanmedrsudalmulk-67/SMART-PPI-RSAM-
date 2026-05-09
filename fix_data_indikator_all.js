const fs = require('fs');
const glob = require('glob');

const files = glob.sync('./app/dashboard/input/**/*.tsx');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Let's replace simple `data_indikator: data_indikator || checklist_json || {}`
  // with `data_indikator: { ...(data_indikator || checklist_json || {}), nama_pj_ruangan: (typeof pjName !== 'undefined' ? pjName : (typeof namaPj !== 'undefined' ? namaPj : null)) }`
  
  content = content.replace(/data_indikator:\s*(data_indikator \|\| checklist_json \|\| \{\}|checklist_json \|\| data_indikator \|\| \{\})(?!\s*,)/g, 
    "data_indikator: { ...($1), nama_pj_ruangan: (typeof pjName !== 'undefined' ? pjName : (typeof namaPj !== 'undefined' ? namaPj : null)) }"
  );
  
  content = content.replace(/data_indikator:\s*data(?!\w)(?!\s*:)(?!\s*,)/g, 
    "data_indikator: { ...(data || {}), nama_pj_ruangan: (typeof pjName !== 'undefined' ? pjName : (typeof namaPj !== 'undefined' ? namaPj : null)) }"
  );

  // For monitoring-isolasi: data_indikator: checklistJson
  content = content.replace(/data_indikator:\s*checklistJson(?!\s*,)/g, 
    "data_indikator: { ...(checklistJson || {}), nama_pj_ruangan: (typeof pjName !== 'undefined' ? pjName : (typeof namaPj !== 'undefined' ? namaPj : null)) }"
  );

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
