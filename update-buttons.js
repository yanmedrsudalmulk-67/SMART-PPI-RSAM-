const fs = require('fs');
const path = require('path');

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(fullPath));
    } else if (fullPath.endsWith('.tsx')) {
      results.push(fullPath);
    }
  });
  return results;
}

const buttonPattern = /<button[^>]*?>[\s\S]*?(?:Simpan[^<]*?)[\s\S]*?<\/button>|<motion\.button[^>]*?>[\s\S]*?(?:Simpan[^<]*?)[\s\S]*?<\/motion\.button>/g;

const files = getFiles(path.join(process.cwd(), 'src/pages/dashboard/input'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  const matches = content.match(buttonPattern);
  if (matches) {
    let replacedCount = 0;
    matches.forEach(m => {
      if (m.toLowerCase().includes('simpan')) {
        let onClickMatch = m.match(/onClick=\{([^\}]+)\}/);
        let disabledMatch = m.match(/disabled=\{([^\}]+)\}/);
        let typeMatch = m.match(/type="submit"/);

        let attrs = [];
        if (onClickMatch) {
            attrs.push(`onClick={${onClickMatch[1]}}`);
        } else if (m.includes("onClick={handleSubmit}")) {
            attrs.push(`onClick={handleSubmit}`);
        }
        
        if (disabledMatch) attrs.push(`disabled={${disabledMatch[1]}}`);
        if (typeMatch) attrs.push(`type="submit"`);

        let newButton = `<button ${attrs.join(' ')}
          className="w-full flex justify-center items-center gap-4 py-5 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-widest rounded-2xl transition-all shadow-lg disabled:opacity-50"
        >
          {isSubmitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          <span>Simpan Data Audit</span>
        </button>`;
        
        content = content.replace(m, newButton);
        replacedCount++;
      }
    });

    if (replacedCount > 0) {
      if (!content.includes('RefreshCw')) {
        content = content.replace(/import {([^}]+)} from 'lucide-react';/, "import { $1, RefreshCw } from 'lucide-react';");
      }
      fs.writeFileSync(file, content);
      console.log(`Updated ${file}`);
    }
  }
});
