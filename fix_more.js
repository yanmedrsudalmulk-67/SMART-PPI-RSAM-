const fs = require('fs');
const { execSync } = require('child_process');

function fixSpecificFile(file, prop) {
    let content = fs.readFileSync(file, 'utf8');
    
    // remove the prop from within the sessionPayload block
    const propRegex = new RegExp(`\\s+${prop}:\\s*.*?\\,`, 'g');
    
    // We only want to remove it inside sessionPayload
    const beforeSession = content.split('const sessionPayload = {');
    if (beforeSession.length < 2) return;
    
    const afterSessionStart = beforeSession[1];
    const sessionEnds = afterSessionStart.indexOf('};');
    
    let sessionBlock = afterSessionStart.substring(0, sessionEnds);
    const afterSession = afterSessionStart.substring(sessionEnds);
    
    if (sessionBlock.includes(`${prop}:`)) {
        sessionBlock = sessionBlock.replace(propRegex, '');
        
        // Also ensure data_indikator contains nama_pj_ruangan
        sessionBlock = sessionBlock.replace(/data_indikator: (checklistJson|data_indikator \|\| checklist_json \|\| \{\})/, "data_indikator: { ...($1), nama_pj_ruangan: pjName.trim() }")
        
        content = beforeSession[0] + 'const sessionPayload = {' + sessionBlock + afterSession;
        fs.writeFileSync(file, content);
        console.log(`Fixed ${file}`);
    }
}

fixSpecificFile('./app/dashboard/input/monitoring-isolasi/page.tsx', 'nama_pj_ruangan');
fixSpecificFile('./app/dashboard/input/monitoring-farmasi/page.tsx', 'nama_pj');
