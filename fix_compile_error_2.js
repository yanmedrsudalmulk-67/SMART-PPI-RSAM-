const fs = require('fs');
const glob = require('glob');

const files = glob.sync('./app/dashboard/input/**/*.tsx');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  let hasPjName = content.includes('const [pjName');
  let hasNamaPj = content.includes('const [namaPj');
  
  let varName = 'null';
  if (hasPjName) varName = 'pjName';
  else if (hasNamaPj) varName = 'namaPj';
  
  content = content.replace(/nama_pj_ruangan:\s*pjName\s*(?=})/g, `nama_pj_ruangan: ${varName}`);

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file} with ${varName}`);
  }
});
