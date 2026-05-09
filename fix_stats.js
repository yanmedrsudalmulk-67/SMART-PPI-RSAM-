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
              `<h2 className="absolute top-6 left-8 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 z-10">\n<Activity className="w-4 h-4 text-blue-400" /> Hasil Persentase\n</h2>`);

            // If it doesn't have Ringkasan Kepatuhan, try to inject right after the nearest glass-card that contains the svg.
            // Actually, we can use a simpler approach. If there's an SVG circle, inject the h2 before the div that holds the blur circle.
            // Find `<div className={\`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`
            content = content.replace(/(<div className={`absolute top-1\/2 left-1\/2 -translate-x-1\/2 -translate-y-1\/2 [^`]*`\} \/>)/, 
              `<h2 className="absolute top-6 left-8 flex items-center gap-2 text-[10px] sm:text-sm font-bold uppercase tracking-widest text-slate-400 z-10"><Activity className="w-4 sm:w-5 h-4 sm:h-5 text-blue-400" /> Hasil Persentase</h2>\n$1`);
            
            // Wait, for monitoring-farmasi, it's `div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5`
            content = content.replace(/(<div className="absolute top-0 right-0 w-64 h-64 bg-blue-600\/5[^"]*" \/>)/,
              `<h2 className="absolute top-6 left-8 flex items-center gap-2 text-[10px] sm:text-sm font-bold uppercase tracking-widest text-slate-400 z-10"><Activity className="w-4 sm:w-5 h-4 sm:h-5 text-blue-400" /> Hasil Persentase</h2>\n$1`);

            // Convert `bg-blue-600 hover:bg-blue-700...` on Simpan Data buttons to standard hand-hygiene button style.
            const btnStandard = `className="w-full flex justify-center items-center gap-4 py-5 bg-blue-600 hover:bg-blue-500 text-white text-base font-bold uppercase tracking-[0.2em] rounded-2xl transition-all border border-blue-400/30 group disabled:opacity-50 overflow-hidden relative shadow-[0_0_20px_rgba(37,99,235,0.4)] glow-blue"`;
            const innerStandard = `<div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ease-in-out" />
          {isSubmitting ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Simpan Data</span>
            </>
          )}`;

            // monitoring-farmasi, etc
            content = content.replace(/className="w-full py-5 rounded-\[2rem\] bg-blue-600 hover:bg-blue-700[^"]*"/g, btnStandard);
            content = content.replace(/className="w-full py-6 rounded-\[2\.5rem\] bg-blue-600 hover:bg-blue-700[^"]*"/g, btnStandard);
            content = content.replace(/className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-\[2rem\][^"]*"/g, btnStandard);
            content = content.replace(/className="w-full flex justify-center items-center gap-4 py-6 bg-blue-600 hover:bg-blue-700[^"]*"/g, btnStandard);

            // Replace the interior of the button if it hasn't been replaced.
            // Oh actually, let's just make sure we replace the children of the button IF we just replaced the classname.
            // It's easier just to manually replace the inner parts.
        }

        if (content !== initialContent) {
           fs.writeFileSync(f, content);
           console.log("Updated", f);
        }
    });

}

updateStats();
