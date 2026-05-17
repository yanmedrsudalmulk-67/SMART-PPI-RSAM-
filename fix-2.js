const fs = require('fs');

const files2 = [
  'src/pages/dashboard/input/penatalaksanaan-linen.tsx',
  'src/pages/dashboard/input/penempatan-pasien.tsx',
  'src/pages/dashboard/input/pengelolaan-limbah-medis.tsx',
  'src/pages/dashboard/input/pengendalian-lingkungan.tsx',
  'src/pages/dashboard/input/penyuntikan-aman.tsx',
  'src/pages/dashboard/input/perlindungan-petugas.tsx'
];

files2.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    
    const search = /<button[^>]*?onClick=\{\(\) => (?:handleSelection|setChecklist|handleActionClick)\([^,]+,\s*choice as any\)\}[^>]*?>[\s\S]*/;

    const dataNameMatch = content.match(/const \[([a-zA-Z0-9_]+), set(?!Waktu|Observer|Unit|Date)\w+\] = useState<Record<string, /);
    let dataName = dataNameMatch ? dataNameMatch[1] : 'data';
    if(f.includes('penatalaksanaan-linen')) dataName = 'data';
    if(f.includes('penempatan-pasien')) dataName = 'data';
    if(f.includes('pengelolaan-limbah-medis')) dataName = 'checklist';
    if(f.includes('pengelolaan-limbah-tajam')) dataName = 'checklist';
    if(f.includes('pengendalian-lingkungan')) dataName = 'data';
    if(f.includes('penyuntikan-aman')) dataName = 'data';
    if(f.includes('perlindungan-petugas')) dataName = 'data';

    // Different files might have different parameter names in array map, mostly item.id or apd.id
    // But we can just capture the EXACT original button before replacing it! Wait, we deleted it!
    // Let's use generic replacement suitable for these loops.
    // They are all inside `map(item =>` or `map(item, idx =>` and inner is `map(choice =>`

    const replaceText = `<button key={choice} type="button" onClick={() => (typeof handleActionClick === 'function' ? handleActionClick : (typeof setChecklist === 'function' ? (id, c) => setChecklist(prev => ({...prev, [id]: c})) : handleSelection))(item.id || item.key || item, choice as any)}
                      className={\`py-3 flex-1 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border \${
                        ${dataName}[item.id || item.key || item] === choice ? 'bg-blue-600 text-white border-blue-500' : 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10'
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
          totalDinilai={stats.dinilai || stats.totalEvaluasi || stats.peluang || 0} 
          totalPatuh={stats.patuh || 0} 
          totalTidakPatuh={(stats.dinilai || stats.totalEvaluasi || stats.peluang || 0) - (stats.patuh || 0)}
          persentase={stats.persentase || 0} 
          statusText={stats.statusText || 'Belum Dinilai'}
        />

        <button type="submit" disabled={isSubmitting}
          className="w-full flex justify-center items-center gap-4 py-5 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-widest rounded-2xl transition-all shadow-lg disabled:opacity-50"
        >
          {isSubmitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          <span>Simpan Data Audit</span>
        </button>
      </div>
      </form>
    </div>
  );
}

// Ensure layout
function getDashboardLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
}
`;
    
    if (search.test(content)) {
      content = content.replace(search, replaceText);
      const matchExport = content.match(/export default function ([A-Za-z0-9_]+)/);
      if (matchExport) {
        content = content.replace(/\/\/ Ensure layout[\s\S]*/, `${matchExport[1]}.getLayout = function getLayout(page: React.ReactElement) {\n  return <DashboardLayout>{page}</DashboardLayout>;\n};\n`);
      }
      fs.writeFileSync(f, content);
      console.log(`Fixed ${f}`);
    }
  }
});
