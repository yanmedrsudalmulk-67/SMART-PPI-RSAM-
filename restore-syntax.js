const fs = require('fs');
const path = require('path');
const dirs = ['src/pages/dashboard/input'];

for (const dir of dirs) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (!file.endsWith('.tsx')) continue;
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    let replaced = content.replace(/<\/div>\s*<\/div>\s*\)\s*}}/g, "</div>\n                </div>\n              )\n            })}");

    // also for files like pengelolaan-limbah-medis that threw a parsing error
    let replaced2 = replaced.replace(/let borderLeftColor = 'border-l-transparent';(\s*)if \(selected === 'na'\) \{ borderLeftColor = 'border-l-slate-500'; \}(\s*)else if \(selected\) \{ borderLeftColor =/g, "let borderLeftColor = 'border-l-transparent';$1if (selected === 'na') { borderLeftColor = 'border-l-slate-500'; }$2else if (selected) { borderLeftColor =");

    if (content !== replaced) {
       fs.writeFileSync(filePath, replaced, 'utf8');
       console.log("Restored " + file);
    }
  }
}
