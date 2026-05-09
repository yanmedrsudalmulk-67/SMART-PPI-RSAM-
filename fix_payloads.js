const fs = require('fs');
const glob = require('glob');

const files = glob.sync('app/dashboard/input/**/page.tsx');

files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  let changed = false;

  const replaceMap = {
    'headerData.observer || observer': 'headerData.observer || (typeof observer !== \'undefined\' ? observer : \'\') || (typeof selectedSupervisor !== \'undefined\' ? selectedSupervisor : \'\')',
    'headerData.unit || unit': 'headerData.unit || (typeof unit !== \'undefined\' ? unit : (typeof ruangan !== \'undefined\' ? ruangan : \'\'))',
    'stats?.dinilai || 0': '(typeof stats !== \'undefined\' ? stats?.dinilai : null) || 0',
    'stats?.patuh || 0': '(typeof stats !== \'undefined\' ? stats?.patuh : null) || 0',
    'stats?.persentase || 0': '(typeof stats !== \'undefined\' ? stats?.persentase : null) || 0',
    'stats?.status || stats?.statusText': '(typeof stats !== \'undefined\' ? (stats?.status || stats?.statusText) : null)'
  };

  for (const [key, val] of Object.entries(replaceMap)) {
    // Only replace if it exactly matches and hasn't been replaced
    if (c.includes(key) && !c.includes(val)) {
      c = c.split(key).join(val);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(f, c);
    console.log('Fixed undefined refs in', f);
  }
});
