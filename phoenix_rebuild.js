const fs = require('fs');

const template = fs.readFileSync('template.txt', 'utf8');
const config = JSON.parse(fs.readFileSync('extraction.json', 'utf8'));

const fallbackItems = {
  "app/dashboard/input/apd/page.tsx": {
    title: "Monitoring Fasilitas APD",
    id: "monitoring_fasilitas_apd",
    items: `[
      { id: '1', label: 'Tersedia masker di ruangan' },
      { id: '2', label: 'Tersedia sarung tangan non steril' },
      { id: '3', label: 'Tersedia sarung tangan steril' },
      { id: '4', label: 'Tersedia penutup kepala' },
      { id: '5', label: 'Tersedia gaun pelindung' },
      { id: '6', label: 'Tersedia apron' },
      { id: '7', label: 'Tersedia goggle / perisai wajah' },
      { id: '8', label: 'Tersedia pelindung kaki' }
    ]`
  },
  "app/dashboard/input/dekontaminasi-alat/page.tsx": {
    title: "Audit Dekontaminasi Alat",
    id: "monitoring_dekontaminasi_alat",
    items: `[
      { id: '1', label: 'Petugas menggunakan APD lengkap' },
      { id: '2', label: 'Proses perendaman sesuai standar' },
      { id: '3', label: 'Pembersihan alat secara menyeluruh' },
      { id: '4', label: 'Pengeringan alat dilakukan dengan benar' },
      { id: '5', label: 'Pengepakan alat sesuai prosedur' },
      { id: '6', label: 'Pelabelan indikator sterilisasi terpasang' }
    ]`
  },
  "app/dashboard/input/hand-hygiene/page.tsx": {
    title: "Audit Hand Hygiene",
    id: "audit_hh",
    items: `[
      { id: 'm1', label: 'Momen 1: Sebelum kontak dengan pasien' },
      { id: 'm2', label: 'Momen 2: Sebelum melakukan tindakan aseptik' },
      { id: 'm3', label: 'Momen 3: Sesudah menyentuh cairan tubuh pasien' },
      { id: 'm4', label: 'Momen 4: Sesudah kontak dengan pasien' },
      { id: 'm5', label: 'Momen 5: Sesudah menyentuh lingkungan pasien' }
    ]`
  }
};

Object.keys(config).forEach(file => {
  let { title, checklistItems: items } = config[file];
  let id = file.split('/').slice(-2, -1)[0].replace(/-/g, '_');
  
  if (!items && fallbackItems[file]) {
    items = fallbackItems[file].items;
    title = fallbackItems[file].title;
    id = fallbackItems[file].id;
  }
  
  if (!items) {
     console.log('Skipping ' + file + ' - no items found');
     return;
  }

  // Clean items
  if (items.includes('as const')) items = items.split('as const')[0].trim();

  const componentName = file.split('/').slice(-2, -1)[0].split('-').map(s => s[0].toUpperCase() + s.slice(1)).join('') + 'Page';
  
  let pageContent = template
    .split('{{ITEMS}}').join(items)
    .split('{{COMPONENT_NAME}}').join(componentName)
    .split('{{INDIKATOR_ID}}').join(id)
    .split('{{TITLE_UPPER}}').join(title.toUpperCase().replace(/-/g, ' '))
    .split('{{TITLE}}').join(title.toUpperCase().replace(/-/g, ' '))
    .split('{{SUBTITLE}}').join("Input Audit Kepatuhan PPI RSUD AL-MULK");

  fs.writeFileSync(file, pageContent, 'utf8');
  console.log('Phoenix Rebuild Success: ' + file);
});
