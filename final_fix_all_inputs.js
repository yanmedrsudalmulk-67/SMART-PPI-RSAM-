const fs = require('fs');

const filesToFix = [
  'app/dashboard/input/hand-hygiene/page.tsx',
  'app/dashboard/input/etika-batuk/page.tsx',
  'app/dashboard/input/monitoring-fasilitas_apd/page.tsx',
  'app/dashboard/input/penempatan-pasien/page.tsx',
  'app/dashboard/input/pengelolaan-limbah-medis/page.tsx',
  'app/dashboard/input/pengendalian-lingkungan/page.tsx',
  'app/dashboard/input/perlindungan-petugas/page.tsx'
];

const observerUI = `
              <div className="space-y-4">
                <div className="flex justify-between items-end mb-2">
                  <h2 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1">
                    <User className="w-3.5 h-3.5 text-blue-400" /> Observer
                  </h2>
                </div>
                <div className="relative group">
                  <select 
                    value={observer}
                    onChange={(e) => setObserver(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-4 text-sm text-white outline-none focus:border-blue-500/50 appearance-none transition-all pr-10 hover:bg-white/8 cursor-pointer"
                    required
                  >
                    <option value="" className="bg-navy-dark text-slate-400">Pilih Observer...</option>
                    {observers.map(o => (
                      <option key={o.id || o.nama} value={o.nama} className="bg-navy-dark">
                        {o.nama}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none group-hover:scale-110 transition-transform">
                    <User className="w-4 h-4 text-slate-500" />
                  </div>
                </div>
              </div>`;

const unitUI = `
              <div className="space-y-4">
                <div className="flex justify-between items-end mb-2">
                  <h2 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1">
                    <Building2 className="w-3.5 h-3.5 text-blue-400" /> Unit Kerja
                  </h2>
                  {isIPCN && (
                    <button 
                      type="button" 
                      onClick={() => setIsUnitModalOpen(true)}
                      className="text-purple-400 hover:text-white transition-colors p-1.5 bg-white/5 hover:bg-white/10 rounded-lg shadow-sm" 
                      title="Kelola Unit"
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="relative group">
                  <select 
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-4 text-sm text-white outline-none focus:border-blue-500/50 appearance-none transition-all pr-10 hover:bg-white/8 cursor-pointer"
                    required
                  >
                    <option value="" className="bg-navy-dark text-slate-400">Pilih Unit...</option>
                    {units.map(u => <option key={u.id || u.nama} value={u.nama} className="bg-navy-dark">{u.nama}</option>)}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none group-hover:scale-110 transition-transform">
                    <Building2 className="w-4 h-4 text-slate-500" />
                  </div>
                </div>
              </div>`;

filesToFix.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');

  // Hard restore the identity section
  // Look for the glass card that supposedly contains identity
  // The most common pattern is that it currently contains ONLY the broken Unit UI
  const identitySectionRegex = /<div className="glass-card[^>]*?>[\s\S]*?(?:WAKTU OBSERVASI|IDENTITAS|Data Subjek)[\s\S]*?<div className="space-y-4">[\s\S]*?Unit Kerja[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
  
  // Actually, let's use a simpler marker. Most failed files have this pattern now:
  // <div className="space-y-4"> ... Unit Kerja ... </div> </div> </div>
  
  const unitBlockRegex = /<div className="space-y-4">\s*<div className="flex justify-between items-end mb-2">\s*<h2[^>]*?>[\s\S]*?Unit Kerja[\s\S]*?<\/div>\s*<div className="relative group">[\s\S]*?<\/div>\s*<\/div>/;
  
  if (content.match(unitBlockRegex)) {
     const newIdentityContent = `
            <div className="grid sm:grid-cols-2 gap-6">
              ${observerUI}
              ${unitUI}
            </div>`;

     // Find where it is and replace it. 
     // We also need to make sure we don't include too many closing divs.
     // In most files it was:
     // <div ... glass-card> <div ... space-y-4 (Unit)> ... </div> </div>
     
     // Let's replace the whole block including its parent container if it was messed up.
     // For hand-hygiene it's different.
     
     if (file.includes('hand-hygiene')) {
        // Hand hygiene had Observer and Unit already but redundant divs
        // Let's just use the linter's suggestion to find what's wrong.
     } else {
        content = content.replace(unitBlockRegex, newIdentityContent);
     }
  }

  // Final sanity check for imbalanced tags
  const returnBlock = content.match(/return\s*\(\s*([\s\S]*?)\s*\)\s*;\s*}/);
  if (returnBlock) {
     let block = returnBlock[1];
     // Count tags
     const count = (tag) => (block.match(new RegExp(tag, 'g')) || []).length;
     
     let openDivs = count('<div');
     let closeDivs = count('</div>');
     let openForms = count('<form');
     let closeForms = count('</form>');
     let openAnimate = count('<AnimatePresence');
     let closeAnimate = count('</AnimatePresence>');

     console.log(`${file}: D:${openDivs}/${closeDivs} F:${openForms}/${closeForms} A:${openAnimate}/${closeAnimate}`);

     if (openForms > closeForms) {
        if (block.includes('{/* UNIT MODAL */}')) {
           block = block.replace('{/* UNIT MODAL */}', '</form>\n\n      {/* UNIT MODAL */}');
        } else if (block.includes('<AnimatePresence>')) {
           block = block.replace('<AnimatePresence>', '</form>\n\n      <AnimatePresence>');
        } else {
           block = block + '\n      </form>';
        }
     }
     
     if (openAnimate > closeAnimate) {
        block = block + '\n      </AnimatePresence>'.repeat(openAnimate - closeAnimate);
     }

     openDivs = (block.match(/<div/g) || []).length;
     closeDivs = (block.match(/<\/div>/g) || []).length;
     
     if (openDivs > closeDivs) {
        block = block + '\n      </div>'.repeat(openDivs - closeDivs);
     } else if (closeDivs > openDivs) {
        for (let i = 0; i < (closeDivs - openDivs); i++) {
           block = block.replace(/<\/div>\s*$/, '');
        }
     }
     
     content = content.replace(returnBlock[1], block);
  }

  fs.writeFileSync(file, content, 'utf8');
});
