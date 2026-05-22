const fs = require('fs');
const path = require('path');

const dir = 'src/pages/dashboard/input';
const ignoreFiles = ['hand-hygiene.tsx', 'apd.tsx', 'dekontaminasi-alat.tsx', 'index.tsx'];

const files = fs.readdirSync(dir);
for (const file of files) {
  if (!file.endsWith('.tsx') || ignoreFiles.includes(file)) continue;
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  let stateVar = 'data';
  if (content.includes('auditData[item.id]')) stateVar = 'auditData';
  else if (content.includes('data[item.id]')) stateVar = 'data';
  
  if (content.includes('borderLeftColor')) {
    console.log(`Skipping ${file} - seemingly already processed`);
    continue;
  }

  let replaced = content;
  
  const mapRegex = /({(?:checklistItems|auditItems)\.map\(\(item, (?:idx|index)\) => \()([\s\S]*?)<div key={item\.id} className="bg-white\/5 p-6 rounded-\[24px\] border border-white\/5 relative overflow-hidden group">/g;

  replaced = replaced.replace(mapRegex, (match, prefix, beforeDiv) => {
    return `${prefix}{
              const selected = ${stateVar}[item.id];
              const negativeKeywords = ['berkarat', 'kotor', 'debu', 'genangan', 'tercampur', 'bercampur', 'penumpukan', 'bocor', 'jarum', 'menumpuk', 'sampah medis dan non medis', 'pembuangan sampah infeksius'];
              const isNegativeQuestion = negativeKeywords.some(kw => (item.label || item.desc || '').toLowerCase().includes(kw));
              let borderLeftColor = 'border-l-transparent';
              if (selected === 'na') { borderLeftColor = 'border-l-slate-500'; }
              else if (selected) { borderLeftColor = selected === 'ya' ? (isNegativeQuestion ? 'border-l-red-500' : 'border-l-blue-500') : (isNegativeQuestion ? 'border-l-blue-500' : 'border-l-red-500'); }

              return (
                <div key={item.id} className={\`bg-white/5 p-6 rounded-[24px] border border-white/5 border-l-4 \${borderLeftColor} transition-colors duration-300 relative overflow-hidden group\`}>`;
  });

  const buttonRegex = /<div className="flex p-1\.5 bg-white\/5 rounded-2xl border border-white\/5 w-fit self-end md:self-center">([\s\S]*?){\['ya', 'tidak', 'na'\]\.map\(choice => \(([\s\S]*?)<button key={choice}([\s\S]*?)onClick={\(\) => (\w+)\(item\.id, choice as any\)}([\s\S]*?)className={`px-6 py\.2\.5 rounded-xl text-\[10px\] font-bold uppercase tracking-wider transition-all border \${([^}]*)}`}([\s\S]*?)>([\s\S]*?)<\/button>([\s\S]*?)\)\}([\s\S]*?)<\/div>/g;
  
  replaced = replaced.replace(buttonRegex, (match, before, beforeMap, buttonKey, onClickFn) => {
    return `<div className="flex p-1.5 bg-white/5 rounded-2xl border border-white/5 w-fit self-end md:self-center">
                    {['ya', 'tidak', 'na'].map(choice => {
                      let activeClass = '';
                      if (choice === 'na') {
                         activeClass = 'bg-slate-500 text-white shadow-[0_0_15px_rgba(100,116,139,0.3)] transform scale-105';
                      } else if (isNegativeQuestion) {
                         activeClass = choice === 'ya' ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)] transform scale-105' : 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] transform scale-105';
                      } else {
                         activeClass = choice === 'ya' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] transform scale-105' : 'bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)] transform scale-105';
                      }

                      return (
                        <button key={choice} type="button" onClick={() => ${onClickFn}(item.id, choice as any)}
                            className={\`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 \${
                                ${stateVar}[item.id] === choice ? activeClass : 'bg-transparent text-slate-400 hover:bg-white/10'
                            }\`}
                        >
                            {choice === 'na' ? 'N/A' : choice}
                        </button>
                      );
                    })}
                    </div>`;
  });

  const closingRegex = /<\/div>\s*<\/div>\s*\)\)/g;
  replaced = replaced.replace(closingRegex, `</div>
                </div>
              )
            }`);
            
  if (content !== replaced) {
    fs.writeFileSync(filePath, replaced, 'utf8');
    console.log(`Updated ${file}`);
  } else {
    console.log(`Failed exactly matches for ${file}`);
  }
}
