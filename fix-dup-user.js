const fs = require('fs');
const files = [
  'src/pages/dashboard/input/monitoring-ambulance.tsx',
  'src/pages/dashboard/input/monitoring-cssd.tsx',
  'src/pages/dashboard/input/monitoring-gizi.tsx',
  'src/pages/dashboard/input/monitoring-jenazah.tsx',
  'src/pages/dashboard/input/monitoring-laboratorium.tsx',
  'src/pages/dashboard/input/monitoring-radiologi.tsx'
];

files.forEach(file => {
    if(!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');
    
    // We only care about lucide-react duplicate imports!
    let lines = content.split('\n');
    let newLines = lines.map(line => {
      if (line.includes('lucide-react')) {
         let before = line;
         // Clean up all commas
         let l = line.replace(/,(\s*)User/g, '');
         l = l.replace(/User(\s*),/g, '');
         // add back one User if we stripped all but needed it
         if (before.includes('User')) {
             l = l.replace(/} from/g, ', User } from');
         }
         return l;
      }
      return line;
    });
    
    fs.writeFileSync(file, newLines.join('\n'));
});
