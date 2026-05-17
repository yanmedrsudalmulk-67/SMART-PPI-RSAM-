const fs = require('fs');

const files = [
  'src/pages/dashboard/input/penempatan-pasien.tsx',
  'src/pages/dashboard/input/pengendalian-lingkungan.tsx',
  'src/pages/dashboard/input/penyuntikan-aman.tsx',
  'src/pages/dashboard/input/perlindungan-petugas.tsx',
  'src/pages/dashboard/input/pengelolaan-limbah-medis.tsx'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    if (f.includes('pengelolaan-limbah-medis')) {
        content = content.replace(/<\/div>\n      <\/form>\n    <\/div>\n  \);\n}/, '</form>\n    </div>\n  );\n}  ');
    } else {
        content = content.replace(/<\/div>\n      <\/div>\n      <\/form>\n    <\/div>\n  \);\n}/, '</form>\n    </div>\n  );\n}  ');
    }
    fs.writeFileSync(f, content);
    console.log(`Fixed trailing divs in ${f}`);
  }
});
