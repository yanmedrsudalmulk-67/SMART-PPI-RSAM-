const fs = require('fs');

function trace(file) {
  let content = fs.readFileSync(file, 'utf8');
  let regex = /<\/?([a-zA-Z0-9.]+)[^>]*>/g;
  let match;
  let stack = [];
  
  // Replace JSX strings properly... well, we can just process all tags
  let selfClosing = ['input', 'img', 'br', 'hr', 'CheckCircle2', 'Activity', 'ArrowLeft', 'FileText', 'LiveStatisticsCard', 'RefreshCw', 'Save', 'path', 'circle', 'svg', 'User', 'Settings', 'Trash2', 'DocumentationUploader', 'DigitalSignatureSection', 'EditableSelect'];

  while ((match = regex.exec(content)) !== null) {
    let tagString = match[0];
    let tagName = match[1];
    
    // Check if it's self closing in JSX
    if (tagString.endsWith('/>')) continue;
    if (selfClosing.includes(tagName)) continue;

    if (tagString.startsWith('</')) {
      // it's a close tag
      let last = stack.pop();
      if (last !== tagName) {
        console.log(`Mismatch in ${file}! Stack top was ${last}, but found ${tagString}`);
        
        let lines = content.substring(0, match.index).split('\\n');
        console.log(`Line roughly: ${lines.length}`);
        return;
      }
    } else {
      // it's an open tag
      stack.push(tagName);
    }
  }
  
  console.log(`${file}: Stack at end: ${stack.join(', ')}`);
}

[
  'src/pages/dashboard/input/pengendalian-lingkungan.tsx',
].forEach(trace);
