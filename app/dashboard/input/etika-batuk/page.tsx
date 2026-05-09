'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { LiveStatisticsCard } from '@/components/LiveStatisticsCard';
import { useRouter } from 'next/navigation';
import { 
  Activity,
  ArrowLeft, 
  Save, 
  CheckCircle2,
  Clock,
  User,
  Building2,
  Settings,
  FileText,
  Plus,
  Trash2,
  Edit2,
  X,
  RefreshCw,
  Camera,
  Upload,
  Signature,
  FileCheck2,
  Users2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase';
import { uploadImagesToSupabase } from '@/lib/upload';
import { DocumentationUploader, DocImage } from '@/components/DocumentationUploader';
import DigitalSignatureSection, { DigitalSignatureRef } from '@/components/DigitalSignatureSection';
import { useAppContext } from '@/components/providers';

const units = [
  'IGD', 'ICU', 'Ranap Aisyah', 'Ranap Fatimah', 'Ranap Khadijah', 'Ranap Usman'
];

const materiOptions = [
  'Etika batuk',
  'Cuci tangan 5 momen dan 6 langkah'
];

const sasaranOptions = [
  'Pasien',
  'Keluarga pasien',
  'Pengunjung'
];

const checklistItems = [
  { id: 'mengenakan_masker', label: 'Mengenakan masker' },
  { id: 'menutup_mulut_hidung', label: 'Menutup mulut & hidung saat batuk/bersin' },
  { id: 'tisu_sekali_pakai', label: 'Menggunakan tisu sekali pakai' },
  { id: 'cuci_tangan', label: 'Melakukan kebersihan tangan setelah batuk/bersin' },
  { id: 'jarak_sosial', label: 'Menjaga jarak dengan orang lain' }
];

type AuditStatus = 'ya' | 'tidak' | 'na' | null;
type Observer = { id: string; nama: string };

export default function EtikaBatukPage() {
  const router = useRouter();
  const { userRole } = useAppContext();
  const isIPCN = userRole === 'IPCN' || userRole === 'Admin';
  
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [observer, setObserver] = useState('');
  const [unit, setUnit] = useState('');
  
  // Checklist Data
  const [data, setData] = useState<Record<string, AuditStatus>>({
    mengenakan_masker: null,
    menutup_mulut_hidung: null,
    tisu_sekali_pakai: null,
    cuci_tangan: null,
    jarak_sosial: null
  });

  // Materi & Sasaran
  const [materiSelected, setMateriSelected] = useState<string[]>([]);
  const [sasaranSelected, setSasaranSelected] = useState<string[]>([]);
  
  const [temuan, setTemuan] = useState('');
  const [rekomendasi, setRekomendasi] = useState('');
  const [pjName, setPjName] = useState('');

  // Dokumentasi
  const [images, setImages] = useState<DocImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Observer Management
  const [observers, setObservers] = useState<Observer[]>([]);
  const [isObserverModalOpen, setIsObserverModalOpen] = useState(false);
  const [newObserverName, setNewObserverName] = useState('');
  const [editObserverId, setEditObserverId] = useState<string | null>(null);
  
  // Signatures
  const sigRef = useRef<DigitalSignatureRef>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => {
      setStartTime(new Date());
    });
    fetchObservers();
  }, []);

  const fetchObservers = async () => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.from('master_observers').select('*').order('nama');
      if (error) throw error;
      
      const hasAdi = data?.some(s => s.nama === 'IPCN_Adi Tresa Purnama');
      let finalData = data || [];
      if (!hasAdi) {
        finalData = [{ id: 'local-adi', nama: 'IPCN_Adi Tresa Purnama' }, ...finalData];
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

  const saveObserver = async () => {
    if (!newObserverName.trim()) return;
    try {
      const supabase = getSupabase();
      if (editObserverId) {
        if (!editObserverId.startsWith('local-')) {
          const { error } = await supabase.from('master_observers').update({ nama: newObserverName }).eq('id', editObserverId);
          if (error) throw error;
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
      alert('Gagal menyimpan observer');
    }
  };

  const deleteObserver = async (id: string) => {
    if (!confirm('Hapus observer ini?')) return;
    try {
      const supabase = getSupabase();
      if (!id.startsWith('local-')) {
        await supabase.from('master_observers').delete().eq('id', id);
      }
      setObservers(prev => prev.filter(o => o.id !== id));
      if (observer === (observers.find(o => o.id === id)?.nama)) {
        setObserver('');
      }
    } catch (err) {
      console.error('Delete observer fallback:', err);
      setObservers(prev => prev.filter(o => o.id !== id));
      if (observer === (observers.find(o => o.id === id)?.nama)) {
        setObserver('');
      }
    }
  };

  const toggleMateri = (val: string) => {
    setMateriSelected(prev => 
      prev.includes(val) ? prev.filter(i => i !== val) : [...prev, val]
    );
  };

  const toggleSasaran = (val: string) => {
    setSasaranSelected(prev => 
      prev.includes(val) ? prev.filter(i => i !== val) : [...prev, val]
    );
  };

  const toggleItem = (id: string, stat: AuditStatus) => {
    setData(prev => ({ ...prev, [id]: stat }));
  };

  const stats = useMemo(() => {
    let patuh = 0;
    let dinilai = 0;
    Object.values(data).forEach(val => {
      if (val === 'ya') {
        patuh++;
        dinilai++;
      } else if (val === 'tidak') {
        dinilai++;
      }
    });

    const persentase = dinilai > 0 ? Math.round((patuh / dinilai) * 100) : 0;
    let status = 'Belum Dinilai';

    if (dinilai > 0) {
      if (persentase >= 80) status = 'Patuh';
      else if (persentase >= 60) status = 'Perlu Perbaikan';
      else status = 'Tidak Patuh';
    }

    return { patuh, dinilai, persentase, status };
  }, [data]);

  const dataURLToBlob = (dataURL: string) => {
    if (!dataURL || !dataURL.includes(';base64,')) return null;
    const parts = dataURL.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    return new Blob([uInt8Array], { type: contentType });
  };

  
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!observer || !unit || materiSelected.length === 0 || sasaranSelected.length === 0) {
      alert('Harap lengkapi Nama Observer, Unit, Materi, dan Sasaran Edukasi!');
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = getSupabase();

      // Handle Image Uploads to Storage if needed, or just convert to base64/URL
      // For simplicity and matching other patterns, we'll store metadata
      // In a real app, images would go to Supabase Storage

      const uploadedUrls = await uploadImagesToSupabase(supabase, images, 'dokumentasi', 'audit');
      const pjSignature = sigRef.current?.getPjSignature();
      const ipcnSignature = sigRef.current?.getSupervisorSignature();

      const payload = {
        tanggal_waktu: startTime?.toISOString() || new Date().toISOString(),
        observer,
        unit,
        materi_edukasi: materiSelected,
        sasaran_edukasi: sasaranSelected,
        data_indikator: data,
        persentase: stats.persentase,
        status_kepatuhan: stats.status,
        temuan,
        rekomendasi,
        nama_pj_ruangan: pjName,
        ttd_pj_ruangan: pjSignature,
        ttd_ipcn: ipcnSignature,
        created_at: new Date().toISOString(),
        dokumentasi: uploadedUrls
      };

      
      // Modifikasi untuk menggunakan audit_sessions sesuai instruksi
      const { data_indikator, checklist_json, ...headerData } = payload as any;
      
      const sessionPayload = {
        indikator_id: 'audit_etika_batuk', // Menggunakan nama tabel sebagai indikator ID
        nama_indikator: 'AUDIT ETIKA BATUK',
        tanggal_waktu: headerData.tanggal_waktu || headerData.waktu || headerData.start_time || new Date().toISOString(),
        observer: headerData.observer || observer || '',
        unit: headerData.unit || unit || '',
        profesi: headerData.profesi || null,
        jenis_tindakan: headerData.jenis_tindakan || null,
        jumlah_dinilai: headerData.jumlah_dinilai || (typeof stats !== 'undefined' ? stats?.dinilai : null) || 0,
        jumlah_patuh: headerData.jumlah_patuh || (typeof stats !== 'undefined' ? stats?.patuh : null) || 0,
        persentase: headerData.persentase || (typeof stats !== 'undefined' ? stats?.persentase : null) || 0,
        status_kepatuhan: headerData.status_kepatuhan || stats?.status || 'Belum Dinilai',
        temuan: headerData.temuan || '',
        rekomendasi: headerData.rekomendasi || '',
        nama_pj_ruangan: payload.nama_pj_ruangan,
        ttd_pj_ruangan: headerData.ttd_pj_ruangan || null,
        ttd_ipcn: headerData.ttd_ipcn || null,
        dokumentasi: headerData.foto || headerData.dokumentasi || [],
        data_indikator: data_indikator || checklist_json || {} // Tetap simpan raw JSON
      };

      const { data: sessionData, error: sessionError } = await supabase
        .from('audit_sessions')
        .insert([sessionPayload])
        .select('*')
        .single();

      if (sessionError) {
        console.error("Kesalahan Supabase Simpan Session:", sessionError);
        throw sessionError;
      }
      
      // Simpan details (checklist answers)
      const auditData = data_indikator || checklist_json || {};
      const detailPayloads = Object.keys(auditData).map(key => ({
        session_id: sessionData.id,
        pertanyaan_id: key,
        pertanyaan: key,
        jawaban: String(auditData[key])
      }));

      if (detailPayloads.length > 0) {
        const { error: detailError } = await supabase.from('audit_details').insert(detailPayloads);
        if (detailError) {
          console.warn("Kesalahan Supabase Simpan Details:", detailError);
        }
      }

      // Pastikan tabel lama tetap terisi agar backward compatibility
      const { error } = await supabase.from('audit_etika_batuk').insert([payload]);
      // Jika terjadi error pada table lama (mungkin karena skema tidak sesuai), kita hiraukan karena data sudah aman di audit_sessions
      if (error) {
        console.warn("Kesalahan saat menyimpan fallback table (hiraukan jika skema lama un-matched):", error);
      }

      console.log("Penyimpanan berhasil!");
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        setTemuan('');
        setRekomendasi('');
        setImages([]);
        if (sigRef.current) {
          sigRef.current.clearAll();
        }
        router.push('/dashboard/input/isolasi');
      }, 2000);
    } catch (err: any) {
      console.error("Gagal menyimpan:", err);
      alert(`Gagal menyimpan data: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getLocalIsoString = (val: Date | null) => {
    if (!val) return '';
    const tzoffset = val.getTimezoneOffset() * 60000;
    return new Date(val.getTime() - tzoffset).toISOString().slice(0, 16);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-24 px-4 sm:px-6 mt-4">
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-blue-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold uppercase tracking-widest text-xs border border-white/20 glow-blue text-center"
          >
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            Data Berhasil Disimpan
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center gap-6 relative py-4 z-10 border-b border-white/5 bg-navy-dark/50 backdrop-blur-md rounded-b-[2rem]">
        <Link href="/dashboard/input/isolasi" className="p-3 bg-white/5 rounded-2xl border border-white/10 text-slate-400 hover:text-white transition-all">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-gradient">Input Audit Etika Batuk</h1>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-blue-400 mt-1">Audit kepatuhan etika batuk dan edukasi lapangan</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* CARD INPUT UTAMA */}
        <div className="glass-card p-6 sm:p-8 rounded-[2rem] border-white/5 shadow-xl space-y-8">
          
          {/* WAKTU OBSERVASI */}
          <div className="space-y-4">
            <h2 className="flex items-center gap-4 text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">
              <Clock className="w-5 h-5 text-blue-400 shrink-0" /> Waktu Audit
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">Tanggal & Waktu</label>
                <input 
                  type="datetime-local" 
                  value={getLocalIsoString(startTime)}
                  onChange={(e) => setStartTime(new Date(e.target.value))}
                  className="w-full bg-navy-dark/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all appearance-none"
                />
              </div>
            </div>
          </div>

          {/* SUPERVISOR & UNIT */}
          <div className="grid sm:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <h2 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  <User className="w-3.5 h-3.5 text-blue-400" /> Supervisor
                </h2>
                {isIPCN && (
                  <button 
                    type="button" 
                    onClick={() => setIsObserverModalOpen(true)}
                    className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-blue-400 transition-all shadow-sm"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="relative group">
                <select 
                  value={observer}
                  onChange={(e) => setObserver(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-4 text-sm text-white outline-none focus:border-blue-500/50 appearance-none transition-all pr-10 hover:bg-white/8 cursor-pointer"
                  required
                >
                  <option value="" className="bg-navy-dark text-slate-400">Pilih Supervisor...</option>
                  {observers.map(o => <option key={o.id || o.nama} value={o.nama} className="bg-navy-dark">{o.nama}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none group-hover:scale-110 transition-transform">
                  <Plus className="w-4 h-4 text-slate-500" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1">
                <Building2 className="w-3.5 h-3.5 text-blue-400" /> Unit Kerja
              </h2>
              <div className="relative group">
                <select 
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-4 text-sm text-white outline-none focus:border-blue-500/50 appearance-none transition-all pr-10 hover:bg-white/8"
                  required
                >
                  <option value="" className="bg-navy-dark text-slate-400">Pilih Unit...</option>
                  {units.map(u => <option key={u} value={u} className="bg-navy-dark">{u}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none group-hover:scale-110 transition-transform">
                  <Building2 className="w-4 h-4 text-slate-500" />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION: CEKLIST ETIKA BATUK */}
          <div className="border-t border-white/5 pt-8 space-y-8">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400 font-heading">
              Ceklist Audit Etika Batuk
            </h2>
            <div className="space-y-6">
              {checklistItems.map((item) => (
                <div key={item.id} className="space-y-3">
                  <p className="text-sm font-medium text-slate-300 leading-relaxed">{item.label}</p>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleItem(item.id, 'ya')}
                      className={`py-3 px-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all border ${
                        data[item.id] === 'ya' ? 'bg-blue-600/20 text-blue-400 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10'
                      }`}
                    >
                      Ya
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleItem(item.id, 'tidak')}
                      className={`py-3 px-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all border ${
                        data[item.id] === 'tidak' ? 'bg-red-600 text-white shadow-lg grow' : 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10'
                      }`}
                    >
                      Tidak
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleItem(item.id, 'na')}
                      className={`py-3 px-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all border ${
                        data[item.id] === 'na' ? 'bg-white/10 text-white grow' : 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10'
                      }`}
                    >
                      N/A
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Edukasi Sections */}
            <div className="space-y-4 pt-4 border-t border-white/5">
              <h3 className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                <FileCheck2 className="w-4 h-4 text-emerald-400" /> Materi Edukasi
              </h3>
              <div className="grid gap-3">
                {materiOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleMateri(opt)}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      materiSelected.includes(opt) 
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300' 
                        : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-sm font-medium">{opt}</span>
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                      materiSelected.includes(opt) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'
                    }`}>
                      {materiSelected.includes(opt) && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Sasaran Edukasi */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                <Users2 className="w-4 h-4 text-purple-400" /> Sasaran Edukasi
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {sasaranOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleSasaran(opt)}
                    className={`flex items-center justify-center gap-2 p-4 rounded-xl border transition-all ${
                      sasaranSelected.includes(opt) 
                        ? 'bg-purple-500/10 border-purple-500/50 text-purple-300' 
                        : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-xs font-bold uppercase tracking-widest">{opt}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION: TEMUAN & DOKUMENTASI */}
        <div className="glass-card p-6 sm:p-8 rounded-[2rem] border-white/5 shadow-xl space-y-8">
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 font-heading">
              Temuan & Rekomendasi
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">Temuan Lapangan</label>
                <textarea 
                  value={temuan}
                  onChange={(e) => setTemuan(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all min-h-[100px]"
                  placeholder="Deskripsikan temuan di lapangan..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">Rekomendasi / Rencana Tindak Lanjut</label>
                <textarea 
                  value={rekomendasi}
                  onChange={(e) => setRekomendasi(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all min-h-[100px]"
                  placeholder="Berikan rekomendasi perbaikan..."
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 font-heading">
              Dokumentasi Visual
            </h2>
            <DocumentationUploader 
              images={images} 
              setImages={setImages}
            />
          </div>

          <DigitalSignatureSection ref={sigRef} pjName={pjName} setPjName={setPjName} pjLabel="PJ / KEPALA RUANGAN" supervisorLabel="AUDITOR / IPCLN" />
        </div>

        {/* BUTTON SIMPAN */}
        <div className="pt-4">
          <motion.button
            type="submit"
            disabled={isSubmitting || !observer || !unit}
            animate={(!isSubmitting && observer && unit) ? {
              boxShadow: [
                "0 0 0 0 rgba(37, 99, 235, 0)",
                "0 0 0 15px rgba(37, 99, 235, 0.3)",
                "0 0 0 0 rgba(37, 99, 235, 0)"
              ]
            } : {}}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-full flex justify-center items-center gap-4 py-5 bg-blue-600 hover:bg-blue-500 text-white text-base font-bold uppercase tracking-[0.2em] rounded-2xl transition-all border border-white/10 relative overflow-hidden group disabled:opacity-50 shadow-[0_0_20px_rgba(37,99,235,0.4)]"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Memproses data...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>Simpan Data</span>
              </>
            )}
          </motion.button>
          <div className="flex flex-col items-center justify-center mt-6 text-slate-600 uppercase tracking-widest font-bold">
            <p className="text-[10px]">SMART-PPI | RSUD AL-MULK</p>
          </div>
        </div>
      </form>

      {/* OBSERVER MODAL */}
      <AnimatePresence>
        {isObserverModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsObserverModalOpen(false)}
              className="absolute inset-0 bg-navy-dark/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative w-full max-w-md bg-navy-light border border-white/10 rounded-[2.5rem] shadow-2xl p-8 overflow-hidden bg-gradient-to-b from-navy-light to-navy-dark"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-3 font-heading">
                  <User className="w-5 h-5 text-blue-400" /> Kelola Supervisor
                </h3>
                <button onClick={() => setIsObserverModalOpen(false)} className="p-2 hover:bg-white/5 rounded-xl text-slate-500 transition-colors"><X className="w-5 h-5" /></button>
              </div>

              <div className="flex gap-2 mb-6">
                <input 
                  type="text" 
                  value={newObserverName}
                  onChange={(e) => setNewObserverName(e.target.value)}
                  placeholder="Nama Supervisor baru..."
                  disabled={!isIPCN}
                  className="flex-1 bg-navy-dark border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 shadow-inner disabled:opacity-50"
                  onKeyDown={(e) => e.key === 'Enter' && saveObserver()}
                />
                {isIPCN && (
                  <button 
                    onClick={saveObserver}
                    className="px-5 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20"
                  >
                    {editObserverId ? <RefreshCw className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </button>
                )}
              </div>

              <div className="max-h-[350px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {observers.map(o => (
                  <div key={o.id || o.nama} className="flex items-center justify-between p-4 bg-navy-dark/40 border border-white/5 rounded-2xl group hover:border-blue-500/20 transition-all hover:bg-navy-dark/60">
                    <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">{o.nama}</span>
                    {isIPCN && (
                      <div className="flex gap-2">
                        <button onClick={() => { setNewObserverName(o.nama); setEditObserverId(o.id); }} className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => deleteObserver(o.id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    )}
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
