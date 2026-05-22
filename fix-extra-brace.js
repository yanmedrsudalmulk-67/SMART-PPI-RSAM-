const fs = require('fs');
const path = require('path');
const dirs = ['src/pages/dashboard/input'];

for (const dir of dirs) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (!file.endsWith('.tsx')) continue;
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    let replaced = content;
    // Replace the extra `))}` and `})}` that were mistakenly added.
    replaced = replaced.replace(/<\/select>\s*<\/div>\s*<\/div>\s*[\])}]+/g, "</select>\n            </div>\n          </div>");

    if (content !== replaced) {
       fs.writeFileSync(filePath, replaced, 'utf8');
       console.log("Fixed " + file);
    }
  }
}
