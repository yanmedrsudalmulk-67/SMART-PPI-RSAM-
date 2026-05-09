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

  // 1. Fix nested redundant divs for Unit Kerja
  // We want to replace the whole mess with a single clean block
  const unitBlockStart = /<div[^>]*?>\s*(?:\{\/\*\s*Unit\s*\*\/\}|\/\*\s*Unit\s*\*\/)\s*/;
  if (content.match(unitBlockStart)) {
     // This is hard to regex perfectly, let's try a simpler approach:
     // Find the Unit Kerja header and the select, and its surrounding divs
     const unitHeader = /<h2[^>]*?>\s*<Building2[^>]*?>\s*Unit Kerja\s*<\/h2>/;
     if (content.match(unitHeader)) {
        // Already fixed by previous script but maybe nested?
        content = content.replace(/(?:<div>\s*)+(?:\{\/\*\s*Unit\s*\*\/\}|\/\*\s*Unit\s*\*\/)?\s*(?:<div>\s*)+<div className="space-y-4">/g, '<div className="space-y-4">');
     }
  }

  // 2. Fix unclosed forms
  // If there's a <form but no </form>
  if (content.includes('<form') && !content.includes('</form>')) {
     console.log('Fixing unclosed form in ' + file);
     // Usually ends before UNIT MODAL or before the last closing tags
     if (content.includes('{/* UNIT MODAL */}')) {
        content = content.replace('\n\n      {/* UNIT MODAL */}', '\n      </form>\n\n      {/* UNIT MODAL */}');
     } else {
        content = content.replace('\n\n      <AnimatePresence>', '\n      </form>\n\n      <AnimatePresence>');
     }
  }

  // 3. Fix missing closing tags at the very end (ReferenceError/Parsing error)
  // Check if we have enough </div> tags before );
  const returnBlock = content.match(/return \(\s*([\s\S]*?)\s*\);/);
  if (returnBlock) {
     let block = returnBlock[1];
     let openDivs = (block.match(/<div/g) || []).length;
     let closeDivs = (block.match(/<\/div>/g) || []).length;
     let openForms = (block.match(/<form/g) || []).length;
     let closeForms = (block.match(/<\/form>/g) || []).length;

     console.log(`${file}: form ${openForms}/${closeForms}, div ${openDivs}/${closeDivs}`);

     if (openForms > closeForms) {
        block = block + '\n      </form>'.repeat(openForms - closeForms);
     }
     if (openDivs > closeDivs) {
        block = block + '\n      </div>'.repeat(openDivs - closeDivs);
     }
     // If too many closing tags (unlikely to cause 'unclosed form' but can cause 'unexpected token')
     if (closeDivs > openDivs) {
        // This is harder, but let's try to remove trailing clones
        for (let i = 0; i < (closeDivs - openDivs); i++) {
           block = block.replace(/<\/div>\s*$/, '');
        }
     }

     content = content.replace(returnBlock[1], block);
  }

  if (original !== content) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed syntax in ' + file);
  }
});
