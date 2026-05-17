const fs = require('fs');

const files = [
  'src/pages/dashboard/input/penyuntikan-aman.tsx',
  'src/pages/dashboard/input/penempatan-pasien.tsx',
  'src/pages/dashboard/input/perlindungan-petugas.tsx'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace(/            \}\)\)\}\n          <\/div>\n        <\/div>\n\n        <LiveStatisticsCard/g, '            }))}\n          </div>\n\n        <LiveStatisticsCard');
    fs.writeFileSync(f, content);
    console.log(`Fixed ${f}`);
  }
});
