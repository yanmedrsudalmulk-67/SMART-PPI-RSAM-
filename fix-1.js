const fs = require('fs');

const files = [
  {
    path: 'src/pages/dashboard/input/apd.tsx',
    search: /<button[^>]*?onClick=\{\(\) => handleActionClick\(apd\.id, choice as any\)\}[^>]*?className="w-full flex justify-center items-center gap-4 py-5 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-widest rounded-2xl transition-all shadow-lg disabled:opacity-50"[\s\S]*/,
    replace: `<button key={choice} onClick={() => handleActionClick(apd.id, choice as any)}
                      className={\`py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border \${
                        apdData[apd.id] === choice ? 'bg-blue-600 text-white border-blue-500' : 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10'
                      }\`}
                    >
                      {choice === 'na' ? 'N/A' : choice}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

        <LiveStatisticsCard 
          totalDinilai={stats.dinilai} totalPatuh={stats.patuh} totalTidakPatuh={stats.dinilai - stats.patuh}
          persentase={stats.persentase} statusText={stats.statusText} title="KEPATUHAN PENGGUNAAN APD"
        />

        <button onClick={handleSubmit} disabled={isSubmitting || !observer || !unit || !profesi || !tindakan || stats.dinilai === 0}
          className="w-full flex justify-center items-center gap-4 py-5 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-widest rounded-2xl transition-all shadow-lg disabled:opacity-50"
        >
          {isSubmitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          <span>Simpan Data Audit</span>
        </button>
      </div>
    </div>
  );
}

InputApdPage.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};`
  }
];

files.forEach(f => {
  let content = fs.readFileSync(f.path, 'utf8');
  if(f.search.test(content)) {
    content = content.replace(f.search, f.replace);
    fs.writeFileSync(f.path, content);
    console.log(`Fixed ${f.path}`);
  }
});
