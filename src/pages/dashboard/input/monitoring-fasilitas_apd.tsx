import { useState, useEffect, useMemo, useRef, ReactElement } from 'react';
import { useRouter } from 'next/router';
import {   
  Activity, ArrowLeft, Save, CheckCircle2, Settings, Trash2, X, ChevronDown, ChevronUp
, RefreshCw , User } from 'lucide-react';
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

const unitList = [
  'IGD',
  'ICU',
  'IBS',
  'Rawat Jalan',
  'Ranap Aisyah',
  'Ranap Fatimah',
  'Ranap Khadijah',
  'Ranap Usman',
  'Radiologi',
  'Laboratorium',
  'Farmasi',
  'Rekam Medis',
  'Pantry'
];

const checklistItems = genericAuditConfigs.monitoring_fasilitas_apd?.items || [];
const tableName = genericAuditConfigs.monitoring_fasilitas_apd?.tableName || 'monitoring_fasilitas_apd';

type AuditStatus = 'ya' | 'tidak' | 'na' | null;
type Observer = { id: string; nama: string };

export default function MonitoringFasilitasAPDPage() {
  const router = useRouter();
  const { userRole } = useAppContext();
  
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [observer, setObserver] = useState('');
  const [unit, setUnit] = useState(unitList[0]);
  const [data, setData] = useState<Record<string, AuditStatus>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  
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
    const initialNotes: Record<string, string> = {};
    checklistItems.forEach(item => {
      initialData[item.id] = null;
      initialNotes[item.id] = '';
    });
    setStartTime(new Date());
    setData(initialData);
    setNotes(initialNotes);
  }, []);

  const fetchObservers = async () => {
    try {
      const { data, error } = await supabase.from('master_observers').select('*').order('nama');
      if (error) throw error;
      if (data) {
        setObservers(data);
        if (data.length > 0 && !observer) {
          const defaultObs = data.find(o => o.nama.includes('Adi Tresa Purnama')) || data[0];
          setObserver(defaultObs.nama);
        }
      }
    } catch (err) {
      const fallback = { id: '1', nama: 'IPCN_Adi Tresa Purnama' };
      setObservers([fallback]);
      if (!observer) setObserver(fallback.nama);
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

  const handleNoteChange = (id: string, val: string) => {
    setNotes(prev => ({ ...prev, [id]: val }));
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
    if (dinilai > 0) {
      status = persentase >= 85 ? 'Baik' : persentase >= 70 ? 'Cukup' : 'Perlu Tindak Lanjut';
    }
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
      
      const recordId = crypto.randomUUID();
      
      const payloadIndikator: Record<string, any> = {};
      Object.keys(data).forEach(key => {
        payloadIndikator[key] = {
          status: data[key],
          keterangan: notes[key] || ''
        };
      });

      const sessionPayload = {
        id: recordId,
        waktu: startTime?.toISOString() || new Date().toISOString(),
        supervisor: observer,
        unit: unit,
        checklist_json: payloadIndikator,
        persentase: stats.persentase,
        temuan, 
        rekomendasi,
        ttd_pj,
        ttd_ipcn,
        foto: uploadedUrls,
        created_at: new Date().toISOString()
      };

      await supabase.from(tableName).insert([sessionPayload]);
      
      const payloadStats = {
        id: recordId,
        indikator_id: tableName,
        kategori_id: 'monitoring',
        ruangan: unit,
        supervisor: observer,
        tanggal_waktu: startTime?.toISOString() || new Date().toISOString(),
        persentase: stats.persentase,
        jumlah_patuh: stats.patuh,
        jumlah_tindakan: stats.dinilai,
        ttd_pj_ruangan: ttd_pj,
        ttd_ipcn: ttd_ipcn,
        dokumentasi: uploadedUrls,
        data_indikator: data
      };
      
      await supabase.from('audit_sessions').insert([payloadStats]);

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
    <div className="max-w-3xl mx-auto pb-8">
       <AnimatePresence>
        {showToast && (
          <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-blue-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold uppercase tracking-widest text-xs border border-white/20"
          >
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            Data berhasil disimpan
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-6 py-6 border-b border-white/5">
        <Link href="/dashboard/input/isolasi" className="p-3 bg-white/5 rounded-2xl border border-white/10 text-slate-400 hover:text-white transition-all">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600 animate-gradient drop-shadow-sm uppercase">Input Monitoring Fasilitas APD</h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Monitoring ketersediaan alat pelindung diri sesuai standar PPI Rumah Sakit.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div className="bg-white/5 backdrop-blur-xl p-6 sm:p-8 rounded-[2rem] border border-white/5 shadow-sm space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Waktu Input</label>
            <input type="datetime-local" value={startTime ? new Date(startTime.getTime() - startTime.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''} onChange={(e) => setStartTime(new Date(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 [color-scheme:dark] transition-colors" />
          </div>
          
          <div className="space-y-3 pt-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex justify-between items-center">
              Supervisor
              <button type="button" onClick={() => setIsObserverModalOpen(true)} className="text-blue-400 hover:text-blue-300 font-bold uppercase tracking-widest flex items-center gap-1"><User className="w-3 h-3" /> Tambah / Kelola</button>
            </label>
            <div className="relative">
              <select value={observer} onChange={(e) => setObserver(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white appearance-none outline-none focus:border-blue-500/50">
                <option value="">Pilih Supervisor...</option>
                {observers.map(o => <option key={o.id} value={o.nama}>{o.nama}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white/5 p-6 rounded-[24px] border border-white/5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">📋 Indikator Kepatuhan</h2>
          <div className="space-y-4">
            {checklistItems.map(item => (
              <div key={item.id} className="bg-white/5 p-6 rounded-[24px] border border-white/5">
                <h3 className="text-sm font-bold text-white mb-4">{item.label}</h3>
                <div className="grid grid-cols-3 gap-3">
                  {['ya', 'tidak', 'na'].map(choice => (
                    <button type="button" key={choice} onClick={() => toggleItem(item.id, choice as any)}
                      className={`py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
                        data[item.id] === choice ? 'bg-blue-600 text-white border-blue-500' : 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10'
                      }`}
                    >
                      {choice === 'na' ? 'N/A' : choice}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <LiveStatisticsCard 
          totalDinilai={stats.dinilai} totalPatuh={stats.patuh} totalTidakPatuh={stats.dinilai - stats.patuh}
          persentase={stats.persentase} statusText={stats.status}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm">
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">📝 Temuan Audit</h2>
                <textarea value={temuan} onChange={e => setTemuan(e.target.value)} placeholder="Tuliskan temuan audit..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white h-32 outline-none focus:border-blue-500/50 transition-colors placeholder:text-slate-600"/>
            </div>
            <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm">
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">💡 Rekomendasi</h2>
                <textarea value={rekomendasi} onChange={e => setRekomendasi(e.target.value)} placeholder="Tuliskan rekomendasi tindak lanjut..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white h-32 outline-none focus:border-blue-500/50 transition-colors placeholder:text-slate-600"/>
            </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl p-6 sm:p-8 rounded-[2.5rem] border border-white/5 shadow-sm">
          <DocumentationUploader images={images} setImages={setImages} />
        </div>

        <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">✍️ TANDA TANGAN DIGITAL</h2>
            <DigitalSignatureSection ref={sigRef} pjName={pjName} setPjName={setPjName} pjLabel="PJ RUANGAN" />
        </div>

        <button type="submit" disabled={isSubmitting || !observer || stats.dinilai === 0}
          className="w-full flex justify-center items-center gap-4 py-5 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-widest rounded-2xl transition-all shadow-lg disabled:opacity-50"
        >
          {isSubmitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          <span>Simpan Data Audit</span>
        </button>
      </form>

      <AnimatePresence>
        {isObserverModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsObserverModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-[2rem] p-8 overflow-hidden">
               <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white uppercase tracking-widest flex items-center gap-3">Kelola Supervisor</h3>
                <button type="button" onClick={() => setIsObserverModalOpen(false)} className="p-2 text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex gap-2 mb-6 text-white">
                <input type="text" value={newObserverName} onChange={(e) => setNewObserverName(e.target.value)} placeholder="Nama Supervisor..." className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none" />
                <button type="button" onClick={saveObserver} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase hover:bg-blue-500">{editObserverId ? 'OK' : '+'}</button>
              </div>
              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {observers.map(o => (
                  <div key={o.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl">
                    <span className="text-sm font-medium text-slate-300">{o.nama}</span>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => { setNewObserverName(o.nama); setEditObserverId(o.id); }} className="p-2 text-slate-500 hover:text-blue-400"><Settings className="w-4 h-4" /></button>
                      <button type="button" onClick={() => deleteObserver(o.id)} className="p-2 text-slate-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
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

MonitoringFasilitasAPDPage.getLayout = function getLayout(page: React.ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};
