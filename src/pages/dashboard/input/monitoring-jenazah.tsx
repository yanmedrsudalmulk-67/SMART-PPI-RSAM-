import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import { 
  Activity, ArrowLeft, Save, CheckCircle2, Settings, Trash2, X, Sparkles, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { uploadImagesToSupabase } from '@/lib/upload';
import { DocumentationUploader, DocImage } from '@/components/DocumentationUploader';
import DashboardLayout from '@/components/DashboardLayout';
import { LiveStatisticsCard } from '@/components/LiveStatisticsCard';
import DigitalSignatureSection, { DigitalSignatureRef } from '@/components/DigitalSignatureSection';

const checklistItems = [
  {
    section: 'A. KEBERSIHAN RUANGAN DAN PERALATAN',
    items: [
      { id: 'a1', label: 'Lantai bersih dan tidak licin' },
      { id: 'a2', label: 'Permukaan tidak berdebu' },
      { id: 'a3', label: 'Tidak ada laba-laba / sarang kotoran' },
      { id: 'a4', label: 'Tempat sampah tertutup' },
      { id: 'a5', label: 'Wastafel cuci tangan selalu bersih dan bebas dari peralatan' },
      { id: 'a6', label: 'Keran selalu bersih dan tidak berkarat' },
      { id: 'a7', label: 'Penutup keranda bersih' },
      { id: 'a8', label: 'Mobil jenazah bersih' },
      { id: 'a9', label: 'Mobil jenazah dibersihkan setiap habis pakai' },
    ]
  },
  {
    section: 'B. FASILITAS',
    items: [
      { id: 'b1', label: 'Tersedia APD lengkap (sarung tangan, masker, tutup kepala, goggles, apron, sepatu boot)' },
      { id: 'b2', label: 'Alat cuci tangan lengkap (wastafel, sabun antiseptik, tissue, handrub)' },
      { id: 'b3', label: 'Tersedia handrub di mobil jenazah' },
      { id: 'b4', label: 'Tersedia spillkit di mobil jenazah' },
      { id: 'b5', label: 'Tersedia tempat sampah infeksius dan non infeksius' },
      { id: 'b6', label: 'Tersedia tempat linen kotor' },
    ]
  }
];

type AuditStatus = 'ya' | 'tidak' | 'na' | null;
type Observer = { id: string; nama: string };

export default function MonitoringJenazahPage() {
  const router = useRouter();
  
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [ruangan, setRuangan] = useState('Kamar Jenazah');
  const [observer, setObserver] = useState('');
  const [data, setData] = useState<Record<string, AuditStatus>>({});
  const [temuan, setTemuan] = useState('');
  const [rekomendasi, setRekomendasi] = useState('');
  const [pjName, setPjName] = useState('');
  const [images, setImages] = useState<DocImage[]>([]);
  const [observers, setObservers] = useState<Observer[]>([]);
  const [isObserverModalOpen, setIsObserverModalOpen] = useState(false);
  const [newObserverName, setNewObserverName] = useState('');
  const [editObserverId, setEditObserverId] = useState<string | null>(null);
  const sigRef = useRef<DigitalSignatureRef>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    fetchObservers();
    const initialData: Record<string, AuditStatus> = {};
    checklistItems.forEach(sec => sec.items.forEach(item => initialData[item.id] = null));
    setStartTime(new Date());
    setData(initialData);
  }, []);

  const fetchObservers = async () => {
    try {
      const { data, error } = await supabase.from('master_observers').select('*').order('nama');
      if (error) throw error;
      if (data) setObservers(data);
    } catch (err) {
      setObservers([{ id: '1', nama: 'IPCN_Adi Tresa Purnama' }]);
    }
  };

  const saveObserver = async () => {
    if (!newObserverName.trim()) return;
    try {
      if (editObserverId) {
        if (!editObserverId.startsWith('local-')) {
          await supabase.from('master_observers').update({ nama: newObserverName }).eq('id', editObserverId);
        }
        setObservers(prev => prev.map(o => o.id === editObserverId ? { ...o, nama: newObserverName } : o).sort((a,b) => a.nama.localeCompare(b.nama)));
      } else {
        const { data, error } = await supabase.from('master_observers').insert([{ nama: newObserverName }]).select();
        if (!error && data && data.length > 0) {
          setObservers(prev => [...prev, data[0]].sort((a,b) => a.nama.localeCompare(b.nama)));
        } else {
          setObservers(prev => [...prev, { id: 'local-' + Date.now().toString(), nama: newObserverName }].sort((a,b) => a.nama.localeCompare(b.nama)));
        }
      }
      setNewObserverName('');
      setEditObserverId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteObserver = async (id: string) => {
    if (!confirm('Hapus supervisor ini?')) return;
    try {
      if (!id.startsWith('local-')) await supabase.from('master_observers').delete().eq('id', id);
      setObservers(prev => prev.filter(o => o.id !== id));
      if (observer === (observers.find(o => o.id === id)?.nama)) setObserver('');
    } catch (err) {
      console.error(err);
    }
  };

  const toggleItem = (id: string, stat: AuditStatus) => {
    setData(prev => ({ ...prev, [id]: stat }));
  };

  const stats = useMemo(() => {
    let patuh = 0;
    let dinilai = 0;
    Object.values(data).forEach(val => {
      if (val === 'ya') { patuh++; dinilai++; }
      else if (val === 'tidak') { dinilai++; }
    });
    const persentase = dinilai > 0 ? Math.round((patuh / dinilai) * 100) : 0;
    let status = 'Belum Dinilai';
    if (dinilai > 0) status = persentase >= 85 ? 'Baik' : persentase >= 70 ? 'Cukup' : 'Perlu Tindak Lanjut';
    return { patuh, dinilai, persentase, status };
  }, [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!observer) { alert('Harap pilih Supervisor!'); return; }
    if (Object.values(data).some(v => v === null)) { alert('Harap isi semua checklist!'); return; }

    setIsSubmitting(true);
    try {
      const ttd_pj = sigRef.current?.getPjSignature();
      const ttd_ipcn = sigRef.current?.getSupervisorSignature();
      const uploadedUrls = await uploadImagesToSupabase(supabase, images, 'dokumentasi', 'audit');

      const payload = {
        waktu: startTime?.toISOString() || new Date().toISOString(),
        ruangan: ruangan,
        supervisor: observer,
        checklist_json: data,
        persentase: stats.persentase,
        status: stats.status,
        temuan, rekomendasi,
        nama_pj: pjName.trim(),
        ttd_pj,
        ttd_ipcn,
        dokumentasi: uploadedUrls
      };

      const sessionPayload = {
        indikator_id: 'monitoring_jenazah',
        nama_indikator: 'MONITORING KAMAR JENAZAH',
        tanggal_waktu: payload.waktu,
        observer,
        ruangan: ruangan,
        jumlah_dinilai: stats.dinilai,
        jumlah_patuh: stats.patuh,
        persentase: stats.persentase,
        status_kepatuhan: stats.status,
        temuan, rekomendasi,
        nama_pj_ruangan: pjName.trim(),
        ttd_pj_ruangan: ttd_pj,
        ttd_ipcn: ttd_ipcn,
        dokumentasi: uploadedUrls,
        data_indikator: data
      };

      const { data: sessionData, error: sessionError } = await supabase.from('audit_sessions').insert([sessionPayload]).select('*').single();
      if (sessionError) throw sessionError;

      const detailPayloads: any[] = [];
      checklistItems.forEach(sec => {
        sec.items.forEach(item => {
          detailPayloads.push({
            session_id: sessionData.id,
            pertanyaan_id: item.id,
            pertanyaan: item.label,
            jawaban: String(data[item.id])
          });
        });
      });
      await supabase.from('audit_details').insert(detailPayloads);

      await supabase.from('audit_kamar_jenazah').insert([{ ...payload, updated_at: new Date().toISOString() }]);

      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        router.push('/dashboard/input/isolasi');
      }, 2000);
    } catch (err: any) {
      console.error(err);
      alert(`Gagal menyimpan: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-32">
       <AnimatePresence>
        {showToast && (
          <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-emerald-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold uppercase tracking-widest text-xs border border-white/20"
          >
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            Data Audit Kamar Jenazah berhasil disimpan
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-6 py-6 border-b border-slate-200 dark:border-white/5">
        <Link href="/dashboard/input/isolasi" className="p-3 bg-white dark:bg-white/5 shadow-sm rounded-2xl border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-600 via-slate-500 to-gray-600 dark:from-slate-400 dark:via-gray-300 dark:to-slate-400 uppercase">Input Audit Kamar Jenazah</h1>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1">Audit kepatuhan Pencegahan dan Pengendalian Infeksi area Kamar Jenazah</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 grid xl:grid-cols-12 gap-8 items-start">
        <div className="xl:col-span-8 space-y-8">
          <div className="bg-white dark:bg-[#111827] shadow-sm p-6 lg:p-8 rounded-[2rem] border border-slate-200 dark:border-white/5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-white/5 pb-4 mb-6">1. INFORMASI UMUM</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Waktu Audit</label>
                <input type="datetime-local" value={startTime ? new Date(startTime.getTime() - startTime.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''} onChange={(e) => setStartTime(new Date(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:border-slate-500/50 [color-scheme:light] dark:[color-scheme:dark]" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Ruangan</label>
                <select value={ruangan} onChange={(e) => setRuangan(e.target.value)} required className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none">
                  <option value="Kamar Jenazah" className="dark:bg-slate-900">Kamar Jenazah</option>
                </select>
              </div>
              <div className="space-y-3 sm:col-span-2 md:col-span-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex justify-between items-center">
                  Supervisor
                  <button type="button" onClick={() => setIsObserverModalOpen(true)} className="p-1.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors rounded-lg text-slate-600 dark:text-slate-400"><Settings className="w-3 h-3" /></button>
                </label>
                <select value={observer} onChange={(e) => setObserver(e.target.value)} required className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none">
                  <option value="" className="text-slate-500">Pilih Supervisor...</option>
                  {observers.map(o => <option key={o.id} value={o.nama} className="dark:bg-slate-900">{o.nama}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#111827] shadow-sm p-6 lg:p-8 rounded-[2rem] border border-slate-200 dark:border-white/5 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-white/5 pb-4 mb-6">
               <User className="w-5 h-5 text-slate-500" />
               <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-300">2. CEKLIST KAMAR JENAZAH</h2>
            </div>
            
            <div className="space-y-8">
               {checklistItems.map((sec, sIdx) => (
                  <div key={sIdx} className="space-y-4">
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-500 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-white/10">{sec.section}</h3>
                    <div className="grid md:grid-cols-1 gap-4">
                      {sec.items.map((item) => (
                        <div key={item.id} className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 hover:border-slate-500/30 transition-colors">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed max-w-lg">{item.label}</p>
                          <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl shrink-0 w-full sm:w-fit border border-slate-200 dark:border-white/5">
                            {['ya', 'tidak', 'na'].map(choice => (
                              <button key={choice} type="button" onClick={() => toggleItem(item.id, choice as any)}
                                className={`flex-1 sm:flex-none px-5 sm:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                  data[item.id] === choice 
                                    ? (choice === 'ya' ? 'bg-emerald-500 text-white shadow-md' : choice === 'tidak' ? 'bg-rose-500 text-white shadow-md' : 'bg-slate-500 text-white shadow-md')
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/5'
                                }`}
                              >
                                {choice === 'ya' ? 'Ya' : choice === 'tidak' ? 'Tidak' : 'N/A'}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
               ))}
            </div>
          </div>
        </div>

        <div className="xl:col-span-4 space-y-6 sticky top-24">
          <LiveStatisticsCard totalDinilai={stats.dinilai} totalPatuh={stats.patuh} totalTidakPatuh={stats.dinilai - stats.patuh} persentase={stats.persentase} statusText={stats.status} title="3. PERSENTASE KEPATUHAN" />

          <div className="bg-white dark:bg-[#111827] shadow-sm p-6 lg:p-8 rounded-[2rem] border border-slate-200 dark:border-white/5 space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">4. TEMUAN</label>
              <textarea value={temuan} onChange={(e) => setTemuan(e.target.value)} placeholder="Tulis temuan audit..." className="w-full h-24 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 text-sm text-slate-800 dark:text-white outline-none resize-none focus:border-slate-500" />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">5. REKOMENDASI</label>
              <textarea value={rekomendasi} onChange={(e) => setRekomendasi(e.target.value)} placeholder="Tulis rekomendasi perbaikan..." className="w-full h-24 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 text-sm text-slate-800 dark:text-white outline-none resize-none focus:border-slate-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-[#111827] flex flex-col shadow-sm p-6 lg:p-8 rounded-[2rem] border border-slate-200 dark:border-white/5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-white/5 pb-4 mb-6">6. DOKUMENTASI FOTO</h2>
            <DocumentationUploader images={images} setImages={setImages} />
          </div>

          <div className="bg-white dark:bg-[#111827] shadow-sm p-6 lg:p-8 rounded-[2rem] border border-slate-200 dark:border-white/5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-white/5 pb-4 mb-6">7. TANDA TANGAN DIGITAL</h2>
            <DigitalSignatureSection ref={sigRef} pjName={pjName} setPjName={setPjName} pjLabel="PJ RUANGAN" />
          </div>

          <div className="pb-10 pt-4 z-50 sticky bottom-4">
            <button type="submit" disabled={isSubmitting} className="w-full group relative flex justify-center items-center gap-3 bg-gradient-to-r from-slate-600 to-gray-700 hover:from-slate-500 hover:to-gray-600 text-white font-black uppercase tracking-widest rounded-2xl py-5 transition-all shadow-[0_15px_30px_-10px_rgba(71,85,105,0.6)] hover:shadow-[0_20px_40px_-10px_rgba(71,85,105,0.8)] hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? <Activity className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6 group-hover:scale-110 transition-transform" />}
              <span className="text-sm">💾 Simpan Data Audit</span>
            </button>
          </div>
        </div>
      </form>

      {/* MODAL SUPERVISOR */}
      <AnimatePresence>
        {isObserverModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsObserverModalOpen(false)} className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2rem] p-8 overflow-hidden shadow-2xl">
               <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-3">Kelola Supervisor</h3>
                <button onClick={() => setIsObserverModalOpen(false)} className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-white/5 rounded-xl transition-colors"><X className="w-4 h-4" /></button>
              </div>
              <div className="flex gap-2 mb-6">
                <input type="text" value={newObserverName} onChange={(e) => setNewObserverName(e.target.value)} placeholder="Nama Supervisor..." className="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm text-slate-800 dark:text-white outline-none focus:border-slate-500" />
                <button onClick={saveObserver} className="px-4 py-2 bg-slate-600 text-white rounded-xl text-xs font-bold uppercase hover:bg-slate-700 shadow-md transition-colors">{editObserverId ? 'OK' : '+'}</button>
              </div>
              <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                {observers.map(o => (
                  <div key={o.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{o.nama}</span>
                    <div className="flex gap-1 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-white/5">
                      <button onClick={() => { setNewObserverName(o.nama); setEditObserverId(o.id); }} className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors"><Settings className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteObserver(o.id)} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

MonitoringJenazahPage.getLayout = function getLayout(page: React.ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};
