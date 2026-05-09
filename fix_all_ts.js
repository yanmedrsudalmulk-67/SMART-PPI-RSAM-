const fs = require('fs');
const path = require('path');

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            walkDir(filePath);
        } else if (filePath.endsWith('.tsx')) {
            fixFile(filePath);
        }
    }
}

function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Pattern 1: observer and selectedSupervisor
    const pattern1 = /observer: headerData\.observer \|\| \(typeof observer !== 'undefined' \? observer : ''\) \|\| \(typeof selectedSupervisor !== 'undefined' \? selectedSupervisor : ''\),/g;
    if (content.match(pattern1)) {
        content = content.replace(pattern1, "observer: headerData.observer || (typeof observer !== 'undefined' ? (observer as any) : '') || (headerData as any).selectedSupervisor || (typeof selectedSupervisor !== 'undefined' ? (selectedSupervisor as any) : ''),");
        changed = true;
    }

    // Pattern 2: unit and ruangan
    const pattern2 = /unit: headerData\.unit \|\| \(typeof unit !== 'undefined' \? unit : \(typeof ruangan !== 'undefined' \? ruangan : ''\)\),/g;
    if (content.match(pattern2)) {
        content = content.replace(pattern2, "unit: headerData.unit || (typeof unit !== 'undefined' ? (unit as any) : (typeof ruangan !== 'undefined' ? (ruangan as any) : '')),");
        changed = true;
    }

    // Pattern 3: stats
    const pattern3 = /headerData\.(jumlah_dinilai|jumlah_patuh|persentase) \|\| \(typeof stats !== 'undefined' \? stats\?\.(\w+) : null\) \|\| 0/g;
    if (content.match(pattern3)) {
        content = content.replace(pattern3, (match, field, statField) => {
            return `headerData.${field} || (typeof stats !== 'undefined' ? (stats as any)?.${statField} : null) || 0`;
        });
        changed = true;
    }

    // Pattern 4: status_kepatuhan
    const pattern4 = /status_kepatuhan: headerData\.status_kepatuhan \|\| \(typeof stats !== 'undefined' \? \(stats\?\.status \|\| stats\?\.statusText\) : null\) \|\| 'Belum Dinilai',/g;
    if (content.match(pattern4)) {
        content = content.replace(pattern4, "status_kepatuhan: headerData.status_kepatuhan || (typeof stats !== 'undefined' ? ((stats as any)?.status || (stats as any)?.statusText) : null) || 'Belum Dinilai',");
        changed = true;
    }

    if (changed) {
        console.log(`Fixed ${filePath}`);
        fs.writeFileSync(filePath, content);
    }
}

walkDir('./app/dashboard/input');
