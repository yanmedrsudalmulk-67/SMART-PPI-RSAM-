const fs = require('fs');
const glob = require('glob');

const files = glob.sync('app/dashboard/input/**/*.tsx');

const updateStats = () => {
    files.forEach(f => {
        let content = fs.readFileSync(f, 'utf8');
        let initialContent = content;

        if (!content.includes('Activity') && content.includes("from 'lucide-react'")) {
            content = content.replace(/import \{([\s\S]*?)\} from 'lucide-react';/, "import { Activity,$1} from 'lucide-react';");
        }

        // Just blindly try to inject the title if it has a stat ring
        // The pattern is: <svg className="w-full h-full -rotate-90"
        if (content.includes('-rotate-90" viewBox="0 0') && !content.includes('Hasil Persentase')) {
            // Find the parent glass-card.
            // But some are `<div className="glass-card [...] relative overflow-hidden">`
            // Let's replace the Ringkasan Kepatuhan title if it exists:
            content = content.replace(/<h3 className="[^"]*?Ringkasan Kepatuhan[^"]*?">Ringkasan Kepatuhan<\/h3>/g, 
              `<h2 className="absolute top-6 left-8 flex items-center gap-2 text-[10px] sm:text-sm font-bold uppercase tracking-widest text-slate-400 z-10"><Activity className="w-4 sm:w-5 h-4 sm:h-5 text-blue-400" /> Hasil Persentase</h2>`);

            // If it doesn't have Ringkasan Kepatuhan, try to inject right after the nearest glass-card that contains the svg.
            // Actually, we can use a simpler approach. If there's an SVG circle, inject the h2 before the div that holds the blur circle.
            // Find `<div className={\`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`
            content = content.replace(/(<div className={`absolute top-1\/2 left-1\/2 -translate-x-1\/2 -translate-y-1\/2 [^`]*`\} \/>)/, 
              `<h2 className="absolute top-6 left-8 flex items-center gap-2 text-[10px] sm:text-sm font-bold uppercase tracking-widest text-slate-400 z-10"><Activity className="w-4 sm:w-5 h-4 sm:h-5 text-blue-400" /> Hasil Persentase</h2>\n          $1`);
            
            // Wait, for monitoring-farmasi, it's `div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5`
            content = content.replace(/(<div className="absolute top-0 right-0 w-64 h-64 bg-blue-600\/5[^"]*" \/>)/,
              `<h2 className="absolute top-6 left-8 flex items-center gap-2 text-[10px] sm:text-sm font-bold uppercase tracking-widest text-slate-400 z-10"><Activity className="w-4 sm:w-5 h-4 sm:h-5 text-blue-400" /> Hasil Persentase</h2>\n          $1`);

            // Some have `bg-white/5 shadow-xl` without the glow circle, or with different text. Let's find any `<svg className="w-full h-full -rotate-90"` and inject before it if it doesn't apply.
            // A foolproof way is to find `<div className="relative w-48 h-48` and inject right BEFORE it.
            // Actually the absolute positioning needs relative parent. The `glass-card` usually has `relative`.
        }

        if (content !== initialContent) {
           fs.writeFileSync(f, content);
           console.log("Updated", f);
        }
    });

}

updateStats();
