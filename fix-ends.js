const fs = require('fs');
const files = [
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

files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');

    // 1. Remove the completely misplaced `isObserverModal` from the bottom since we already
    // added it back cleanly to those that needed it. Oh wait, my fix-main.js added it back!
    // But it added it inside the returned JSX. 
    
    // Actually, linter says:
    // monitoring-airborne: 212:7 Parsing error: JSX element 'form' has no corresponding closing tag.
    // monitoring-cssd: 243:9 JSX element 'div' has no corresponding closing tag.
    // penatalaksanaan-linen: 248:8 Expected corresponding JSX closing tag for 'div'.
    
    // In penatalaksanaan-linen.tsx, it's NOT a form. So we should change \`</form>\` to nothing
    if(f.includes('penatalaksanaan-linen') || f.includes('penempatan-pasien') || f.includes('pengelolaan-limbah-medis') || f.includes('pengendalian-lingkungan') || f.includes('penyuntikan-aman') || f.includes('perlindungan-petugas')) {
      // These didn't have <form> in the replacement, but my fix-2.js added </form>
      content = content.replace(/<\/div>\n      <\/form>\n    <\/div>\n  \);\n}/g, "    </div>\n    </div>\n  );\n}");
      // wait, `fix-2.js` added nested divs:
      content = content.replace(/<\/form>\n    <\/div>\n  \);\n}/g, "  </div>\n  );\n}");
    }

    if(f.includes('monitoring-airborne') || f.includes('fasilitas_apd') || f.includes('ibs')) {
        // These have `form` unclosed. Meaning there's an extra `</div>` inside the `<form>`.
        // Let's remove line 240 `</div>` which was incorrectly added by add-missing-div.js
        content = content.replace(/          <\/div>\n        <\/div>\n        <\/div>\n\n        <div className="bg-white\/5 p-6 rounded-\[24px\]/g, 
        \`          </div>\n        </div>\n\n        <div className="bg-white/5 p-6 rounded-[24px]\`);
    }

    if(f.includes('monitoring-ambulance') || f.includes('monitoring-cssd') || f.includes('monitoring-gizi') || f.includes('monitoring-jenazah') || f.includes('monitoring-laboratorium') || f.includes('monitoring-radiologi')) {
        // These have unclosed `<div>` (e.g., parsing error: element 'div' has no corresponding closing tag).
        // That means THEY ARE MISSING closed divs inside the form.
        // Or missing </div> at the end.
        
        // Let's check how many <div and </div there are in the return statement!
    }

    fs.writeFileSync(f, content);
  }
});
