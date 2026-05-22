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
    
    if (file === 'monitoring-jenazah.tsx' || file === 'monitoring-laboratorium.tsx' || file === 'monitoring-radiologi.tsx' || file === 'penatalaksanaan-linen.tsx' || file === 'ppi-ruang-isolasi.tsx') {
        // Change `)}` to `))}` if it's right before `</div>`
        replaced = replaced.replace(/\)\}\n\s*<\/div>\n\s*<\/div>\n\s*<\/div>/g, "))}\n                </div>\n              </div>\n            )}"); // wait, nested map, let me replace specifically
    }
  }
}
