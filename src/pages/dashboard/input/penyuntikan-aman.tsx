import { useState, useEffect, useMemo, ReactElement, useRef } from 'react';
import { useRouter } from 'next/router';
import { 
  ArrowLeft, Save, CheckCircle2, Activity, RefreshCw, FileText, Clock
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
  'IGD', 'ICU', 'Ranap Aisyah', 'Ranap Fatimah', 'Ranap Khadijah', 'Ranap Usman', 'Rawat Jalan'
];

const actionTypes = [
  'Injeksi Intramuskular (IM)', 'Injeksi Intravena (IV)', 'Injeksi Subkutan (SC)', 'Injeksi Intradermal (ID)'
];

const auditItems = [
  { id: 'hh', label: 'Kebersihan tangan', key: 'hh' },
  { id: 'apd', label: 'APD sesuai indikasi', key: 'apd' },
  { id: 'disposable', label: 'Spuit sekali pakai (disposable) dan steril', key: 'disposable' },
  { id: 'no_reuse', label: 'Spuit tidak digunakan berulang', key: 'no_reuse' },
  { id: 'no_touch_sterile', label: 'Tidak menyentuh bagian steril jarum', key: 'no_touch_sterile' },
  { id: 'area_disinfection', label: 'Desinfeksi area penyuntikan', key: 'area_disinfection' },
  { id: 'antiseptic_standard', label: 'Menggunakan antiseptik sesuai standar', key: 'antiseptic_standard' },
  { id: 'no_recapping', label: 'Tidak menutup kembali jarum (no recapping)', key: 'no_recapping' },
  { id: 'safety_box', label: 'Jarum langsung dibuang ke safety box', key: 'safety_box' },
  { id: 'no_bending', label: 'Tidak membengkokkan atau mematahkan jarum', key: 'no_bending' }
] as const;

type AuditStatus = 'ya' | 'tidak' | 'na' | null;

