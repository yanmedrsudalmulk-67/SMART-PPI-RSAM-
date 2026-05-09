const fs = require('fs');
let p = fs.readFileSync('app/dashboard/reports/page.tsx', 'utf8');
p = p.replace(/\\`/g, '`');
p = p.replace(/\\$/g, '$');
fs.writeFileSync('app/dashboard/reports/page.tsx', p);
