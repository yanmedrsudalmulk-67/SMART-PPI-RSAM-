const fs = require('fs');
const path = require('path');
const dir = 'src/pages/dashboard/input';

const files = fs.readdirSync(dir);
for (const file of files) {
  if (!file.endsWith('.tsx')) continue;
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  let replaced = content;
  
  // Fix the common pattern where it should be )) instead of }
  replaced = replaced.split(')})}').join(')) }');
  replaced = replaced.split(') })').join(')) }');
  replaced = replaced.split(' })}').join(' )) }');
  
  // Specific for common select maps
  replaced = replaced.split('        })} </select>').join('        ))}</select>');
  replaced = replaced.split('      })} </select>').join('      ))}</select>');
  replaced = replaced.split('    })} </select>').join('    ))}</select>');

  if (content !== replaced) {
       fs.writeFileSync(filePath, replaced, 'utf8');
       console.log("Simple Fix v2 in " + file);
  }
}
