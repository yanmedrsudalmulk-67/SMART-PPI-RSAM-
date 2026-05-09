const fs = require('fs');

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

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Heal Ruptures in onClick
  content = content.replace(/setEditObserverId\(obs\.id[\s\S]*?setNewObserverName\(obs\.nama[\s\S]*?\}\)/g, 'setEditObserverId(obs.id); setNewObserverName(obs.nama); }}');
  content = content.replace(/setEditUnitId\(u\.id[\s\S]*?setNewUnitName\(u\.nama[\s\S]*?\}\)/g, 'setEditUnitId(u.id); setNewUnitName(u.nama); }}');
  content = content.replace(/setEditObserverId\(obs\.id[\s\S]*?setNewObserverName\(obs\.nama[\s\S]*?\}\s*\}\)/g, 'setEditObserverId(obs.id); setNewObserverName(obs.nama); }}');
  content = content.replace(/setEditUnitId\(u\.id[\s\S]*?setNewUnitName\(u\.nama[\s\S]*?\}\s*\}\)/g, 'setEditUnitId(u.id); setNewUnitName(u.nama); }}');

  // Regex to catch the multiline mess
  content = content.replace(/setEditObserverId\((obs\.id)?[\s\n]*[\s\S]*?[\s\n]*\);[\s\S]*?setNewObserverName\((obs\.nama)?[\s\n]*[\s\S]*?[\s\n]*\);/g, (match, p1, p2) => {
     return `setEditObserverId(obs.id); setNewObserverName(obs.nama);`;
  });
  
  content = content.replace(/setEditUnitId\((u\.id)?[\s\n]*[\s\S]*?[\s\n]*\);[\s\S]*?setNewUnitName\((u\.nama)?[\s\n]*[\s\S]*?[\s\n]*\);/g, (match, p1, p2) => {
     return `setEditUnitId(u.id); setNewUnitName(u.nama);`;
  });

  if (original !== content) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Healed ruptures in ' + file);
  }
});
