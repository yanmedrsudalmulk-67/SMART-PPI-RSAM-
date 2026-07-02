const fs = require('fs');
let code = fs.readFileSync('src/pages/dashboard/input/index.tsx', 'utf8');

code = code.replace('import {\n  ShieldCheck,\n  ShieldAlert,\n React, {', 'import React, {');

fs.writeFileSync('src/pages/dashboard/input/index.tsx', code);
