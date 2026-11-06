const os = require('os');

function getLocalIp() {
  const nets = os.networkInterfaces();
  const candidates = [];

  for (const name of Object.keys(nets)) {
    const interfaces = nets[name];
    if (!interfaces) continue;

    for (const iface of interfaces) {
      if (iface.family === 'IPv4' && !iface.internal) {
        if (!iface.address.startsWith('169.254.')) {
          candidates.push({ name, ip: iface.address });
        }
      }
    }
  }

  if (candidates.length > 0) {
    const preferred = candidates.find(c => /wi-?fi|ethernet|wlan|lan/i.test(c.name)) || candidates[0];
    return preferred.ip;
  }
  return '127.0.0.1';
}

const localIp = getLocalIp();
console.log('====================================================================');
console.log('             SMART PPI RSUD AL-MULK SIAP DIGUNAKAN');
console.log('====================================================================');
console.log(`  > Akses Komputer Ini (Lokal) : http://localhost:3001`);
console.log(`  > Akses Jaringan Wi-Fi/LAN   : http://${localIp}:3001`);
console.log(`  > Akses Internet / Online    : https://www.rsudalmulkmobile.xyz`);
console.log('====================================================================');
console.log('  Membuka browser otomatis...');
