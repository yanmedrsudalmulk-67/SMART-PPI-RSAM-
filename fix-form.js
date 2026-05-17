const fs = require('fs');

const files = [
  'src/pages/dashboard/input/penempatan-pasien.tsx',
  'src/pages/dashboard/input/pengelolaan-limbah-medis.tsx',
  'src/pages/dashboard/input/pengendalian-lingkungan.tsx',
  'src/pages/dashboard/input/penyuntikan-aman.tsx',
  'src/pages/dashboard/input/perlindungan-petugas.tsx'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace(/<div className="space-y-6">/, '<form onSubmit={handleSubmit} className="space-y-6">');
    fs.writeFileSync(f, content);
  }
});
