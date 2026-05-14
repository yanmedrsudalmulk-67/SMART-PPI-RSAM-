import React, { useState, useMemo, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { Activity, ArrowLeft, Plus, Trash2, Save, AlertCircle, Info, CheckCircle2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';
import { DigitalSignatureRef } from '@/components/DigitalSignatureSection';

// Dynamic import for Signature Section
const DigitalSignatureSection = dynamic(() => import('@/components/DigitalSignatureSection'), { ssr: false });

const categories = [
  'Ranap Dewasa', 'Ranap Bedah', 'Ranap Anak', 'Ranap Kebidanan', 'ICU'
];

interface PasienRow {
  id: string;
  nama: string;
  rm: string;
  tindakan: string; 
  jmlPemasangan: number | '';
  jmlInsiden: number | '';
}

export default function SurveilansFormPage() {
  const router = useRouter();

  const [date, setDate] = useState<string>('');
  const [petugas, setPetugas] = useState<string>('');
  const [kategori, setKategori] = useState<string>('');
  
  const [rows, setRows] = useState<PasienRow[]>([]);
  const [pjName, setPjName] = useState('');
  const sigRef = useRef<DigitalSignatureRef>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000; 
    const localISOTime = (new Date(now.getTime() - tzOffset)).toISOString().slice(0,16);
    setDate(localISOTime);
    setRows([{ id: Date.now().toString(), nama: '', rm: '', tindakan: '', jmlPemasangan: '', jmlInsiden: '' }]);
  }, []);

  const addRow = () => {
    setRows([...rows, { id: Date.now().toString() + Math.random().toString(), nama: '', rm: '', tindakan: '', jmlPemasangan: '', jmlInsiden: '' }]);
  };

  const removeRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter(r => r.id !== id));
    }
  };

  const updateRow = (id: string, field: keyof PasienRow, value: any) => {
    setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const totalPemasangan = useMemo(() => rows.reduce((acc, row) => acc + (typeof row.jmlPemasangan === 'number' ? row.jmlPemasangan : 0), 0), [rows]);
  const totalInsiden = useMemo(() => rows.reduce((acc, row) => acc + (typeof row.jmlInsiden === 'number' ? row.jmlInsiden : 0), 0), [rows]);
  const totalRate = useMemo(() => totalPemasangan === 0 ? 0 : (totalInsiden / totalPemasangan) * 1000, [totalPemasangan, totalInsiden]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!date || !petugas || !kategori) {
      setError('Harap lengkapi Waktu, Petugas, dan Kategori.');
      return;
    }

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r.nama.trim() || !r.rm.trim() || !r.tindakan || r.jmlPemasangan === '' || r.jmlInsiden === '') {
        setError(`Data pasien pada baris ke-${i + 1} belum lengkap.`);
        return;
      }
    }

    setIsSubmitting(true);
    
    try {
      // Save each row to insiden_hais
      const promises = rows.map(r => {
        const count = Number(r.jmlPemasangan);
        const insidenCount = Number(r.jmlInsiden);
        const rate = count > 0 ? (insidenCount / count) * 1000 : 0;
        return supabase.from('insiden_hais').insert([{
          created_at: new Date(date).toISOString(),
          unit: kategori,
          ruangan: kategori,
          jenis: r.tindakan,
          rate: rate,
          petugas: petugas,
          nama_pasien: r.nama,
          no_rm: r.rm,
          jml_pemasangan: r.jmlPemasangan,
          jml_insiden: r.jmlInsiden
        }]);
      });

      // Also save to audit_sessions for general log
      promises.push(supabase.from('audit_sessions').insert([{
        indikator_id: 'surveilans_hais',
        nama_indikator: 'SURVEILANS HAIS',
        tanggal_waktu: new Date(date).toISOString(),
        observer: petugas,
        unit: kategori,
        jumlah_dinilai: totalPemasangan,
        jumlah_patuh: totalPemasangan - totalInsiden,
        persentase: totalRate,
        status_kepatuhan: totalRate <= 1.5 ? 'Baik' : 'Perlu Perhatian',
        data_indikator: { rows }
      }]));

      await Promise.all(promises);

      setShowToast(true);
      setTimeout(() => {
        router.push('/dashboard/input');
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError(`Gagal menyimpan data: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-32 space-y-6">
      <div className="flex items-center gap-4 mb-6 py-4 border-b border-white/5">
        <Link href="/dashboard/input" className="p-2.5 bg-white/5 rounded-xl border border-white/10 text-slate-400 hover:text-white transition-all">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-blue-500 to-emerald-500 dark:from-blue-400 dark:via-purple-500 dark:to-blue-400 bg-[length:200%_auto] animate-gradient transition-all drop-shadow-sm dark:drop-shadow-[0_0_10px_rgba(59,130,246,0.4)] uppercase">Surveilans HAIs</h1>
          <p className="text-sm font-bold uppercase tracking-widest text-emerald-600 dark:text-blue-400 mt-1">Input Data Surveilans</p>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl flex items-center gap-3 text-sm font-medium"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white/5 backdrop-blur-xl grid grid-cols-1 md:grid-cols-3 gap-6 p-6 sm:p-8 rounded-[2rem] border border-white/5">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Waktu Surveilans</label>
            <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 [color-scheme:dark]" />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Nama Petugas</label>
            <input type="text" value={petugas} onChange={(e) => setPetugas(e.target.value)} placeholder="Masukkan nama petugas..." className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl text-sm outline-none focus:border-blue-500/50" />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Kategori Unit</label>
            <select value={kategori} onChange={(e) => setKategori(e.target.value)} className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl text-sm outline-none focus:border-blue-500/50">
              <option value="" className="bg-slate-900">Pilih Kategori</option>
              {categories.map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
            </select>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl p-6 sm:p-8 rounded-[2rem] border border-white/5 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Data Pasien</h2>
          </div>
          
          <div className="overflow-x-auto -mx-6 px-6 sm:-mx-8 sm:px-8 pb-4">
            <table className="w-full min-w-[900px] text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-slate-400">
                  <th className="pb-3 w-12 font-bold text-center">No</th>
                  <th className="pb-3 px-2 font-bold min-w-[180px]">Nama Pasien</th>
                  <th className="pb-3 px-2 font-bold min-w-[120px]">No. RM</th>
                  <th className="pb-3 px-2 font-bold min-w-[140px]">Tindakan</th>
                  <th className="pb-3 px-2 font-bold min-w-[140px]">Jml Hari Pasang</th>
                  <th className="pb-3 px-2 font-bold min-w-[120px]">Jml Insiden</th>
                  <th className="pb-3 w-16 px-2 font-bold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={row.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 text-center text-sm text-slate-500">{idx + 1}</td>
                    <td className="py-3 px-2">
                      <input type="text" placeholder="Nama Pasien..." value={row.nama} onChange={(e) => updateRow(row.id, 'nama', e.target.value)} className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-lg text-sm outline-none" />
                    </td>
                    <td className="py-3 px-2">
                      <input type="text" placeholder="No RM..." value={row.rm} onChange={(e) => updateRow(row.id, 'rm', e.target.value)} className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-lg text-sm outline-none" />
                    </td>
                    <td className="py-3 px-2">
                      <select value={row.tindakan} onChange={(e) => updateRow(row.id, 'tindakan', e.target.value)} className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-lg text-sm outline-none">
                        <option value="" className="bg-slate-900">Pilih Tindakan</option>
                        <option value="Phlebitis" className="bg-slate-900">Phlebitis</option>
                        <option value="ISK" className="bg-slate-900">ISK</option>
                        <option value="IDO" className="bg-slate-900">IDO</option>
                        <option value="VAP" className="bg-slate-900">VAP</option>
                      </select>
                    </td>
                    <td className="py-3 px-2">
                      <input type="number" min="0" value={row.jmlPemasangan} onChange={(e) => updateRow(row.id, 'jmlPemasangan', e.target.value === '' ? '' : parseInt(e.target.value))} className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-lg text-sm outline-none" />
                    </td>
                    <td className="py-3 px-2">
                      <input type="number" min="0" value={row.jmlInsiden} onChange={(e) => updateRow(row.id, 'jmlInsiden', e.target.value === '' ? '' : parseInt(e.target.value))} className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-lg text-sm outline-none" />
                    </td>
                    <td className="py-3 px-2 text-center">
                      <button type="button" onClick={() => removeRow(row.id)} disabled={rows.length === 1} className="p-2 text-slate-500 hover:text-red-400 disabled:opacity-30"><Trash2 className="w-5 h-5 mx-auto" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <button type="button" onClick={addRow} className="mt-4 flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-white/10 text-slate-500 font-medium rounded-xl hover:bg-white/5 hover:text-white transition-all text-sm">
            <Plus className="w-4 h-4" /> Tambah Baris Pasien
          </button>
        </div>

        <div className="bg-slate-900 border border-white/10 rounded-[2rem] p-6 grid grid-cols-1 sm:grid-cols-3 gap-6 relative overflow-hidden">
          <div className="flex flex-col items-center pt-2 sm:pt-0">
            <p className="text-blue-400 font-bold text-[10px] uppercase tracking-widest mb-1">Total Pemasangan</p>
            <p className="text-3xl font-black text-white">{totalPemasangan}</p>
          </div>
          <div className="flex flex-col items-center pt-4 sm:pt-0 border-t sm:border-t-0 sm:border-l border-white/10">
            <p className="text-red-400 font-bold text-[10px] uppercase tracking-widest mb-1">Total Insiden</p>
            <p className="text-3xl font-black text-white">{totalInsiden}</p>
          </div>
          <div className="flex flex-col items-center pt-4 sm:pt-0 border-t sm:border-t-0 sm:border-l border-white/10">
            <p className="text-emerald-400 font-bold text-[10px] uppercase tracking-widest mb-1">Insiden Rate (‰)</p>
            <p className="text-3xl font-black text-white">{totalRate.toFixed(2)}</p>
          </div>
        </div>

        <DigitalSignatureSection ref={sigRef} pjName={pjName} setPjName={setPjName} />

        <button type="submit" disabled={isSubmitting} className="w-full flex justify-center items-center gap-4 py-5 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-widest rounded-2xl transition-all shadow-lg">
          {isSubmitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          <span>Simpan Data Surveilans</span>
        </button>
      </form>

      <AnimatePresence>
        {showToast && (
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-blue-600 text-white px-8 py-4 rounded-2xl shadow-xl font-bold uppercase tracking-widest text-xs border border-white/20"
          >
            <CheckCircle2 className="w-5 h-5 inline-block mr-2" />
            Data Surveilans HAIs Tersimpan!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

SurveilansFormPage.getLayout = function getLayout(page: React.ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};
