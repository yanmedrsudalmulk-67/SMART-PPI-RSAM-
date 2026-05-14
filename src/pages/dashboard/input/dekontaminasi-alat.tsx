import { useState, useEffect, useMemo, ReactElement } from 'react';
import { useRouter } from 'next/router';
import { 
  ArrowLeft, Save, CheckCircle2, Activity, RefreshCw, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { useAppContext } from '@/components/Providers';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';
import { LiveStatisticsCard } from '@/components/LiveStatisticsCard';

type Observer = { id: string; nama: string };

const units = [
  'IGD', 'ICU', 'IBS', 'Rawat Jalan', 'Ranap Aisyah', 
  'Ranap Fatimah', 'Ranap Khadijah', 'Ranap Usman', 
  'Radiologi', 'Laboratorium', 'Pantry', 'Emergency Kebidanan'
];

const professions = [
  'Dokter Umum', 'Dokter Spesialis', 'Perawat', 'Bidan', 
  'Analis Laboratorium', 'Radiografer', 'Pramusaji'
];

const auditItems = [
  { id: 'peralatan_tersedia', label: '1. Peralatan tersedia dan tersusun baik di meja dan lemari', key: 'peralatan_tersedia' },
  { id: 'peralatan_berkarat', label: '2. Adakah peralatan sarana dan prasarana kesehatan yang berkarat', key: 'peralatan_berkarat' },
  { id: 'sterilisasi_tersentral', label: '3. Sterilisasi tersentral', key: 'sterilisasi_tersentral' },
  { id: 'alat_reused', label: '4. Alat used reused sesuai aturan', key: 'alat_reused' },
  { id: 'metode_dekontaminasi', label: '5. Petugas dapat menjelaskan metoda dekontaminasi peralatan yang biasa digunakan pasien', key: 'metode_dekontaminasi' },
  { id: 'dekontaminasi_lokal', label: '6. Dekontaminasi lokal dari instrumen bedah tidak dilakukan di area klinis', key: 'dekontaminasi_lokal' },
  { id: 'expired_date', label: '7. Tanggal kadaluarsa peralatan steril belum terlewati', key: 'expired_date' },
  { id: 'instrumen_bekas', label: '8. Tidak terlihat debu / darah tertinggal di instrumen bekas pakai', key: 'instrumen_bekas' }
] as const;

type AuditStatus = 'ya' | 'tidak' | 'na' | null;

export default function InputDekontaminasiAlatPage() {
  const router = useRouter();
  const { userRole } = useAppContext();
  
  const [startTime, setStartTime] = useState<Date | null>(null);
  
  const [observer, setObserver] = useState('');
  const [unit, setUnit] = useState('');
  const [profesi, setProfesi] = useState('');
  const [keterangan, setKeterangan] = useState('');
  
  const [observers, setObservers] = useState<Observer[]>([]);

  const [auditData, setAuditData] = useState<Record<string, AuditStatus>>({
    peralatan_tersedia: null, peralatan_berkarat: null, sterilisasi_tersentral: null, alat_reused: null, 
    metode_dekontaminasi: null, dekontaminasi_lokal: null, expired_date: null, instrumen_bekas: null
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const d = new Date();
    setStartTime(d);
    fetchObservers();
  }, []);

  const fetchObservers = async () => {
    try {
      const { data, error } = await supabase.from('master_observers').select('*').order('nama');
      if (error) throw error;
      
      let finalData = data || [];
      const hasAdi = finalData.some(s => s.nama === 'IPCN_Adi Tresa Purnama');
      if (!hasAdi) {
        finalData = [{ id: 'adi-static', nama: 'IPCN_Adi Tresa Purnama' }, ...finalData];
      }
      setObservers(finalData);
      if (finalData.length > 0 && !observer) {
        setObserver(finalData[0].nama);
      }
    } catch (err) {
      setObservers([{ id: '1', nama: 'IPCN_Adi Tresa Purnama' }]);
      setObserver('IPCN_Adi Tresa Purnama');
    }
  };

  const handleError = (err: any) => {
    console.error(err);
    alert(`Error: ${err.message || 'Terjadi kesalahan sistem'}`);
  };

  const handleActionClick = (id: string, stat: AuditStatus) => {
    setAuditData(prev => ({ ...prev, [id]: stat }));
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
      statusText = persentase === 100 ? 'Patuh' : 'Tidak Patuh';
    }
    return { patuh, dinilai, persentase, statusText };
  }, [auditData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const payload = {
        tanggal_waktu: startTime?.toISOString() || new Date().toISOString(),
        observer, unit, profesi,
        keterangan,
        ...auditData,
        jumlah_dinilai: stats.dinilai,
        jumlah_patuh: stats.patuh,
        persentase: stats.persentase,
        status_kepatuhan: stats.statusText,
      };

      const { data: sessionData, error: sessionError } = await supabase
        .from('audit_sessions')
        .insert([{
          indikator_id: 'dekontaminasi_alat', 
          nama_indikator: 'DEKONTAMINASI ALAT',
          tanggal_waktu: payload.tanggal_waktu,
          observer, unit, profesi,
          jenis_tindakan: keterangan,
          jumlah_dinilai: stats.dinilai,
          jumlah_patuh: stats.patuh,
          persentase: stats.persentase,
          status_kepatuhan: stats.statusText,
          data_indikator: auditData
        }])
        .select('*')
        .single();

      if (sessionError) throw sessionError;

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
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-blue-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold uppercase tracking-widest text-xs border border-blue-400/30"
          >
            <CheckCircle2 className="w-5 h-5" />
            Data Audit Dekontaminasi Alat Tersimpan!
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-6 mb-8 py-6 border-b border-white/5">
        <Link href="/dashboard/input/isolasi" className="p-3 bg-white/5 rounded-2xl border border-white/10 text-slate-400 hover:text-white transition-all">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-blue-500 to-emerald-500 dark:from-blue-400 dark:via-purple-500 dark:to-blue-400 bg-[length:200%_auto] animate-gradient transition-all drop-shadow-sm dark:drop-shadow-[0_0_10px_rgba(59,130,246,0.4)] uppercase">Audit Dekontaminasi Alat</h1>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.1em] text-emerald-600 dark:text-blue-400 mt-1">Observasi kepatuhan dekontaminasi peralatan medis</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white/5 p-6 rounded-[24px] border border-white/5">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
            <Activity className="w-4 h-4 text-purple-400" /> Data Subjek
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Observer</label>
              <select value={observer} onChange={(e) => setObserver(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none">
                <option value="" className="bg-slate-900">Pilih Observer...</option>
                {observers.map(o => <option key={o.id} value={o.nama} className="bg-slate-900">{o.nama}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Unit</label>
              <select value={unit} onChange={(e) => setUnit(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none">
                <option value="" className="bg-slate-900">Pilih Unit...</option>
                {units.map(u => <option key={u} value={u} className="bg-slate-900">{u}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Profesi / Sasaran</label>
              <select value={profesi} onChange={(e) => setProfesi(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none">
                <option value="" className="bg-slate-900">Pilih...</option>
                {professions.map(p => <option key={p} value={p} className="bg-slate-900">{p}</option>)}
                <option value="Pasien" className="bg-slate-900">Pasien</option>
                <option value="Pengunjung / Keluarga" className="bg-slate-900">Pengunjung / Keluarga</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white/5 p-6 rounded-[24px] border border-white/5">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
            <FileText className="w-4 h-4 text-amber-400" /> Keterangan Tambahan
          </h2>
          <input type="text" value={keterangan} onChange={(e) => setKeterangan(e.target.value)} placeholder="Opsional..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none" />
        </div>

        <div className="space-y-4">
          {auditItems.map((item) => (
            <div key={item.id} className="bg-white/5 p-6 rounded-[24px] border border-white/5">
              <h3 className="text-sm font-bold text-white mb-4">{item.label}</h3>
              <div className="grid grid-cols-3 gap-3">
                {['ya', 'tidak', 'na'].map(choice => (
                  <button key={choice} onClick={() => handleActionClick(item.id, choice as any)}
                    className={`py-3 px-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
                      auditData[item.id] === choice 
                        ? (choice === 'ya' ? 'bg-blue-600/20 text-blue-400 border-blue-500/50' : choice === 'tidak' ? 'bg-red-600/20 text-red-400 border-red-500/50' : 'bg-slate-600/20 text-slate-300 border-slate-500/50')
                        : 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10'
                    }`}
                  >
                    {choice.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <LiveStatisticsCard 
          totalDinilai={stats.dinilai} totalPatuh={stats.patuh} totalTidakPatuh={stats.dinilai - stats.patuh}
          persentase={stats.persentase} statusText={stats.statusText} title="KEPATUHAN DEKONTAMINASI ALAT"
        />

        <button onClick={handleSubmit} disabled={isSubmitting || !observer || !unit || !profesi || stats.dinilai === 0}
          className="w-full flex justify-center items-center gap-4 py-5 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-widest rounded-2xl transition-all shadow-lg disabled:opacity-50"
        >
          {isSubmitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          <span>Simpan Data Audit</span>
        </button>
      </div>
    </div>
  );
}

InputDekontaminasiAlatPage.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};
