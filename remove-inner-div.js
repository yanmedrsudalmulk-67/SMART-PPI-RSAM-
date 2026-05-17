const fs = require('fs');

const files = [
  'src/pages/dashboard/input/monitoring-airborne.tsx',
  'src/pages/dashboard/input/monitoring-fasilitas_apd.tsx',
  'src/pages/dashboard/input/monitoring-ibs.tsx'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace(/          <\/div>\n        <\/div>\n        <\/div>\n\n        <div className="bg-white\/5 p-6/g, '          </div>\n        </div>\n\n        <div className="bg-white/5 p-6');
    fs.writeFileSync(f, content);
    console.log(`Fixed inner div for ${f}`);
  }
});
