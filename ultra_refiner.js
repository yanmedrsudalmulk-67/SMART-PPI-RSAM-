const fs = require('fs');
const path = require('path');

// 1. Fix template.txt (remove style jsx global)
let template = fs.readFileSync('template.txt', 'utf8');
template = template.replace(/<style jsx global>[\s\S]*?<\/style>/, '');
fs.writeFileSync('template.txt', template);

// 2. Fix dashboard/page.tsx
const dashboardPath = 'app/dashboard/page.tsx';
if (fs.existsSync(dashboardPath)) {
  let content = fs.readFileSync(dashboardPath, 'utf8');
  content = content.replace(/}\s*,\s*\[\s*\]\s*\)\s*;\s*\/\/\s*eslint-disable-line/g, '}, [slides.length]);');
  // Fallback if the above regex fails
  if (!content.includes('[slides.length]')) {
    content = content.replace(/}\s*,\s*\[\s*\]\s*\)\s*;/g, '}, [slides.length]);');
  }
  fs.writeFileSync(dashboardPath, content);
}

// 3. Fix <img> tags to <Image />
const reports = [
  'app/dashboard/reports/farmasi/page.tsx',
  'app/dashboard/reports/fasilitas-apd/page.tsx',
  'app/dashboard/reports/penatalaksanaan-linen/page.tsx',
  'app/dashboard/reports/penempatan-pasien/page.tsx',
  'components/reports/DekontaminasiAlatReport.tsx',
  'components/reports/OfficialReportSheet.tsx'
];

reports.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (!fs.existsSync(fullPath)) return;
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Basic replacement for <img> tags
  // <img src={...} alt="..." className="..." /> -> <Image src={...} alt="..." className="..." width={500} height={300} referrerPolicy="no-referrer" />
  content = content.replace(/<img([\s\S]*?)\/>/g, (match, p1) => {
    if (p1.includes('Image')) return match; // Already converted?
    return `<Image${p1} width={500} height={300} referrerPolicy="no-referrer" />`;
  });
  
  // Ensure import
  if (!content.includes("import Image from 'next/image'")) {
    content = "import Image from 'next/image';\n" + content;
  }
  
  fs.writeFileSync(fullPath, content);
});

console.log('Refinement complete');
