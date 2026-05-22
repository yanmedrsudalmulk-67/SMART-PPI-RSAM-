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
    if (content.includes('.map(item => (') || content.includes('.map((item, index) => (') || content.includes('.map((item, idx) => (')) {
       // It's using `=> (` at the start of map.
       // Let's replace `})}` with `))`
       replaced = replaced.replace(/\)\n\s*}\)}/g, ")\n            ))}");
    }

    if (content !== replaced) {
       fs.writeFileSync(filePath, replaced, 'utf8');
       console.log("Restored " + file);
    }
  }
}
