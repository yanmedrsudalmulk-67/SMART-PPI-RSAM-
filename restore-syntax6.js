const fs = require('fs');
const path = require('path');
const dirs = ['src/pages/dashboard/input'];

for (const dir of dirs) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (!file.endsWith('.tsx')) continue;
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // let's look at the beginning of the .map
    let replaced = content;
    
    // Find all map starts
    const mapRegex = /{(?:checklistItems|auditItems)\.map\([^=>]+=>\s*([{(])/g;
    let match;
    let expectedClosing = '';
    while ((match = mapRegex.exec(content)) !== null) {
       // Only the first main map matters usually, but let's just see.
       if (match[1] === '{') {
           expectedClosing = '})}';
       } else if (match[1] === '(') {
           expectedClosing = '))}';
       }
       break;
    }

    if (expectedClosing) {
        // the end is right before `</div` and `LiveStatisticsCard` probably.
        // It's easier to just match what it currently is:
        replaced = replaced.replace(/\)\n*\s*\)\s*\}\s*\n*\s*<(\/div>|div)/g, expectedClosing + "\n          <$1");
        replaced = replaced.replace(/\}\s*\)\s*\}\s*\n*\s*<(\/div>|div)/g, expectedClosing + "\n          <$1");
        replaced = replaced.replace(/\)\s*\}\s*\n*\s*<(\/div>|div)/g, expectedClosing + "\n          <$1");
        replaced = replaced.replace(/\)\s*\)\s*\n*\s*<(\/div>|div)/g, expectedClosing + "\n          <$1");
        replaced = replaced.replace(/\n\s*\}\)\}\s*\n*\s*<(\/div>|div)/g, "\n            " + expectedClosing + "\n          <$1");
        replaced = replaced.replace(/\n\s*\)\}\s*\n*\s*<(\/div>|div)/g, "\n            " + expectedClosing + "\n          <$1");
        replaced = replaced.replace(/\n\s*\}\)\s*\n*\s*<(\/div>|div)/g, "\n            " + expectedClosing + "\n          <$1");
    }

    if (content !== replaced) {
       fs.writeFileSync(filePath, replaced, 'utf8');
       console.log("Fixed " + file + " with " + expectedClosing);
    }
  }
}
