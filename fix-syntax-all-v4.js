const fs = require('fs');
const path = require('path');
const dir = 'src/pages/dashboard/input';

const files = fs.readdirSync(dir);
for (const file of files) {
  if (!file.endsWith('.tsx')) continue;
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  let replaced = content;
  
  // Pattern 1: }) } </div>
  replaced = replaced.replace(/\}\)\s*\}\s*<\/div>/g, "})} ");
  
  // Pattern 2: ) ) }
  replaced = replaced.replace(/\)\s*\)\s*\}\s+/g, "))} ");
  
  // Pattern 3: ) } ) }
  replaced = replaced.replace(/\)\s*\}\s*\)\s*\}/g, "}) }");

  // Fix extra trailing </div> often caused by my script
  // if we have </div> then })} then </div> then </div>
  // and the second </div> is on the same line as })}
  
  if (content !== replaced) {
       fs.writeFileSync(filePath, replaced, 'utf8');
       console.log("Fixed syntax v4 in " + file);
  }
}
