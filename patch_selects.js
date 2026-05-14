const fs = require('fs');
const path = require('path');

const dir = 'src/pages/dashboard/input';

const processFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf-8');
  let original = content;

  // Replace observer select wrapper
  content = content.replace(/<div[^>]*>\s*<label[^>]*>Observer.*?<\/label>[\s\S]*?<select value={observer}[\s\S]*?<\/select>\s*<\/div>/g, 
    `<EditableSelect label="Observer" value={observer} onChange={setObserver} options={[]} isIPCN={isIPCN} table="master_observers" placeholder="Pilih Observer..." />`);

  content = content.replace(/<div(?:[^>]*)>\s*<div(?:[^>]*)>\s*<label(?:[^>]*)>Observer(?:.*?)<\/label>[\s\S]*?<\/div>\s*<select value={observer}[\s\S]*?<\/select>\s*<\/div>/g, 
    `<EditableSelect label="Observer" value={observer} onChange={setObserver} options={[]} isIPCN={isIPCN} table="master_observers" placeholder="Pilih Observer..." />`);

  // Replace unit select wrapper
  content = content.replace(/<div[^>]*>\s*<label[^>]*>.*?Unit.*?<\/label>[\s\S]*?<select value={unit}[\s\S]*?<\/select>\s*<\/div>/g,
    `<EditableSelect label="Unit" value={unit} onChange={setUnit} options={units} isIPCN={isIPCN} storageKey="smartppi_units" placeholder="Pilih Unit..." />`);

  content = content.replace(/<div(?:[^>]*)>\s*<label(?:[^>]*)>Unit Kerja<\/label>[\s\S]*?<select value={unit}[\s\S]*?<\/select>\s*<\/div>/g,
    `<EditableSelect label="Unit Kerja" value={unit} onChange={setUnit} options={units} isIPCN={isIPCN} storageKey="smartppi_units" placeholder="Pilih Unit..." />`);

  // Replace profesi select wrapper
  content = content.replace(/<div[^>]*>\s*<label[^>]*>.*?Profesi.*?<\/label>[\s\S]*?<select value={profesi}[\s\S]*?<\/select>\s*<\/div>/g,
    `<EditableSelect label="Profesi" value={profesi} onChange={setProfesi} options={professions || []} isIPCN={isIPCN} storageKey="smartppi_professions" placeholder="Pilih Profesi..." />`);

  if (content !== original) {
    if (!content.includes('EditableSelect')) {
      content = `import { EditableSelect } from '@/components/EditableSelect';\n` + content;
    }
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
  }
};

const walk = (d) => {
  const files = fs.readdirSync(d);
  for (const f of files) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) {
      walk(p);
    } else if (p.endsWith('.tsx')) {
      processFile(p);
    }
  }
};

walk(dir);

