const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      replaceInDir(filePath);
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      if (filePath.includes('useSafeRouter.ts')) continue;
      let content = fs.readFileSync(filePath, 'utf8');
      
      const regex = /import\s+\{\s*useRouter\s*\}\s+from\s+['"]next\/router['"];?/g;
      
      if (regex.test(content)) {
        content = content.replace(regex, "import { useSafeRouter as useRouter } from '@/hooks/useSafeRouter';");
        fs.writeFileSync(filePath, content, 'utf8');
        console.log("Updated", filePath);
      }
    }
  }
}

replaceInDir('src');
