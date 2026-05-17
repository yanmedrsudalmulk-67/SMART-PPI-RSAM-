import { useState, useEffect, useMemo, ReactElement, useRef } from 'react';
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
import { EditableSelect } from '@/components/EditableSelect';
import DigitalSignatureSection, { DigitalSignatureRef } from '@/components/DigitalSignatureSection';
import { DocumentationUploader, DocImage } from '@/components/DocumentationUploader';

const units = [
  'IGD', 'ICU', 'Ranap Aisyah', 'Ranap Fatimah', 'Ranap Khadijah', 'Ranap Usman'
];

const auditItems = [
  { id: 'catatan_infeksi', label: 'Ada catatan pasien infeksi dan non infeksi', key: 'catatan_infeksi' },
  { id: 'instruksi_ruang', label: 'Instruksi jelas untuk petugas dan pengunjung di ruang infeksi (tanda)', key: 'instruksi_ruang' },
  { id: 'poster_pencegahan', label: 'Poster petunjuk pencegahan penularan penyakit (kontak, droplet, airborne)', key: 'poster_pencegahan' },
  { id: 'apd_tersedia', label: 'Alat proteksi diri tersedia lengkap saat memasuki ruang isolasi', key: 'apd_tersedia' },
  { id: 'catatan_klinis', label: 'Ada catatan kasus/bagan klinis di ruangan isolasi', key: 'catatan_klinis' },
  { id: 'instruksi_isolasi', label: 'Instruksi jelas untuk petugas dan pengunjung saat pasien di isolasi (contoh: tanda di pintu)', key: 'instruksi_isolasi' },
  { id: 'pintu_tertutup', label: 'Pintu selalu ditutup', key: 'pintu_tertutup' },
  { id: 'alur_pasien', label: 'Alur pasien masuk terpasang jelas', key: 'alur_pasien' }
] as const;

type AuditStatus = 'ya' | 'tidak' | 'na' | null;

export default function InputPenempatanPasienPage() {
  const router = useRouter();
  const { userRole } = useAppContext();
  
  const [startTime, setStartTime] = useState<Date | null>(null);
  
  const [observer, setObserver] = useState('');
  const [unit, setUnit] = useState('');
  const [temuan, setTemuan] = useState('');
  const [rekomendasi, setRekomendasi] = useState('');
  const [images, setImages] = useState<DocImage[]>([]);
  const [pjName, setPjName] = useState('');
  const sigRef = useRef<DigitalSignatureRef>(null);

  const [auditData, setAuditData] = useState<Record<string, AuditStatus>>({
    catatan_infeksi: null, instruksi_ruang: null, poster_pencegahan: null, apd_tersedia: null,
    catatan_klinis: null, instruksi_isolasi: null, pintu_tertutup: null, alur_pasien: null
  });

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

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      setStartTime(new Date(val));
    }
  };

  const formattedDate = startTime ? new Date(startTime.getTime() - startTime.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.values(auditData).some(v => v === null)) { alert('Harap isi semua indikator!'); return; }
    
    setIsSubmitting(true);
    
    try {
      const ttd_pj = sigRef.current?.getPjSignature();
      const ttd_ipcn = sigRef.current?.getSupervisorSignature();

      const payload = {
        tanggal_waktu: startTime?.toISOString() || new Date().toISOString(),
        observer, unit,
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
          indikator_id: 'penempatan_pasien', 
          nama_indikator: 'PENEMPATAN PASIEN',
          tanggal_waktu: payload.tanggal_waktu,
          observer, unit,
          temuan, rekomendasi,
          jumlah_dinilai: stats.dinilai,
          jumlah_patuh: stats.patuh,
          persentase: stats.persentase,
          status_kepatuhan: stats.statusText,
          data_indikator: auditData,
          nama_pj_ruangan: pjName.trim(),
          ttd_pj_ruangan: ttd_pj,
          ttd_ipcn: ttd_ipcn
        }])
        .select('id')
        .single();

      if (sessionError) throw sessionError;

      for(let i=0; i<images.length; i++) {
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
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r bg-[length:200%_auto] animate-gradient drop-shadow-[0_0_10px_rgba(59,130,246,0.4)] from-blue-400 via-purple-500 to-blue-400">Audit Penempatan Pasien</h1>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.1em] text-blue-400 mt-1">Observasi kepatuhan penempatan pasien infeksius</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
            <Activity className="w-4 h-4 text-purple-400" /> Informasi Audit
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
            <div>
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
            <FileText className="w-4 h-4 text-amber-400" /> CEKLIST PENEMPATAN PASIEN
          </h2>
          <div className="space-y-4">
            {auditItems.map((item) => (
              <div key={item.id} className="bg-black/20 p-5 rounded-2xl border border-white/5">
                <h3 className="text-sm font-semibold text-white mb-4 leading-relaxed">{item.label}</h3>
                <div className="flex gap-3">
                  {['ya', 'tidak', 'na'].map(choice => (
                    <button key={choice} onClick={() => handleActionClick(item.id, choice as any)}
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

        <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm space-y-6">
          <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Temuan</label>
              <textarea value={temuan} onChange={e => setTemuan(e.target.value)} placeholder="Masukkan temuan di lapangan..." rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition-colors placeholder:text-slate-600" />
          </div>
          <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Rekomendasi</label>
              <textarea value={rekomendasi} onChange={e => setRekomendasi(e.target.value)} placeholder="Masukkan rekomendasi tindak lanjut..." rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition-colors placeholder:text-slate-600" />
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl p-6 sm:p-8 rounded-[2.5rem] border border-white/5 shadow-sm">
          <DocumentationUploader images={images} setImages={setImages} />
        </div>

        <LiveStatisticsCard 
          totalDinilai={stats.dinilai} totalPatuh={stats.patuh} totalTidakPatuh={stats.dinilai - stats.patuh}
          persentase={stats.persentase} statusText={stats.statusText} title="KEPATUHAN PENEMPATAN PASIEN"
        />

        <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">✍️ TANDA TANGAN DIGITAL</h2>
            <DigitalSignatureSection ref={sigRef} pjName={pjName} setPjName={setPjName} pjLabel="PJ RUANGAN" />
        </div>

        <button onClick={handleSubmit} disabled={isSubmitting || !observer || !unit || stats.dinilai === 0}
          className="w-full flex justify-center items-center gap-3 py-4 mt-6 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 text-white font-bold uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] disabled:opacity-50"
        >
          {isSubmitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          <span>Simpan Data</span>
        </button>
      </div>
    </div>
  );
}

InputPenempatanPasienPage.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

