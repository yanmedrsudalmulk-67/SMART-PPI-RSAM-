const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'reports', 'OfficialReportSheet.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Fix 1: Remove unused `import Image` if still there
content = content.replace(/^import Image from 'next\/image';\r?\n/m, '');

// Fix 2: Replace perbaikan images block - old pattern uses <Image .../>
const oldPerbaikan = `                 {perbaikanImages.map((url, i) => (
                   <div key={i} onClick={() => setZoomedImage(url)} className="relative pt-[75%] border-2 border-amber-500 bg-white p-1 cursor-zoom-in rounded-lg overflow-hidden shadow-sm">
                     <Image src={url} alt="Foto Upaya Perbaikan" fill sizes="50vw" className="absolute inset-0 w-full h-full object-cover p-1" referrerPolicy="no-referrer" />
                   </div>
                 ))}`;

const newPerbaikan = `                 {perbaikanImages.map((url, i) => {
                   const normalizedP = normalizeImageUrl(url);
                   return (
                     <div key={i} onClick={() => setZoomedImage(normalizedP)} className="relative pt-[75%] border-2 border-amber-500 bg-white p-1 cursor-zoom-in rounded-lg overflow-hidden shadow-sm">
                       {/* eslint-disable-next-line @next/next/no-img-element */}
                       <img src={normalizedP} alt={\`Foto Perbaikan \${i+1}\`}
                         className="absolute inset-0 w-full h-full object-cover p-1" loading="lazy"
                         onError={(e) => { e.currentTarget.style.display = "none"; }} />
                     </div>
                   );
                 })}`;

// Also try with ttd images
const oldTtdPj = `{data.ttd_pj && <Image src={data.ttd_pj} fill sizes="200px" className="object-contain filter brightness-0" alt="TTD PJ" referrerPolicy="no-referrer" />}`;
const newTtdPj = `{data.ttd_pj && <img src={normalizeImageUrl(data.ttd_pj)} className="w-full h-full object-contain filter brightness-0" alt="TTD PJ" />}`;

const oldTtdIpcn = `{data.ttd_ipcn && <Image src={data.ttd_ipcn} fill sizes="200px" className="object-contain filter brightness-0" alt="TTD IPCN" referrerPolicy="no-referrer" />}`;
const newTtdIpcn = `{data.ttd_ipcn && <img src={normalizeImageUrl(data.ttd_ipcn)} className="w-full h-full object-contain filter brightness-0" alt="TTD IPCN" />}`;

let changed = false;

if (content.includes(oldPerbaikan)) {
  content = content.replace(oldPerbaikan, newPerbaikan);
  console.log('✅ Fixed perbaikan images');
  changed = true;
} else {
  console.log('⚠️  perbaikan images pattern not found, trying flexible match...');
  // Try with different whitespace
  const flexMatch = content.match(/\{perbaikanImages\.map\(\(url, i\) => \([\s\S]*?\)\)\}/);
  if (flexMatch) {
    console.log('Found flexible match:', flexMatch[0].substring(0, 100));
  }
}

if (content.includes(oldTtdPj)) {
  content = content.replace(oldTtdPj, newTtdPj);
  console.log('✅ Fixed TTD PJ image');
  changed = true;
} else {
  console.log('⚠️  TTD PJ pattern not found');
}

if (content.includes(oldTtdIpcn)) {
  content = content.replace(oldTtdIpcn, newTtdIpcn);
  console.log('✅ Fixed TTD IPCN image');
  changed = true;
} else {
  console.log('⚠️  TTD IPCN pattern not found');
}

// Check if any Image tags remain
const imageMatches = content.match(/<Image\s/g);
if (imageMatches) {
  console.log(`⚠️  Still ${imageMatches.length} <Image> tags remaining`);
  // Find them
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    if (line.includes('<Image')) {
      console.log(`  Line ${i+1}: ${line.trim()}`);
    }
  });
} else {
  console.log('✅ No more <Image> tags - all converted');
}

if (changed) {
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('✅ File saved');
}
