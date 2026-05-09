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

            const target1 = "const { data_indikator, checklist_json, ...headerData } = insertData;";
            const replacement1 = "const { data_indikator, checklist_json, ...headerData } = insertData as any;";

            if (content.includes(target1)) {
                content = content.replace(target1, replacement1);
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
