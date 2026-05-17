import { ReactElement, useState, useRef } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/DashboardLayout';
import {  ArrowLeft, Save, Upload, X, CheckCircle2 , RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { DocumentationUploader, DocImage } from '@/components/DocumentationUploader';

export default function DiklatPage() {
  const [judulPendidikan, setJudulPendidikan] = useState('');
  const [jenisPendidikan, setJenisPendidikan] = useState('sosialisasi');
  const [waktu, setWaktu] = useState(new Date().toISOString().slice(0, 16));
  const [tempat, setTempat] = useState('');
  const [narasumber, setNarasumber] = useState('');
  const [peserta, setPeserta] = useState<string[]>([]);
  const [materi, setMateri] = useState('');
  const [images, setImages] = useState<DocImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pesertaOptions = [
    'Dokter', 'Dokter Spesialis', 'Perawat', 'Bidan', 'Analis Laboratorium', 
    'Radiografer', 'Farmasi', 'Pramusaji', 'Pegawai Baru', 'Cleaning Service', 'Mahasiswa PKL'
  ];

  const [isPesertaDropdownOpen, setIsPesertaDropdownOpen] = useState(false);

  const togglePeserta = (p: string) => {
    setPeserta(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(peserta.length === 0) { alert('Harap pilih minimal 1 peserta!'); return; }
    
    setIsSubmitting(true);
    try {
      // Mock delay for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Data pelatihan berhasil disimpan!');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Pendidikan & Pelatihan - SMART PPI</title>
      </Head>

      <div className="max-w-2xl mx-auto pb-16">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard/input" className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white uppercase bg-clip-text">Pendidikan & Pelatihan</h1>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mt-1">Input Data Pelatihan PPI</p>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 shadow-2xl"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Waktu Kegiatan</label>
                <input type="datetime-local" value={waktu} onChange={(e) => setWaktu(e.target.value)} required className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition-colors [color-scheme:dark]" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Tempat</label>
                <input type="text" value={tempat} onChange={(e) => setTempat(e.target.value)} required className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition-colors" placeholder="Masukkan lokasi..." />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Narasumber</label>
              <input type="text" value={narasumber} onChange={(e) => setNarasumber(e.target.value)} required className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition-colors" placeholder="Masukkan nama narasumber..." />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Peserta Pelatihan</label>
              <div className="relative">
                <button type="button" onClick={() => setIsPesertaDropdownOpen(!isPesertaDropdownOpen)} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-left text-white outline-none focus:border-blue-500/50 transition-colors flex justify-between items-center">
                  <span className="truncate">{peserta.length > 0 ? `${peserta.length} Profesi Terpilih` : 'Pilih Profesi Peserta...'}</span>
                  <div className="flex gap-2 items-center">
                     <span className="text-xs text-slate-500 font-medium">Buka</span>
                  </div>
                </button>

                <AnimatePresence>
                  {isPesertaDropdownOpen && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute z-50 w-full mt-2 bg-slate-800 border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                      <div className="max-h-60 overflow-y-auto p-2">
                        {['Dokter Umum', 'Dokter Spesialis', 'Perawat', 'Bidan', 'Analis Laboratorium', 'Radiografer', 'Pramusaji', 'Pekarya', 'Satpam', 'Cleaning Service', 'Manajemen', 'Staf Administrasi'].map(p => (
                          <label key={p} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg cursor-pointer transition-colors">
                            <input type="checkbox" checked={peserta.includes(p)} onChange={(e) => {
                              if(e.target.checked) setPeserta([...peserta, p]);
                              else setPeserta(peserta.filter(x => x !== p));
                            }} className="w-4 h-4 rounded border-white/20 bg-black/50 text-blue-500 focus:ring-blue-500/50 focus:ring-offset-slate-900" />
                            <span className="text-sm text-slate-300 font-medium">{p}</span>
                          </label>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {peserta.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {peserta.map(p => (
                    <span key={p} className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded-lg flex items-center gap-2">
                      {p} <button type="button" onClick={() => setPeserta(peserta.filter(x => x !== p))} className="hover:text-white"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
               <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Dokumentasi Kegiatan</label>
               <DocumentationUploader images={images} setImages={setImages} />
            </div>

            <button type="submit" disabled={isSubmitting || !waktu || !tempat || !narasumber || peserta.length === 0}
              className="w-full flex justify-center items-center gap-4 py-5 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-widest rounded-2xl transition-all shadow-lg disabled:opacity-50 mt-8"
            >
              {isSubmitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              <span>Simpan Data Audit</span>
            </button>
          </form>
        </motion.div>
      </div>
    </>
  );
}

DiklatPage.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};
