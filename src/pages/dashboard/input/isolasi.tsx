import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, ShieldCheck, ShieldAlert, Activity, ClipboardCheck, Droplets, Shield, Trash2, Syringe, Shirt, Wind, Bed, UserCheck, Sparkles, FlaskConical, Stethoscope, Briefcase, Users, Truck, Coffee, Home
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';

const standarIndicators = [
  { id: 'hh', title: 'Kepatuhan Kebersihan Tangan', desc: 'Kepatuhan petugas dalam melakukan 5 momen dan 6 langkah cuci tangan', icon: Droplets },
  { id: 'apd', title: 'Kepatuhan Penggunaan APD', desc: 'Ketersediaan dan kepatuhan penggunaan APD sesuai indikasi.', icon: Shield },
  { id: 'alat', title: 'Dekontaminasi Alat', desc: 'Proses pembersihan, disinfeksi, dan sterilisasi peralatan perawatan pasien.', icon: Stethoscope },
  { id: 'lingkungan', title: 'Pengendalian Lingkungan', desc: 'Kebersihan permukaan lingkungan, tempat tidur, dan peralatan di sekitarnya.', icon: Sparkles },
  { id: 'limbah_medis', title: 'Pengelolaan Limbah Medis', desc: 'Pemisahan limbah infeksius dan non-infeksius, tempat sampah tertutup.', icon: Trash2 },
  { id: 'limbah_tajam', title: 'Pengelolaan Limbah Tajam', desc: 'Ketersediaan dan kondisi safety box (tidak > 3/4 penuh).', icon: Syringe },
  { id: 'linen', title: 'Penatalaksanaan Linen', desc: 'Pemisahan linen kotor infeksius dan non-infeksius, troli tertutup.', icon: Shirt },
  { id: 'petugas', title: 'Perlindungan Kesehatan Petugas', desc: 'Pemeriksaan kesehatan berkala, imunisasi, penanganan pasca pajanan.', icon: UserCheck },
  { id: 'penempatan', title: 'Penempatan Pasien', desc: 'Penempatan pasien sesuai dengan cara penularan infeksi.', icon: Bed },
  { id: 'etika', title: 'Etika Batuk', desc: 'Edukasi dan fasilitas etika batuk (masker, tempat sampah).', icon: Wind },
  { id: 'suntik', title: 'Penyuntikan Yang Aman', desc: 'Penggunaan spuit sekali pakai, teknik aseptik.', icon: Syringe },
];

const transmisiIndicators = [
  { id: 'ruang_isolasi', title: 'Ruang Isolasi', desc: 'Audit fasilitas dan kepatuhan prosedur di dalam ruang isolasi.', icon: Home },
  { id: 'isolasi', title: 'PPI di Ruang Isolasi', desc: 'Kepatuhan petugas dan pengunjung di ruang isolasi.', icon: ShieldAlert },
  { id: 'airborne', title: 'Penempatan Pasien Airborne', desc: 'Ruang tekanan negatif, exhaust fan, pintu tertutup.', icon: Wind },
  { id: 'immuno', title: 'Penempatan Pasien Immunocompromised', desc: 'Ruang tekanan positif, perlindungan maksimal.', icon: ShieldCheck },
];

const monitoringIndicators = [
  { id: 'fasilitas_hh', title: 'Fasilitas Kebersihan Tangan', desc: 'Audit ketersediaan wastafel, sabun, dan handrub.', icon: Droplets },
  { id: 'fasilitas_apd', title: 'Fasilitas APD', desc: 'Audit ketersediaan stok APD di unit kerja.', icon: Shield },
  { id: 'ibs', title: 'Instalasi Bedah Sentral (IBS)', desc: 'Audit kepatuhan PPI di area kamar operasi.', icon: Activity },
  { id: 'cssd', title: 'CSSD', desc: 'Audit proses sterilisasi di pusat sterilisasi.', icon: Sparkles },
  { id: 'laboratorium', title: 'Laboratorium', desc: 'Audit kepatuhan PPI di area laboratorium.', icon: FlaskConical },
  { id: 'radiologi', title: 'Radiologi', desc: 'Audit kepatuhan PPI di area radiologi.', icon: Activity },
  { id: 'gizi', title: 'Gizi', desc: 'Audit higiene sanitasi makanan dan dapur gizi.', icon: Coffee },
  { id: 'jenazah', title: 'Kamar Jenazah', desc: 'Audit kepatuhan PPI di area pemulasaraan jenazah.', icon: Bed },
  { id: 'ambulance', title: 'Ambulance', desc: 'Audit kebersihan dan disinfeksi armada ambulance.', icon: Truck },
  { id: 'tps', title: 'Tempat Pembuangan Sampah (TPS)', desc: 'Audit pengelolaan limbah di area TPS.', icon: Trash2 },
  { id: 'tunggu', title: 'Ruang Tunggu', desc: 'Audit kebersihan dan fasilitas di ruang tunggu.', icon: Users },
  { id: 'farmasi', title: 'Farmasi', desc: 'Audit kepatuhan PPI di area Instalasi Farmasi.', icon: Briefcase },
];

