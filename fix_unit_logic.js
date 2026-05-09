const fs = require('fs');
const glob = require('glob');

const files = glob.sync('app/dashboard/input/**/*.tsx');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // 1. type="button" for all buttons already fixed by previous turn script? 
  // No, I should make sure my new buttons are type="button"

  // 2. staticUnits & type Unit
  if (content.includes('const units = [')) {
    content = content.replace(/const units = \[[\s\S]*?\];/g, `const staticUnits = [
  'IGD', 'ICU', 'IBS', 'Rawat Jalan', 'Ranap Aisyah', 
  'Ranap Fatimah', 'Ranap Khadijah', 'Ranap Usman', 
  'Radiologi', 'Laboratorium', 'Pantry', 'Emergency Kebidanan'
];
type Unit = { id: string; nama: string };`);
  }

  // 3. Unit Management States
  if (content.includes('const [observer, setObserver] = useState') && !content.includes('const [units, setUnits] = useState')) {
     content = content.replace(/(const \[profesi, setProfesi\] = useState\(.*?\);)/, `$1
  
  // Unit Management
  const [units, setUnits] = useState<Unit[]>([]);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');
  const [editUnitId, setEditUnitId] = useState<string | null>(null);`);
  }

  // 4. fetchUnits call in useEffect
  if (content.includes('fetchObservers();') && !content.includes('fetchUnits();')) {
    content = content.replace('fetchObservers();', 'fetchObservers();\n    fetchUnits();');
  }

  // 5. fetchUnits, saveUnit, deleteUnit functions
  if (content.includes('const fetchObservers = async () => {') && !content.includes('const fetchUnits = async () => {')) {
    const unitFunctions = `  const fetchUnits = async () => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.from('master_units').select('*').order('nama');
      if (error) throw error;
      
      if (data && data.length > 0) {
        setUnits(data);
      } else {
        setUnits(staticUnits.map((u, i) => ({ id: \`static-\${i}\`, nama: u })));
      }
    } catch (err) {
      setUnits(staticUnits.map((u, i) => ({ id: \`static-\${i}\`, nama: u })));
    }
  };

  const saveUnit = async () => {
    if (!newUnitName.trim()) return;
    try {
      const supabase = getSupabase();
      if (editUnitId) {
        const oldUnit = units.find(u => u.id === editUnitId);
        if (oldUnit && (typeof unit !== 'undefined' && unit === oldUnit.nama)) {
          setUnit(newUnitName);
        }
        if (!editUnitId.startsWith('static-')) {
          await supabase.from('master_units').update({ nama: newUnitName }).eq('id', editUnitId);
        }
        setUnits(prev => prev.map(u => u.id === editUnitId ? { ...u, nama: newUnitName } : u).sort((a,b) => a.nama.localeCompare(b.nama)));
      } else {
        const { data, error } = await supabase.from('master_units').insert([{ nama: newUnitName }]).select();
        if (!error && data && data.length > 0) {
          setUnits(prev => [...prev, data[0]].sort((a,b) => a.nama.localeCompare(b.nama)));
        } else {
          setUnits(prev => [...prev, { id: 'local-' + Date.now().toString(), nama: newUnitName }].sort((a,b) => a.nama.localeCompare(b.nama)));
        }
      }
      setNewUnitName('');
      setEditUnitId(null);
    } catch (err) {
      console.error('Save unit fallback:', err);
      if (editUnitId) {
        setUnits(prev => prev.map(u => u.id === editUnitId ? { ...u, nama: newUnitName } : u));
      } else {
        setUnits(prev => [...prev, { id: 'local-' + Date.now().toString(), nama: newUnitName }].sort((a,b) => a.nama.localeCompare(b.nama)));
      }
      setNewUnitName('');
      setEditUnitId(null);
    }
  };

  const deleteUnit = async (id: string) => {
    try {
      const supabase = getSupabase();
      if (!id.startsWith('static-') && !id.startsWith('local-')) {
        await supabase.from('master_units').delete().eq('id', id);
      }
      setUnits(prev => prev.filter(u => u.id !== id));
      if (unit === (units.find(u => u.id === id)?.nama)) {
        setUnit('');
      }
    } catch (err) {
      console.error('Delete unit fallback:', err);
      setUnits(prev => prev.filter(u => u.id !== id));
    }
  };

`;
    content = content.replace('const fetchObservers = async () => {', unitFunctions + '  const fetchObservers = async () => {');
  }

  // 6. Update Unit UI selection (BROADER MATCH)
  const unitUIRegex = /<div[^>]*?>\s*(?:<label|<h2)[\s\S]*?Unit[\s\S]*?(?:<\/label>|<\/h2>)\s*<div[^>]*?>\s*<select[\s\S]*?value=\{unit\}[\s\S]*?<\/select>[\s\S]*?<\/div>\s*<\/div>/g;
  
  const newUnitUI = `<div className="space-y-4">
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

  if (content.match(unitUIRegex)) {
    content = content.replace(unitUIRegex, newUnitUI);
  }

  // 7. Append Unit Modal before the last </div>
  const unitModal = `
      {/* UNIT MODAL */}
      <AnimatePresence>
        {isUnitModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsUnitModalOpen(false)}
              className="absolute inset-0 bg-navy-dark/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-navy-light border border-white/10 rounded-[2.5rem] shadow-2xl p-8 overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-purple-400" /> Kelola Unit Kerja
                </h3>
                <button type="button" onClick={() => setIsUnitModalOpen(false)} className="p-2 hover:bg-white/5 rounded-xl text-slate-500"><X className="w-5 h-5" /></button>
              </div>

              <div className="flex gap-2 mb-6">
                <input 
                  type="text" 
                  value={newUnitName}
                  onChange={(e) => setNewUnitName(e.target.value)}
                  placeholder="Nama Unit baru..."
                  disabled={!isIPCN}
                  className="flex-1 bg-navy-dark border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-purple-500/50 disabled:opacity-50"
                  onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); saveUnit(); } }}
                />
                {isIPCN && (
                  <button type="button" 
                    onClick={saveUnit}
                    className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-purple-500"
                  >
                    {editUnitId ? 'Update' : 'Tambah'}
                  </button>
                )}
              </div>

              <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {units.map(u => (
                  <div key={u.id || u.nama} className="flex items-center justify-between p-3 bg-navy-dark border border-white/5 rounded-xl group">
                    <span className="text-sm font-medium text-slate-300">{u.nama}</span>
                    {isIPCN && (
                      <div className="flex gap-1">
                        <button type="button" onClick={() => { setNewUnitName(u.nama); setEditUnitId(u.id); }} className="p-2 text-slate-500 hover:text-purple-400 transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button type="button" onClick={() => deleteUnit(u.id)} className="p-2 text-slate-500 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
`;

  if (content.includes('</AnimatePresence>\n    </div>') && !content.includes('UNIT MODAL')) {
    content = content.replace('      </AnimatePresence>\n    </div>', '      </AnimatePresence>\n' + unitModal + '    </div>');
  } else if (content.includes('</AnimatePresence>\n      </div>') && !content.includes('UNIT MODAL')) {
    // some files might have more indentation
    content = content.replace('      </AnimatePresence>\n      </div>', '      </AnimatePresence>\n' + unitModal + '      </div>');
  }

  if (original !== content) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed Unit logic in ' + file);
  }
});
