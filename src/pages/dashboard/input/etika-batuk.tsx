import { useState, useEffect, ReactElement } from 'react';
import { useRouter } from 'next/router';
import { 
  ArrowLeft, Save, CheckCircle2, Activity, RefreshCw, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { useAppContext } from '@/components/Providers';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';
import { EditableSelect } from '@/components/EditableSelect';
import { DocumentationUploader, DocImage } from '@/components/DocumentationUploader';

const units = [
  'IGD', 'ICU', 'Ranap Aisyah', 'Ranap Fatimah', 'Ranap Khadijah', 'Ranap Usman'
];

const materiOptions = [
  'Etika batuk',
  'Cuci tangan 5 momen dan 6 langkah'
] as const;

const sasaranOptions = [
  'Pasien',
  'Keluarga pasien',
  'Pengunjung'
] as const;

export default function InputEtikaBatukPage() {
  const router = useRouter();
  const { userRole } = useAppContext();
  
  const [startTime, setStartTime] = useState<Date | null>(null);
  
  const [observer, setObserver] = useState('');
  const [unit, setUnit] = useState('');
  const [images, setImages] = useState<DocImage[]>([]);

  const [selectedMateri, setSelectedMateri] = useState<string[]>([]);
  const [selectedSasaran, setSelectedSasaran] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const d = new Date();
    setStartTime(d);
  }, []);

  const handleError = (err: any) => {
    console.error(err);
    alert(`Error: ${err.message || 'Terjadi kesalahan sistem'}`);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      setStartTime(new Date(val));
    }
  };

  const formattedDate = startTime ? new Date(startTime.getTime() - startTime.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '';

  const toggleMateri = (materi: string) => {
    setSelectedMateri(prev => prev.includes(materi) ? prev.filter(m => m !== materi) : [...prev, materi]);
  };

  const toggleSasaran = (sasaran: string) => {
    setSelectedSasaran(prev => prev.includes(sasaran) ? prev.filter(s => s !== sasaran) : [...prev, sasaran]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMateri.length === 0) { alert('Harap pilih minimal 1 materi edukasi!'); return; }
    if (selectedSasaran.length === 0) { alert('Harap pilih minimal 1 sasaran edukasi!'); return; }
    if (!observer || !unit) { alert('Harap isi Supervisor dan Unit!'); return; }
    
    setIsSubmitting(true);
    
    try {
      const payload = {
        tanggal_waktu: startTime?.toISOString() || new Date().toISOString(),
        observer, unit,
        materi_edukasi: selectedMateri,
        sasaran_edukasi: selectedSasaran
      };

      const { data: sessionData, error: sessionError } = await supabase
        .from('audit_sessions')
        .insert([{
          indikator_id: 'etika_batuk', 
          nama_indikator: 'ETIKA BATUK',
          tanggal_waktu: payload.tanggal_waktu,
          observer, unit,
          data_indikator: {
            materi_edukasi: selectedMateri,
            sasaran_edukasi: selectedSasaran
          }
        }])
        .select('id')
        .single();

      if (sessionError) throw sessionError;

      for (let i=0; i<images.length; i++) {
        await supabase.storage.from('audit_images').upload(`images/${sessionData.id}_${i}.jpg`, images[i].file);
      }

      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        router.push('/dashboard/input/isolasi');
      }, 2000);
    } catch (err: any) {
      handleError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-16">
      <AnimatePresence>
        {showToast && (
          <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-blue-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold uppercase tracking-widest text-xs border border-blue-400/30"
          >
            <CheckCircle2 className="w-5 h-5" />
            Data berhasil disimpan
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-4 mb-8 py-6 border-b border-white/5">
        <Link href="/dashboard/input/isolasi" className="p-3 bg-white/5 rounded-2xl border border-white/10 text-slate-400 hover:text-white transition-all">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r bg-[length:200%_auto] animate-gradient drop-shadow-[0_0_10px_rgba(59,130,246,0.4)] from-blue-400 via-purple-500 to-blue-400 uppercase">Audit Etika Batuk</h1>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.1em] text-blue-400 mt-1">Dokumentasi kepatuhan etika batuk dan bersin</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
            <Activity className="w-4 h-4 text-purple-400" /> Informasi Audit
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Waktu Audit</label>
              <input type="datetime-local" value={formattedDate} onChange={handleDateChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition-colors" />
            </div>
            <div>
              <EditableSelect 
                label="Supervisor" 
                value={observer} 
                onChange={setObserver} 
                options={['IPCN_Adi Tresa Purnama']} 
                isIPCN={userRole === 'ipcn'} 
                table="master_observers"
                storageKey="local_obs"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Unit</label>
              <select value={unit} onChange={(e) => setUnit(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition-colors">
                <option value="" className="bg-slate-900">Pilih Unit...</option>
                {units.map(u => <option key={u} value={u} className="bg-slate-900">{u}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
            <FileText className="w-4 h-4 text-amber-400" /> CEKLIST ETIKA BATUK
          </h2>
          
          <div className="space-y-6">
            <div>
               <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 block">Materi Edukasi</h3>
               <div className="flex flex-col gap-3">
                 {materiOptions.map((opt) => (
                    <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${selectedMateri.includes(opt) ? 'bg-blue-600 border-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.4)]' : 'bg-black/20 border-white/10 group-hover:bg-black/40'}`}>
                        {selectedMateri.includes(opt) && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                      <span className="text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">{opt}</span>
                      <input type="checkbox" className="hidden" checked={selectedMateri.includes(opt)} onChange={() => toggleMateri(opt)} />
                    </label>
                 ))}
               </div>
            </div>

            <div>
               <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 block">Sasaran Edukasi</h3>
               <div className="flex flex-col gap-3">
                 {sasaranOptions.map((opt) => (
                    <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${selectedSasaran.includes(opt) ? 'bg-purple-600 border-purple-500 shadow-[0_0_10px_rgba(147,51,234,0.4)]' : 'bg-black/20 border-white/10 group-hover:bg-black/40'}`}>
                        {selectedSasaran.includes(opt) && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                      <span className="text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">{opt}</span>
                      <input type="checkbox" className="hidden" checked={selectedSasaran.includes(opt)} onChange={() => toggleSasaran(opt)} />
                    </label>
                 ))}
               </div>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl p-6 sm:p-8 rounded-[2.5rem] border border-white/5 shadow-sm">
          <DocumentationUploader images={images} setImages={setImages} />
        </div>

        <button onClick={handleSubmit} disabled={isSubmitting || !observer || !unit || selectedMateri.length === 0 || selectedSasaran.length === 0}
          className="w-full flex justify-center items-center gap-3 py-4 mt-6 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 text-white font-bold uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] disabled:opacity-50 group active:scale-[0.98]"
        >
          {isSubmitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />}
          <span>Simpan Data</span>
        </button>
      </div>
    </div>
  );
}

InputEtikaBatukPage.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};
