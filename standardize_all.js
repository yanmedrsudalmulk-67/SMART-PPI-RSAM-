const fs = require('fs');
const glob = require('glob');

const files = glob.sync('app/dashboard/input/**/*.tsx');

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    let initial = content;

    // 1. Ensure imports
    if (content.includes('stats.') || content.includes('StatsCard')) {
        if (!content.includes('Activity') && content.includes("from 'lucide-react'")) {
            content = content.replace(/import \{([\s\S]*?)\} from 'lucide-react';/, "import { Activity,$1} from 'lucide-react';");
        }
        if (!content.includes('RefreshCw') && content.includes("from 'lucide-react'")) {
            content = content.replace(/import \{([\s\S]*?)\} from 'lucide-react';/, "import { RefreshCw,$1} from 'lucide-react';");
        }
    }

    // 2. Clean up Titles
    const standardHeader = '<h2 className="absolute top-6 left-8 flex items-center gap-2 text-[10px] sm:text-sm font-bold uppercase tracking-widest text-slate-400 z-10"><Activity className="w-4 sm:w-5 h-4 sm:h-5 text-blue-400" /> Hasil Persentase</h2>';

    content = content.replace(/<h3 className="[^"]*?text-slate-400[^"]*?">Ringkasan Kepatuhan<\/h3>/g, "");
    content = content.replace(/<p className="text-\[10px\] font-bold uppercase tracking-widest text-slate-400 mb-2">Capaian<\/p>/g, "");
    content = content.replace(/<h3 className="text-\[10px\] font-bold uppercase tracking-\[0\.2em\] text-slate-[45]00 mb-8 w-full text-left">Ringkasan Kepatuhan<\/h3>/g, "");
    content = content.replace(/<h3 className="text-\[10px\] font-bold uppercase tracking-\[0\.2em\] text-slate-[45]00 mb-8 w-full text-left">Realtime Analytics<\/h3>/g, "");

    // 3. Standardize Layout
    content = content.replace(/className="glass-card p-6 sm:p-8 rounded-\[32px\] border-white\/5 flex flex-col items-center justify-center relative overflow-hidden"/g,
      'className="glass-card p-6 sm:p-8 rounded-[32px] border-white/5 flex flex-col md:flex-row items-center justify-center gap-8 relative overflow-hidden mt-6 mb-6"');

    // 4. Inject Title and Standardize Circle Inner Text
    if (content.includes('-rotate-90')) {
        if (!content.includes('Hasil Persentase')) {
            content = content.replace(/(<div className={`absolute top-1\/2 left-1\/2 -translate-x-1\/2 -translate-y-1\/2 [^`]*`\} \/>)/, 
              standardHeader + "\n          $1");
            
            // For those without the glow circle:
            if (!content.includes('Hasil Persentase')) {
                content = content.replace(/(<div className="relative w-48 h-48)/, standardHeader + "\n          $1");
                content = content.replace(/(<div className="relative w-20 h-20)/, standardHeader + "\n          $1");
            }
        } else {
            content = content.replace(/<h2 className="absolute top-6 left-8 flex items-center gap-2 text-\[10px\] sm:text-sm font-bold uppercase tracking-widest text-slate-400 z-10">.*?<\/h2>/, standardHeader);
        }

        // Inner circle text
        // Replace:
        /*
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-xl font-heading font-black text-white leading-none">{stats.persentase}%</span>
        </div>
        */
        // With:
        /*
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-heading font-bold text-white">{stats.persentase}%</span>
          <span className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${stats.color}`}>{stats.status}</span>
        </div>
        */
        
        // This is a bit specific. Let's try to find common patterns.
        content = content.replace(/<div className="absolute inset-0 flex items-center justify-center flex-col">\s*<span className="text-xl font-heading font-black text-white leading-none">(\{stats\.persentase\}%)<\/span>\s*<\/div>/g,
          `<div className="absolute inset-0 flex flex-col items-center justify-center">\n          <span className="text-4xl font-heading font-bold text-white">$1</span>\n          <span className={\`text-[10px] font-bold uppercase tracking-widest mt-1 \${stats.color}\`}>{stats.status}</span>\n        </div>`);
          
        // Remove the separate status badge that might exist below the circle in isolasi
        content = content.replace(/<span className={`text-\[9px\] font-bold px-2 py-1 rounded-full border uppercase tracking-widest \$\{stats\.statusColor\}`\}>\s*\{stats\.statusText\}\s*<\/span>/g, "");
    }

    // 5. Circle size and stroke
    content = content.replace(/relative w-20 h-20 flex items-center justify-center mb-2/g, 'relative w-48 h-48 flex items-center justify-center shrink-0');
    content = content.replace(/relative w-48 h-48 flex items-center justify-center mb-6/g, 'relative w-48 h-48 flex items-center justify-center shrink-0');
    content = content.replace(/cx="40" cy="40" r="32"/g, 'cx="40" cy="40" r="36"');
    content = content.replace(/strokeDasharray=\{2 \* Math\.PI \* 32\}/g, 'strokeDasharray={2 * Math.PI * 36}');
    content = content.replace(/strokeDashoffset=\{2 \* Math\.PI \* 32 - \(stats\.persentase \/ 100\) \* \(2 \* Math\.PI \* 32\)\}/g, 'strokeDashoffset={2 * Math.PI * 36 - (stats.persentase / 100) * (2 * Math.PI * 36)}');
    content = content.replace(/animate=\{\{ strokeDashoffset: 2 \* Math\.PI \* 32 - \(stats\.persentase \/ 100\) \* \(2 \* Math\.PI \* 32\) \}\}/g, "animate={{ strokeDashoffset: 2 * Math.PI * 36 - (stats.persentase / 100) * (2 * Math.PI * 36) }}");
    content = content.replace(/initial=\{\{ strokeDashoffset: 2 \* Math\.PI \* 32 \}\}/g, 'initial={{ strokeDashoffset: 2 * Math.PI * 36 }}');

    // 6. Max-w-sm for stats boxes
    content = content.replace(/className="w-full grid grid-cols-2 gap-4 mt-2"/g, 'className="w-full max-w-sm grid grid-cols-2 gap-4"');
    content = content.replace(/className="w-full grid grid-cols-2 gap-4 mt-8"/g, 'className="w-full max-w-sm grid grid-cols-2 gap-4"');

    // 7. Simpan Data button fix (for dimness/consistency)
    const standardBtnClass = 'className="w-full flex justify-center items-center gap-4 py-5 bg-blue-600 hover:bg-blue-500 text-white text-base font-bold uppercase tracking-[0.2em] rounded-2xl transition-all border border-blue-400/30 group disabled:opacity-50 overflow-hidden relative shadow-[0_0_20px_rgba(37,99,235,0.4)] glow-blue"';
    
    // Identify button by "Simpan Data"
    if (content.includes('Simpan Data') && content.includes('<motion.button')) {
        // Replace the className of the button that contains Simpan Data
        // This is complex. Let's try to match the common dim class
        const dimClass = 'className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-\\[2rem\\] font-bold text-lg shadow-xl shadow-blue-500/20 transition-all active:scale-\\[0\\.98\\] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group relative overflow-hidden ring-1 ring-blue-400/50"';
        content = content.replace(new RegExp(dimClass, 'g'), standardBtnClass);
        
        // Also other variations
        content = content.replace(/className="w-full flex justify-center items-center gap-4 py-5 bg-blue-600 hover:bg-blue-700[^"]*"/g, standardBtnClass);
    }

    if (content !== initial) {
        fs.writeFileSync(f, content);
        console.log("Standardized", f);
    }
});
