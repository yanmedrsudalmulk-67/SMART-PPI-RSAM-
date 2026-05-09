const fs = require('fs');

function replaceInDir(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const fullPath = dir + '/' + item;
        if (fs.statSync(fullPath).isDirectory()) {
            replaceInDir(fullPath);
        } else if (fullPath.endsWith('page.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            const target1 = "observer: headerData.observer || (typeof observer !== 'undefined' ? observer : '') || (typeof selectedSupervisor !== 'undefined' ? selectedSupervisor : ''),";
            const replacement1 = "observer: headerData.observer || '',";

            if (content.includes(target1)) {
                content = content.replace(target1, replacement1);
                modified = true;
            }

            const target2 = "unit: headerData.unit || (typeof unit !== 'undefined' ? unit : (typeof ruangan !== 'undefined' ? ruangan : '')),";
            const replacement2 = "unit: headerData.unit || '',";

            if (content.includes(target2)) {
                content = content.replace(target2, replacement2);
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(fullPath, content);
                console.log('Fixed', fullPath);
            }
        }
    }
}

replaceInDir('./app/dashboard/input');
