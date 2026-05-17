const fs = require('fs');

const files = [
  'src/pages/dashboard/input/monitoring-laboratorium.tsx',
  'src/pages/dashboard/input/monitoring-radiologi.tsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  
  content = content.replace(/const \[supervisor, setSupervisor\] = useState\(''\);/g, "const [observer, setObserver] = useState('');");
  content = content.replace(/setSupervisor\(/g, "setObserver(");
  content = content.replace(/supervisor ===/g, "observer ===");
  content = content.replace(/!supervisor/g, "!observer");
  content = content.replace(/value=\{supervisor\}/g, "value={observer}");
  content = content.replace(/supervisor\b/g, "observer"); // Careful with this one, but in these files we want to unify
  
  fs.writeFileSync(file, content);
  console.log(`Fixed naming in ${file}`);
});
