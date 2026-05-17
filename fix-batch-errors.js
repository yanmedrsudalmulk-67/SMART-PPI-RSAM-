const fs = require('fs');

const files = [
  'src/pages/dashboard/input/monitoring-ambulance.tsx',
  'src/pages/dashboard/input/monitoring-gizi.tsx',
  'src/pages/dashboard/input/monitoring-fasilitas_apd.tsx',
  'src/pages/dashboard/input/monitoring-ibs.tsx',
  'src/pages/dashboard/input/monitoring-jenazah.tsx',
  'src/pages/dashboard/input/monitoring-fasilitas_hh.tsx',
  'src/pages/dashboard/input/monitoring-cssd.tsx',
  'src/pages/dashboard/input/monitoring-laboratorium.tsx',
  'src/pages/dashboard/input/monitoring-radiologi.tsx'
];

files.forEach(file => {
    if(!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/handleActionClick/g, 'toggleItem');
    content = content.replace(/stats\.statusText/g, 'stats.status');
    fs.writeFileSync(file, content);
    console.log(`Fixed ${file}`);
});
