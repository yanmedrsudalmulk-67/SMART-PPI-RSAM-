const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

console.log('--- Checking SMART PPI.lnk in Workspace ---');
try {
  const psCmd = `powershell -NoProfile -Command "$sh = New-Object -ComObject WScript.Shell; $s = $sh.CreateShortcut('${path.resolve('SMART PPI.lnk').replace(/'/g, "''")}'); [PSCustomObject]@{ TargetPath = $s.TargetPath; Arguments = $s.Arguments; WorkingDirectory = $s.WorkingDirectory; IconLocation = $s.IconLocation } | ConvertTo-Json"`;
  const res = execSync(psCmd, { encoding: 'utf8' });
  console.log('SMART PPI.lnk info:', res);
} catch (e) {
  console.error('Error reading workspace shortcut:', e.message);
}

console.log('--- Checking Desktop Shortcuts ---');
const desktopPath = path.join(os.homedir(), 'Desktop');
const oneDriveDesktop = path.join(os.homedir(), 'OneDrive', 'Desktop');

const checkDir = (dir) => {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
      if (f.toLowerCase().includes('smart') || f.toLowerCase().includes('ppi')) {
        const full = path.join(dir, f);
        console.log('Found on desktop:', full);
        if (f.endsWith('.lnk')) {
          try {
            const psCmd = `powershell -NoProfile -Command "$sh = New-Object -ComObject WScript.Shell; $s = $sh.CreateShortcut('${full.replace(/'/g, "''")}'); [PSCustomObject]@{ TargetPath = $s.TargetPath; Arguments = $s.Arguments; WorkingDirectory = $s.WorkingDirectory } | ConvertTo-Json"`;
            const res = execSync(psCmd, { encoding: 'utf8' });
            console.log('Shortcut info:', res);
          } catch (e) {
            console.error(e.message);
          }
        }
      }
    }
  }
};

checkDir(desktopPath);
checkDir(oneDriveDesktop);
