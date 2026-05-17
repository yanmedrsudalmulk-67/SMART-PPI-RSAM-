const fs = require('fs');

const files = [
  'src/pages/dashboard/input/pengendalian-lingkungan.tsx',
  'src/pages/dashboard/input/penatalaksanaan-linen.tsx',
  'src/pages/dashboard/input/penempatan-pasien.tsx',
  'src/pages/dashboard/input/pengelolaan-limbah-medis.tsx',
  'src/pages/dashboard/input/perlindungan-petugas.tsx',
  'src/pages/dashboard/input/penyuntikan-aman.tsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  
  // Decide which name to use based on content
  let realName = 'dinilai';
  if (content.includes('totalEvaluasi:')) realName = 'totalEvaluasi';
  else if (content.includes('peluang:')) realName = 'peluang';
  
  const suspiciousChain = /totalDinilai=\{stats\.dinilai \|\| stats\.totalEvaluasi \|\| stats\.peluang \|\| 0\}/g;
  content = content.replace(suspiciousChain, `totalDinilai={stats.${realName} || 0}`);
  
  const suspiciousChain2 = /totalTidakPatuh=\{\(stats\.dinilai \|\| stats\.totalEvaluasi \|\| stats\.peluang \|\| 0\) - \(stats\.patuh \|\| 0\)\}/g;
  content = content.replace(suspiciousChain2, `totalTidakPatuh={(stats.${realName} || 0) - (stats.patuh || 0)}`);
  
  fs.writeFileSync(file, content);
  console.log(`Fixed stats props in ${file} using ${realName}`);
});
