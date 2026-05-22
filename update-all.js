const fs = require('fs');
const path = require('path');

const dir = 'src/pages/dashboard/input';
const ignoreFiles = ['hand-hygiene.tsx', 'apd.tsx', 'dekontaminasi-alat.tsx', 'index.tsx'];

const files = fs.readdirSync(dir);
for (const file of files) {
  if (!file.endsWith('.tsx') || ignoreFiles.includes(file)) continue;
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  if (content.includes('const selected =')) {
    console.log(`Skipping ${file} - already updated logic`);
    continue;
  }

  let stateVar = 'data';
  if (content.includes('auditData[item.id]')) stateVar = 'auditData';
  else if (content.includes('data[item.id]')) stateVar = 'data';

  // 1. Identify the toggle/action function
  let toggleFn = 'toggleItem';
  if (content.includes('handleActionClick')) toggleFn = 'handleActionClick';
  else if (content.includes('setData({ ...data, [id]: choice })')) {
      // Inline update, we might need to handle this
  }
  
  // Try to find the onClick in the buttons
  const toggleMatch = /onClick=\{\(\) => (\w+)\(item\.id/g.exec(content);
  if (toggleMatch) toggleFn = toggleMatch[1];

  let replaced = content;

  // Pattern: {checklistItems.map((item) => ( <div key={item.id} ...
  // We want to replace it with a block that includes the logic.
  
  const mapRegex = /({(?:checklistItems|auditItems)\.map\(\((item(?:,\s*\w+)?)\) => \()\s*<div\s+key={item\.id}\s+className="([^"]+)"/g;

  replaced = replaced.replace(mapRegex, (match, prefix, args, originalClass) => {
    // Determine the new class. We want to add border-l-4 and borderLeftColor
    let baseClass = originalClass.replace('border-l-4', '').replace(/\${borderLeftColor}/g, '').trim();
    if (!baseClass.includes('relative')) baseClass += ' relative';
    if (!baseClass.includes('overflow-hidden')) baseClass += ' overflow-hidden';
    if (!baseClass.includes('group')) baseClass += ' group';
    
    return `${prefix}{
              const selected = ${stateVar}[item.id];
              const negativeKeywords = ['berkarat', 'kotor', 'debu', 'genangan', 'tercampur', 'bercampur', 'penumpukan', 'bocor', 'jarum', 'menumpuk', 'sampah medis dan non medis', 'pembuangan sampah infeksius'];
              const isNegativeQuestion = negativeKeywords.some(kw => (item.label || (item as any).desc || '').toLowerCase().includes(kw));
              let borderLeftColor = 'border-l-transparent';
              if (selected === 'na') { borderLeftColor = 'border-l-slate-500'; }
              else if (selected) { borderLeftColor = selected === 'ya' ? (isNegativeQuestion ? 'border-l-red-500' : 'border-l-blue-500') : (isNegativeQuestion ? 'border-l-blue-500' : 'border-l-red-500'); }

              return (
                <div key={item.id} className={\`${baseClass} border-l-4 \${borderLeftColor} transition-colors duration-300\`}`;
  });

  // Now replace the button group inside the map
  // Pattern: <div className="grid grid-cols-3 gap-3"> {["ya", "tidak", "na"].map((choice) => ( <button ... </button> ))} </div>
  const buttonGroupRegex = /<div className="grid grid-cols-3 gap-3">[\s\S]*?{\["ya", "tidak", "na"\].map\(\(choice\) => \([\s\S]*?onClick=\{\(\) => (\w+)\(item\.id, choice as any\)[\s\S]*?<\/div>/g;

  replaced = replaced.replace(buttonGroupRegex, (match, onClickFn) => {
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

  // Also handle cases where the grid was diff or map was diff
  // but mostly I just want to catch the ones that failed
  
  // Close the block
  // Find the end: )) } </div>
  // Wait, if I changed `(item) => (` to `(item) => { return (`
  // I need to add `}`
  
  if (content !== replaced) {
      // Need to find the closing of the map and change `))` or `)}` to `)} ) }`
      // This is tricky. Let's try a simpler approach for the end:
      // The map usually ends before `</div>` and `LiveStatisticsCard`
      
      const mapEndRegex = /<\/div>\s*\)\)\s*(?=<\/div>|\s*<LiveStatisticsCard)/g;
      replaced = replaced.replace(mapEndRegex, "</div>\n              )\n            })} ");
      
      const mapEndRegex2 = /<\/div>\s*\}\)\s*(?=<\/div>|\s*<LiveStatisticsCard)/g;
      replaced = replaced.replace(mapEndRegex2, "</div>\n              )\n            })} ");

      fs.writeFileSync(filePath, replaced, 'utf8');
      console.log(`Updated ${file}`);
  } else {
      // console.log(`No match for ${file}`);
  }
}
