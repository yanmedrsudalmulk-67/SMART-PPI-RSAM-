const fs = require('fs');
const path = require('path');
const dir = 'src/pages/dashboard/input';

const indicatorFiles = [
  'monitoring-airborne.tsx', 'monitoring-ambulance.tsx', 'monitoring-cssd.tsx',
  'monitoring-farmasi.tsx', 'monitoring-fasilitas_apd.tsx', 'monitoring-fasilitas_hh.tsx',
  'monitoring-gizi.tsx', 'monitoring-ibs.tsx', 'monitoring-immuno.tsx',
  'monitoring-jenazah.tsx', 'monitoring-laboratorium.tsx', 'monitoring-radiologi.tsx',
  'monitoring-ruang_isolasi.tsx', 'monitoring-tps.tsx', 'monitoring-tunggu.tsx',
  'penatalaksanaan-linen.tsx', 'penempatan-pasien.tsx',
  'pengelolaan-limbah-medis.tsx', 'pengelolaan-limbah-tajam.tsx',
  'pengendalian-lingkungan.tsx', 'penyuntikan-aman.tsx',
  'perlindungan-petugas.tsx', 'ppi-ruang-isolasi.tsx'
];

for (const file of indicatorFiles) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Identify variables
  let itemsVar = content.includes('checklistItems') ? 'checklistItems' : 'auditItems';
  let stateVar = content.includes('auditData') ? 'auditData' : 'data';
  let toggleFn = content.includes('handleActionClick') ? 'handleActionClick' : 'toggleItem';

  // Find the entire checklist section
  // Start: <div className="space-y-4">
  // End: <LiveStatisticsCard 
  // or until the double closing divs of the checklist container
  
  const startMarker = '<div className="space-y-4">';
  const endMarker = '<LiveStatisticsCard';
  
  const startIndex = content.indexOf(startMarker);
  const endIndex = content.indexOf(endMarker);
  
  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    const newContent = content.substring(0, startIndex) + `<div className="space-y-4">
            {${itemsVar}.map((item, idx) => {
              const selected = ${stateVar}[item.id];
              const negativeKeywords = ['berkarat', 'kotor', 'debu', 'genangan', 'tercampur', 'bercampur', 'penumpukan', 'bocor', 'jarum', 'menumpuk', 'sampah medis dan non medis', 'pembuangan sampah infeksius'];
              const isNegativeQuestion = negativeKeywords.some(kw => (item.label || (item as any).desc || '').toLowerCase().includes(kw));
              let borderLeftColor = 'border-l-transparent';
              if (selected === 'na') { borderLeftColor = 'border-l-slate-500'; }
              else if (selected) { borderLeftColor = selected === 'ya' ? (isNegativeQuestion ? 'border-l-red-500' : 'border-l-blue-500') : (isNegativeQuestion ? 'border-l-blue-500' : 'border-l-red-500'); }

              return (
                <div
                  key={item.id}
                  className={\`bg-white/5 p-6 rounded-[24px] border border-white/5 border-l-4 \${borderLeftColor} transition-colors duration-300 relative overflow-hidden group\`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-500 bg-white/5 border-white/10 text-slate-500">
                        <span className="text-xs font-black">{idx + 1}</span>
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white mb-2">{item.label}</h3>
                      </div>
                    </div>

                    <div className="flex p-1.5 bg-white/5 rounded-2xl border border-white/5 w-fit self-end md:self-center">
                      {["ya", "tidak", "na"].map((choice) => {
                        let activeClass = "";
                        if (choice === "na") {
                          activeClass = "bg-slate-500 text-white shadow-[0_0_15px_rgba(100,116,139,0.3)] transform scale-105";
                        } else if (isNegativeQuestion) {
                          activeClass = choice === "ya" ? "bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)] transform scale-105" : "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] transform scale-105";
                        } else {
                          activeClass = choice === "ya" ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] transform scale-105" : "bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)] transform scale-105";
                        }

                        return (
                          <button
                            key={choice}
                            type="button"
                            onClick={() => ${toggleFn}(item.id, choice as any)}
                            className={\`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 \${
                              ${stateVar}[item.id] === choice ? activeClass : "bg-transparent text-slate-400 hover:bg-white/10"
                            }\`}
                          >
                            {choice === "na" ? "N/A" : choice}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        ` + content.substring(endIndex);
    
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log("Cleanly fixed " + file);
  } else {
    console.log("Could not find markers for " + file);
  }
}

// Special fix for index.tsx
const indexFile = path.join(dir, 'index.tsx');
let indexContent = fs.readFileSync(indexFile, 'utf8');
indexContent = indexContent.replace(/\)\)\}\s*<\/div>/g, " ))} </div>");
indexContent = indexContent.replace(/\)\s*\}\s*\)\s*\}\s*/g, " )) } ");
fs.writeFileSync(indexFile, indexContent, 'utf8');
console.log("Fixed index.tsx");

// Special fix for hand-hygiene.tsx
const hhFile = path.join(dir, 'hand-hygiene.tsx');
let hhContent = fs.readFileSync(hhFile, 'utf8');
hhContent = hhContent.replace(/\)\s*\}\s*\)\s*\}\s*/g, " )) } ");
fs.writeFileSync(hhFile, hhContent, 'utf8');
console.log("Fixed hand-hygiene.tsx");
