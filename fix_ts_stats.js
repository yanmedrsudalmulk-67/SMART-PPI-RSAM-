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

            const target1 = "stats?.dinilai";
            const replacement1 = "(stats as any)?.dinilai";

            if (content.includes(target1)) {
                content = content.replace(target1, replacement1);
                modified = true;
            }

            const target2 = "stats?.patuh";
            const replacement2 = "(stats as any)?.patuh";

            if (content.includes(target2)) {
                content = content.replace(target2, replacement2);
                modified = true;
            }

            const target3 = "stats?.persentase";
            const replacement3 = "(stats as any)?.persentase";

            if (content.includes(target3)) {
                content = content.replace(target3, replacement3);
                modified = true;
            }

            const target4 = "stats?.status";
            const replacement4 = "(stats as any)?.status";

            const target5 = "stats?.statusText";
            const replacement5 = "(stats as any)?.statusText";

            if (content.includes(target4)) {
                content = content.replace(target4, replacement4);
                modified = true;
            }

            if (content.includes(target5)) {
                content = content.replace(target5, replacement5);
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(fullPath, content);
                console.log('Fixed stats?', fullPath);
            }
        }
    }
}

replaceInDir('./app/dashboard/input');
