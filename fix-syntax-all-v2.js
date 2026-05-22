const fs = require('fs');
const path = require('path');
const dir = 'src/pages/dashboard/input';

const files = fs.readdirSync(dir);
for (const file of files) {
  if (!file.endsWith('.tsx')) continue;
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  let replaced = content;
  
  // If we have "return (" and "})}" or "))}" at the end of the map
  // Replace "))}" or "})}" with ")} ) }" assuming we have a matching return (
  
  // Actually, let's just fix the specific cases where it broke
  replaced = replaced.replace(/<\/div>\n\s*\)\)\}/g, "</div>\n              )\n            })} ");
  replaced = replaced.replace(/<\/div>\s*\)\)\}/g, "</div>\n              )\n            })} ");
  replaced = replaced.replace(/<\/div>\s*\)\)\s+/g, "</div>\n              )\n            })} ");

  // One more check: if it has return ( and } )) } or something
  
  if (content !== replaced) {
       fs.writeFileSync(filePath, replaced, 'utf8');
       console.log("Fixed syntax v2 in " + file);
  }
}
