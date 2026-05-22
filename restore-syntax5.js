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
    // Check if it has `=> (` but ends with `})}`
    if (replaced.includes('.map((item) => (') || replaced.includes('.map(item => (')) {
       // It's using `=> (` at the start of map.
       // Let's replace `})}` with `))`
       replaced = replaced.replace(/\)\s*\n*\s*}\)}/g, ")\n            ))}");
       replaced = replaced.replace(/\)\s*\n*\s*\}\s*\)}/g, ")\n            ))}");
       replaced = replaced.replace(/<\/div>\s*<\/div>\s*\)\s*}\)/g, "</div>\n                </div>\n            )}"); // Wait no, just `))` 
    }
    
    // Let's just fix the end if the top is `(`
    if (replaced.match(/\.map\(\([^)]*\)\s*=>\s*\(/)) {
         replaced = replaced.replace(/\)\n\s*\}\)}/g, ")\n            ))}");
         replaced = replaced.replace(/\)\n\s*}\)/g, ")\n            ))}");
         replaced = replaced.replace(/<\/div>\s*<\/div>\s*\)\s*\}\)}/g, "</div>\n                </div>\n            ))}");
         replaced = replaced.replace(/<\/div>\s*<\/div>\s*\)\s*\}\)\s*}/g, "</div>\n                </div>\n            ))}");
         // Just blindly replace any closing `})}` at the end of the map with `))`
         replaced = replaced.replace(/\)\n\s*}\)}\n/g, ")\n            ))}\n");
    }

    if (content !== replaced) {
       fs.writeFileSync(filePath, replaced, 'utf8');
       console.log("Restored " + file);
    }
  }
}