function getCorrectHref(id: string) {
  if (id === 'isolasi') return '#';
  if (['ibs', 'cssd', 'laboratorium', 'radiologi', 'gizi', 'jenazah', 'ambulance', 'tps', 'tunggu', 'farmasi', 'ruang_isolasi', 'airborne', 'immuno'].includes(id)) return `/dashboard/input/monitoring-${id}`;
  if (id.startsWith('fasilitas')) return `/dashboard/input/monitoring-${id}`;
  return '/dashboard/input/penatalaksanaan-linen';
}

export default function IsolasiInputPage() {
  const [activeTab, setActiveTab] = useState<'standar' | 'transmisi' | 'monitoring'>('standar');

  const currentIndicators = useMemo(() => {
    if (activeTab === 'standar') return standarIndicators;
    if (activeTab === 'transmisi') return transmisiIndicators;
    return monitoringIndicators;
  }, [activeTab]);

  return (
    <div className="max-w-6xl mx-auto pb-28">
      <div className="flex items-center gap-4 mb-6 py-4 border-b border-white/5">
        <Link href="/dashboard/input" className="p-2.5 bg-white/5 rounded-xl border border-white/10 text-slate-400 hover:text-white transition-all">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-blue-600 to-emerald-600 dark:from-blue-400 dark:via-purple-500 dark:to-blue-400 bg-[length:200%_auto] animate-gradient transition-all uppercase">Kewaspadaan Isolasi</h1>
          <p className="text-sm font-bold uppercase tracking-widest text-emerald-600 dark:text-blue-400 mt-1">Input Data Audit</p>
        </div>
      </div>

      <div className="flex p-1 bg-white/5 rounded-xl mb-6 border border-white/5">
        <button onClick={() => setActiveTab('standar')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${
            activeTab === 'standar' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> Standar
        </button>
        <button onClick={() => setActiveTab('transmisi')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${
            activeTab === 'transmisi' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'
          }`}
        >
          <ShieldAlert className="w-4 h-4" /> Transmisi
        </button>
        <button onClick={() => setActiveTab('monitoring')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${
            activeTab === 'monitoring' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'
          }`}
        >
          <Activity className="w-4 h-4" /> Monitoring
        </button>
      </div>

      <AnimatePresence>
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {currentIndicators.map((ind) => (
            <div key={ind.id} className="bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-white/5 flex flex-col justify-between group hover:border-blue-500/30 transition-all">
              <div className="space-y-4">
                <div className="p-3 bg-white/5 border border-white/10 rounded-2xl w-fit group-hover:scale-110 transition-transform">
                  <ind.icon className="w-6 h-6 text-slate-400 group-hover:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg group-hover:text-blue-400 transition-colors">{ind.title}</h3>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-3">{ind.desc}</p>
                </div>
              </div>

              <Link 
                href={
                  ind.id === 'hh' ? "/dashboard/input/hand-hygiene" : 
                  ind.id === 'apd' ? "/dashboard/input/apd" : 
                  ind.id === 'alat' ? "/dashboard/input/dekontaminasi-alat" : 
                  ind.id === 'lingkungan' ? "/dashboard/input/pengendalian-lingkungan" :
                  ind.id === 'limbah_medis' ? "/dashboard/input/pengelolaan-limbah-medis" :
                  ind.id === 'limbah_tajam' ? "/dashboard/input/pengelolaan-limbah-tajam" :
                  ind.id === 'petugas' ? "/dashboard/input/perlindungan-petugas" :
                  ind.id === 'penempatan' ? "/dashboard/input/penempatan-pasien" :
                  ind.id === 'etika' ? "/dashboard/input/etika-batuk" :
                  ind.id === 'suntik' ? "/dashboard/input/penyuntikan-aman" :
                  getCorrectHref(ind.id)
                }
                className={
                  ind.id === 'jenazah' || ind.id === 'laboratorium' || ind.id === 'radiologi'
                  ? "mt-6 flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-blue-400 to-indigo-600 hover:from-blue-500 hover:to-indigo-700 text-white text-[11px] font-black uppercase tracking-widest rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all hover:shadow-[0_0_25px_rgba(59,130,246,0.7)] hover:-translate-y-0.5 active:scale-95 animate-pulse hover:animate-none"
                  : "mt-6 flex items-center justify-center gap-2 w-full py-4 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold uppercase tracking-widest rounded-2xl shadow-lg transition-all active:scale-95"
                }
              >
                {ind.id === 'jenazah' || ind.id === 'laboratorium' || ind.id === 'radiologi' ? <Activity className="w-4 h-4" /> : <ClipboardCheck className="w-4 h-4" />}
                INPUT DATA
              </Link>
            </div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

IsolasiInputPage.getLayout = function getLayout(page: React.ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};
