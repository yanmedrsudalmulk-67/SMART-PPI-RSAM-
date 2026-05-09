const fs = require('fs');
const { execSync } = require('child_process');

function fixFiles(dir) {
    const files = execSync(`find ${dir} -name "page.tsx"`).toString().split('\n').filter(Boolean);
    for (const file of files) {
        let content = fs.readFileSync(file, 'utf8');
        let modified = false;

        // 1. Check if sessionPayload has nama_pj_ruangan
        if (content.match(/nama_pj_ruangan:\s*(headerData|payload)\.nama_pj_ruangan\s*((\|\|).*?)?,/)) {
            // Remove the line
            content = content.replace(/\s+nama_pj_ruangan:\s*(headerData|payload)\.nama_pj_ruangan\s*((\|\|).*?)?,/g, '');
            modified = true;
        }

        // 1b. Check if sessionPayload has nama_pj_ruangan: pjName,
        else if (content.match(/\s+nama_pj_ruangan:\s*pjName\.trim\(\),/)) {
			// This is usually in the first payload, let's just make sure we only remove from sessionPayload if any
		}

        // We only want to remove it if it's throwing error for the sessionPayload
        // The error specifically happens because sessionPayload is used for audit_sessions

        if (modified) {
            // Find data_indikator inside sessionPayload
            const regex = /data_indikator:\s*(.*?)( \/\/.*)?$/m;
			// let's do a more robust regex or just replace
			
            content = content.replace(/data_indikator: data_indikator \|\| checklist_json \|\| \{\}/g, 
                "data_indikator: { ...(data_indikator || checklist_json || {}), nama_pj_ruangan: headerData?.nama_pj_ruangan || payload?.nama_pj_ruangan || null }");
            
            content = content.replace(/data_indikator: payload\.data_indikator \|\| headerData\.data_indikator \|\| \{\}/g, 
                "data_indikator: { ...(payload.data_indikator || headerData.data_indikator || {}), nama_pj_ruangan: headerData?.nama_pj_ruangan || payload?.nama_pj_ruangan || null }");
				
			content = content.replace(/data_indikator: payload\.data_indikator/g,
				"data_indikator: { ...(payload.data_indikator || {}), nama_pj_ruangan: headerData?.nama_pj_ruangan || payload?.nama_pj_ruangan || null }");

            fs.writeFileSync(file, content);
            console.log(`Fixed ${file}`);
        }
    }
}
fixFiles('./app/dashboard/input');
