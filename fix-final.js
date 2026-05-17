const fs = require('fs');

const missingDivFiles = [
  'src/pages/dashboard/input/monitoring-cssd.tsx',
  'src/pages/dashboard/input/monitoring-gizi.tsx',
  'src/pages/dashboard/input/monitoring-jenazah.tsx',
  'src/pages/dashboard/input/monitoring-laboratorium.tsx',
  'src/pages/dashboard/input/monitoring-radiologi.tsx',
  'src/pages/dashboard/input/penatalaksanaan-linen.tsx',
  'src/pages/dashboard/input/penempatan-pasien.tsx',
  'src/pages/dashboard/input/pengendalian-lingkungan.tsx',
  'src/pages/dashboard/input/penyuntikan-aman.tsx',
  'src/pages/dashboard/input/perlindungan-petugas.tsx',
  'src/pages/dashboard/input/pengelolaan-limbah-medis.tsx'
];

const extraDivFiles = [
  'src/pages/dashboard/input/monitoring-airborne.tsx',
  'src/pages/dashboard/input/monitoring-fasilitas_apd.tsx',
  'src/pages/dashboard/input/monitoring-ibs.tsx',
  'src/pages/dashboard/input/monitoring-ambulance.tsx' // Wait, ambulance was what? Let's check linter. Linter says: ambulance 198: User not defined... Wait. Ambulance didn't complain about tags! Wait, yes it did: earlier it said 'div' has no corresponding closing tag. 
];

missingDivFiles.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    // For limbah-medis the error was: "Unexpected token. Did you mean `}` or `&rbrace;`?"
    // Let's just fix the missing div ones first.
    if (!f.includes('limbah-medis')) {
        content = content.replace(/<\/form>/, '</div>\n      </form>');
    }
    fs.writeFileSync(f, content);
    console.log(`Added </div> to ${f}`);
  }
});

extraDivFiles.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace(/<\/div>\n      <\/form>/, '</form>');
    // If it didn't have \n it might fail, let's be robust
    content = content.replace(/<\/div>\s*<\/form>/, '</form>');
    fs.writeFileSync(f, content);
    console.log(`Removed </div> from ${f}`);
  }
});
