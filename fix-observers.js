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
    
    // The observer map typically closes right before `</div>` and `</motion.div>` in the modal.
    replaced = replaced.replace(/<\/div>\n\s*\)\}\n\s*<\/div>\n\s*<\/motion\.div>/g, "</div>\n                ))}\n              </div>\n            </motion.div>");

    if (content !== replaced) {
       fs.writeFileSync(filePath, replaced, 'utf8');
       console.log("Fixed " + file);
    }
  }
}
