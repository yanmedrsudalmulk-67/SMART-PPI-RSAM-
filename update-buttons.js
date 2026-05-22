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
  
  if (!content.includes('bg-transparent text-slate-400 hover:bg-white/10') && !content.includes('text-slate-400 border-transparent')) {
      console.log(`Skipping buttons for ${file} - looks already updated or has different signature`);
      continue;
  }

  let replaced = content;
  
  // Replace the exact map area for buttons.
  // There is a div containing it: <div className="flex p-1.5 bg-white/5 rounded-2xl border border-white/5 w-fit self-end md:self-center">
  // We'll capture the onClick function name dynamically: onClick={() => (\w+)\(item.id
  
  const buttonAreaMatch = /<div className="flex p-1\.5 bg-white\/5 rounded-2xl border border-white\/5 w-fit self-end md:self-center">[\s\S]*?onClick={\(\) => (\w+)\(item\.id[\s\S]*?<\/div>/g;
  
  replaced = replaced.replace(buttonAreaMatch, (match, onClickFn) => {
      // Find the onClickFn
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

  if (content !== replaced) {
    fs.writeFileSync(filePath, replaced, 'utf8');
    console.log(`Updated buttons in ${file}`);
  }
}
