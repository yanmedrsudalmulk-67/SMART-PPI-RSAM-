const fs = require('fs');
const glob = require('glob'); // Note: We might not have glob. Let's just use standard fs.

function replaceInDir(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const fullPath = dir + '/' + item;
        if (fs.statSync(fullPath).isDirectory()) {
            replaceInDir(fullPath);
        } else if (fullPath.endsWith('page.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            const target = 'const { data_indikator, checklist_json, ...headerData } = payload;';
            if (content.includes(target)) {
                content = content.replace(target, 'const { data_indikator, checklist_json, ...headerData } = payload as any;');
                fs.writeFileSync(fullPath, content);
                console.log('Fixed', fullPath);
            }
            
            // And for other things
            const target2 = 'const { data_indikator, ttd_pj_ruangan, ttd_ipcn, ...headerData } = payload;';
            if (content.includes(target2)) {
                content = content.replace(target2, 'const { data_indikator, ttd_pj_ruangan, ttd_ipcn, ...headerData } = payload as any;');
                fs.writeFileSync(fullPath, content);
                console.log('Fixed', fullPath);
            }
        }
    }
}

replaceInDir('./app/dashboard/input');
