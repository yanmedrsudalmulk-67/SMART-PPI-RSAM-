const fs = require('fs');
const path = require('path');

const dir = 'src/pages/dashboard/input';

const mapRegexFailed = /{(\w+)\.map\(\(item(,\s*(?:idx|index))?\) => \(\s*{/g;
const mapRegexFailed2 = /{(\w+)\.map\(\(item(,\s*(?:idx|index))?\) => \(\s*\r?\n\s*{/g;

const files = fs.readdirSync(dir);
for (const file of files) {
  if (!file.endsWith('.tsx')) continue;
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  let updated = false;

  // Replace {auditItems.map((item, idx) => ({ 
  // With {auditItems.map((item, idx) => {
  let replaced = content.replace(/{(\w+)\.map\(\(item(,\s*(?:idx|index))?\) => \(\s*{/g, "{$1.map((item$2) => {");
  
  if (replaced !== content) {
     content = replaced;
     updated = true;
  }
  
  if (updated) {
     fs.writeFileSync(filePath, content, 'utf8');
     console.log(`Fixed syntax in ${file}`);
  }
}
