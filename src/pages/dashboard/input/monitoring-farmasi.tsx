import { useState, useEffect, useMemo, useRef, ReactElement } from 'react';
import { useRouter } from 'next/router';
import { 
  Activity, ArrowLeft, Save, CheckCircle2, Settings, Trash2, X
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
import { genericAuditConfigs } from '@/lib/audit-configs';

const checklistItems = genericAuditConfigs.monitoring_farmasi?.items || [];
const tableName = genericAuditConfigs.monitoring_farmasi?.tableName || 'audit_farmasi';

type AuditStatus = 'ya' | 'tidak' | 'na' | null;
type Observer = { id: string; nama: string };

export default function MonitoringFarmasiPage() {
  const router = useRouter();
  const { userRole } = useAppContext();
  
  const [startTime, setStartTime] = useState<Date | null>(null);
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
    checklistItems.forEach(item => initialData[item.id] = null);
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
    if (!confirm('Hapus observer ini?')) return;
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
    if (dinilai > 0) status = persentase >= 80 ? 'Patuh' : persentase >= 60 ? 'Cukup' : 'Tidak Patuh';
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
      const uploadedUrls = await uploadImagesToSupabase(supabase, images, 'logos', 'audit');

      const sessionPayload = {
        indikator_id: 'monitoring_farmasi',
        nama_indikator: 'MONITORING FARMASI',
        tanggal_waktu: startTime?.toISOString() || new Date().toISOString(),
        observer,
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

      const detailPayloads = Object.keys(data).map(key => ({
        session_id: sessionData.id,
        pertanyaan_id: key,
        pertanyaan: checklistItems.find(i => i.id === key)?.label || key,
        jawaban: String(data[key])
      }));
      await supabase.from('audit_details').insert(detailPayloads);

      await supabase.from(tableName || 'audit_farmasi').insert([{ ...sessionPayload, created_at: new Date().toISOString() }]);

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
    <div className="max-w-3xl mx-auto pb-32">
       <AnimatePresence>
        {showToast && (
          <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-blue-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold uppercase tracking-widest text-xs border border-white/20"
          >
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            Data Monitoring Berhasil Disimpan
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-6 py-6 border-b border-white/5">
        <Link href="/dashboard/input/isolasi" className="p-3 bg-white/5 rounded-2xl border border-white/10 text-slate-400 hover:text-white transition-all">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-blue-500 to-emerald-500 dark:from-blue-400 dark:via-purple-500 dark:to-blue-400 bg-[length:200%_auto] animate-gradient transition-all drop-shadow-sm dark:drop-shadow-[0_0_10px_rgba(59,130,246,0.4)] uppercase">Monitoring Farmasi</h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mt-1">Audit kepatuhan PPI di area Instalasi Farmasi</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-8">
        <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2rem] border border-white/5 space-y-6">
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Waktu Monitoring</label>
              <input type="datetime-local" value={startTime ? new Date(startTime.getTime() - startTime.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''} onChange={(e) => setStartTime(new Date(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 [color-scheme:dark]" />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex justify-between items-center">
                Supervisor
                <button type="button" onClick={() => setIsObserverModalOpen(true)} className="p-1.5 bg-white/5 rounded-lg text-blue-400"><Settings className="w-3 h-3" /></button>
              </label>
              <select value={observer} onChange={(e) => setObserver(e.target.value)} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none">
                <option value="" className="bg-slate-900">Pilih Supervisor...</option>
                {observers.map(o => <option key={o.id} value={o.nama} className="bg-slate-900">{o.nama}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2rem] border border-white/5 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-blue-400 border-b border-white/5 pb-4">Checklist TPS</h2>
          {checklistItems.map((item, idx) => (
            <div key={item.id} className="p-5 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-4">
              <p className="text-sm font-medium text-slate-300">
                <span className="text-blue-400 font-bold mr-2">{idx + 1}.</span>{item.label}
              </p>
              <div className="grid grid-cols-3 gap-3">
                {['ya', 'tidak', 'na'].map(choice => (
                  <button key={choice} type="button" onClick={() => toggleItem(item.id, choice as any)}
                    className={`py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border ${
                      data[item.id] === choice 
                        ? (choice === 'ya' ? 'bg-blue-600 text-white border-blue-500' : choice === 'tidak' ? 'bg-red-600 text-white border-red-500' : 'bg-slate-700 text-white border-slate-600')
                        : 'bg-white/5 text-slate-500 border-transparent hover:bg-white/10'
                    }`}
                  >
                    {choice}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <LiveStatisticsCard totalDinilai={stats.dinilai} totalPatuh={stats.patuh} totalTidakPatuh={stats.dinilai - stats.patuh} persentase={stats.persentase} statusText={stats.status} title="HASIL OBSERVASI" />

        <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2rem] border border-white/5 space-y-6 text-white">
          <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Temuan Monitoring</label>
            <textarea value={temuan} onChange={(e) => setTemuan(e.target.value)} placeholder="Tuliskan temuan..." className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none resize-none" />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Rekomendasi</label>
            <textarea value={rekomendasi} onChange={(e) => setRekomendasi(e.target.value)} placeholder="Tuliskan rekomendasi..." className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none resize-none" />
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5">
          <DocumentationUploader images={images} setImages={setImages} />
        </div>

        <DigitalSignatureSection ref={sigRef} pjName={pjName} setPjName={setPjName} pjLabel="PJ TPS" />

        <button type="submit" disabled={isSubmitting} className="w-full flex justify-center items-center gap-4 py-5 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50">
          {isSubmitting ? <Activity className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          <span>Simpan Data Monitoring</span>
        </button>
      </form>

      <AnimatePresence>
        {isObserverModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsObserverModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-[2rem] p-8 overflow-hidden">
               <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white uppercase tracking-widest flex items-center gap-3">Kelola Supervisor</h3>
                <button onClick={() => setIsObserverModalOpen(false)} className="p-2 text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex gap-2 mb-6 text-white">
                <input type="text" value={newObserverName} onChange={(e) => setNewObserverName(e.target.value)} placeholder="Nama Supervisor..." className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none" />
                <button onClick={saveObserver} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase hover:bg-blue-500">{editObserverId ? 'OK' : '+'}</button>
              </div>
              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {observers.map(o => (
                  <div key={o.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl">
                    <span className="text-sm font-medium text-slate-300">{o.nama}</span>
                    <div className="flex gap-1">
                      <button onClick={() => { setNewObserverName(o.nama); setEditObserverId(o.id); }} className="p-2 text-slate-500 hover:text-blue-400"><Settings className="w-4 h-4" /></button>
                      <button onClick={() => deleteObserver(o.id)} className="p-2 text-slate-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
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

MonitoringFarmasiPage.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};
