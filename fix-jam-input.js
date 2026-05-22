const fs = require('fs');
const path = require('path');
const dirs = ['src/pages/dashboard/input'];

for (const dir of dirs) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (!file.endsWith('.tsx')) continue;
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    let replaced = content.replace(/<\/div>\n\s*<\/div>\n\s*\}\)\}\n\s*<\/div>\n\s*<\/div>\n\n\s*<div className="bg-white\/5 p-6 rounded-\[24px\] border border-white\/5 shadow-sm">\n\s*<h2 className="flex items-center/g, 
    "</div>\n                </div>\n          </div>\n        </div>\n\n        <div className=\"bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm\">\n          <h2 className=\"flex items-center");

    replaced = replaced.replace(/<\/div>\n\s*<\/div>\n\s*\)\}\n\s*<\/div>\n\s*<\/div>\n\n\s*<div className="bg-white\/5 p-6 rounded-\[24px\] border border-white\/5 shadow-sm">\n\s*<h2 className="flex items-center/g, 
    "</div>\n                </div>\n          </div>\n        </div>\n\n        <div className=\"bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm\">\n          <h2 className=\"flex items-center");

    if (content !== replaced) {
       fs.writeFileSync(filePath, replaced, 'utf8');
       console.log("Fixed Jam Input for " + file);
    }
  }
}
