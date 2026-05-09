const fs = require('fs');
const glob = require('glob');

const files = glob.sync('app/dashboard/input/**/page.tsx');

files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  let changed = false;

  const regex = /if\s*\(error\)\s*\{\s*console\.warn\("Kesalahan saat menyimpan fallback table[^}]+\}\s*(?:;)?\s*if\s*\(error\)\s*\{\s*console\.error\("Kesalahan Supabase Simpan:".*?throw\s*error;\s*\}/gs;
  
  if (regex.test(c)) {
      c = c.replace(regex, `if (error) {
        console.warn("Kesalahan saat menyimpan fallback table (hiraukan jika skema lama un-matched):", error);
      }`);
      changed = true;
  }

  if (changed) {
    fs.writeFileSync(f, c);
    console.log('Fixed throw on fallback in', f);
  }
});
