import { useState, useEffect, useMemo, ReactElement, useRef } from 'react';
import { useRouter } from 'next/router';
import { 
  ArrowLeft, Save, CheckCircle2, Activity, RefreshCw, Clock, Camera, Upload, Trash2, X, ClipboardCheck, Info, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { useAppContext } from '@/components/Providers';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';
import { LiveStatisticsCard } from '@/components/LiveStatisticsCard';
import DigitalSignatureSection, { DigitalSignatureRef } from '@/components/DigitalSignatureSection';
import { EditableSelect } from '@/components/EditableSelect';

const units = [
  'IGD', 'ICU', 'IBS', 'Rawat Jalan', 'Ranap Aisyah', 
  'Ranap Fatimah', 'Ranap Khadijah', 'Ranap Usman', 
  'Radiologi', 'Laboratorium', 'Pantry', 'Emergency Kebidanan'
];

const professions = [
  'Dokter Umum', 'Dokter Spesialis', 'Perawat', 'Bidan', 
  'Analis Laboratorium', 'Radiografer', 'Pramusaji',
  'Pasien', 'Pengunjung / Keluarga'
];

const auditItems = [
  { id: 'item_1', label: 'Tersedia safety box sesuai standar WHO' },
  { id: 'item_2', label: 'Wadah limbah tajam diletakkan di tempat yang aman' },
  { id: 'item_3', label: 'Wadah limbah tajam tidak lebih dari 3/4 penuh' },
  { id: 'item_4', label: 'Tidak ada benda tajam yang keluar dari wadah' },
  { id: 'item_5', label: 'Limbah tajam langsung dibuang ke wadah limbah tajam' },
  { id: 'item_6', label: 'Tempat sampah khusus benda tajam tersedia pada troli tindakan' },
  { id: 'item_7', label: 'Pengelolaan jarum suntik kontak minimal dan apabila menutup menggunakan metode 1 tangan' },
  { id: 'item_8', label: 'Tersedia jalur pasca pajanan apabila terjadi tusukan benda tajam' }
] as const;

type AuditStatus = 'ya' | 'tidak' | 'na' | null;

export default function InputPengelolaanLimbahTajamPage() {
  const router = useRouter();
  const { userRole } = useAppContext();
  const isIPCN = userRole === 'IPCN' || userRole === 'Admin';
  
  const [startTime, setStartTime] = useState<Date | null>(null);
  
  const [observer, setObserver] = useState('');
  const [unit, setUnit] = useState('');
  const [profesi, setProfesi] = useState('');
  const [temuan, setTemuan] = useState('');
  const [rekomendasi, setRekomendasi] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [pjName, setPjName] = useState('');
  
  const sigRef = useRef<DigitalSignatureRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [auditData, setAuditData] = useState<Record<string, AuditStatus>>({
    item_1: null, item_2: null, item_3: null, item_4: null, 
    item_5: null, item_6: null, item_7: null, item_8: null
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    setStartTime(new Date());
  }, []);

  const handleError = (err: any) => {
    console.error(err);
    alert(`Error: ${err.message || 'Terjadi kesalahan sistem'}`);
  };

  const handleActionClick = (id: string, stat: AuditStatus) => {
    setAuditData(prev => ({ ...prev, [id]: stat }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const stats = useMemo(() => {
    let patuh = 0;
    let dinilai = 0;
    
    Object.values(auditData).forEach(val => {
      if (val === 'ya') { patuh++; dinilai++; }
      else if (val === 'tidak') { dinilai++; }
    });

    const persentase = dinilai > 0 ? Math.round((patuh / dinilai) * 100) : 0;
    let statusText = 'Belum Dinilai';
    if (dinilai > 0) {
      if (persentase >= 85) statusText = 'Patuh';
      else if (persentase >= 70) statusText = 'Cukup';
      else statusText = 'Tidak Patuh';
    }
    return { patuh, dinilai, persentase, statusText };
  }, [auditData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const ttd_pj = sigRef.current?.getPjSignature();
      const ttd_ipcn = sigRef.current?.getSupervisorSignature();

      const payload = {
        tanggal_waktu: startTime?.toISOString() || new Date().toISOString(),
        observer, unit, profesi,
        temuan, rekomendasi,
        ...auditData,
        jumlah_dinilai: stats.dinilai,
        jumlah_patuh: stats.patuh,
        persentase: stats.persentase,
        status_kepatuhan: stats.statusText,
        nama_pj_ruangan: pjName.trim(),
        ttd_pj_ruangan: ttd_pj,
        ttd_ipcn: ttd_ipcn
      };

      const { data: sessionData, error: sessionError } = await supabase
        .from('audit_sessions')
        .insert([{
          indikator_id: 'pengelolaan_limbah_tajam', 
          nama_indikator: 'PENGELOLAAN LIMBAH TAJAM',
          tanggal_waktu: payload.tanggal_waktu,
          observer, unit, profesi,
          jenis_tindakan: 'Pengelolaan Limbah Tajam Audit',
          jumlah_dinilai: stats.dinilai,
          jumlah_patuh: stats.patuh,
          persentase: stats.persentase,
          status_kepatuhan: stats.statusText,
          data_indikator: auditData,
          temuan, rekomendasi,
          nama_pj_ruangan: pjName.trim(),
          ttd_pj_ruangan: ttd_pj,
          ttd_ipcn: ttd_ipcn
        }])
        .select('id')
        .single();

      if (sessionError) throw sessionError;

      for (let i = 0; i < images.length; i++) {
        await supabase.storage.from('audit_images').upload(`images/${sessionData.id}_${i}.jpg`, images[i]);
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
    <div className="max-w-7xl mx-auto pb-32">
      <AnimatePresence>
        {showToast && (
          <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-emerald-500 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold uppercase tracking-widest text-xs border border-emerald-400"
          >
            <CheckCircle2 className="w-5 h-5" />
            Data Audit Berhasil Disimpan!
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-6 mb-8 py-6 border-b border-white/5">
        <Link href="/dashboard/input/isolasi" className="p-3 bg-white/5 rounded-2xl border border-white/10 text-slate-400 hover:text-white transition-all shadow-lg hover:shadow-blue-500/10">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-400 bg-[length:200%_auto] animate-gradient uppercase drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            Audit Pengelolaan Limbah Tajam
          </h1>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-blue-500/80 mt-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            Audit kepatuhan pengelolaan benda tajam dan pencegahan risiko pajanan sesuai standar PPI Rumah Sakit.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
            <Activity className="w-4 h-4 text-purple-400" /> Data Subjek
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <EditableSelect
              label="Observer / Verifikator"
              value={observer}
              onChange={setObserver}
              options={[]}
              isIPCN={isIPCN}
              table="master_observers"
              placeholder="Pilih Observer..."
            />
            <EditableSelect
              label="Unit Kerja / Ruangan"
              value={unit}
              onChange={setUnit}
              options={units}
              isIPCN={isIPCN}
              storageKey="smartppi_units"
              placeholder="Pilih Unit..."
            />
            <EditableSelect
              label="Profesi / Sasaran"
              value={profesi}
              onChange={setProfesi}
              options={professions}
              isIPCN={isIPCN}
              storageKey="smartppi_profesi"
              placeholder="Pilih Profesi..."
            />
          </div>
        </div>

        <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
            Checklist Pengelolaan Limbah Tajam
          </h2>
          <div className="space-y-4">
            {auditItems.map((item, idx) => (
              <div key={item.id} className="bg-white/5 p-6 rounded-[24px] border border-white/5 relative overflow-hidden group">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                  <div className="flex gap-4">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-500 bg-white/5 border-white/10 text-slate-500`}>
                      <span className="text-xs font-black">{idx + 1}</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white mb-2">{item.label}</h3>
                    </div>
                  </div>
                  
                  <div className="flex p-1.5 bg-white/5 rounded-2xl border border-white/5 w-fit self-end md:self-center">
                    {['ya', 'tidak', 'na'].map(choice => (
                      <button key={choice} onClick={() => handleActionClick(item.id, choice as any)}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                          auditData[item.id] === choice 
                            ? (choice === 'ya' ? 'bg-emerald-600 text-white shadow-lg transform scale-105' : choice === 'tidak' ? 'bg-red-600 text-white shadow-lg transform scale-105' : 'bg-slate-600 text-white shadow-lg transform scale-105')
                            : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                        }`}
                      >
                        {choice}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <LiveStatisticsCard 
          totalDinilai={stats.dinilai} totalPatuh={stats.patuh} totalTidakPatuh={stats.dinilai - stats.patuh}
          persentase={stats.persentase} statusText={stats.statusText} title="KEPATUHAN PENGELOLAAN LIMBAH TAJAM"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm">
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">📝 TEMUAN</h2>
                <textarea value={temuan} onChange={e => setTemuan(e.target.value)} placeholder="Tuliskan temuan audit limbah tajam...&#10;Contoh:&#10;Safety box hampir penuh&#10;Safety box tidak tersedia di troli&#10;Jarum masih direcap dua tangan" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white h-32 outline-none"/>
            </div>
            <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm">
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">💡 REKOMENDASI</h2>
                <textarea value={rekomendasi} onChange={e => setRekomendasi(e.target.value)} placeholder="Tuliskan rekomendasi tindak lanjut...&#10;Contoh:&#10;Segera ganti safety box yang penuh&#10;Tempatkan safety box di area tindakan&#10;Edukasi teknik one hand scoop" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white h-32 outline-none"/>
            </div>
        </div>

        <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">📷 DOKUMENTASI</h2>
            <div className="flex flex-wrap gap-4">
                {images.map((img, i) => (
                    <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-white/10 shadow-sm">
                        <img src={URL.createObjectURL(img)} alt="img" className="w-full h-full object-cover"/>
                        <button onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-red-500/80 p-1 rounded-full text-white backdrop-blur-md hover:bg-red-500 transition-colors"><X size={12}/></button>
                    </div>
                ))}
                <button onClick={() => fileInputRef.current?.click()} className="w-24 h-24 rounded-[1.25rem] border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-slate-500 hover:text-blue-400 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all cursor-pointer">
                    <Upload size={24}/>
                    <span className="text-[10px] mt-2 font-bold uppercase tracking-widest">Upload</span>
                </button>
                <input type="file" ref={fileInputRef} hidden multiple accept="image/*" onChange={handleImageChange}/>
            </div>
        </div>

        <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">✍️ TANDA TANGAN DIGITAL</h2>
            <DigitalSignatureSection ref={sigRef} pjName={pjName} setPjName={setPjName} pjLabel="PJ RUANGAN" />
        </div>

        <motion.button 
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={handleSubmit} 
          disabled={isSubmitting || !observer || !unit || !profesi || stats.dinilai === 0}
          className={`w-full group relative overflow-hidden py-6 rounded-[1.5rem] flex items-center justify-center gap-4 transition-all duration-500 disabled:opacity-30 disabled:cursor-not-allowed ${
            isSubmitting 
              ? 'bg-blue-600/50 cursor-wait' 
              : 'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-800 shadow-[0_20px_40px_-15px_rgba(37,99,235,0.4)] hover:shadow-[0_25px_50px_-12px_rgba(37,99,235,0.6)]'
          }`}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.2),transparent)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative flex items-center gap-4">
            <div className="relative">
              {isSubmitting ? (
                <RefreshCw className="w-6 h-6 text-white animate-spin" />
              ) : (
                <>
                  <Save className="w-6 h-6 text-white group-hover:scale-110 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-white/40 blur-lg rounded-full animate-pulse" />
                </>
              )}
            </div>
            <span className="text-xs font-black uppercase tracking-[0.3em] text-white drop-shadow-md">
              {isSubmitting ? 'Memproses...' : 'Simpan Data Audit'}
            </span>
          </div>
        </motion.button>
      </div>
    </div>
  );
}

InputPengelolaanLimbahTajamPage.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

