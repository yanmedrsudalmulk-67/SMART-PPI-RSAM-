const fs = require('fs');

const fixFiles = [
  'src/pages/dashboard/input/diklat.tsx',
  'src/pages/dashboard/input/monitoring-airborne.tsx',
  'src/pages/dashboard/input/monitoring-ambulance.tsx',
  'src/pages/dashboard/input/monitoring-cssd.tsx',
  'src/pages/dashboard/input/monitoring-fasilitas_apd.tsx',
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

fixFiles.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');

    // Fix imports
    if (content.includes('AnimatePresence') && !content.includes('AnimatePresence')) {
      content = content.replace(/import {([^}]+)} from 'framer-motion';/, "import { $1, AnimatePresence } from 'framer-motion';");
      content = content.replace(/import {([^}]+)} from 'motion\/react';/, "import { $1, AnimatePresence } from 'motion/react';");
    }
    if (content.includes('RefreshCw') && !content.includes('RefreshCw,')) {
      content = content.replace(/import {([^}]+)} from 'lucide-react';/, "import { $1, RefreshCw } from 'lucide-react';");
    }
    if (content.includes('User ') || content.includes('<User ')) {
        if (!content.includes('User,')) {
            content = content.replace(/import {([^}]+)} from 'lucide-react';/, "import { $1, User } from 'lucide-react';");
        }
    }

    // Fix tags for CSSD, Gizi, Jenazah, Radiologi, etc
    if (f.includes('cssd') || f.includes('gizi') || f.includes('jenazah') || f.includes('radiologi')) {
        let replaceText = `          </label>
            <div className="relative">
              <select value={observer} onChange={(e) => setObserver(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white appearance-none outline-none focus:border-blue-500/50">
                <option value="">Pilih Supervisor...</option>
                {observers.map(o => <option key={o.id} value={o.nama}>{o.nama}</option>)}
              </select>
            </div>
          </div>
        </div>
        </div>

        <div className="bg-white/5 p-6 rounded-[24px] border border-white/5">`;
        
        let targetText = `          </label>
            <div className="relative">
              <select value={observer} onChange={(e) => setObserver(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white appearance-none outline-none focus:border-blue-500/50">
                <option value="">Pilih Supervisor...</option>
                {observers.map(o => <option key={o.id} value={o.nama}>{o.nama}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white/5 p-6 rounded-[24px] border border-white/5">`;

        content = content.replace(targetText, replaceText);
    }
    
    // Some are missing `</div>` entirely at the end of the form. Let's just fix them individually!
    fs.writeFileSync(f, content);
  }
});
