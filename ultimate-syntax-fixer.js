const fs = require('fs');
const path = require('path');
const dir = 'src/pages/dashboard/input';

const files = fs.readdirSync(dir);
for (const file of files) {
  if (!file.endsWith('.tsx')) continue;
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  let replaced = content;
  
  // Clean up my mess
  replaced = replaced.split(')})}').join('})}');
  replaced = replaced.split(')})').join('})');
  replaced = replaced.split(') })').join('})');
  replaced = replaced.split(')) }').join('})}');
  
  // Specific for apd.tsx and dekontaminasi
  replaced = replaced.split('    )})}').join('    })}');
  replaced = replaced.split('  )})}').join('  })}');

  if (content !== replaced) {
       fs.writeFileSync(filePath, replaced, 'utf8');
       console.log("Ultimate fix in " + file);
  }
}
