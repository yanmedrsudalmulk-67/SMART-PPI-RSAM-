const fs = require('fs');
let content = fs.readFileSync('src/pages/dashboard/reports/index.tsx', 'utf-8');
content = content.replace(/<div className="p-1\.5 bg-blue-50 dark:bg-blue-500\/10 rounded-lg text-blue-600 dark:text-blue-400">\s*<Calendar className="w-4 h-4" \/>\s*<\/div>/, '');
fs.writeFileSync('src/pages/dashboard/reports/index.tsx', content);
