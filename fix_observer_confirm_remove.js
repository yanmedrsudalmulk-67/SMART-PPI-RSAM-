const fs = require('fs');
const glob = require('glob');

const files = glob.sync('app/dashboard/input/**/*.tsx');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replace confirm logic we just added
  const confirmRegex = /\/\/\s*confirm bypass[\s\S]*?if \(\!window\.confirm\('Hapus observer ini\?'\)\) return;\s*\}/g;
  content = content.replace(confirmRegex, '');

  if (original !== content) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Removed confirm from ' + file);
  }
});
