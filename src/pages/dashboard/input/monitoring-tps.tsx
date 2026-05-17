import { useState, useEffect, useMemo, useRef, ReactElement } from 'react';
import { useRouter } from 'next/router';
import { 
  ArrowLeft, Save, CheckCircle2, Activity, RefreshCw, ChevronDown, ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';
import { LiveStatisticsCard } from '@/components/LiveStatisticsCard';
import DigitalSignatureSection, { DigitalSignatureRef } from '@/components/DigitalSignatureSection';
import { EditableSelect } from '@/components/EditableSelect';
import { useAppContext } from '@/components/Providers';
import { DocumentationUploader, DocImage } from '@/components/DocumentationUploader';

const checklistGroups = [
  {
    title: 'A. Area TPS dan Bangunan',
    items: [
      { id: 'tb_1', label: 'Lokasi TPS terpisah dari area pelayanan pasien' },
      { id: 'tb_2', label: 'TPS memiliki akses terbatas / terkunci' },
      { id: 'tb_3', label: 'Bangunan TPS tertutup dan aman' },
      { id: 'tb_4', label: 'Lantai kuat, rata, kedap air, dan mudah dibersihkan' },
      { id: 'tb_5', label: 'Lantai tidak licin' },
      { id: 'tb_6', label: 'Dinding dalam kondisi baik dan bersih' },
      { id: 'tb_7', label: 'Atap tidak bocor' },
      { id: 'tb_8', label: 'Pencahayaan cukup' },
      { id: 'tb_9', label: 'Ventilasi memadai' },
      { id: 'tb_10', label: 'Tersedia drainase / saluran pembuangan baik' }
    ]
  },
  {
    title: 'B. Kebersihan Lingkungan',
    items: [
      { id: 'kl_1', label: 'Area TPS bersih dan rapi' },
      { id: 'kl_2', label: 'Tidak ada tumpahan sampah di lantai' },
      { id: 'kl_3', label: 'Tidak ada bau menyengat berlebihan' },
      { id: 'kl_4', label: 'Tidak ada genangan air' },
      { id: 'kl_5', label: 'Tidak ada debu berlebihan' },
      { id: 'kl_6', label: 'Tidak ditemukan vektor (lalat/tikus/kucing liar)' },
      { id: 'kl_7', label: 'Jadwal pembersihan rutin tersedia' },
      { id: 'kl_8', label: 'Disinfeksi area dilakukan berkala' }
    ]
  },
  {
    title: 'C. Pemilahan dan Penyimpanan Sampah',
    items: [
      { id: 'ps_1', label: 'Sampah medis dan non medis dipisahkan' },
      { id: 'ps_2', label: 'Sampah infeksius menggunakan kantong kuning' },
      { id: 'ps_3', label: 'Sampah non medis menggunakan kantong hitam' },
      { id: 'ps_4', label: 'Limbah tajam menggunakan safety box/container khusus' },
      { id: 'ps_5', label: 'Safety box tidak lebih dari 3/4 penuh' },
      { id: 'ps_6', label: 'Sampah diberi label sesuai jenis' },
      { id: 'ps_7', label: 'Wadah sampah tertutup' },
      { id: 'ps_8', label: 'Wadah sampah dalam kondisi baik' },
      { id: 'ps_9', label: 'Tidak ada pencampuran limbah' }
    ]
  },
  {
    title: 'D. Pengangkutan Sampah',
    items: [
      { id: 'psd_1', label: 'Jadwal pengangkutan sampah tersedia' },
      { id: 'psd_2', label: 'Sampah diangkut rutin sesuai jadwal' },
      { id: 'psd_3', label: 'Troli/alat angkut khusus tersedia' },
      { id: 'psd_4', label: 'Troli dalam kondisi bersih' },
      { id: 'psd_5', label: 'Jalur pengangkutan aman dan tidak melewati area bersih' },
      { id: 'psd_6', label: 'Petugas mengikat kantong sebelum diangkut' }
    ]
  },
  {
    title: 'E. Petugas dan APD',
    items: [
      { id: 'pa_1', label: 'Petugas menggunakan sarung tangan' },
      { id: 'pa_2', label: 'Petugas menggunakan masker' },
      { id: 'pa_3', label: 'Petugas menggunakan sepatu boot' },
      { id: 'pa_4', label: 'Petugas menggunakan apron / pelindung' },
      { id: 'pa_5', label: 'Petugas melakukan hand hygiene setelah bekerja' },
      { id: 'pa_6', label: 'Petugas mengetahui SOP pengelolaan limbah' },
      { id: 'pa_7', label: 'Petugas mengetahui penanganan tumpahan limbah' }
    ]
  },
  {
    title: 'F. Sarana Pendukung',
    items: [
      { id: 'sp_1', label: 'Tersedia handrub / fasilitas cuci tangan' },
      { id: 'sp_2', label: 'Tersedia sabun antiseptik' },
      { id: 'sp_3', label: 'Tersedia tissue / pengering tangan' },
      { id: 'sp_4', label: 'Tersedia spill kit limbah' },
      { id: 'sp_5', label: 'Tersedia APAR bila diperlukan' },
      { id: 'sp_6', label: 'Tersedia papan peringatan biohazard' }
    ]
  }
];

type AuditStatus = 'ya' | 'tidak' | 'na' | null;

export default function InputMonitoringTPSPage() {
  const router = useRouter();
  const { userRole } = useAppContext();
  const isIPCN = userRole === 'ipcn' || userRole === 'admin';
  
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [observer, setObserver] = useState('');
  
  const [data, setData] = useState<Record<string, AuditStatus>>({});
  const [keterangan, setKeterangan] = useState<Record<string, string>>({});
  
  const [temuan, setTemuan] = useState('');
  const [rekomendasi, setRekomendasi] = useState('');
  const [images, setImages] = useState<DocImage[]>([]);
  const [pjName, setPjName] = useState('');
  
  const sigRef = useRef<DigitalSignatureRef>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'A. Area TPS dan Bangunan': true,
    'B. Kebersihan Lingkungan': true,
    'C. Pemilahan dan Penyimpanan Sampah': false,
    'D. Pengangkutan Sampah': false,
    'E. Petugas dan APD': false,
    'F. Sarana Pendukung': false,
  });

  useEffect(() => {
    setStartTime(new Date());
    const initialData: Record<string, AuditStatus> = {};
    const initialKet: Record<string, string> = {};
    checklistGroups.forEach(group => {
      group.items.forEach(item => {
        initialData[item.id] = null;
        initialKet[item.id] = '';
      });
    });
    setData(initialData);
    setKeterangan(initialKet);
  }, []);

  const toggleGroup = (title: string) => {
    setExpandedGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const handleActionClick = (id: string, stat: AuditStatus) => {
    setData(prev => ({ ...prev, [id]: stat }));
  };

  const handleKeteranganChange = (id: string, val: string) => {
    setKeterangan(prev => ({ ...prev, [id]: val }));
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
        ruangan: 'TPS',
        supervisor: observer,
        checklist_json: {
            data
        },
        keterangan_json: {
            data: keterangan
        },
        persentase: stats.persentase,
        status: stats.statusText,
        temuan,
        rekomendasi,
        nama_pj: pjName.trim(),
        ttd_pj: ttd_pj,
        ttd_ipcn: ttd_ipcn
      };

      const { data: sessionData, error } = await supabase.from('audit_tps').insert([payload]).select('id').single();
      if (error) {
          console.error("Error direct insert", error);
          const fallbackPayload = {
            indikator_id: 'monitoring_tps',
            nama_indikator: 'MONITORING TPS',
            tanggal_waktu: payload.waktu,
            observer: payload.supervisor,
            unit: payload.ruangan,
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
          await uploadAssets(fallbackData.id, true);
      } else {
          await uploadAssets(sessionData.id, false);
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

  const uploadAssets = async (id: string, isFallback: boolean) => {
      const prefix = isFallback ? 'tps_' : 'tps_';
      for (let i = 0; i < images.length; i++) {
        await supabase.storage.from('audit_images').upload(`images/${prefix}${id}_${i}.jpg`, images[i].file);
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
            Data Audit TPS berhasil disimpan
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-6 mb-8 py-6 border-b border-white/5">
        <Link href="/dashboard/input/isolasi" className="p-3 bg-white/5 rounded-2xl border border-white/10 text-slate-400 hover:text-white transition-all shadow-lg hover:shadow-blue-500/10">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-400 bg-[length:200%_auto] animate-gradient uppercase drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            Input Audit Tempat Pembuangan Sampah (TPS)
          </h1>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-blue-500/80 mt-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            Audit kepatuhan Pencegahan dan Pengendalian Infeksi area TPS Rumah Sakit
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
            <Activity className="w-4 h-4 text-purple-400" /> Informasi Umum
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">🕒 Waktu Audit</label>
              <input type="datetime-local" value={startTime ? new Date(startTime.getTime() - startTime.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''} onChange={(e) => setStartTime(new Date(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 [color-scheme:dark]" />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">📍 Ruangan</label>
              <input type="text" readOnly value="TPS" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none cursor-not-allowed text-slate-400" />
            </div>
            <div className="md:col-span-2">
              <EditableSelect
                label="👤 Supervisor"
                value={observer}
                onChange={setObserver}
                options={['IPCN_Adi Tresa Purnama']}
                isIPCN={isIPCN}
                table="master_observers"
                storageKey="local_obs"
                placeholder="Pilih Supervisor..."
              />
            </div>
          </div>
        </div>

        <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
            📋 Ceklist PPI Tempat Pembuangan Sampah (TPS)
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
                          <div key={item.id} className="bg-white/5 p-5 rounded-[1.5rem] border border-white/5 flex flex-col gap-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex gap-4 relative z-10 w-full md:w-auto">
                                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border bg-white/5 border-white/10 text-slate-400">
                                    <span className="text-xs font-black">{idx + 1}</span>
                                  </div>
                                  <div className="mt-1 flex-1">
                                    <h3 className="text-sm font-bold text-white leading-relaxed">{item.label}</h3>
                                  </div>
                              </div>
                              
                              <div className="flex p-1.5 bg-slate-900 rounded-2xl border border-white/5 w-full md:w-fit shrink-0 relative z-10">
                                  {['ya', 'tidak', 'na'].map(choice => (
                                      <button key={choice} onClick={() => handleActionClick(item.id, choice as any)} type="button"
                                      className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                                          data[item.id] === choice 
                                          ? (choice === 'ya' ? 'bg-emerald-600 text-white shadow-lg' : choice === 'tidak' ? 'bg-red-600 text-white shadow-lg' : 'bg-slate-600 text-white shadow-lg')
                                          : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                                      }`}
                                      >
                                      {choice === 'na' ? 'N/A' : choice}
                                      </button>
                                  ))}
                              </div>
                            </div>
                            <div className="w-full">
                                <input 
                                    type="text" 
                                    value={keterangan[item.id] || ''} 
                                    onChange={(e) => handleKeteranganChange(item.id, e.target.value)} 
                                    placeholder="Keterangan opsional..." 
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-blue-500/50 transition-colors placeholder:text-slate-600" 
                                />
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
          persentase={stats.persentase} statusText={stats.statusText} title="KEPATUHAN TPS"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm">
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">📝 Temuan Audit</h2>
                <textarea value={temuan} onChange={e => setTemuan(e.target.value)} placeholder="Tuliskan temuan audit...&#10;Contoh:&#10;Safety box penuh&#10;Lantai TPS licin&#10;Limbah belum dipilah" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white h-32 outline-none focus:border-blue-500/50 transition-colors placeholder:text-slate-600"/>
            </div>
            <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm">
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">💡 Rekomendasi</h2>
                <textarea value={rekomendasi} onChange={e => setRekomendasi(e.target.value)} placeholder="Tuliskan rekomendasi tindak lanjut...&#10;Contoh:&#10;Ganti safety box segera&#10;Lakukan disinfeksi harian&#10;Tambahkan label pemilahan limbah" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white h-32 outline-none focus:border-blue-500/50 transition-colors placeholder:text-slate-600"/>
            </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl p-6 sm:p-8 rounded-[2.5rem] border border-white/5 shadow-sm">
          <DocumentationUploader images={images} setImages={setImages} />
        </div>

        <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">✍️ TANDA TANGAN DIGITAL</h2>
            <DigitalSignatureSection ref={sigRef} pjName={pjName} setPjName={setPjName} pjLabel="PJ TPS" />
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

InputMonitoringTPSPage.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};
