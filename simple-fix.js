const fs = require('fs');
const path = require('path');
const dir = 'src/pages/dashboard/input';

const files = fs.readdirSync(dir);
for (const file of files) {
  if (!file.endsWith('.tsx')) continue;
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  let replaced = content;
  
  // Fix the specific broken map ending for choice map
  replaced = replaced.replace(/\)\s*\)\s*;?\s*\)\s*\)/g, ");\n                      })");
  
  // Actually, even simpler:
  replaced = replaced.split('                      ))').join('                      })');
  replaced = replaced.split('                    ))').join('                    })');
  replaced = replaced.split('                  ))').join('                  })');
  replaced = replaced.split('                        ))').join('                        })');
  
  // fix index and hand-hygiene specifically
  if (file === 'index.tsx' || file === 'hand-hygiene.tsx') {
      replaced = replaced.split('))} </div>').join(')) } </div>');
  }

  if (content !== replaced) {
       fs.writeFileSync(filePath, replaced, 'utf8');
       console.log("Fixed with simple split/join in " + file);
  }
}
