import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import { 
  Activity, ArrowLeft, Save, CheckCircle2, Settings, Trash2, X, Plus, Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { uploadImagesToSupabase } from '@/lib/upload';
import { DocumentationUploader, DocImage } from '@/components/DocumentationUploader';
import { useAppContext } from '@/components/Providers';
import DashboardLayout from '@/components/DashboardLayout';
import { LiveStatisticsCard } from '@/components/LiveStatisticsCard';
import DigitalSignatureSection, { DigitalSignatureRef } from '@/components/DigitalSignatureSection';

const checklistItems = [
  {
    section: 'SUB SECTION A — KEBERSIHAN RUANGAN DAN PERALATAN',
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
    section: 'SUB SECTION B — FASILITAS',
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

export default function KamarJenazahInputPage() {
  const router = useRouter();
  const { userRole } = useAppContext();
  
  const [waktu, setWaktu] = useState<Date | null>(null);
  const [ruangan, setRuangan] = useState('Kamar Jenazah');
  const [supervisor, setSupervisor] = useState('');
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
    setWaktu(new Date());
    setData(initialData);
  }, []);

  const fetchObservers = async () => {
    try {
      const { data, error } = await supabase.from('master_observers').select('*').order('nama');
      if (error) throw error;
      if (data && data.length > 0) {
          setObservers(data);
          const defaultObs = data.find(o => o.nama.includes('Adi Tresa Purnama')) || data[0];
          setSupervisor(defaultObs.nama);
      } else {
          setObservers([{ id: '1', nama: 'IPCN_Adi Tresa Purnama' }]);
          setSupervisor('IPCN_Adi Tresa Purnama');
      }
    } catch (err) {
      const defaultObs = { id: '1', nama: 'IPCN_Adi Tresa Purnama' };
      setObservers([defaultObs]);
      setSupervisor(defaultObs.nama);
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
      if (supervisor === (observers.find(o => o.id === id)?.nama)) setSupervisor('');
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
    if (!supervisor) { alert('Harap pilih Supervisor!'); return; }
    if (Object.values(data).some(v => v === null)) { alert('Harap lengkapi semua checklist!'); return; }

    setIsSubmitting(true);
    try {
      const ttd_pj = sigRef.current?.getPjSignature();
      const ttd_ipcn = sigRef.current?.getSupervisorSignature();
      const uploadedUrls = await uploadImagesToSupabase(supabase, images, 'dokumentasi', 'audit');

      const payload = {
        waktu: waktu?.toISOString() || new Date().toISOString(),
        ruangan,
        supervisor,
        checklist_json: data,
        persentase: stats.persentase,
        status: stats.status,
        temuan,
        rekomendasi,
        dokumentasi: uploadedUrls,
        nama_pj: pjName.trim(),
        ttd_pj,
        ttd_ipcn,
        updated_at: new Date().toISOString()
      };

      // Save to main form table
      const { error } = await supabase.from('audit_kamar_jenazah').insert([payload]);
      if (error) throw error;

      // Save to audit_sessions for global dashboard
      const sessionPayload = {
        indikator_id: 'monitoring_jenazah',
        nama_indikator: 'MONITORING KAMAR JENAZAH',
        tanggal_waktu: payload.waktu,
        observer: supervisor,
        unit: ruangan,
        jumlah_dinilai: stats.dinilai,
        jumlah_patuh: stats.patuh,
        persentase: stats.persentase,
        status_kepatuhan: stats.status,
        temuan,
        rekomendasi,
        nama_pj_ruangan: pjName.trim(),
        ttd_pj_ruangan: ttd_pj,
        ttd_ipcn: ttd_ipcn,
        dokumentasi: uploadedUrls,
        data_indikator: data
      };

      const { data: sessionData, error: sessionError } = await supabase.from('audit_sessions').insert([sessionPayload]).select('*').single();
      if (sessionError) throw sessionError;

      // Flatten details
      const detailPayloads: any[] = [];
      checklistItems.forEach(sec => {
        sec.items.forEach(item => {
          if (data[item.id] !== null) {
            detailPayloads.push({
              session_id: sessionData.id,
              pertanyaan_id: item.id,
              pertanyaan: item.label,
              jawaban: String(data[item.id])
            });
          }
        });
      });
      await supabase.from('audit_details').insert(detailPayloads);

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
    <div className="max-w-4xl mx-auto pb-40">
       <AnimatePresence>
        {showToast && (
          <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-blue-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold uppercase tracking-widest text-xs border border-white/20"
          >
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            Data Audit Kamar Jenazah berhasil disimpan
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-6 py-6 border-b border-white/5">
        <Link href="/dashboard/input/isolasi" className="p-3 bg-white/5 rounded-2xl border border-white/10 text-slate-400 hover:text-white transition-all shadow-sm">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 uppercase">Input Audit Kamar Jenazah</h1>
          <p className="text-[11px] lg:text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">Audit kepatuhan Pencegahan dan Pengendalian Infeksi area Kamar Jenazah</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-8">
        <div className="bg-white dark:bg-[#111827] shadow-sm dark:shadow-none p-6 lg:p-8 rounded-2xl border border-slate-200 dark:border-white/5 space-y-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 border-b border-slate-200 dark:border-white/5 pb-4">SECTION 1 — INFORMASI UMUM</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Waktu Audit</label>
              <input type="datetime-local" value={waktu ? new Date(waktu.getTime() - waktu.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''} onChange={(e) => setWaktu(new Date(e.target.value))} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:border-blue-500/50 [color-scheme:light] dark:[color-scheme:dark]" />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Ruangan</label>
              <select value={ruangan} onChange={(e) => setRuangan(e.target.value)} required className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none">
                <option value="Kamar Jenazah" className="dark:bg-slate-900">Kamar Jenazah</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex justify-between items-center">
                Supervisor
                <button type="button" onClick={() => setIsObserverModalOpen(true)} className="p-1.5 bg-slate-100 dark:bg-white/5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-slate-200 dark:hover:bg-white/10"><Settings className="w-3 h-3" /></button>
              </label>
              <select value={supervisor} onChange={(e) => setSupervisor(e.target.value)} required className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none">
                <option value="" className="dark:bg-slate-900">Pilih Supervisor...</option>
                {observers.map(o => <option key={o.id} value={o.nama} className="dark:bg-slate-900">{o.nama}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111827] shadow-sm dark:shadow-none p-6 lg:p-8 rounded-2xl border border-slate-200 dark:border-white/5 space-y-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 border-b border-slate-200 dark:border-white/5 pb-4">SECTION 2 — CEKLIST KAMAR JENAZAH</h2>
          
          {checklistItems.map((sec, sIdx) => (
            <div key={sIdx} className="space-y-4">
              <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/50 p-3 rounded-xl">{sec.section}</h3>
              {sec.items.map((item, idx) => (
                <div key={item.id} className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 flex flex-col gap-4 transition-all hover:border-blue-500/30">
                  <p className="text-sm lg:text-[15px] font-medium text-slate-700 dark:text-slate-300">
                    {item.label}
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {['ya', 'tidak', 'na'].map(choice => (
                      <button key={choice} type="button" onClick={() => toggleItem(item.id, choice as any)}
                        className={`py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all border ${
                          data[item.id] === choice 
                            ? (choice === 'ya' ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20' : choice === 'tidak' ? 'bg-red-500 text-white border-red-500 shadow-md shadow-red-500/20' : 'bg-slate-600 dark:bg-slate-700 text-white border-slate-500')
                            : 'bg-white dark:bg-white/5 text-slate-500 dark:text-slate-500 border-slate-200 dark:border-transparent hover:bg-slate-100 dark:hover:bg-white/10'
                        }`}
                      >
                        {choice === 'ya' ? '✅ Ya' : choice === 'tidak' ? '❌ Tidak' : '➖ N/A'}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="p-0">
          <LiveStatisticsCard totalDinilai={stats.dinilai} totalPatuh={stats.patuh} totalTidakPatuh={stats.dinilai - stats.patuh} persentase={stats.persentase} statusText={stats.status} title="SECTION 3 — PERSENTASE OTOMATIS" />
        </div>

        <div className="bg-white dark:bg-[#111827] shadow-sm dark:shadow-none p-6 lg:p-8 rounded-2xl border border-slate-200 dark:border-white/5 space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">SECTION 4 — TEMUAN</label>
            <textarea value={temuan} onChange={(e) => setTemuan(e.target.value)} placeholder="Contoh:&#10;Spillkit belum tersedia di mobil jenazah&#10;Tempat sampah tidak tertutup&#10;Lantai area belakang licin" className="w-full h-32 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 text-sm text-slate-800 dark:text-white outline-none resize-none focus:border-blue-500" />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">SECTION 5 — REKOMENDASI</label>
            <textarea value={rekomendasi} onChange={(e) => setRekomendasi(e.target.value)} placeholder="Contoh:&#10;Lengkapi spillkit mobil jenazah&#10;Ganti tempat sampah tertutup&#10;Jadwalkan pembersihan rutin area belakang" className="w-full h-32 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 text-sm text-slate-800 dark:text-white outline-none resize-none focus:border-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#111827] shadow-sm dark:shadow-none p-6 lg:p-8 rounded-2xl border border-slate-200 dark:border-white/5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 border-b border-slate-200 dark:border-white/5 pb-4 mb-6">SECTION 6 — DOKUMENTASI</h2>
          <DocumentationUploader images={images} setImages={setImages} />
        </div>

        <div className="bg-white dark:bg-[#111827] shadow-sm dark:shadow-none p-6 lg:p-8 rounded-2xl border border-slate-200 dark:border-white/5">
           <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 border-b border-slate-200 dark:border-white/5 pb-4 mb-6">SECTION 7 — TANDA TANGAN DIGITAL</h2>
          <DigitalSignatureSection ref={sigRef} pjName={pjName} setPjName={setPjName} pjLabel="PJ RUANGAN" />
        </div>

        <div className="pb-10 pt-4">
          <button type="submit" disabled={isSubmitting} className="w-full h-16 flex justify-center items-center gap-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-black uppercase tracking-widest rounded-2xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] disabled:opacity-50 disabled:cursor-not-allowed">
            {isSubmitting ? <Activity className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
            <span className="text-sm">💾 Simpan Data Audit</span>
          </button>
        </div>
      </form>

      <AnimatePresence>
        {isObserverModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsObserverModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2rem] p-8 overflow-hidden shadow-2xl">
               <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-3">Kelola Supervisor</h3>
                <button onClick={() => setIsObserverModalOpen(false)} className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex gap-2 mb-6">
                <input type="text" value={newObserverName} onChange={(e) => setNewObserverName(e.target.value)} placeholder="Nama Supervisor..." className="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm outline-none text-slate-800 dark:text-white" />
                <button onClick={saveObserver} className="px-5 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase hover:bg-blue-500">{editObserverId ? 'OK' : '+'}</button>
              </div>
              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {observers.map(o => (
                  <div key={o.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{o.nama}</span>
                    <div className="flex gap-1">
                      <button onClick={() => { setNewObserverName(o.nama); setEditObserverId(o.id); }} className="p-2 text-slate-500 hover:text-blue-500"><Settings className="w-4 h-4" /></button>
                      <button onClick={() => deleteObserver(o.id)} className="p-2 text-slate-500 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
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

KamarJenazahInputPage.getLayout = function getLayout(page: React.ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};
