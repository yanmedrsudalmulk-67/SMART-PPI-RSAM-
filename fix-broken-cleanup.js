const fs = require('fs');
const path = require('path');
const dir = 'src/pages/dashboard/input';

const files = fs.readdirSync(dir);
for (const file of files) {
  if (!file.endsWith('.tsx')) continue;
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  let replaced = content;
  
  // Fix map((choice) => { ... })) -> map((choice) => { ... })
  // This happens when the outer map was map((item) => ( ... ))
  
  // We want to replace the sequence of closing tags for the button map
  replaced = replaced.replace(/<\/button>\s*;\s*\}\s*\)\s*\)/g, "</button>\n                        );\n                      })");
  
  // Also fix the observer maps that I broke
  replaced = replaced.replace(/<\/\w+>\s*\}\s*\)\s*\}\s*<\/div>/g, "</motion.div>\n                  ))}\n                </AnimatePresence>\n              </div>");

  if (content !== replaced) {
       fs.writeFileSync(filePath, replaced, 'utf8');
       console.log("Fixed broken cleanup in " + file);
  }
}
