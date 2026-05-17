import { ReactElement, useState, useRef } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/DashboardLayout';
import { ArrowLeft, Save, Upload, X, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'motion/react';
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

  const pesertaOptions = [
    'Dokter', 'Dokter Spesialis', 'Perawat', 'Bidan', 'Analis Laboratorium', 
    'Radiografer', 'Farmasi', 'Pramusaji', 'Pegawai Baru', 'Cleaning Service', 'Mahasiswa PKL'
  ];

  const [isPesertaDropdownOpen, setIsPesertaDropdownOpen] = useState(false);

  const togglePeserta = (p: string) => {
    setPeserta(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(peserta.length === 0) { alert('Harap pilih minimal 1 peserta!'); return; }
    alert('Data pelatihan berhasil disimpan!');
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
                <button type="button" onClick={() => setIsPesertaDropdownOpen(!isPesertaDropdownOpen)} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-400 flex items-center justify-between outline-none focus:border-blue-500/50 transition-colors">
                  {peserta.length > 0 ? `${peserta.length} peserta terpilih` : 'Pilih peserta...'}
                  <span className="text-xs">▼</span>
                </button>
                {isPesertaDropdownOpen && (
                  <div className="absolute top-full left-0 w-full bg-slate-900 border border-white/10 rounded-xl mt-2 p-2 shadow-2xl z-20 max-h-60 overflow-y-auto">
                    {pesertaOptions.map(p => (
                      <button key={p} type="button" onClick={() => togglePeserta(p)} className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${peserta.includes(p) ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-white/5'}`}>
                        {p}
                        {peserta.includes(p) && <CheckCircle2 className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {peserta.map(p => (
                  <div key={p} className="flex items-center gap-1 bg-blue-600/20 border border-blue-500/50 text-blue-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                    {p}
                    <button type="button" onClick={() => togglePeserta(p)}><X className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Materi Pelatihan</label>
              <textarea rows={4} value={materi} onChange={(e) => setMateri(e.target.value)} required className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition-colors" placeholder="Masukkan materi..." />
            </div>

            <div className="border-t border-white/5 pt-6">
              <DocumentationUploader images={images} setImages={setImages} />
            </div>

            <div className="pt-4">
              <button type="submit" className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 text-white font-bold uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] group active:scale-[0.98] flex items-center justify-center gap-3">
                <Save className="w-5 h-5 group-hover:scale-110 transition-transform"/>
                Simpan Data
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </>
  );
}

DiklatPage.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};
