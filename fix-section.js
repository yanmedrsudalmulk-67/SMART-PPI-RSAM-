const fs = require('fs');

function fixUndefinedSection(file) {
    if(!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/subsectionMap\[item\.section\]/g, "subsectionMap[item.section || '']");
    fs.writeFileSync(file, content);
}

[
  'src/components/reports/JenazahReport.tsx',
  'src/components/reports/LaboratoriumReport.tsx',
  'src/components/reports/RadiologiReport.tsx'
].forEach(fixUndefinedSection);
