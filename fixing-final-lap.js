const fs = require('fs');
const path = require('path');
const dir = 'src/pages/dashboard/input';

const files = fs.readdirSync(dir);
for (const file of files) {
  if (!file.endsWith('.tsx')) continue;
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  let replaced = content;
  
  // 1. Fix the map((...) => ( ... )})} issue
  // It should be )})} or )) if it was (
  
  // Let's just fix the most common multi-line map pattern in these specific files
  replaced = replaced.replace(/map\(([^)]+)\) => \(\s*([\s\S]+?)\s*\}\)\}/g, (match, p1, p2) => {
    return `map(${p1}) => (\n${p2}\n))}`;
  });

  // 2. Fix the specific broken lines from previous log
  replaced = replaced.split(')})} </div>').join(')) } </div>');
  replaced = replaced.split(')})}').join(')) }');
  
  // 3. Fix the unclosed div in monitoring-farmasi and others
  // Look for <div className="p-4 space-y-4">\n {group.items.map...
  // And ensure it has a closing </div> before the map ends or after
  
  // This is too complex for simple replace. Let's do it file by file if needed.
  
  if (content !== replaced) {
       fs.writeFileSync(filePath, replaced, 'utf8');
       console.log("Final Lap Fix in " + file);
  }
}
