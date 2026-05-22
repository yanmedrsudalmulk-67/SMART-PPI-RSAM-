const fs = require('fs');
const path = require('path');
const dirs = ['src/pages/dashboard/input'];

for (const dir of dirs) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (!file.endsWith('.tsx')) continue;
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    let replaced = content.replace(/<\/div>\s*<\/div>\s*\)\s*\)\)}/g, "</div>\n                </div>\n            )}");
    let replaced2 = replaced.replace(/<\/div>\s*<\/div>\s*\)\s*}}/g, "</div>\n                </div>\n            )}");

    if (content !== replaced2) {
       fs.writeFileSync(filePath, replaced2, 'utf8');
       console.log("Restored " + file);
    }
  }
}
