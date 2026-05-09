const fs = require('fs');
const glob = require('glob');

const files = glob.sync('app/dashboard/input/**/*.tsx');

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    let initial = content;

    // Skip the menu page
    if (f === 'app/dashboard/input/page.tsx') return;

    // 1. Ensure imports
    const icons = ['Activity', 'RefreshCw', 'Save'];
    icons.forEach(icon => {
        if (!content.includes(icon) && content.includes("from 'lucide-react'")) {
            content = content.replace(/import \{([\s\S]*?)\} from 'lucide-react';/, `import { ${icon},$1} from 'lucide-react';`);
        }
    });

    // 2. Standardize Stats Block
    // We look for the main glass-card that contains the svg circle
    // Usually starts with class="glass-card [...] relative overflow-hidden" and contains -rotate-90
    
    const standardHeader = '<h2 className="absolute top-6 left-8 flex items-center gap-2 text-[10px] sm:text-sm font-bold uppercase tracking-widest text-slate-400 z-10"><Activity className="w-4 sm:w-5 h-4 sm:h-5 text-blue-400" /> Hasil Persentase</h2>';
    
    // Instead of regex replacement of the whole block which is risky due to different variable names,
    // let's do targeted property fixes and title injection.

    // A. Inject/Fix Title
    if (content.includes('-rotate-90')) {
        // Remove existing redundant titles first
        content = content.replace(/<h3 className="[^"]*?text-slate-400[^"]*?">Ringkasan Kepatuhan<\/h3>/g, "");
        content = content.replace(/<p className="text-\[10px\] font-bold uppercase tracking-widest text-slate-400 mb-2">Capaian<\/p>/g, "");
        content = content.replace(/<h3 className="text-\[10px\] font-bold uppercase tracking-\[0\.2em\] text-slate-[45]00 mb-8 w-full text-left">Ringkasan Kepatuhan<\/h3>/g, "");
        content = content.replace(/<h3 className="text-\[10px\] font-bold uppercase tracking-\[0\.2em\] text-slate-[45]00 mb-8 w-full text-left">Realtime Analytics<\/h3>/g, "");
        content = content.replace(/<p className="text-\[10px\] font-bold uppercase tracking-widest text-slate-500 mb-2">Capaian<\/p>/g, "");
        content = content.replace(/<p className="text-\[10px\] font-bold uppercase tracking-widest text-slate-400 mb-2">Capaian<\/p>/g, "");

        // Inject standard header if not present
        if (!content.includes('Hasil Persentase')) {
            // Find the start of a glass-card that contains an svg with -rotate-90
            // We'll search for the div that likely starts the stats card
            content = content.replace(/(<div className="glass-card [^"]*?relative overflow-hidden[^"]*">)/g, function(match) {
                // Check if the next 500 characters contain -rotate-90
                const index = content.indexOf(match);
                const peek = content.substring(index, index + 1000);
                if (peek.includes('-rotate-90') && !peek.includes('Hasil Persentase')) {
                    return match + "\n          " + standardHeader;
                }
                return match;
            });
        } else {
            // Already has it, but maybe different style. Update it.
            content = content.replace(/<h2 className="absolute top-6 left-8 flex items-center gap-2 text-\[10px\] sm:text-sm font-bold uppercase tracking-widest text-slate-400 z-10">.*?<\/h2>/, standardHeader);
        }
    }

    // B. Fix layout classes
    // Targeted replacement for the container of the stats card
    content = content.replace(/className="glass-card p-6 sm:p-8 rounded-\[32px\] border-white\/5 flex flex-col md:flex-row items-center justify-center gap-8 relative overflow-hidden"/g,
        'className="glass-card p-6 sm:p-8 rounded-[32px] border-white/5 flex flex-col md:flex-row items-center justify-center gap-8 relative overflow-hidden mt-6 mb-6"');
    
    // For those that are NOT flex-row yet
    content = content.replace(/className="glass-card p-6 sm:p-8 rounded-\[2rem\] border-white\/5 shadow-xl flex flex-col items-center gap-8 relative overflow-hidden"/g,
        'className="glass-card p-6 sm:p-8 rounded-[32px] border-white/5 flex flex-col md:flex-row items-center justify-center gap-8 relative overflow-hidden mt-6 mb-6"');

    // C. Fix SVG size and stroke consistency
    content = content.replace(/relative w-20 h-20 flex items-center justify-center mb-2/g, 'relative w-48 h-48 flex items-center justify-center shrink-0 mt-8 md:mt-0');
    content = content.replace(/relative w-40 h-40 flex items-center justify-center shrink-0/g, 'relative w-48 h-48 flex items-center justify-center shrink-0 mt-8 md:mt-0');
    content = content.replace(/relative w-48 h-48 flex items-center justify-center mb-6/g, 'relative w-48 h-48 flex items-center justify-center shrink-0 mt-8 md:mt-0');
    
    content = content.replace(/cx="40" cy="40" r="32"/g, 'cx="40" cy="40" r="36"');
    content = content.replace(/strokeDasharray=\{2 \* Math\.PI \* 32\}/g, 'strokeDasharray={2 * Math.PI * 36}');
    content = content.replace(/strokeDashoffset=\{2 \* Math\.PI \* 32 - \(stats\.persentase \/ 100\) \* \(2 \* Math\.PI \* 32\)\}/g, 'strokeDashoffset={2 * Math.PI * 36 - (stats.persentase / 100) * (2 * Math.PI * 36)}');
    content = content.replace(/animate=\{\{ strokeDashoffset: 2 \* Math\.PI \* 32 - \(stats\.persentase \/ 100\) \* \(2 \* Math\.PI \* 32\) \}\}/g, "animate={{ strokeDashoffset: 2 * Math.PI * 36 - (stats.persentase / 100) * (2 * Math.PI * 36) }}");
    content = content.replace(/initial=\{\{ strokeDashoffset: 2 \* Math\.PI \* 32 \}\}/g, 'initial={{ strokeDashoffset: 2 * Math.PI * 36 }}');
    
    // Circle inner text standardization
    // Pattern: <div className="absolute inset-0 flex flex-col items-center justify-center">\s*<span className="text-4xl font-heading font-bold text-white">{stats.persentase}%</span>\s*</div>
    // Add the status line if missing
    content = content.replace(/<div className="absolute inset-0 flex flex-col items-center justify-center">\s*<span className="text-4xl font-heading font-bold text-white">(\{stats\.persentase\}%)<\/span>\s*<\/div>/g,
      `<div className="absolute inset-0 flex flex-col items-center justify-center">\n            <span className="text-4xl font-heading font-bold text-white">$1</span>\n            <span className={\`text-[10px] font-bold uppercase tracking-widest mt-1 \${stats.color}\`}>{stats.status}</span>\n          </div>`);

    // D. Grid Boxes standardization
    content = content.replace(/className="w-full grid grid-cols-2 gap-4 mt-2"/g, 'className="w-full max-w-sm grid grid-cols-2 gap-4"');
    content = content.replace(/className="flex-1 grid grid-cols-2 gap-4 sm:gap-6 w-full"/g, 'className="w-full max-w-sm grid grid-cols-2 gap-4"');

    // E. Buttons
    const standardBtnClass = 'className="w-full flex justify-center items-center gap-4 py-5 bg-blue-600 hover:bg-blue-500 text-white text-base font-bold uppercase tracking-[0.2em] rounded-2xl transition-all border border-blue-400/30 group disabled:opacity-50 overflow-hidden relative shadow-[0_0_20px_rgba(37,99,235,0.4)] glow-blue"';
    if (content.includes('Simpan Data') && content.includes('<motion.button')) {
        content = content.replace(/className="w-full flex justify-center items-center gap-4 py-6 bg-blue-600 hover:bg-blue-700[^"]*"/g, standardBtnClass);
        content = content.replace(/className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-\[2rem\][^"]*"/g, standardBtnClass);
    }

    if (content !== initial) {
        fs.writeFileSync(f, content);
        console.log("Standardized Aggressive V2", f);
    }
});
