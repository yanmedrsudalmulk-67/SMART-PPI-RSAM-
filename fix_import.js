const fs = require('fs');
let code = fs.readFileSync('src/pages/dashboard/input/index.tsx', 'utf8');

code = code.replace(
  '  Filter,\n} from "lucide-react";',
  '  Filter,\n  ShieldCheck,\n  ShieldAlert,\n} from "lucide-react";'
);

fs.writeFileSync('src/pages/dashboard/input/index.tsx', code);
