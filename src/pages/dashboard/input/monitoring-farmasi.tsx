import { useState, useEffect, useMemo, useRef, ReactElement } from 'react';
import { useRouter } from 'next/router';
import { 
  ArrowLeft, Save, CheckCircle2, Activity, RefreshCw, Upload, X, ChevronDown, ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';
import { LiveStatisticsCard } from '@/components/LiveStatisticsCard';
import DigitalSignatureSection, { DigitalSignatureRef } from '@/components/DigitalSignatureSection';
import { EditableSelect } from '@/components/EditableSelect';
import { useAppContext } from '@/components/Providers';

const checklistGroups = [
  {
    title: 'A: LINGKUNGAN UMUM',
    items: [
      { id: 'lu_1', label: 'Fasilitas memadai, kebersihan tangan tersedia dan memadai' },
      { id: 'lu_2', label: 'Kipas angin / AC bersih dan bebas debu' },
      { id: 'lu_3', label: 'Langit-langit / plafon bebas noda' },
      { id: 'lu_4', label: 'Mebelair bersih dan bebas debu' }
    ]
  },
  {
    title: 'B: RUANGAN BERSIH',
    items: [
      { id: 'rb_1', label: 'Area penyimpanan obat bersih dan rapi' },
      { id: 'rb_2', label: 'Obat tersusun sesuai kategori' },
      { id: 'rb_3', label: 'Tidak ada debu pada rak penyimpanan' },
      { id: 'rb_4', label: 'Area dispensing bersih' },
      { id: 'rb_5', label: 'Tidak ada makanan/minuman di area kerja' }
    ]
  },
  {
    title: 'C: PEMBUANGAN LIMBAH',
    items: [
      { id: 'pl_1', label: 'Tersedia wadah limbah infeksius, non infeksius, dan benda tajam' },
      { id: 'pl_2', label: 'Ada label di setiap tempat sampah' },
      { id: 'pl_3', label: 'Tempat sampah menggunakan plastik sesuai jenis limbah' },
      { id: 'pl_4', label: 'Container benda tajam tahan air & tahan tusuk' },
      { id: 'pl_5', label: 'Limbah dibuang saat 3/4 penuh atau 48 jam' },
      { id: 'pl_6', label: 'Tempat sampah bersih dan tertutup' },
      { id: 'pl_7', label: 'Pedal injak berfungsi baik' },
      { id: 'pl_8', label: 'Tersedia spillkit tumpahan cairan' }
    ]
  },
  {
    title: 'D: FASILITAS KEBERSIHAN TANGAN',
    items: [
      { id: 'fkt_1', label: 'Tersedia botol handrub dan diberi tanggal pemakaian' },
      { id: 'fkt_2', label: 'Tersedia wastafel cuci tangan' },
      { id: 'fkt_3', label: 'Keran air berfungsi baik' },
      { id: 'fkt_4', label: 'Tersedia sabun cair' },
      { id: 'fkt_5', label: 'Tersedia tissue towel' },
      { id: 'fkt_6', label: 'Tempat sampah dekat wastafel tersedia' },
      { id: 'fkt_7', label: 'Poster 6 langkah cuci tangan dan 5 momen tersedia' }
    ]
  },
  {
    title: 'E: PEMBERSIHAN LINGKUNGAN',
    items: [
      { id: 'pel_1', label: 'Ada jadwal pembersihan harian dan mingguan' },
      { id: 'pel_2', label: 'Permukaan kerja dibersihkan rutin' },
      { id: 'pel_3', label: 'Rak penyimpanan dibersihkan berkala' },
      { id: 'pel_4', label: 'Lantai bersih dan tidak licin' },
      { id: 'pel_5', label: 'Ventilasi bersih dan tidak berdebu' },
      { id: 'pel_6', label: 'Bangunan ruangan dalam kondisi baik' }
    ]
  },
  {
    title: 'F: SUHU DAN KELEMBABAN',
    items: [
      { id: 'sdk_1', label: 'Suhu ruangan sesuai standar penyimpanan obat' },
      { id: 'sdk_2', label: 'Kelembaban ruangan terkontrol' },
      { id: 'sdk_3', label: 'Thermometer tersedia dan berfungsi' }
    ]
  },
  {
    title: 'G: VENTILASI',
    items: [
      { id: 'ven_1', label: 'Sirkulasi udara baik' },
      { id: 'ven_2', label: 'AC/ventilasi berfungsi baik' },
      { id: 'ven_3', label: 'Tidak ada bau menyengat/jamur' }
    ]
  }
];

type AuditStatus = 'ya' | 'tidak' | 'na' | null;

export default function InputMonitoringFarmasiPage() {
  const router = useRouter();
  const { userRole } = useAppContext();
  const isIPCN = userRole === 'IPCN' || userRole === 'Admin';
  
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [observer, setObserver] = useState('');
  
  const [data, setData] = useState<Record<string, AuditStatus>>({});
  
  const [temuan, setTemuan] = useState('');
  const [rekomendasi, setRekomendasi] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [pjName, setPjName] = useState('');
  
  const sigRef = useRef<DigitalSignatureRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'A: LINGKUNGAN UMUM': true,
    'B: RUANGAN BERSIH': true,
    'C: PEMBUANGAN LIMBAH': false,
    'D: FASILITAS KEBERSIHAN TANGAN': false,
    'E: PEMBERSIHAN LINGKUNGAN': false,
    'F: SUHU DAN KELEMBABAN': false,
    'G: VENTILASI': false,
  });

  useEffect(() => {
    setStartTime(new Date());
    const initialData: Record<string, AuditStatus> = {};
    checklistGroups.forEach(group => {
      group.items.forEach(item => {
        initialData[item.id] = null;
      });
    });
    setData(initialData);
  }, []);

  const toggleGroup = (title: string) => {
    setExpandedGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

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
        supervisor: observer,
        checklist_json: {
            data
        },
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

      const { data: sessionData, error } = await supabase.from('audit_farmasi').insert([payload]).select('id').single();
      if (error) {
          // If table might not exist
          console.error("Error direct insert", error);
          const fallbackPayload = {
            indikator_id: 'monitoring_farmasi',
            nama_indikator: 'MONITORING FARMASI',
            tanggal_waktu: payload.waktu,
            observer: payload.supervisor,
            jumlah_dinilai: stats.dinilai,
            jumlah_patuh: stats.patuh,
            persentase: stats.persentase,
            status_kepatuhan: stats.statusText,
            temuan, rekomendasi,
            nama_pj_ruangan: pjName.trim(),
            ttd_pj_ruangan: ttd_pj,
            ttd_ipcn: ttd_ipcn,
            data_indikator: payload.checklist_json
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
        await supabase.storage.from('audit_images').upload(`images/farmasi_${id}_${i}.jpg`, images[i]);
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
            Data Audit Farmasi Berhasil Disimpan
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-6 mb-8 py-6 border-b border-white/5">
        <Link href="/dashboard/input/isolasi" className="p-3 bg-white/5 rounded-2xl border border-white/10 text-slate-400 hover:text-white transition-all shadow-lg hover:shadow-blue-500/10">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-400 bg-[length:200%_auto] animate-gradient uppercase drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            Audit Farmasi
          </h1>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-blue-500/80 mt-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            Audit kepatuhan PPI ruang Farmasi
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
            <Activity className="w-4 h-4 text-purple-400" /> Data Subjek
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Waktu Audit</label>
              <input type="datetime-local" value={startTime ? new Date(startTime.getTime() - startTime.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''} onChange={(e) => setStartTime(new Date(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 [color-scheme:dark]" />
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
            📋 Checklist Audit Farmasi
          </h2>
          <div className="space-y-6">
            {checklistGroups.map((group) => (
              <div key={group.title} className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden">
                <button 
                  type="button" 
                  onClick={() => toggleGroup(group.title)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                >
                  <span className="text-sm font-bold text-white uppercase tracking-widest">{group.title}</span>
                  {expandedGroups[group.title] ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </button>
                <AnimatePresence>
                  {expandedGroups[group.title] && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }} 
                      animate={{ height: 'auto', opacity: 1 }} 
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/5"
                    >
                      <div className="p-4 space-y-4">
                        {group.items.map((item, idx) => (
                          <div key={item.id} className="bg-white/5 p-5 rounded-[1.5rem] border border-white/5 relative overflow-hidden group flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex gap-4 relative z-10">
                                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border bg-white/5 border-white/10 text-slate-400">
                                  <span className="text-xs font-black">{idx + 1}</span>
                                </div>
                                <div className="mt-1 flex-1">
                                  <h3 className="text-sm font-bold text-white leading-relaxed">{item.label}</h3>
                                </div>
                            </div>
                            
                            <div className="flex p-1.5 bg-slate-900 rounded-2xl border border-white/5 w-fit shrink-0 self-end md:self-center z-10">
                                {['ya', 'tidak', 'na'].map(choice => (
                                    <button key={choice} onClick={() => handleActionClick(item.id, choice as any)} type="button"
                                    className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                                        data[item.id] === choice 
                                        ? (choice === 'ya' ? 'bg-emerald-600 text-white shadow-lg' : choice === 'tidak' ? 'bg-red-600 text-white shadow-lg' : 'bg-slate-600 text-white shadow-lg')
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        <LiveStatisticsCard 
          totalDinilai={stats.dinilai} totalPatuh={stats.patuh} totalTidakPatuh={stats.dinilai - stats.patuh} 
          persentase={stats.persentase} statusText={stats.statusText} title="KEPATUHAN FARMASI"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm">
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">📝 TEMUAN</h2>
                <textarea value={temuan} onChange={e => setTemuan(e.target.value)} placeholder="Tuliskan temuan audit...&#10;Contoh:&#10;Tissue towel habis&#10;Rak obat berdebu&#10;Tempat sampah tajam penuh" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white h-32 outline-none"/>
            </div>
            <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm">
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">💡 REKOMENDASI</h2>
                <textarea value={rekomendasi} onChange={e => setRekomendasi(e.target.value)} placeholder="Tuliskan rekomendasi tindak lanjut...&#10;Contoh:&#10;Tambah stok tissue towel&#10;Jadwalkan pembersihan rak" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white h-32 outline-none"/>
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

InputMonitoringFarmasiPage.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};
