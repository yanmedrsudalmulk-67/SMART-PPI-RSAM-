const { execSync } = require('child_process');

try {
  const json = execSync('powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like \'*Jalankan_SMART_PPI*\' } | Select-Object -Property ProcessId | ConvertTo-Json"', { encoding: 'utf8' }).trim();
  if (json) {
    const data = JSON.parse(json);
    const list = Array.isArray(data) ? data : [data];
    for (const item of list) {
      if (item && item.ProcessId) {
        console.log('Killing PID:', item.ProcessId);
        try { execSync(`taskkill /F /PID ${item.ProcessId}`); } catch(e){}
      }
    }
  }
} catch (e) {
  console.log('Error or no process:', e.message);
}
