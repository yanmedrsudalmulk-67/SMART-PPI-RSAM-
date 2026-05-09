const fs = require('fs');
const glob = require('glob');

const files = glob.sync('app/dashboard/input/**/*.tsx');

const updateStatsToDekontaminasi = () => {
    files.forEach(f => {
        let content = fs.readFileSync(f, 'utf8');
        let initialContent = content;

        // Make the stats glass-card horizontal by default on md: screens
        // In APD: className="glass-card p-6 sm:p-8 rounded-[32px] border-white/5 flex flex-col items-center justify-center relative overflow-hidden"
        content = content.replace(/className="glass-card [^"]*?flex flex-col items-center justify-center relative overflow-hidden"/g, 
            'className="glass-card p-6 sm:p-8 rounded-[32px] border-white/5 flex flex-col md:flex-row items-center justify-center gap-8 relative overflow-hidden mt-6 mb-6"');
            
        // Look for the "w-full grid grid-cols-2 gap-4 mt-2" and make it centered like dekontaminasi: className="w-full max-w-sm grid grid-cols-2 gap-4"
        content = content.replace(/className="w-full grid grid-cols-2 gap-4 mt-2"/g, 
            'className="w-full max-w-sm grid grid-cols-2 gap-4"');

        // Look for `flex-1 grid grid-cols-2 gap-4 w-full` and replace it
        content = content.replace(/className="flex-1 grid grid-cols-2 gap-4 w-full"/g, 
            'className="w-full max-w-sm grid grid-cols-2 gap-4"');

        // Fix APD padding texts:
        content = content.replace(/<p className="text-2xl font-bold text-white mb-1">(\{stats\.[a-zA-Z_]+\})<\/p>\s*<p className="text-\[9px\] uppercase tracking-widest text-slate-500 font-bold">([^<]+)<\/p>/g,
          '<p className="text-3xl font-bold text-white mb-2">$1</p>\n                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">$2</p>');

        // Fix monitoring layouts:
        content = content.replace(/<div className="bg-white\/5 p-4 rounded-2xl border border-white\/5">\s*<p className="text-\[10px\] font-bold uppercase tracking-widest text-slate-500 mb-1">([^<]+)<\/p>\s*<p className="text-2xl font-bold text-white">(\{stats\.[a-zA-Z_]+\})<\/p>\s*<\/div>/g,
          '<div className="bg-white/5 rounded-2xl p-4 text-center border border-white/5">\n              <p className="text-3xl font-bold text-white mb-2">$2</p>\n              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">$1</p>\n            </div>');
        
        // Remove the separate "Status:" box
        content = content.replace(/<div className=\{`col-span-2 p-4 rounded-2xl border \$\{stats\.color\} \$\{stats\.bg\} border-current\/20 flex items-center justify-center gap-2`\}>\s*<p className="text-sm font-bold uppercase tracking-widest">Status: \{stats\.status\}<\/p>\s*<\/div>/g, ""); 

        if (content !== initialContent) {
           fs.writeFileSync(f, content);
           console.log("Updated Layout", f);
        }
    });

}

updateStatsToDekontaminasi();
