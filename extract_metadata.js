const fs = require('fs');
const path = require('path');

const files = [
  'app/dashboard/input/apd/page.tsx',
  'app/dashboard/input/dekontaminasi-alat/page.tsx',
  'app/dashboard/input/etika-batuk/page.tsx',
  'app/dashboard/input/hand-hygiene/page.tsx',
  'app/dashboard/input/monitoring-fasilitas_apd/page.tsx',
  'app/dashboard/input/penatalaksanaan-linen/page.tsx',
  'app/dashboard/input/penempatan-pasien/page.tsx',
  'app/dashboard/input/pengelolaan-limbah-medis/page.tsx',
  'app/dashboard/input/pengelolaan-limbah-tajam/page.tsx',
  'app/dashboard/input/pengendalian-lingkungan/page.tsx',
  'app/dashboard/input/penyuntikan-aman/page.tsx',
  'app/dashboard/input/perlindungan-petugas/page.tsx'
];

const results = {};

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  const content = fs.readFileSync(file, 'utf8');
  
  const checklistMatch = content.match(/const checklistItems = (\[[\s\S]*?\]);/);
  const titleMatch = content.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  
  results[file] = {
    checklistItems: checklistMatch ? checklistMatch[1] : null,
    title: titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : path.basename(path.dirname(file)).toUpperCase()
  };
});

fs.writeFileSync('extraction.json', JSON.stringify(results, null, 2));
console.log('Extraction complete');
