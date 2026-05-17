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
  'src/pages/dashboard/input/monitoring-radiologi.tsx'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    
    // Add the missing </div>
    const regex = /<\/select>\n            <\/div>\n          <\/div>\n        <\/div>\n\n        <div className="bg-white\/5 p-6 rounded-\[24px\] border border-white\/5">/g;
    
    const replacement = `</select>
            </div>
          </div>
        </div>
        </div>

        <div className="bg-white/5 p-6 rounded-[24px] border border-white/5">`;
        
    if (regex.test(content)) {
      content = content.replace(regex, replacement);
      fs.writeFileSync(f, content);
      console.log(`Fixed missing div in ${f}`);
    }
  }
});
