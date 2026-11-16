const fs = require('fs');
const path = require('path');

const dir = './src/pages/dashboard/input';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

files.forEach(f => {
  const content = fs.readFileSync(path.join(dir, f), 'utf8');
  if (content.includes('setTemuan') && content.includes('setRekomendasi')) {
    const hasGrid = content.includes('grid grid-cols-1 md:grid-cols-2') && content.includes('Temuan');
    const hasBox = content.includes('Temuan dan Rekomendasi');
    console.log(`${f}: hasGrid=${hasGrid}, hasBox=${hasBox}`);
  }
});
