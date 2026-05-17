const fs = require('fs');
const files = [
  'src/pages/dashboard/input/monitoring-airborne.tsx',
  'src/pages/dashboard/input/monitoring-ambulance.tsx',
  'src/pages/dashboard/input/monitoring-cssd.tsx',
  'src/pages/dashboard/input/monitoring-fasilitas_apd.tsx',
  'src/pages/dashboard/input/monitoring-fasilitas_hh.tsx',
  'src/pages/dashboard/input/monitoring-gizi.tsx',
  'src/pages/dashboard/input/monitoring-ibs.tsx',
  'src/pages/dashboard/input/monitoring-jenazah.tsx',
  'src/pages/dashboard/input/monitoring-laboratorium.tsx',
  'src/pages/dashboard/input/monitoring-radiologi.tsx',
  'src/pages/dashboard/input/penatalaksanaan-linen.tsx',
  'src/pages/dashboard/input/penempatan-pasien.tsx',
  'src/pages/dashboard/input/pengelolaan-limbah-medis.tsx',
  'src/pages/dashboard/input/pengendalian-lingkungan.tsx',
  'src/pages/dashboard/input/penyuntikan-aman.tsx',
  'src/pages/dashboard/input/perlindungan-petugas.tsx'
];

const matchRegex = /<button[^>]*?onClick=\{\(\) => setIsObserverModalOpen\(true\)\}[^>]*?>[\s\S]*/;

const replaceText = `<button type="button" onClick={() => setIsObserverModalOpen(true)} className="text-blue-400 hover:text-blue-300 font-bold uppercase tracking-widest flex items-center gap-1"><User className="w-3 h-3" /> Tambah / Kelola</button>
            </label>
            <div className="relative">
              <select value={observer} onChange={(e) => setObserver(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white appearance-none outline-none focus:border-blue-500/50">
                <option value="">Pilih Supervisor...</option>
                {observers.map(o => <option key={o.id} value={o.nama}>{o.nama}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white/5 p-6 rounded-[24px] border border-white/5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">📋 Indikator Kepatuhan</h2>
          <div className="space-y-4">
            {checklistItems.map(item => (
              <div key={item.id} className="bg-white/5 p-6 rounded-[24px] border border-white/5">
                <h3 className="text-sm font-bold text-white mb-4">{item.label}</h3>
                <div className="grid grid-cols-3 gap-3">
                  {['ya', 'tidak', 'na'].map(choice => (
                    <button type="button" key={choice} onClick={() => handleActionClick(item.id, choice as any)}
                      className={\`py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border \${
                        data[item.id] === choice ? 'bg-blue-600 text-white border-blue-500' : 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10'
                      }\`}
                    >
                      {choice === 'na' ? 'N/A' : choice}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <LiveStatisticsCard 
          totalDinilai={stats.dinilai} totalPatuh={stats.patuh} totalTidakPatuh={stats.dinilai - stats.patuh}
          persentase={stats.persentase} statusText={stats.statusText}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm">
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">📝 Temuan Audit</h2>
                <textarea value={temuan} onChange={e => setTemuan(e.target.value)} placeholder="Tuliskan temuan audit..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white h-32 outline-none focus:border-blue-500/50 transition-colors placeholder:text-slate-600"/>
            </div>
            <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm">
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">💡 Rekomendasi</h2>
                <textarea value={rekomendasi} onChange={e => setRekomendasi(e.target.value)} placeholder="Tuliskan rekomendasi tindak lanjut..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white h-32 outline-none focus:border-blue-500/50 transition-colors placeholder:text-slate-600"/>
            </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl p-6 sm:p-8 rounded-[2.5rem] border border-white/5 shadow-sm">
          <DocumentationUploader images={images} setImages={setImages} />
        </div>

        <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">✍️ TANDA TANGAN DIGITAL</h2>
            <DigitalSignatureSection ref={sigRef} pjName={pjName} setPjName={setPjName} pjLabel="PJ RUANGAN" />
        </div>

        <button type="submit" disabled={isSubmitting || !observer || stats.dinilai === 0}
          className="w-full flex justify-center items-center gap-4 py-5 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-widest rounded-2xl transition-all shadow-lg disabled:opacity-50"
        >
          {isSubmitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          <span>Simpan Data Audit</span>
        </button>
      </form>

      <AnimatePresence>
        {isObserverModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsObserverModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-[2rem] p-8 overflow-hidden">
               <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white uppercase tracking-widest flex items-center gap-3">Kelola Supervisor</h3>
                <button type="button" onClick={() => setIsObserverModalOpen(false)} className="p-2 text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex gap-2 mb-6 text-white">
                <input type="text" value={newObserverName} onChange={(e) => setNewObserverName(e.target.value)} placeholder="Nama Supervisor..." className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none" />
                <button type="button" onClick={saveObserver} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase hover:bg-blue-500">{editObserverId ? 'OK' : '+'}</button>
              </div>
              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {observers.map(o => (
                  <div key={o.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl">
                    <span className="text-sm font-medium text-slate-300">{o.nama}</span>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => { setNewObserverName(o.nama); setEditObserverId(o.id); }} className="p-2 text-slate-500 hover:text-blue-400"><Settings className="w-4 h-4" /></button>
                      <button type="button" onClick={() => deleteObserver(o.id)} className="p-2 text-slate-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Get proper layout
function getDashboardLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
}
`;

files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    if (matchRegex.test(content)) {
      content = content.replace(matchRegex, replaceText);
      // Let's ensure getLayout matches the file exported function name normally
      const matchExport = content.match(/export default function ([A-Za-z0-9_]+)/);
      if (matchExport) {
        content = content.replace(/\/\/ Get proper layout[\s\S]*/, `${matchExport[1]}.getLayout = function getLayout(page: React.ReactElement) {\n  return <DashboardLayout>{page}</DashboardLayout>;\n};\n`);
      }
      fs.writeFileSync(f, content);
      console.log(`Fixed ${f}`);
    }
  }
});
