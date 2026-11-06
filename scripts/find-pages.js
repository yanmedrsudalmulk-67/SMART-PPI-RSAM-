const fs = require('fs');
const path = require('path');

function searchFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') {
        searchFiles(fullPath);
      }
    } else if (file.includes('AnnualPages') || file.includes('resmi')) {
      console.log(`Found: ${fullPath}`);
    }
  }
}

searchFiles(path.join(__dirname, '..', 'src'));
