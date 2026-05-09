const fs = require('fs');
const path = require('path');

const dir = 'app/dashboard/input';

function walk(dir, callback) {
  fs.readdirSync(dir).forEach( f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
};

walk(dir, (filePath) => {
  if (!filePath.endsWith('.tsx')) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  const hasObserver = content.includes('const [observer');
  const hasSelectedSupervisor = content.includes('const [selectedSupervisor');
  const hasUnit = content.includes('const [unit');
  const hasRuangan = content.includes('const [ruangan');
  const hasStats = content.includes('const stats = ');

  // Fix Observer
  const observerPattern = /observer: headerData\.observer \|\| \(typeof observer !== 'undefined' \? observer : ''\) \|\| \(typeof selectedSupervisor !== 'undefined' \? selectedSupervisor : ''\),/g;
  if (observerPattern.test(content)) {
    let replacement = '';
    if (hasObserver) {
      replacement = 'observer: headerData.observer || observer || (typeof selectedSupervisor !== \'undefined\' ? (selectedSupervisor as any) : \'\'),';
    } else if (hasSelectedSupervisor) {
      replacement = 'observer: headerData.observer || selectedSupervisor || \'\',';
    } else {
      replacement = 'observer: headerData.observer || \'\',';
    }
    content = content.replace(observerPattern, replacement);
    changed = true;
  }

  // Fix Unit
  const unitPattern = /unit: headerData\.unit \|\| \(typeof unit !== 'undefined' \? unit : \(typeof ruangan !== 'undefined' \? ruangan : ''\)\),/g;
  if (unitPattern.test(content)) {
    let replacement = '';
    if (hasUnit) {
      replacement = 'unit: headerData.unit || unit || (typeof ruangan !== \'undefined\' ? (ruangan as any) : \'\'),';
    } else if (hasRuangan) {
      replacement = 'unit: headerData.unit || ruangan || \'\',';
    } else {
      replacement = 'unit: headerData.unit || \'\',';
    }
    content = content.replace(unitPattern, replacement);
    changed = true;
  }

  // Fix Stats
  const dinilaiPattern = /jumlah_dinilai: headerData\.jumlah_dinilai \|\| \(typeof stats !== 'undefined' \? stats\?\.dinilai : null\) \|\| 0,/g;
  if (dinilaiPattern.test(content)) {
    content = content.replace(dinilaiPattern, 'jumlah_dinilai: headerData.jumlah_dinilai || (stats as any)?.dinilai || 0,');
    changed = true;
  }

  const patuhPattern = /jumlah_patuh: headerData\.jumlah_patuh \|\| \(typeof stats !== 'undefined' \? stats\?\.patuh : null\) \|\| 0,/g;
  if (patuhPattern.test(content)) {
    content = content.replace(patuhPattern, 'jumlah_patuh: headerData.jumlah_patuh || (stats as any)?.patuh || 0,');
    changed = true;
  }

  const persentasePattern = /persentase: headerData\.persentase \|\| \(typeof stats !== 'undefined' \? stats\?\.persentase : null\) || 0,/g;
  if (persentasePattern.test(content)) {
    content = content.replace(persentasePattern, 'persentase: headerData.persentase || (stats as any)?.persentase || 0,');
    changed = true;
  }

  const statusPattern = /status_kepatuhan: headerData\.status_kepatuhan \|\| \(typeof stats !== 'undefined' \? \(stats\?\.status \|\| stats\?\.statusText\) : null\) \|\| 'Belum Dinilai',/g;
  if (statusPattern.test(content)) {
    content = content.replace(statusPattern, 'status_kepatuhan: headerData.status_kepatuhan || (stats as any)?.status || (stats as any)?.statusText || \'Belum Dinilai\',');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed ${filePath}`);
  }
});
