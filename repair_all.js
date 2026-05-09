const fs = require('fs');

const files = [
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

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  console.log('Repairing ' + file);
  let content = fs.readFileSync(file, 'utf8');

  // Hard replace from Card Start to Checklist Start
  const cardStart = /\{[\/*]\s*(?:IDENTITAS|CARD INPUT UTAMA|WAKTU OBSERVASI|CARD INPUT UMUM|Data Subjek)\s*[\/*]\}[\s\S]*?<div[^>]*?>/;
  const checklistStart = /\{[\/*]\s*(?:CHECKLIST|SECTION: CEKLIST|Ceklist)\s*[\/*]\}/;
  
  const startMatch = content.match(cardStart);
  const endMatch = content.match(checklistStart);
  
  if (startMatch && endMatch) {
     const before = content.substring(0, startMatch.index + startMatch[0].length);
     const after = content.substring(endMatch.index);
     
     const middle = `
          <div className="grid sm:grid-cols-2 gap-6">
            ${observerUI}
            ${unitUI}
          </div>
        </div>

        `;
     content = before + middle + after;
  }

  // Fix form
  if (content.includes('<form') && !content.includes('</form>')) {
     content = content.replace('{/* UNIT MODAL */}', '</form>\n\n      {/* UNIT MODAL */}');
     content = content.replace('{/* OBSERVER MODAL */}', '</form>\n\n      {/* OBSERVER MODAL */}');
  }
  
  // Tag balancer (D: open/close)
  // We'll trust the manual fixed structure more now.
  
  fs.writeFileSync(file, content, 'utf8');
});
