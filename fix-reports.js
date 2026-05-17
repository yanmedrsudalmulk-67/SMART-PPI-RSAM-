const fs = require('fs');

const fixFile = (file, key) => {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(new RegExp(`genericAuditConfigs\\.${key}\\.items`, 'g'), `(genericAuditConfigs.${key}?.items || [])`);
    fs.writeFileSync(file, content);
};

fixFile('src/components/reports/JenazahReport.tsx', 'monitoring_jenazah');
fixFile('src/components/reports/LaboratoriumReport.tsx', 'monitoring_laboratorium');
fixFile('src/components/reports/RadiologiReport.tsx', 'monitoring_radiologi');
