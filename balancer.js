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
  console.log('Balancing ' + file);
  let content = fs.readFileSync(file, 'utf8');

  // Find the return block
  const match = content.match(/return\s*\(\s*([\s\S]*?)\s*\)\s*;\s*}/);
  if (!match) {
     console.log('Skipping ' + file + ' - return block not found');
     return;
  }
  
  let block = match[1];
  
  // Strip comments for counting
  const stripped = block.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
  
  const count = (str, re) => (str.match(re) || []).length;
  
  let oD = count(stripped, /<div[\s>]/g);
  let cD = count(stripped, /<\/div>/g);
  let oF = count(stripped, /<form[\s>]/g);
  let cF = count(stripped, /<\/form>/g);
  let oA = count(stripped, /<AnimatePresence[\s>]/g);
  let cA = count(stripped, /<\/AnimatePresence>/g);
  
  console.log(`${file}: D:${oD}/${cD} F:${oF}/${cF} A:${oA}/${cA}`);
  
  // Construct fix from the end
  if (oF > cF) block = block + '\n      </form>'.repeat(oF-cF);
  if (oA > cA) block = block + '\n      </AnimatePresence>'.repeat(oA-cA);
  
  // Re-verify after form/animate fix
  {
    let temp = block.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
    let currOD = count(temp, /<div[\s>]/g);
    let currCD = count(temp, /<\/div>/g);
    if (currOD > currCD) block = block + '\n      </div>'.repeat(currOD - currCD);
    if (currCD > currOD) {
       // Too many closing divs. Remove from the end.
       for (let i = 0; i < (currCD - currOD); i++) {
          block = block.replace(/<\/div>\s*$/, '');
       }
    }
  }

  content = content.replace(match[1], block);
  fs.writeFileSync(file, content, 'utf8');
});
