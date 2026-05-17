import { useState, useEffect, useMemo, useRef, ReactElement } from 'react';
import { useRouter } from 'next/router';
import { 
  ArrowLeft, Save, CheckCircle2, Activity, RefreshCw, Upload, X, UserSearch
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';
import { LiveStatisticsCard } from '@/components/LiveStatisticsCard';
import DigitalSignatureSection, { DigitalSignatureRef } from '@/components/DigitalSignatureSection';
import { EditableSelect } from '@/components/EditableSelect';
import { useAppContext } from '@/components/Providers';

const checklistItems = [
  { id: 'ppi_1', label: 'Penggunaan APD yang sesuai' },
  { id: 'ppi_2', label: 'Ketersediaan APD yang sesuai' },
  { id: 'ppi_3', label: 'Kelengkapan Fasilitas Hand Hygiene' },
  { id: 'ppi_4', label: 'Edukasi Etika Batuk / Pembuangan Sputum' },
  { id: 'ppi_5', label: 'Edukasi Hand Hygiene' }
];

type AuditStatus = 'ya' | 'tidak' | null;
type TekananUdara = 'negatif' | 'positif' | null;

export default function InputPPIRuangIsolasiPage() {
  const router = useRouter();
  const { userRole } = useAppContext();
  const isIPCN = userRole === 'IPCN' || userRole === 'Admin';
  
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [observer, setObserver] = useState('');
  
  // Patient Data
  const [namaPasien, setNamaPasien] = useState('');
  const [umur, setUmur] = useState('');
  const [noRm, setNoRm] = useState('');
  
  const [tekananUdara, setTekananUdara] = useState<TekananUdara>(null);
  
  const [data, setData] = useState<Record<string, AuditStatus>>({});
  
  const [keterangan, setKeterangan] = useState('');
  const [temuan, setTemuan] = useState('');
  const [rekomendasi, setRekomendasi] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [pjName, setPjName] = useState('');
  
  const sigRef = useRef<DigitalSignatureRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  
  useEffect(() => {
    setStartTime(new Date());
    const initialData: Record<string, AuditStatus> = {};
    checklistItems.forEach(item => {
      initialData[item.id] = null;
    });
    setData(initialData);
  }, []);

  const handleActionClick = (id: string, stat: AuditStatus) => {
    setData(prev => ({ ...prev, [id]: stat }));
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
    Object.values(data).forEach(val => {
      if (val === 'ya') { patuh++; dinilai++; }
      else if (val === 'tidak') { dinilai++; }
    });
    const persentase = dinilai > 0 ? Math.round((patuh / dinilai) * 100) : 0;
    let statusText = 'Belum Dinilai';
    if (dinilai > 0) {
      if (persentase >= 85) statusText = 'Baik';
      else if (persentase >= 70) statusText = 'Cukup';
      else statusText = 'Perlu Tindak Lanjut';
    }
    return { patuh, dinilai, persentase, statusText };
  }, [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!observer) return alert('Pilih Supervisor terlebih dahulu');

    setIsSubmitting(true);
    try {
      const ttd_pj = sigRef.current?.getPjSignature();
      const ttd_ipcn = sigRef.current?.getSupervisorSignature();

      const payload = {
        waktu: startTime?.toISOString() || new Date().toISOString(),
        ruangan: 'Ruang Isolasi',
        supervisor: observer,
        nama_pasien: namaPasien,
        umur: umur,
        no_rm: noRm,
        tekanan_udara: tekananUdara,
        checklist_json: { data },
        keterangan,
        persentase: stats.persentase,
        temuan,
        rekomendasi,
        jumlah_dinilai: stats.dinilai,
        jumlah_patuh: stats.patuh,
        status_kepatuhan: stats.statusText,
        nama_pj_ruangan: pjName.trim(),
        ttd_pj_ruangan: ttd_pj,
        ttd_ipcn: ttd_ipcn
      };

      const { data: sessionData, error } = await supabase.from('ppi_ruang_isolasi').insert([payload]).select('id').single();
      if (error) {
          console.error("Error direct insert", error);
          const fallbackPayload = {
            indikator_id: 'ppi_ruang_isolasi',
            nama_indikator: 'PPI DI RUANG ISOLASI',
            tanggal_waktu: payload.waktu,
            observer: payload.supervisor,
            ruangan: payload.ruangan,
            jumlah_dinilai: stats.dinilai,
            jumlah_patuh: stats.patuh,
            persentase: stats.persentase,
            status_kepatuhan: stats.statusText,
            temuan, rekomendasi,
            nama_pj_ruangan: pjName.trim(),
            ttd_pj_ruangan: ttd_pj,
            ttd_ipcn: ttd_ipcn,
            data_indikator: {
              ...payload.checklist_json,
              nama_pasien: payload.nama_pasien,
              umur: payload.umur,
              no_rm: payload.no_rm,
              tekanan_udara: payload.tekanan_udara,
              keterangan: payload.keterangan
            }
          };
          const { data: fallbackData, error: fbError } = await supabase.from('audit_sessions').insert([fallbackPayload]).select('id').single();
          if (fbError) throw fbError;
          await uploadAssets(fallbackData.id);
      } else {
          await uploadAssets(sessionData.id);
      }

      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        router.push('/dashboard/input/isolasi');
      }, 2000);
    } catch (err: any) {
      console.error(err);
      alert(`Error: ${err.message || 'Gagal menyimpan data'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const uploadAssets = async (id: string) => {
      for(let i=0; i<images.length; i++) {
        await supabase.storage.from('audit_images').upload(`images/ppi_iso_${id}_${i}.jpg`, images[i]);
      }
  };

  return (
    <div className="max-w-4xl mx-auto pb-32">
      <AnimatePresence>
        {showToast && (
          <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-emerald-500 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold uppercase tracking-widest text-xs border border-emerald-400"
          >
            <CheckCircle2 className="w-5 h-5" />
            Data PPI Ruang Isolasi Berhasil Disimpan
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-6 mb-8 py-6 border-b border-white/5">
        <Link href="/dashboard/input/isolasi" className="p-3 bg-white/5 rounded-2xl border border-white/10 text-slate-400 hover:text-white transition-all shadow-lg hover:shadow-blue-500/10">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-400 bg-[length:200%_auto] animate-gradient uppercase drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            Input PPI di Ruang Isolasi
          </h1>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-blue-500/80 mt-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            Monitoring kepatuhan PPI pasien dan fasilitas di ruang isolasi
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
            <Activity className="w-4 h-4 text-emerald-400" /> Data Subjek & Ruangan
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Waktu Input</label>
              <input type="datetime-local" value={startTime ? new Date(startTime.getTime() - startTime.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''} onChange={(e) => setStartTime(new Date(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 [color-scheme:dark]" />
            </div>
            
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Ruangan</label>
              <div className="w-full bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 text-sm text-blue-300 font-medium">
                Ruang Isolasi
              </div>
            </div>

            <EditableSelect
              label="Supervisor"
              value={observer}
              onChange={setObserver}
              options={[]}
              isIPCN={isIPCN}
              table="master_observers"
              placeholder="Pilih Supervisor..."
            />
          </div>
        </div>

        <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
            👤 Data Pasien
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Nama Pasien</label>
                  <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <UserSearch className="w-4 h-4 text-slate-400"/>
                      </div>
                      <input type="text" value={namaPasien} onChange={e => setNamaPasien(e.target.value)} placeholder="Nama pasien..." className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none focus:border-blue-500/50" />
                  </div>
              </div>
              <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Umur</label>
                  <input type="text" value={umur} onChange={e => setUmur(e.target.value)} placeholder="Contoh: 45 Tahun" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50" />
              </div>
              <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">No. RM</label>
                  <input type="text" value={noRm} onChange={e => setNoRm(e.target.value)} placeholder="00-00-00" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50" />
              </div>
          </div>

          <div className="mt-8 border-t border-white/5 pt-8">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
                🌬️ Tekanan Udara Ruangan
              </h2>
              <div className="flex bg-slate-900 rounded-xl border border-white/5 w-fit">
                  {['negatif', 'positif'].map(choice => (
                    <button key={choice} type="button" onClick={() => setTekananUdara(choice as TekananUdara)}
                      className={`px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 ${
                        tekananUdara === choice 
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      {choice}
                    </button>
                  ))}
              </div>
          </div>
        </div>

        <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
            🛡️ Checklist PPI
          </h2>
          <div className="space-y-4">
            {checklistItems.map((item, idx) => (
                <div key={item.id} className="bg-slate-900/50 p-5 rounded-[1.5rem] border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-white/5 transition-colors">
                    <div className="flex gap-4 relative z-10 w-full md:w-auto">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border bg-white/5 border-white/10 text-slate-400">
                            <span className="text-xs font-black">{idx + 1}</span>
                        </div>
                        <div className="mt-1 flex-1">
                            <h3 className="text-sm font-bold text-white leading-relaxed">{item.label}</h3>
                        </div>
                    </div>
                    
                    <div className="flex p-1.5 bg-slate-900 rounded-2xl border border-white/5 w-fit shrink-0 self-end md:self-center z-10">
                        {['ya', 'tidak'].map(choice => (
                            <button key={choice} onClick={() => handleActionClick(item.id, choice as any)} type="button"
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                                data[item.id] === choice 
                                ? (choice === 'ya' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-red-600 text-white shadow-lg')
                                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                            }`}
                            >
                            {choice}
                            </button>
                        ))}
                    </div>
                </div>
            ))}
          </div>

          <div className="mt-6">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-3">📝 Keterangan</label>
                <input type="text" value={keterangan} onChange={e => setKeterangan(e.target.value)} placeholder="Contoh: Susp. TB Paru, COVID Suspek..." className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50" />
            </div>
        </div>

        <LiveStatisticsCard 
          totalDinilai={stats.dinilai} totalPatuh={stats.patuh} totalTidakPatuh={stats.dinilai - stats.patuh} 
          persentase={stats.persentase} statusText={stats.statusText} title="KEPATUHAN PPI RUANG ISOLASI"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm">
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">📝 TEMUAN</h2>
                <textarea value={temuan} onChange={e => setTemuan(e.target.value)} placeholder="Tuliskan temuan monitoring...&#10;Contoh:&#10;APD tidak lengkap&#10;Edukasi sputum belum diberikan" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white h-32 outline-none"/>
            </div>
            <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm">
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">💡 REKOMENDASI</h2>
                <textarea value={rekomendasi} onChange={e => setRekomendasi(e.target.value)} placeholder="Tuliskan rekomendasi tindak lanjut...&#10;Contoh:&#10;Lengkapi stok masker N95&#10;Berikan edukasi ulang" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white h-32 outline-none"/>
            </div>
        </div>

        <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">📷 DOKUMENTASI</h2>
            <div className="flex flex-wrap gap-4">
                {images.map((img, i) => (
                    <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-white/10 shadow-sm">
                        <img src={URL.createObjectURL(img)} alt="img" className="w-full h-full object-cover"/>
                        <button onClick={() => removeImage(i)} type="button" className="absolute top-1 right-1 bg-red-500/80 p-1 rounded-full text-white backdrop-blur-md hover:bg-red-500 transition-colors"><X size={12}/></button>
                    </div>
                ))}
                <button onClick={() => fileInputRef.current?.click()} type="button" className="w-24 h-24 rounded-[1.25rem] border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-slate-500 hover:text-blue-400 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all cursor-pointer">
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

        <button onClick={handleSubmit} disabled={isSubmitting || !observer || stats.dinilai === 0}
          className="w-full flex justify-center items-center gap-4 py-5 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-widest rounded-2xl transition-all shadow-lg disabled:opacity-50"
        >
          {isSubmitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          <span>Simpan Data Audit</span>
        </button>
      </div>
    </div>
  );
}

InputPPIRuangIsolasiPage.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};
