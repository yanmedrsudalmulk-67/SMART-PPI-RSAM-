const fs = require('fs');

const config = {
  'src/pages/dashboard/input/penatalaksanaan-linen.tsx': { fn: 'handleSelection', state: 'auditData' },
  'src/pages/dashboard/input/penempatan-pasien.tsx': { fn: 'handleActionClick', state: 'auditData' },
  'src/pages/dashboard/input/penyuntikan-aman.tsx': { fn: 'handleActionClick', state: 'auditData' },
  'src/pages/dashboard/input/perlindungan-petugas.tsx': { fn: 'handleActionClick', state: 'auditData' }
};

Object.entries(config).forEach(([file, settings]) => {
    if(!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');
    
    const messyRegex = /onClick=\{\(\) => \(typeof handleActionClick === 'function' \? handleActionClick : \(typeof setChecklist === 'function' \? \(id, c\) => setChecklist\(prev => \(\{\.\.\.prev, \[id\]: c\}\)\) : handleSelection\)\)\(item\.id \|\| item\.key \|\| item, choice as any\)\}/g;
    content = content.replace(messyRegex, `onClick={() => ${settings.fn}(item.id, choice as any)}`);
    
    // Also fix the state reference in the same block if it was 'data'
    const dataRegex = /className=\{`py-3 flex-1 rounded-xl text-\[10px\] font-bold uppercase tracking-wider transition-all border \$\{([ \n\t]*)data\[item\.id \|\| item\.key \|\| item\] === choice/g;
    content = content.replace(dataRegex, (match, p1) => {
        return `className={\`py-3 flex-1 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border \$\{${p1}${settings.state}[item.id] === choice`;
    });
    
    fs.writeFileSync(file, content);
    console.log(`Fixed ${file}`);
});
