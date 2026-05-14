import { ReactElement, useState } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/DashboardLayout';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'motion/react';

export default function DiklatPage() {
  const [judulPendidikan, setJudulPendidikan] = useState('');
  const [jenisPendidikan, setJenisPendidikan] = useState('sosialisasi');
  const [tanggal, setTanggal] = useState('');
  const [jumlahPeserta, setJumlahPeserta] = useState('');
  const [keterangan, setKeterangan] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Data Pendidikan & Pelatihan (Diklat) berhasil disimpan! (Placeholder)');
  };

  return (
    <>
      <Head>
        <title>Input Diklat - SMART PPI</title>
      </Head>

      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/input" className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-300" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Pendidikan & Pelatihan (Diklat)</h1>
            <p className="text-sm text-slate-400">Input data kegiatan pendidikan dan pelatihan PPI</p>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Judul Kegiatan</label>
                <input 
                  type="text" 
                  value={judulPendidikan} 
                  onChange={(e) => setJudulPendidikan(e.target.value)} 
                  required
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition-colors"
                  placeholder="Misal: Sosialisasi Hand Hygiene"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Jenis Kegiatan</label>
                <select 
                  value={jenisPendidikan} 
                  onChange={(e) => setJenisPendidikan(e.target.value)} 
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition-colors"
                >
                  <option value="sosialisasi" className="bg-slate-900">Sosialisasi</option>
                  <option value="inhouse_training" className="bg-slate-900">Inhouse Training</option>
                  <option value="workshop" className="bg-slate-900">Workshop / Seminar</option>
                  <option value="orientasi" className="bg-slate-900">Orientasi Karyawan Baru</option>
                  <option value="lainnya" className="bg-slate-900">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Tanggal Kegiatan</label>
                <input 
                  type="date" 
                  value={tanggal} 
                  onChange={(e) => setTanggal(e.target.value)} 
                  required
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Jumlah Peserta</label>
                <input 
                  type="number" 
                  min="1"
                  value={jumlahPeserta} 
                  onChange={(e) => setJumlahPeserta(e.target.value)} 
                  required
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition-colors"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Keterangan Tambahan</label>
              <textarea 
                rows={4}
                value={keterangan} 
                onChange={(e) => setKeterangan(e.target.value)} 
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition-colors"
                placeholder="Catatan kegiatan..."
              />
            </div>

            <div className="flex justify-end pt-4">
              <button 
                type="submit" 
                disabled={!judulPendidikan || !tanggal || !jumlahPeserta}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"
              >
                <Save className="w-5 h-5" />
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
