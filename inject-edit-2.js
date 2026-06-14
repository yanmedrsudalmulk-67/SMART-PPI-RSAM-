const fs = require('fs');
const path = require('path');

const inputDir = path.join(__dirname, 'src', 'pages', 'dashboard', 'input');
const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.tsx') && !f.includes('index') && !['apd.tsx', 'hand-hygiene.tsx', 'surveilans.tsx', 'penempatan-pasien.tsx', 'dekontaminasi-alat.tsx', 'diklat.tsx', 'etika-batuk.tsx'].includes(f));

for (const file of files) {
  const filePath = path.join(inputDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Let's just restore from git
}
