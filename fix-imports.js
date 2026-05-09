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
  'app/dashboard/input/perlindungan-petugas/page.tsx',
  'app/dashboard/input/bundles/[bundleId]/page.tsx'
];

files.forEach(filePath => {
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // 1. Add missing imports
  if (!content.includes("from '@/lib/upload'")) {
    // try to find where to insert
    if (content.includes("from '@/lib/supabase'")) {
        content = content.replace("from '@/lib/supabase';", "from '@/lib/supabase';\nimport { uploadImagesToSupabase } from '@/lib/upload';");
        changed = true;
    } else {
        // insert at top
        content = content.replace("'use client';", "'use client';\nimport { uploadImagesToSupabase } from '@/lib/upload';");
        changed = true;
    }
  }

  if (!content.includes('DocumentationUploader') && !content.includes("from '@/components/DocumentationUploader'")) {
     content = content.replace(/import {[^}]*useState[^}]*} from 'react';/, (m) => m + "\nimport { DocumentationUploader, DocImage } from '@/components/DocumentationUploader';");
     changed = true;
  }

  // 2. Ensure types are available if DocImage is used
  if (content.includes('DocImage') && !content.includes("from '@/components/DocumentationUploader'")) {
    content = content.replace(/import { uploadImagesToSupabase } from '@\/lib\/upload';/, "import { uploadImagesToSupabase } from '@/lib/upload';\nimport { DocumentationUploader, DocImage } from '@/components/DocumentationUploader';");
    changed = true;
  }

  // 3. Add states if missing
  if (!content.includes('const [images, setImages]')) {
    content = content.replace(/export default function .*{/, (m) => m + `
  const [images, setImages] = useState<DocImage[]>([]);
  const [temuan, setTemuan] = useState('');
  const [rekomendasi, setRekomendasi] = useState('');`);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log('Fixed imports/states in', filePath);
  }
});