export default function InputPenyuntikanAmanPage() {
  const router = useRouter();
  const { userRole } = useAppContext();
  
  const [startTime, setStartTime] = useState<Date | null>(null);
  
  const isIPCN = userRole === 'ipcn';
  
  const [observer, setObserver] = useState('');
  const [unit, setUnit] = useState('');
  const [jenisTindakan, setJenisTindakan] = useState('');
  const [temuan, setTemuan] = useState('');
  const [rekomendasi, setRekomendasi] = useState('');
  
  const [images, setImages] = useState<DocImage[]>([]);
  const [pjName, setPjName] = useState('');
  const signatureRef = useRef<DigitalSignatureRef>(null);

  const [auditData, setAuditData] = useState<Record<string, AuditStatus>>({
    hh: null, apd: null, disposable: null, no_reuse: null, no_touch_sterile: null,
    area_disinfection: null, antiseptic_standard: null, no_recapping: null, safety_box: null, no_bending: null
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    setStartTime(new Date());
  }, []);

  const formatDateForInput = (date: Date | null) => {
    if (!date) return '';
    try {
      const d = new Date(date);
      return d.toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  };

  const formatTimeForInput = (date: Date | null) => {
    if (!date) return '';
    try {
      const d = new Date(date);
      const hours = d.getHours().toString().padStart(2, '0');
      const mins = d.getMinutes().toString().padStart(2, '0');
      return `${hours}:${mins}`;
    } catch (e) {
      return '';
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [year, month, day] = e.target.value.split('-').map(Number);
    if (!year) return;
    
    if (startTime) {
      const newD = new Date(startTime);
      newD.setFullYear(year, month - 1, day);
      setStartTime(newD);
    } else {
        const newD = new Date();
        newD.setFullYear(year, month - 1, day);
        setStartTime(newD);
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [hours, mins] = e.target.value.split(':').map(Number);
    const newD = startTime ? new Date(startTime) : new Date();
    newD.setHours(hours, mins);
    setStartTime(newD);
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
      if (persentase >= 80) statusText = 'Patuh';
      else if (persentase >= 60) statusText = 'Kepatuhan Sedang';
      else statusText = 'Tidak Patuh';
    }
    return { patuh, dinilai, persentase, statusText };
  }, [auditData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.values(auditData).some(v => v === null)) { alert('Harap isi semua indikator!'); return; }
    
    setIsSubmitting(true);
    
    try {
      const pjSig = signatureRef.current?.getPjSignature();
      const ipcnSig = signatureRef.current?.getSupervisorSignature();

      const uploadedImages: string[] = [];
      for (const img of images || []) {
        uploadedImages.push(img.url); 
      }

      const payload = {
        tanggal_waktu: startTime?.toISOString() || new Date().toISOString(),
        observer, unit,
        jenis_tindakan: jenisTindakan,
        temuan, rekomendasi,
        ...auditData,
        jumlah_dinilai: stats.dinilai,
        jumlah_patuh: stats.patuh,
        persentase: stats.persentase,
        status_kepatuhan: stats.statusText,
        dokumentasi: uploadedImages,
        tanda_tangan_pj: pjSig,
        tanda_tangan_ipcn: ipcnSig,
        nama_pj_ruangan: pjName.trim()
      };

      const { data: sessionData, error: sessionError } = await supabase
        .from('audit_sessions')
        .insert([{
          indikator_id: 'penyuntikan_aman', 
          nama_indikator: 'PENYUNTIKAN AMAN',
          tanggal_waktu: payload.tanggal_waktu,
          observer, unit,
          jenis_tindakan: jenisTindakan,
          temuan, rekomendasi,
          jumlah_dinilai: stats.dinilai,
          jumlah_patuh: stats.patuh,
          persentase: stats.persentase,
          status_kepatuhan: stats.statusText,
          data_indikator: { ...auditData, temuan, rekomendasi, dokumentasi: uploadedImages, tanda_tangan_pj: pjSig, tanda_tangan_ipcn: ipcnSig, nama_pj_ruangan: pjName.trim() },
          nama_pj_ruangan: pjName.trim(),
          ttd_pj_ruangan: pjSig,
          ttd_ipcn: ipcnSig
        }])
        .select('id')
        .single();

      if (sessionError) throw sessionError;

      for (let i = 0; i < images.length; i++) {
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
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r bg-[length:200%_auto] animate-gradient drop-shadow-[0_0_10px_rgba(59,130,246,0.4)] from-blue-400 via-purple-500 to-blue-400 uppercase">Audit Penyuntikan Aman</h1>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.1em] text-blue-400 mt-1">Dokumentasi kepatuhan prosedur penyuntikan yang aman</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Waktu Observasi */}
        <div className="bg-white/5 p-6 rounded-[24px] border border-white/5">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
                 <Clock className="w-4 h-4 text-emerald-400" /> Waktu Input
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <div className="relative group overflow-hidden bg-white/5 p-6 rounded-[24px] border border-white/5 hover:border-blue-500/30 transition-all duration-500 shadow-inner">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-transparent rounded-bl-full pointer-events-none" />
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4 block">Tanggal Audit</label>
                  <div className="relative flex items-center">
                    <input 
                      type="date" 
                      value={formatDateForInput(startTime)}
                      onChange={handleDateChange}
                      className="w-full bg-transparent text-xl font-bold text-white outline-none cursor-pointer [appearance:none] [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:left-0 [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:bottom-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer" 
                    />
                  </div>
                </div>

                <div className="relative group overflow-hidden bg-white/5 p-6 rounded-[24px] border border-white/5 hover:border-blue-500/30 transition-all duration-500 shadow-inner border-l-4 border-l-blue-500/30">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-transparent rounded-bl-full pointer-events-none" />
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-4 block flex items-center justify-between">
                    Jam Input
                    <span className="text-[8px] opacity-50 animate-pulse italic text-slate-400">Scroll untuk pilih</span>
                  </label>
                  <div className="relative flex items-center">
                    <input 
                      type="time" 
                      value={formatTimeForInput(startTime)}
                      onChange={handleTimeChange}
                      className="w-full bg-transparent text-xl font-bold text-white outline-none cursor-pointer [appearance:none] [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:left-0 [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:bottom-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer" 
                    />
                  </div>
                </div>
            </div>
        </div>

        <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
            <Activity className="w-4 h-4 text-purple-400" /> Data Subjek
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <EditableSelect 
                label="Observer / Verifikator" 
                value={observer} 
                onChange={setObserver} 
                options={['IPCN_Adi Tresa Purnama']} 
                isIPCN={userRole === 'ipcn'} 
                table="master_observers"
                storageKey="local_obs"
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
            <div className="sm:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Jenis Tindakan</label>
              <select value={jenisTindakan} onChange={(e) => setJenisTindakan(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition-colors">
                <option value="" className="bg-slate-900">Pilih Jenis Tindakan...</option>
                {actionTypes.map(at => <option key={at} value={at} className="bg-slate-900">{at}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
            <FileText className="w-4 h-4 text-amber-400" /> CEKLIST PENYUNTIKAN YANG AMAN
          </h2>
          <div className="space-y-4">
            {auditItems.map((item) => (
              <div key={item.id} className="bg-black/20 p-5 rounded-2xl border border-white/5">
                <h3 className="text-sm font-semibold text-white mb-4 leading-relaxed">{item.label}</h3>
                <div className="flex gap-3">
                  {['ya', 'tidak', 'na'].map(choice => (
                    <button key={choice} type="button" onClick={() => handleActionClick(item.id, choice as any)}
                      className={`py-3 flex-1 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
                        auditData[item.id] === choice ? 'bg-blue-600 text-white border-blue-500' : 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10'
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
          totalDinilai={stats.dinilai || 0} 
          totalPatuh={stats.patuh || 0} 
          totalTidakPatuh={(stats.dinilai || 0) - (stats.patuh || 0)}
          persentase={stats.persentase || 0} 
          statusText={stats.statusText || 'Belum Dinilai'}
        />

        <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Section Audit Tambahan</h2>
          
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Temuan Audit</label>
            <textarea value={temuan} onChange={(e) => setTemuan(e.target.value)} placeholder="Tuliskan temuan audit..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none min-h-[100px]" />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Rekomendasi</label>
            <textarea value={rekomendasi} onChange={(e) => setRekomendasi(e.target.value)} placeholder="Rekomendasi tindakan..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none min-h-[100px]" />
          </div>
          
          <DocumentationUploader images={images} setImages={setImages} />
          
          <DigitalSignatureSection 
            ref={signatureRef} 
            pjName={pjName} 
            setPjName={setPjName} 
            pjLabel="PJ RUANGAN"
          />
        </div>

        <button type="submit" disabled={isSubmitting}
          className="w-full flex justify-center items-center gap-4 py-5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-emerald-900/20 active:scale-[0.98] disabled:opacity-50"
        >
          {isSubmitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          <span>Simpan Data Audit</span>
        </button>
      </form>
    </div>
  );
}  

InputPenyuntikanAmanPage.getLayout = function getLayout(page: React.ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};
