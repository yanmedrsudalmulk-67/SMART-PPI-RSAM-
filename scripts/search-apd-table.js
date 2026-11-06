const fs = require('fs');
const path = require('path');

function searchFiles(dir, pattern) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') {
        searchFiles(fullPath, pattern);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.toLowerCase().includes(pattern.toLowerCase())) {
        console.log(`Found in: ${fullPath}`);
      }
    }
  }
}

searchFiles(path.join(__dirname, '..', 'src'), 'belum diisi');
searchFiles(path.join(__dirname, '..', 'src'), 'Belum Diisi');
searchFiles(path.join(__dirname, '..', 'src'), 'PENUTUP KEPALA');
