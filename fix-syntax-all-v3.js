const fs = require('fs');
const path = require('path');
const dir = 'src/pages/dashboard/input';

const files = fs.readdirSync(dir);
for (const file of files) {
  if (!file.endsWith('.tsx')) continue;
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  let replaced = content;
  
  if (content.includes('const selected =')) {
      // Updated file: map((item) => { ... return ( ... ) })
      // End should be ) } ) }
      // Or if it was map((item, idx) => { ... return ( ... ) })
      
      // Let's search for the end of the return (...) inside the map
      // and ensure it has ) } ) }
      
      replaced = replaced.replace(/<\/div>\s*\)\s*\}\s*\}\s*/g, "</div>\n              )\n            })} ");
      replaced = replaced.replace(/<\/div>\s*\)\s*\}\s*\)\s*\}\s*/g, "</div>\n              )\n            })} ");
      
      // Wait, let's use a simpler one:
      replaced = replaced.replace(/<\/div>\s*\)\s*\}\s*(\s*)\}\s*/g, "</div>\n              )\n            })} \n");

  } else {
      // Not updated file (like index.tsx): map((item) => ( ... ))
      // End should be ) ) }
      if (file === 'index.tsx' || file === 'hand-hygiene.tsx') {
          replaced = replaced.replace(/<\/div>\s*\)\s*\}\s*/g, "</div>\n              )\n            )} ");
      }
  }

  if (content !== replaced) {
       fs.writeFileSync(filePath, replaced, 'utf8');
       console.log("Improved syntax in " + file);
  }
}
