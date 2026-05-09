const fs = require('fs');

const brokenFiles = [
  'app/dashboard/input/hand-hygiene/page.tsx',
  'app/dashboard/input/etika-batuk/page.tsx',
  'app/dashboard/input/monitoring-fasilitas_apd/page.tsx',
  'app/dashboard/input/penempatan-pasien/page.tsx',
  'app/dashboard/input/pengelolaan-limbah-medis/page.tsx',
  'app/dashboard/input/pengendalian-lingkungan/page.tsx',
  'app/dashboard/input/perlindungan-petugas/page.tsx'
];

brokenFiles.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // The pattern to remove is exactly the redundant closing divs after the unit select relative group
  // New plan: search for the Unit selection end and if it's followed by TOO MANY </div>s, remove them.
  
  const unitEndPattern = /<Building2 className="w-4 h-4 text-slate-500" \/>\s*<\/div>\s*<\/div>\s*<\/div>/;
  if (content.match(unitEndPattern)) {
     // Check if followed by more </div>s that might be redundant
     // Actually, in etika-batuk we saw:
     // </div> (closes space-y-4)
     // </div> (redundant)
     // </div> (redundant)
     
     // I'll use a more surgical replace
     content = content.replace(/(<Building2 className="w-4 h-4 text-slate-500" \/>\s*<\/div>\s*<\/div>\s*<\/div>)\s*<\/div>\s*<\/div>/, '$1');
  }

  if (original !== content) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed redundant divs in ' + file);
  }
});
