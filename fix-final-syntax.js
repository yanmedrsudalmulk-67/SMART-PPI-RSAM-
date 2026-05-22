const fs = require('fs');
const path = require('path');
const dir = 'src/pages/dashboard/input';

const files = [
  'monitoring-airborne.tsx', 'monitoring-ambulance.tsx', 'monitoring-cssd.tsx',
  'monitoring-farmasi.tsx', 'monitoring-fasilitas_apd.tsx', 'monitoring-fasilitas_hh.tsx',
  'monitoring-gizi.tsx', 'monitoring-ibs.tsx', 'monitoring-immuno.tsx',
  'monitoring-jenazah.tsx', 'monitoring-laboratorium.tsx', 'monitoring-radiologi.tsx',
  'monitoring-ruang_isolasi.tsx', 'monitoring-tps.tsx', 'monitoring-tunggu.tsx',
  'penatalaksanaan-linen.tsx', 'penempatan-pasien.tsx',
  'pengelolaan-limbah-medis.tsx', 'pengelolaan-limbah-tajam.tsx',
  'pengendalian-lingkungan.tsx', 'penyuntikan-aman.tsx',
  'perlindungan-petugas.tsx', 'ppi-ruang-isolasi.tsx', 'index.tsx', 'hand-hygiene.tsx', 'apd.tsx', 'dekontaminasi-alat.tsx'
];

for (const file of files) {
  const filePath = path.join(dir, file);
  if (!fs.existsSync(filePath)) continue;
  let content = fs.readFileSync(filePath, 'utf8');

  let replaced = content;
  
  // Fix map((o) => ( ... }) -> map((o) => ( ... ))
  replaced = replaced.replace(/(\.map\(\(\w+\)\s*=>\s*\()([\s\S]*?)\}\s*\)\s*\}/g, "$1$2))}");
  
  // Actually, let's just fix the specific error lines
  replaced = replaced.replace(/\}\)\s*\}\s*(?=\s*<\/motion\.div>|\s*<\/div>\n\s*<\/div>\n\s*<\/AnimatePresence>)/g, "))}");
  
  // Fix the ones I broke with })} line
  replaced = replaced.replace(/(\n\s*)\}\)\s*\}\s*(\s*<LiveStatisticsCard)/g, "$1            )}\n          </div>\n        </div>\n\n        $2");

  if (content !== replaced) {
       fs.writeFileSync(filePath, replaced, 'utf8');
       console.log("Fixed final syntax in " + file);
  }
}
