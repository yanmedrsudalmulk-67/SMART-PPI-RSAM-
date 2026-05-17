import { useState, useEffect, useMemo, ReactElement, useRef } from 'react';
import { useRouter } from 'next/router';
import { 
  ArrowLeft, Save, CheckCircle2, Clock, Info, ShieldCheck, RefreshCw, ClipboardCheck, Activity, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { useAppContext } from '@/components/Providers';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';
import { LiveStatisticsCard } from '@/components/LiveStatisticsCard';
import { EditableSelect } from '@/components/EditableSelect';
import DigitalSignatureSection, { DigitalSignatureRef } from '@/components/DigitalSignatureSection';
import { DocumentationUploader, DocImage } from '@/components/DocumentationUploader';

const units = [
  'IGD', 'ICU', 'IBS', 'Rawat Jalan', 'Ranap Aisyah', 
  'Ranap Fatimah', 'Ranap Khadijah', 'Ranap Usman', 
  'Radiologi', 'Laboratorium', 'Pantry', 'Emergency Kebidanan'
];

const criteria = [
  { id: 'c1', label: 'Penyimpanan Linen Bersih', desc: 'Linen bersih disimpan di lemari tertutup dengan jarak setidaknya dari lantai 30 cm, dinding 20 cm, langit-langit 60 cm, di area bersih terlindung dari kontaminasi' },
  { id: 'c2', label: 'Fasilitas Troli Kotor', desc: 'Tersedia troli/tempat linen kotor dalam kondisi baik dan tertutup' },
  { id: 'c3', label: 'Kantung Linen Kuning', desc: 'Tersedia kantung linen berwarna kuning untuk linen infeksius / tercemar / basah' },
  { id: 'c4', label: 'Pemisahan Linen Kotor', desc: 'Linen kotor dipisahkan sesuai dengan SPO' },
  { id: 'c5', label: 'Penggunaan APD Petugas', desc: 'Petugas menggunakan APD saat menangani linen infeksius / tercemar / basah' },
] as const;

type AuditStatus = 'ya' | 'tidak' | 'na' | null;

export default function LinenAuditPage() {
  const router = useRouter();
  const { userRole } = useAppContext();
  const isIPCN = userRole === 'IPCN' || userRole === 'Admin';
  
  const [startTime, setStartTime] = useState<Date | null>(null);
  
  const [observer, setObserver] = useState('');
  const [unit, setUnit] = useState('');
  
  const [temuan, setTemuan] = useState('');
  const [rekomendasi, setRekomendasi] = useState('');
  
  const [images, setImages] = useState<DocImage[]>([]);
  const [pjName, setPjName] = useState('');
  const sigRef = useRef<DigitalSignatureRef>(null);
  
  const [auditData, setAuditData] = useState<Record<string, AuditStatus>>({
    c1: null, c2: null, c3: null, c4: null, c5: null
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const d = new Date();
    setStartTime(d);
  }, []);

  const handleSelection = (cid: string, val: AuditStatus) => {
    setAuditData(prev => ({ ...prev, [cid]: val }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      setStartTime(new Date(val));
    }
  };

  const formattedDate = startTime ? new Date(startTime.getTime() - startTime.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '';

  const stats = useMemo(() => {
    let patuh = 0;
    let totalEvaluasi = 0;
    
    Object.values(auditData).forEach(val => {
      if (val === 'ya') {
        patuh++;
        totalEvaluasi++;
      } else if (val === 'tidak') {
        totalEvaluasi++;
      }
    });

    const persentase = totalEvaluasi > 0 ? Math.round((patuh / totalEvaluasi) * 100) : 0;
    let statusText = 'Belum Dinilai';
    
    if (totalEvaluasi > 0) {
      if (persentase >= 85) statusText = 'Baik';
      else if (persentase >= 70) statusText = 'Cukup';
      else statusText = 'Perlu Perbaikan';
    }

    return { patuh, totalEvaluasi, persentase, statusText };
  }, [auditData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.values(auditData).some(v => v === null)) { alert('Harap isi semua indikator!'); return; }
    
    setIsSubmitting(true);
    
    try {
      const ttd_pj = sigRef.current?.getPjSignature();
      const ttd_ipcn = sigRef.current?.getSupervisorSignature();

      const payload = {
        indikator_id: 'penatalaksanaan_linen', 
        nama_indikator: 'PENATALAKSANAAN LINEN',
        tanggal_waktu: startTime?.toISOString() || new Date().toISOString(),
        observer, 
        unit, 
        jenis_tindakan: 'Linen Management Audit',
        jumlah_dinilai: stats.totalEvaluasi,
        jumlah_patuh: stats.patuh,
        persentase: stats.persentase,
        status_kepatuhan: stats.statusText,
        data_indikator: auditData,
        temuan, rekomendasi,
        nama_pj_ruangan: pjName.trim(),
        ttd_pj_ruangan: ttd_pj,
        ttd_ipcn: ttd_ipcn
      };

      const { data: sessionData, error } = await supabase.from('audit_sessions').insert([payload]).select('id').single();
      if (error) throw error;

      for (let i = 0; i < images.length; i++) {
        await supabase.storage.from('audit_images').upload(`images/${sessionData.id}_${i}.jpg`, images[i].file);
      }

      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        router.push('/dashboard/input/isolasi');
      }, 2000);
    } catch (err: any) {
      console.error(err);
      alert(`Gagal menyimpan data: ${err.message}`);
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
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r bg-[length:200%_auto] animate-gradient drop-shadow-[0_0_10px_rgba(59,130,246,0.4)] from-blue-400 via-purple-500 to-blue-400 uppercase">Audit Penatalaksanaan Linen</h1>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.1em] text-blue-400 mt-1">Audit kepatuhan pengelolaan linen bersih dan linen kotor</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
            <Activity className="w-4 h-4 text-purple-400" /> Informasi Audit
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Waktu Audit</label>
              <input type="datetime-local" value={formattedDate} onChange={handleDateChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition-colors" />
            </div>
            <div>
              <EditableSelect 
                label="Observer / Verifikator" 
                value={observer} 
                onChange={setObserver} 
                options={[]} 
                isIPCN={isIPCN} 
                table="master_observers"
                storageKey="local_obs"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Unit Kerja / Ruangan</label>
              <select value={unit} onChange={(e) => setUnit(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition-colors">
                <option value="" className="bg-slate-900">Pilih Unit...</option>
                {units.map(u => <option key={u} value={u} className="bg-slate-900">{u}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
            <FileText className="w-4 h-4 text-amber-400" /> CEKLIST PENATALAKSANAAN LINEN
          </h2>
          <div className="space-y-4">
            {criteria.map((item, idx) => (
              <div key={item.id} className="bg-black/20 p-5 rounded-2xl border border-white/5">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-black text-slate-400">{idx + 1}</span>
                  </div>
                  <div>
                     <h3 className="text-sm font-semibold text-white mb-2 leading-relaxed">{item.label}</h3>
                     <p className="text-xs text-slate-500 mb-4">{item.desc}</p>
                  </div>
                </div>
                <div className="flex gap-3 pl-12">
                  {['ya', 'tidak', 'na'].map(choice => (
                    <button key={choice} onClick={() => handleSelection(item.id, choice as any)}
                      className={`flex-1 py-3 px-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all border ${
                        auditData[item.id] === choice 
                          ? (choice === 'ya' ? 'bg-blue-600/20 text-blue-400 border-blue-500/50' : choice === 'tidak' ? 'bg-red-600/20 text-red-400 border-red-500/50' : 'bg-slate-600/20 text-slate-300 border-slate-500/50')
                          : 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10'
                      }`}
                    >
                      {choice === 'na' ? 'N/A' : choice.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <LiveStatisticsCard 
          totalDinilai={stats.totalEvaluasi} 
          totalPatuh={stats.patuh} 
          totalTidakPatuh={stats.totalEvaluasi - stats.patuh}
          persentase={stats.persentase} 
          statusText={stats.statusText} 
          title="KEPATUHAN PENATALAKSANAAN LINEN"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm">
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">📝 TEMUAN</h2>
                <textarea value={temuan} onChange={e => setTemuan(e.target.value)} placeholder="Tuliskan temuan audit linen...&#10;Contoh:&#10;Linen bersih disimpan terbuka&#10;Tidak tersedia kantong kuning&#10;Petugas tanpa APD" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white h-32 outline-none focus:border-blue-500/50 transition-colors"/>
            </div>
            <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm">
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">💡 REKOMENDASI</h2>
                <textarea value={rekomendasi} onChange={e => setRekomendasi(e.target.value)} placeholder="Tuliskan rekomendasi tindak lanjut...&#10;Contoh:&#10;Sediakan lemari tertutup untuk linen bersih&#10;Lengkapi troli linen tertutup&#10;Sosialisasi penggunaan APD petugas linen" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white h-32 outline-none focus:border-blue-500/50 transition-colors"/>
            </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl p-6 sm:p-8 rounded-[2.5rem] border border-white/5 shadow-sm">
          <DocumentationUploader images={images} setImages={setImages} />
        </div>

        <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">✍️ TANDA TANGAN DIGITAL</h2>
            <DigitalSignatureSection ref={sigRef} pjName={pjName} setPjName={setPjName} pjLabel="PJ RUANGAN" />
        </div>

        <button onClick={handleSubmit} disabled={isSubmitting || !observer || !unit || stats.totalEvaluasi === 0}
          className="w-full flex justify-center items-center gap-3 py-4 mt-6 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 text-white font-bold uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] disabled:opacity-50 group active:scale-[0.98]"
        >
          {isSubmitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />}
          <span>Simpan Data</span>
        </button>
      </div>
    </div>
  );
}

LinenAuditPage.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

