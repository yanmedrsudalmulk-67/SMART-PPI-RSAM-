const fs = require('fs');
const path = require('path');
const dirs = ['src/pages/dashboard/input'];

for (const dir of dirs) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (!file.endsWith('.tsx')) continue;
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    let replaced = content.replace(/<\/div>\n\s*<\/div>\n\s*\)\}\n\s*<\/div>\n\s*<div className="mt-6">/g, "</div>\n                </div>\n            ))}\n          </div>\n\n          <div className=\"mt-6\">");

    // linen
    replaced = replaced.replace(/<\/div>\n\s*<\/div>\n\s*\)\}\n\s*<\/div>\n\s*<\/div>\n\n\s*<LiveStatisticsCard/g, "</div>\n                </div>\n            ))}\n          </div>\n        </div>\n\n        <LiveStatisticsCard");

    // also for index.tsx warn: exhaustive deps, we don't care now (compile works with warnings).

    if (content !== replaced) {
       fs.writeFileSync(filePath, replaced, 'utf8');
       console.log("Fixed Endings for " + file);
    }
  }
}
