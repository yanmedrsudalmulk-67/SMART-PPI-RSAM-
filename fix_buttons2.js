const fs = require('fs');
const glob = require('glob');

const files = glob.sync('app/dashboard/input/**/*.tsx');

files.forEach(file => {
  if (file.includes('dekontaminasi-alat') || file.includes('apd') || file.includes('hand-hygiene')) return;
  
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // We are looking for the wrapper of Ya, Tidak, NA buttons.
  // We can do this by regexing the entire button group block:
  // <div className="flex .*?">\s*<button.*?>Ya<\/button>\s*<button.*?>Tidak<\/button>\s*<button.*?>N\/A<\/button>\s*<\/div>
  const groupRegex = /<div className="flex[^"]*">(\s*<button[^>]*?>\s*(?:Ya|Melakukan)\s*<\/button>\s*<button[^>]*?>\s*(?:Tidak|Tidak Melakukan)\s*<\/button>\s*<button[^>]*?>\s*N\/A\s*<\/button>\s*)<\/div>/g;
  
  // Actually, some labels are inside or spread over lines. Let's just find the flex div that contains Ya, Tidak, N/A and change it to the grid.
  
  // A cleaner approach: look for files that have 'Ya', 'Tidak'
  if (content.includes('Tidak') || content.includes('Ya')) {
     
     // 1. Convert `<div className="flex ...">` that has exactly 3 buttons into grid
     let segments = content.split('<div className="flex');
     for (let i = 1; i < segments.length; i++) {
        let closingIndex = segments[i].indexOf('</div>');
        let block = segments[i].substring(0, closingIndex);
        
        let buttonCount = (block.match(/<button/g) || []).length;
        if (buttonCount === 3 && (block.includes('>Ya<') || block.includes('Ya') || block.includes('Melakukan')) && (block.includes('Tidak') || block.includes('N/A'))) {
           // We found the block! Replace it.
           // Replace the first ' ...">' with ' grid grid-cols-3 gap-2 sm:gap-3 w-full shrink-0">'
           segments[i] = segments[i].replace(/^[^>]*>/, ' grid grid-cols-3 gap-2 sm:gap-3 w-full shrink-0">');
           
           // Replace all `className="..."` inside buttons with the uniform class
           // Wait, we need the dynamic parts
           
           // Simple replacement inside the block:
           // Replace `className={XYZ}` with `className={`py-3 px-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all border ${... ? 'bg-blue-600/20 text-blue-400 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10'}`}`
           
           // Actually, let's just make the button classes:
           // `className={`py-3 px-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all border ${ data[item.id] === 'ya' ? ... }`}`
           // This is too complex to script blindly without parsing AST or exactly matching.
           // Let's use simple regex on the buttons.
           let btnRegex = /<button[\s\S]*?onClick=\{\(\) => [a-zA-Z]+\(([^,]+), '([^']+)'\)\}[\s\S]*?>\s*(Ya|Tidak|N\/A|Melakukan|Tidak Melakukan)\s*<\/button>/g;
           
           segments[i] = segments[i].replace(btnRegex, (match, idStr, valStr, labelStr) => {
              let colorClass = '';
              if (valStr === 'ya' || valStr === 'melakukan') {
                 colorClass = `'bg-blue-600/20 text-blue-400 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]'`;
              } else if (valStr === 'tidak' || valStr === 'tidak_melakukan') {
                 colorClass = `'bg-red-600/20 text-red-400 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]'`;
              } else if (valStr === 'na') {
                 colorClass = `'bg-slate-600/20 text-slate-300 border-slate-500/50'`;
              } else {
                 return match;
              }
              
              // find the map data var name, e.g. `data[item.id]`
              // let's just look at what's in the if condition or just assume `data[${idStr}]` or `data[item.id]`
              // Actually, the original is already using something. Let's just capture the condition statement
              // `data[item.id] === 'ya'` or `data[item.key] === 'ya'`
              // The `idStr` is literally `item.id`, so we can just use `data[${idStr}] === '${valStr}'`
              // Wait, what if the state variable is something else? In penyuntikan aman it's `data`.
              
           });
        }
     }
  }

  // A safer approach string-by-string:
  // Instead of replacing the JS buttons, let's just replace the wrapper for now. The buttons will stretch if the wrapper is a grid!
  
  let newContent = content.replace(/<div className="flex [^"]*?p-1[^"]*w-[^"]*">/g, (m) => {
      if (m.includes('shrink-0') || m.includes('w-full') || m.includes('p-[0px]')) {
         return '<div className="grid grid-cols-3 gap-2 sm:gap-3 w-full shrink-0">';
      }
      return m;
  });
  
  // Look at penyuntikan-aman: `<div className="flex p-1 bg-white/5 rounded-xl border border-white/10 w-full shadow-inner">`
  newContent = newContent.replace(/<div className="flex p-1 bg-white\/5 rounded-xl border border-white\/10 w-full shadow-inner">/g, 
         '<div className="grid grid-cols-3 gap-2 sm:gap-3 w-full shrink-0">');

  // Let's replace button classNames to look great if they are stretched.
  // In penyuntikan-aman:
  // className={`flex-1 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
  //                      data[item.id] === 'ya' ? 'bg-blue-600 text-white shadow-lg grow' : 'text-slate-500 hover:text-slate-300'
  //                    }`}
  newContent = newContent.replace(/className={`flex-1 py-3 rounded-lg text-\[10px\] font-bold uppercase tracking-widest transition-all \${(.*?) \? (.*?) : (.*?)}`}/gs, 
    'className={`py-3 px-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all border ${$1 ? $2 : $3}`}');

  // Let's replace the `bg-blue-600` inside those with `bg-blue-600/20 text-blue-400 border-blue-500/50` to match dekontaminasi
  newContent = newContent.replace(/'bg-blue-600 text-white shadow-lg(?: grow)?'/g, "'bg-blue-600/20 text-blue-400 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]'");
  newContent = newContent.replace(/'bg-red-500 text-white shadow-lg(?: grow)?'/g, "'bg-red-600/20 text-red-400 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]'");
  newContent = newContent.replace(/'bg-slate-600 text-white shadow-lg(?: grow)?'/g, "'bg-slate-600/20 text-slate-300 border-slate-500/50'");
  newContent = newContent.replace(/'text-slate-500 hover:text-slate-300'/g, "'bg-white/5 text-slate-400 border-transparent hover:bg-white/10'");
  newContent = newContent.replace(/'text-slate-400 hover:text-white hover:bg-white\/5'/g, "'bg-white/5 text-slate-400 border-transparent hover:bg-white/10'");

  if (newContent !== originalContent) {
    fs.writeFileSync(file, newContent);
    console.log('Updated ' + file);
  }
});
