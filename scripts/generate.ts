import fs from 'fs';
import path from 'path';

const pages = {
  'dekontaminasi-alat': { title: 'Dekontaminasi Alat', desc: 'Prosedur dekontaminasi' },
  'pengendalian-lingkungan': { title: 'Pengendalian Lingkungan', desc: 'Kebersihan lingkungan' },
  'pengelolaan-limbah-medis': { title: 'Pengelolaan Limbah Medis', desc: 'Limbah Medis' },
  'pengelolaan-limbah-tajam': { title: 'Pengelolaan Limbah Tajam', desc: 'Limbah Tajam' },
  'perlindungan-petugas': { title: 'Perlindungan Kesehatan Petugas', desc: 'Kesehatan Petugas' },
  'penempatan-pasien': { title: 'Penempatan Pasien', desc: 'Penempatan pasien' },
  'penyuntikan-aman': { title: 'Penyuntikan Aman', desc: 'Praktik penyuntikan aman' },
  'penatalaksanaan-linen': { title: 'Penatalaksanaan Linen', desc: 'Pengelolaan linen' },
};

const templatePath = path.join(process.cwd(), 'src/pages/dashboard/input/etika-batuk.tsx');
const template = fs.readFileSync(templatePath, 'utf8');

for (const [id, { title, desc }] of Object.entries(pages)) {
  const filePath = path.join(process.cwd(), `src/pages/dashboard/input/${id}.tsx`);
  if (!fs.existsSync(filePath)) {
    const ComponentName = 'Input' + id.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('') + 'Page';
    let newContent = template.replace(/InputEtikaBatukPage/g, ComponentName);
    newContent = newContent.replace(/etika_batuk/g, id.replace(/-/g, '_'));
    newContent = newContent.replace(/EtikaStatus/g, 'AuditStatus');
    newContent = newContent.replace(/Etika/g, 'Audit');
    newContent = newContent.replace(/etika/g, 'audit');
    newContent = newContent.replace(/ETIKA BATUK/g, title.toUpperCase());
    newContent = newContent.replace(/Audit Etika Batuk/g, `Audit ${title}`);
    newContent = newContent.replace(/Observasi kepatuhan etika batuk dan bersin/g, `Observasi ${desc}`);
    
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Created ${filePath}`);
  }
}

const monitoringPages = {
  'monitoring-ibs': { title: 'Monitoring IBS', desc: 'Audit kepatuhan PPI di area kamar operasi', auditId: 'ibs' },
  'monitoring-cssd': { title: 'Monitoring CSSD', desc: 'Audit proses sterilisasi di pusat sterilisasi', auditId: 'cssd' },
  'monitoring-laboratorium': { title: 'Monitoring Laboratorium', desc: 'Audit kepatuhan PPI di area laboratorium', auditId: 'laboratorium' },
  'monitoring-radiologi': { title: 'Monitoring Radiologi', desc: 'Audit kepatuhan PPI di area radiologi', auditId: 'radiologi' },
  'monitoring-gizi': { title: 'Monitoring Gizi', desc: 'Audit higiene sanitasi makanan dan dapur gizi', auditId: 'gizi' },
  'monitoring-jenazah': { title: 'Monitoring Kamar Jenazah', desc: 'Audit kepatuhan PPI di area pemulasaraan jenazah', auditId: 'jenazah' },
  'monitoring-ambulance': { title: 'Monitoring Ambulance', desc: 'Audit kebersihan dan disinfeksi armada ambulance', auditId: 'ambulance' },
  'monitoring-tunggu': { title: 'Monitoring Ruang Tunggu', desc: 'Audit kebersihan dan fasilitas di ruang tunggu', auditId: 'tunggu' },
  'monitoring-farmasi': { title: 'Monitoring Farmasi', desc: 'Audit kepatuhan PPI di area Instalasi Farmasi', auditId: 'farmasi' },
  'monitoring-ruang_isolasi': { title: 'Monitoring Ruang Isolasi', desc: 'Audit fasilitas dan kepatuhan prosedur di dalam ruang isolasi', auditId: 'ppi_ruang_isolasi' },
  'monitoring-airborne': { title: 'Monitoring Penempatan Pasien Airborne', desc: 'Ruang tekanan negatif, exhaust fan, pintu tertutup', auditId: 'airborne' },
  'monitoring-immuno': { title: 'Monitoring Penempatan Pasien Immunocompromised', desc: 'Ruang tekanan positif, perlindungan maksimal', auditId: 'immuno' },
};

const monitoringTemplatePath = path.join(process.cwd(), 'src/pages/dashboard/input/monitoring-tps.tsx');
const monitoringTemplate = fs.readFileSync(monitoringTemplatePath, 'utf8');

for (const [id, { title, desc, auditId }] of Object.entries(monitoringPages)) {
  const filePath = path.join(process.cwd(), `src/pages/dashboard/input/${id}.tsx`);
  if (!fs.existsSync(filePath)) {
    const ComponentName = id.split('-').map(s => s.charAt(0).toUpperCase() + (s === 'cssd' ? s.toUpperCase() : s.slice(1))).join('') + 'Page';
    // Fix ComponentName generation for IBS/CSSD
    let name = id.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('') + 'Page';
    if (id === 'monitoring-ibs') name = 'MonitoringIBSPage';
    if (id === 'monitoring-cssd') name = 'MonitoringCSSDPage';
    
    let newContent = monitoringTemplate.replace(/MonitoringTPSPage/g, name);
    newContent = newContent.replace(/monitoring_tps/g, `monitoring_${auditId}`);
    newContent = newContent.replace(/tps/g, auditId);
    newContent = newContent.replace(/MONITORING TEMPAT PEMBUANGAN SAMPAH \(TPS\)/g, title.toUpperCase());
    newContent = newContent.replace(/Monitoring TPS/g, title);
    newContent = newContent.replace(/Audit pengelolaan limbah di area TPS/g, desc);
    
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Created ${filePath}`);
  }
}
