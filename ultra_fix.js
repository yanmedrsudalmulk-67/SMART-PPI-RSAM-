const fs = require('fs');
const path = require('path');

const filesToFix = [
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

filesToFix.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // 1. Fix the redundant div mess
  // Look for the specific pattern of redundant closing divs
  // pattern: </div>\n              </div>\n            </div>\n              </div>
  content = content.replace(/<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/g, '</div>\n            </div>\n          </div>');
  content = content.replace(/<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/g, '</div>\n            </div>\n          </div>');
  
  // 2. Wrap fetchObservers/fetchUnits in useCallback if they are used in useEffect
  if (content.includes('fetchObservers') && !content.includes('useCallback(')) {
     // Add useCallback import if missing
     if (!content.includes('useCallback')) {
        content = content.replace(/useState, useEffect/g, 'useState, useEffect, useCallback');
     }
     
     // Wrap fetchObservers
     content = content.replace(/const fetchObservers = async \(\) => {/g, 'const fetchObservers = useCallback(async () => {');
     // Find the end of fetchObservers and add );
     // This is tricky, let's just use a simpler marker
     // We know it ends before another const or useEffect
     const fetchObsMatch = content.match(/const fetchObservers = useCallback\(async \(\) => \{([\s\S]*?)\n  \};/);
     if (fetchObsMatch) {
        content = content.replace(fetchObsMatch[0], `const fetchObservers = useCallback(async () => {${fetchObsMatch[1]}\n  }, []);`);
     }
     
     // Wrap fetchUnits
     content = content.replace(/const fetchUnits = async \(\) => {/g, 'const fetchUnits = useCallback(async () => {');
     const fetchUnitMatch = content.match(/const fetchUnits = useCallback\(async \(\) => \{([\s\S]*?)\n  \};/);
     if (fetchUnitMatch) {
        content = content.replace(fetchUnitMatch[0], `const fetchUnits = useCallback(async () => {${fetchUnitMatch[1]}\n  }, []);`);
     }
  }

  // 3. Fix exhaustive-deps for fetchObservers/fetchUnits
  content = content.replace(/useEffect\(\(\) => \{\s*fetchObservers\(\);\s*fetchUnits\(\);\s*\}, \[\]\);/g, 'useEffect(() => {\n    fetchObservers();\n    fetchUnits();\n  }, [fetchObservers, fetchUnits]);');
  content = content.replace(/useEffect\(\(\) => \{\s*fetchObservers\(\);\s*\}, \[\]\);/g, 'useEffect(() => {\n    fetchObservers();\n  }, [fetchObservers]);');

  if (original !== content) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed ' + file);
  }
});

// 4. Replace <img> with <Image /> in report pages
const reportFiles = [
  'app/dashboard/reports/farmasi/page.tsx',
  'app/dashboard/reports/fasilitas-apd/page.tsx',
  'app/dashboard/reports/penatalaksanaan-linen/page.tsx',
  'app/dashboard/reports/penempatan-pasien/page.tsx',
  'components/reports/DekontaminasiAlatReport.tsx',
  'components/reports/OfficialReportSheet.tsx'
];

reportFiles.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  if (content.includes('<img')) {
     if (!content.includes('import Image')) {
        content = "import Image from 'next/image';\n" + content;
     }
     // Replace <img> with <Image />
     // We need to provide width/height or fill. 
     // For these logos, width={100} height={100} or similar is fine.
     content = content.replace(/<img\s+src="([^"]+)"\s+alt="([^"]+)"\s+className="([^"]+)"\s*\/>/g, '<Image src="$1" alt="$2" className="$3" width={100} height={100} referrerPolicy="no-referrer" />');
     content = content.replace(/<img\s+src="([^"]+)"\s+alt="([^"]+)"\s*\/>/g, '<Image src="$1" alt="$2" width={100} height={100} referrerPolicy="no-referrer" />');
  }

  if (original !== content) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed Image in ' + file);
  }
});
