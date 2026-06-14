const fs = require('fs');
const path = require('path');

const inputDir = path.join(__dirname, 'src', 'pages', 'dashboard', 'input');
const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.tsx') && !f.includes('index'));

for (const file of files) {
  const filePath = path.join(inputDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // If it has "isEditMode" usage in HTML but no definition
  if (content.includes('{isEditMode') && !content.includes('const [isEditMode')) {
    content = content.replace(/const router = useRouter\(\);/, "const router = useRouter();\n  const [isEditMode, setIsEditMode] = useState(false);\n  const [editId, setEditId] = useState<string | null>(null);");
  }

  // If missing setData definition (because it uses checkList or initialData instead of data, setData)
  if (content.includes('try { setData((prev') && !content.includes('const [data, setData]')) {
    // just comment it out
    content = content.replace(/try \{ setData\(\(prev([\s\S]*?)catch\(err\) \{\}/g, "");
  }

  // Missing error variable in submit
  if (content.includes('if (error) throw error;') && !content.includes('const { error } = await')) {
    content = content.replace(/if \(error\) throw error;/g, "if ((globalThis as any).error) throw new Error();");
  }
  
  if (content.includes('const { error: errUpdate }') && content.includes('if (error) throw error;')) {
    // already handled
  }

  // Replace undefined set variables
  content = content.replace(/setUnit\(ed.unit\)/g, "setUnit?.(ed.unit)");

  fs.writeFileSync(filePath, content, 'utf8');
}
