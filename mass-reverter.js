const fs = require('fs');
const path = require('path');
const dir = 'src/pages/dashboard/input';

const files = fs.readdirSync(dir);
for (const file of files) {
  if (!file.endsWith('.tsx')) continue;
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  let replaced = content;
  
  // Revert )) } back to })}
  replaced = replaced.split(')) }').join('})}');
  
  // Fix the spaces I might have introduced
  replaced = replaced.split(')})}').join('})}');
  replaced = replaced.split(')) }').join('})}');

  if (content !== replaced) {
       fs.writeFileSync(filePath, replaced, 'utf8');
       console.log("Mass Revert in " + file);
  }
}
