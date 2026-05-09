const fs = require('fs');
const glob = require('glob');

const files = glob.sync('app/dashboard/input/**/*.tsx');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // 1. Check if isUnitModalOpen is used but not declared
  if (content.includes('isUnitModalOpen') && !content.includes('const [isUnitModalOpen')) {
    console.log('Inserting state in ' + file);
    
    // Find a good place to insert states: after observer management or after unit state
    if (content.includes('const [editObserverId, setEditObserverId]')) {
      content = content.replace(/(const \[editObserverId, setEditObserverId\].*?;)/, `$1
  
  // Unit Management
  const [units, setUnits] = useState<Unit[]>([]);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');
  const [editUnitId, setEditUnitId] = useState<string | null>(null);`);
    } else if (content.includes('const [unit, setUnit] = useState')) {
      content = content.replace(/(const \[unit, setUnit\] = useState\(.*?\);)/, `$1
  
  // Unit Management
  const [units, setUnits] = useState<Unit[]>([]);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');
  const [editUnitId, setEditUnitId] = useState<string | null>(null);`);
    }
  }

  // 2. Ensure staticUnits and Unit type are there if states were (or about to be) added
  if (content.includes('setUnits') && !content.includes('const staticUnits = [')) {
    console.log('Inserting staticUnits and Unit type in ' + file);
    // Insert before the component function
    const insertPoint = content.match(/export default function/);
    if (insertPoint) {
       const staticDef = `const staticUnits = [
  'IGD', 'ICU', 'IBS', 'Rawat Jalan', 'Ranap Aisyah', 
  'Ranap Fatimah', 'Ranap Khadijah', 'Ranap Usman', 
  'Radiologi', 'Laboratorium', 'Pantry', 'Emergency Kebidanan'
];
type Unit = { id: string; nama: string };

`;
       content = content.replace('export default function', staticDef + 'export default function');
    }
  }

  if (original !== content) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Modified ' + file);
  }
});
