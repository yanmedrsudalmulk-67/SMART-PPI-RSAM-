const fs = require('fs');
const glob = require('glob');

const files = glob.sync('app/dashboard/input/**/*.tsx');

files.forEach(file => {
  if (file.includes('dekontaminasi-alat') || file.includes('apd') || file.includes('hand-hygiene')) return;
  
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Pattern exactly used in pengelolaan-limbah-tajam and others
  content = content.replace(/className="glass-card(?: |(.*?)?)flex-row md:items-center justify-between gap-6"/g, 
    'className="glass-card$1flex-col justify-between gap-4"');
    
  // Then the button wrapper in pengelolaan-limbah-tajam
  content = content.replace(/<div className="flex p-1\.5 bg-white\/5 rounded-2xl border border-white\/10 w-fit shrink-0">\s*<button/g, 
    '<div className="grid grid-cols-3 gap-2 sm:gap-3 w-full shrink-0">\n<button');

  // Pattern in pengelolaan-limbah-medis
  content = content.replace(/className="bg-navy-dark\/30 border border-white\/5 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-white\/10 transition-colors"/g,
    'className="bg-navy-dark/30 border border-white/5 p-4 rounded-2xl flex flex-col gap-3 hover:border-white/10 transition-colors"');

  content = content.replace(/<div className="flex bg-navy-dark\/50 p-1 rounded-xl shrink-0 w-full md:w-auto">/g,
    '<div className="grid grid-cols-3 gap-2 sm:gap-3 w-full shrink-0">');

  // Let's modify buttons in tajam
  content = content.replace(/className={`px-4 sm:px-6 py-2 rounded-xl text-\[10px\] font-bold uppercase tracking-widest transition-all \${/g, 
    'className={`py-3 px-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all border ${');
    
  // And in limbah medis
  content = content.replace(/className={`flex-1 md:w-20 py-2 rounded-lg text-xs font-bold transition-all \${(.*?) \? (.*?) : (.*?)}`}/g, 
    'className={`py-3 px-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all border ${$1 ? $2 : $3}`}');

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log('Updated ' + file);
  }
});
