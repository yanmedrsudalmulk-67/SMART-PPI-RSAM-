const fs = require('fs');
const glob = require('glob');

const files = glob.sync('app/dashboard/input/**/*.tsx');

files.forEach(file => {
  // Skip ones that are already grid or different formats (like hand-hygiene)
  if (file.includes('dekontaminasi-alat') || file.includes('apd') || file.includes('hand-hygiene')) return;
  
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // We are looking for something like:
  // <div className="flex p-1.5 bg-white/5 rounded-2xl border border-white/10 w-fit shrink-0">
  // <button ... Ya, Tidak, N/A ...
  
  content = content.replace(/<div className="flex (?:p-1\.5 |bg-navy-dark\/50 p-1 ).*?shrink-0.*?">(.*?)<\/div>/gs, 
    '<div className="grid grid-cols-3 gap-2 sm:gap-3 w-full sm:w-auto shrink-0">$1</div>');

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log('Updated ' + file);
  }
});
