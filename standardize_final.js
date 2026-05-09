const fs = require('fs');
const glob = require('glob');

const files = glob.sync('app/dashboard/input/**/*.tsx');

const STANDARD_STATS = (s = 'stats') => `
        {/* HASIL PERSENTASE STANDARDIZED */}
        <div className="glass-card p-6 sm:p-8 rounded-[32px] border-white/5 flex flex-col md:flex-row items-center justify-center gap-8 relative overflow-hidden mt-6 mb-6">
          <h2 className="absolute top-6 left-8 flex items-center gap-2 text-[10px] sm:text-sm font-bold uppercase tracking-widest text-slate-400 z-10">
            <Activity className="w-4 sm:w-5 h-4 sm:h-5 text-blue-400" /> Hasil Persentase
          </h2>
          <div className={\`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 blur-[80px] rounded-full -z-10 \${${s}.bg.replace('/10', '/20')}\`} />
          
          <div className="relative w-48 h-48 flex items-center justify-center shrink-0 mt-8 md:mt-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="36" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
              <motion.circle 
                cx="40" cy="40" r="36" fill="transparent" stroke="currentColor" strokeWidth="8" strokeDasharray={2 * Math.PI * 36} strokeLinecap="round" className={${s}.color}
                initial={{ strokeDashoffset: 2 * Math.PI * 36 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 36 - (${s}.persentase / 100) * (2 * Math.PI * 36) }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-heading font-bold text-white">{${s}.persentase}%</span>
              <span className={\`text-[10px] font-bold uppercase tracking-widest mt-1 \${${s}.color}\`}>{${s}.status}</span>
            </div>
          </div>

          <div className="w-full max-w-sm grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/5">
              <p className="text-3xl font-bold text-white mb-2">{${s}.patuh}</p>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Kepatuhan</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/5">
              <p className="text-3xl font-bold text-white mb-2">{${s}.dinilai}</p>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Item Dinilai</p>
            </div>
          </div>
        </div>
`;

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    let initial = content;

    if (f === 'app/dashboard/input/page.tsx') return;

    // 1. Imports
    const icons = ['Activity', 'RefreshCw', 'Save'];
    icons.forEach(icon => {
        if (!content.includes(icon) && content.includes("from 'lucide-react'")) {
            content = content.replace(/import \{([\s\S]*?)\} from 'lucide-react';/, `import { ${icon},$1} from 'lucide-react';`);
        }
    });

    // 2. Sections to replace
    const sections = [
        ['SECTION 4: PERSENTASE OTOMATIS', 'SECTION 5: TEMUAN'],
        ['SECTION 5: Statistik', 'SECTION 6: Temuan'],
        ['SECTION 4: Hasil Persentase', 'SECTION 5: Temuan'],
        ['STATS FLOATING CARD', 'CHECKLIST'],
        ['STATISTIK', 'TEMUAN & REKOMENDASI'],
        ['PROGRESS CIRCLE & STATS', 'DOKUMENTASI'],
        ['SECTION 5: STATISTIK', 'SECTION 6: Temuan'],
        ['SECTION: STATISTIK', 'SECTION: TEMUAN']
    ];

    sections.forEach(([start, end]) => {
        const startMarker = `/* ${start} */`;
        const endMarker = `/* ${end} */`;
        if (content.includes(startMarker) && content.includes(endMarker)) {
            // Find the boundary with { and } if they are in JSX
            const startIndex = content.indexOf(`{${startMarker}`);
            const endIndex = content.indexOf(`{${endMarker}`);
            
            if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
                const head = content.substring(0, startIndex);
                const tail = content.substring(endIndex);
                content = head + '{' + STANDARD_STATS('stats') + '\n\n        ' + tail;
            } else if (content.includes(startMarker) && content.includes(endMarker)) {
                // Try without curly if not in JSX (rare but possible)
                content = content.replace(new RegExp(`\\/\\* ${start} \\*\\/[\\s\\S]*?\\/\\* ${end} \\*\\/`), STANDARD_STATS('stats') + `\n\n        /* ${end} */`);
            }
        }
    });

    // 3. StatsCard function replacement
    if (content.includes('function StatsCard')) {
        content = content.replace(/function StatsCard\(\{ stats, calculateDashOffset \}: any\) \{[\s\S]*?return \([\s\S]*?<div className="glass-card[\s\S]*?<\/div>\s*<\/div>\s*\);\s*\}/, 
`function StatsCard({ stats, calculateDashOffset }: any) {
  return (
    ${STANDARD_STATS('stats')}
  );
}`);
    }

    // 4. Targeted fixes for circles and buttons
    content = content.replace(/<div className="absolute inset-0 flex flex-col items-center justify-center">\s*<span className="text-[34]xl font-heading font-bold text-white">(\{stats\.persentase\}%)<\/span>\s*<\/div>/g,
      `<div className="absolute inset-0 flex flex-col items-center justify-center">\n            <span className="text-4xl font-heading font-bold text-white">$1</span>\n            <span className={\`text-[10px] font-bold uppercase tracking-widest mt-1 \${stats.color}\`}>{stats.status}</span>\n          </div>`);

    const standardBtnClass = 'className="w-full flex justify-center items-center gap-4 py-5 bg-blue-600 hover:bg-blue-500 text-white text-base font-bold uppercase tracking-[0.2em] rounded-2xl transition-all border border-blue-400/30 group disabled:opacity-50 overflow-hidden relative shadow-[0_0_20px_rgba(37,99,235,0.4)] glow-blue"';
    if (content.includes('Simpan Data') && content.includes('<motion.button')) {
        content = content.replace(/className="w-full flex justify-center items-center gap-4 py-6 bg-blue-600 hover:bg-blue-700[^"]*"/g, standardBtnClass);
        content = content.replace(/className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-\[2rem\][^"]*"/g, standardBtnClass);
        content = content.replace(/className="w-full flex justify-center items-center gap-4 py-5 bg-blue-600 hover:bg-blue-700[^"]*"/g, standardBtnClass);
    }

    if (content !== initial) {
        fs.writeFileSync(f, content);
        console.log("Final Standardized", f);
    }
});
