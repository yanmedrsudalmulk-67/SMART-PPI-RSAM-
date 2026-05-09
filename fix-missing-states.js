const fs = require('fs');
const path = require('path');

const files = [
  'app/dashboard/input/dekontaminasi-alat/page.tsx',
  'app/dashboard/input/etika-batuk/page.tsx',
  'app/dashboard/input/monitoring-airborne/page.tsx',
  'app/dashboard/input/monitoring-ambulance/page.tsx',
  'app/dashboard/input/monitoring-cssd/page.tsx',
  'app/dashboard/input/monitoring-farmasi/page.tsx',
  'app/dashboard/input/monitoring-fasilitas_apd/page.tsx',
  'app/dashboard/input/monitoring-fasilitas_hh/page.tsx',
  'app/dashboard/input/monitoring-gizi/page.tsx',
  'app/dashboard/input/monitoring-ibs/page.tsx',
  'app/dashboard/input/monitoring-immuno/page.tsx',
  'app/dashboard/input/monitoring-isolasi/page.tsx',
  'app/dashboard/input/monitoring-jenazah/page.tsx',
  'app/dashboard/input/monitoring-laboratorium/page.tsx',
  'app/dashboard/input/monitoring-radiologi/page.tsx',
  'app/dashboard/input/monitoring-ruang_isolasi/page.tsx',
  'app/dashboard/input/monitoring-tps/page.tsx',
  'app/dashboard/input/monitoring-tunggu/page.tsx',
  'app/dashboard/input/penatalaksanaan-linen/page.tsx',
  'app/dashboard/input/penempatan-pasien/page.tsx',
  'app/dashboard/input/pengelolaan-limbah-medis/page.tsx',
  'app/dashboard/input/pengelolaan-limbah-tajam/page.tsx',
  'app/dashboard/input/pengendalian-lingkungan/page.tsx',
  'app/dashboard/input/penyuntikan-aman/page.tsx',
  'app/dashboard/input/perlindungan-petugas/page.tsx'
];

files.forEach(filePath => {
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // 1. Add Imports
  if (!content.includes('DocumentationUploader')) {
    content = content.replace(/import {[^}]*useState[^}]*} from 'react';/, (m) => m + "\nimport { DocumentationUploader, DocImage } from '@/components/DocumentationUploader';");
    changed = true;
  }
  if (!content.includes('uploadImagesToSupabase')) {
    content = content.replace(/import { getSupabase } from '@\/lib\/supabase';/, "import { getSupabase } from '@/lib/supabase';\nimport { uploadImagesToSupabase } from '@/lib/upload';");
    changed = true;
  }

  // 2. Add States
  if (!content.includes('const [images, setImages]')) {
    content = content.replace(/export default function .*{/, (m) => m + `
  const [images, setImages] = useState<DocImage[]>([]);
  const [temuan, setTemuan] = useState('');
  const [rekomendasi, setRekomendasi] = useState('');`);
    changed = true;
  }

  // 3. Add UI Section
  // We want to insert it before the Signatures or before the Button Submit.
  // Many of these files have {/* SECTION: TANDA TANGAN */} or {/* BUTTON SIMPAN */}
  const uiSection = `
        {/* SECTION: TEMUAN & DOKUMENTASI */}
        <div className="glass-card p-6 sm:p-8 rounded-[2rem] border-white/5 shadow-xl space-y-8">
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 font-heading">
              Temuan & Rekomendasi
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">Temuan Lapangan</label>
                <textarea 
                  value={temuan}
                  onChange={(e) => setTemuan(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all min-h-[100px]"
                  placeholder="Deskripsikan temuan di lapangan..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">Rekomendasi / Rencana Tindak Lanjut</label>
                <textarea 
                  value={rekomendasi}
                  onChange={(e) => setRekomendasi(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all min-h-[100px]"
                  placeholder="Berikan rekomendasi perbaikan..."
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 font-heading">
              Dokumentasi Visual
            </h2>
            <DocumentationUploader 
              images={images} 
              onImagesChange={setImages}
              maxImages={4}
            />
          </div>
        </div>
`;

  if (!content.includes('SECTION: TEMUAN & DOKUMENTASI')) {
    if (content.includes('{/* SECTION: TANDA TANGAN */}')) {
      content = content.replace('{/* SECTION: TANDA TANGAN */}', uiSection + '\n        {/* SECTION: TANDA TANGAN */}');
      changed = true;
    } else if (content.includes('{/* BUTTON SIMPAN */}')) {
      content = content.replace('{/* BUTTON SIMPAN */}', uiSection + '\n        {/* BUTTON SIMPAN */}');
      changed = true;
    } else if (content.includes('<div className="pt-4">')) {
       content = content.replace('<div className="pt-4">', uiSection + '\n        <div className="pt-4">');
       changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log('Fixed', filePath);
  }
});
