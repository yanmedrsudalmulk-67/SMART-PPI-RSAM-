const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      replaceInDir(filePath);
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      let content = fs.readFileSync(filePath, 'utf8');
      if (content.includes("from 'next/router'")) {
        content = content.replace("import { useRouter } from 'next/router';", "import { useSafeRouter as useRouter } from '@/hooks/useSafeRouter';");
        fs.writeFileSync(filePath, content, 'utf8');
        console.log("Updated", filePath);
      }
    }
  }
}

replaceInDir('src');
