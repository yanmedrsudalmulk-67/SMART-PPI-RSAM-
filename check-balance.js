const fs = require('fs');

function checkBalance(file) {
  let content = fs.readFileSync(file, 'utf8');
  let openDivs = (content.match(/<div(\s|>)/g) || []).length;
  let closeDivs = (content.match(/<\/div>/g) || []).length;

  let openForms = (content.match(/<form(\s|>)/g) || []).length;
  let closeForms = (content.match(/<\/form>/g) || []).length;

  console.log(`${file}: openDivs=${openDivs}, closeDivs=${closeDivs}, openForms=${openForms}, closeForms=${closeForms}`);
}

[
  'src/pages/dashboard/input/pengendalian-lingkungan.tsx',
  'src/pages/dashboard/input/monitoring-fasilitas_apd.tsx',
  'src/pages/dashboard/input/monitoring-airborne.tsx',
  'src/pages/dashboard/input/monitoring-ibs.tsx',
  'src/pages/dashboard/input/monitoring-laboratorium.tsx'
].forEach(checkBalance);
