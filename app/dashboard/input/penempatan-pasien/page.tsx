'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
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
  Signature
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

const checklistItems = [
  { id: 'catatan_infeksi', label: '1. Ada catatan pasien infeksi dan non infeksi' },
  { id: 'instruksi_ruang', label: '2. Instruksi jelas untuk petugas dan pengunjung di ruang infeksi (tanda)' },
  { id: 'poster_pencegahan', label: '3. Poster petunjuk pencegahan penularan penyakit (kontak, droplet, airborne)' },
  { id: 'apd_tersedia', label: '4. Alat proteksi diri tersedia lengkap saat memasuki ruang isolasi' },
  { id: 'catatan_klinis', label: '5. Ada catatan kasus/bagan klinis di ruangan isolasi' },
  { id: 'instruksi_isolasi', label: '6. Instruksi jelas untuk petugas dan pengunjung saat pasien di isolasi (contoh: tanda di pintu)' },
  { id: 'pintu_tertutup', label: '7. Pintu selalu ditutup' },
  { id: 'alur_pasien', label: '8. Alur pasien masuk terpasang jelas' },
];

type AuditStatus = 'ya' | 'tidak' | 'na' | null;
type Observer = { id: string; nama: string };

export default function PenempatanPasienPage() {
  const router = useRouter();
  const { userRole } = useAppContext();
  
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [observer, setObserver] = useState('');
  const [unit, setUnit] = useState('');
  
  // Checklist State
  const [data, setData] = useState<Record<string, AuditStatus>>({
    catatan_infeksi: null,
    instruksi_ruang: null,
    poster_pencegahan: null,
    apd_tersedia: null,
    catatan_klinis: null,
    instruksi_isolasi: null,
    pintu_tertutup: null,
    alur_pasien: null,
  });

  const [temuan, setTemuan] = useState('');
  const [rekomendasi, setRekomendasi] = useState('');
  
  // Documentation
  const [images, setImages] = useState<DocImage[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Signatures

  
  // Observer Management
  const [observers, setObservers] = useState<Observer[]>([]);
  const [isObserverModalOpen, setIsObserverModalOpen] = useState(false);
  const [newObserverName, setNewObserverName] = useState('');
  const [editObserverId, setEditObserverId] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const getLocalIsoString = (val: Date | null) => {
    if (!val) return '';
    const tzoffset = val.getTimezoneOffset() * 60000;
    return new Date(val.getTime() - tzoffset).toISOString().slice(0, 16);
  };
  
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

  const toggleItem = (itemId: string, status: AuditStatus) => {
    setData(prev => ({ ...prev, [itemId]: status }));
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
    let statusText = 'Belum Dinilai';

    if (dinilai > 0) {
      if (persentase >= 85) statusText = 'Baik';
      else if (persentase >= 75) statusText = 'Cukup';
      else statusText = 'Perlu Tindak Lanjut';
    }

    return { patuh, dinilai, persentase, statusText };
  }, [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi
    const allChecked = Object.values(data).every(v => v !== null);
    if (!observer || !unit || !allChecked) {
      alert("Mohon lengkapi semua field wajib.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const supabase = getSupabase();

      const uploadedUrls = await uploadImagesToSupabase(supabase, images, 'dokumentasi', 'audit');
      const payload = {
        tanggal_waktu: startTime?.toISOString() || new Date().toISOString(),
        observer,
        unit,
        ceklist: data,
        temuan,
        rekomendasi,
        created_at: new Date().toISOString(),
        foto: uploadedUrls
      };

      
      // Modifikasi untuk menggunakan audit_sessions sesuai instruksi
      const { data_indikator, checklist_json, ...headerData } = payload;
      
      const sessionPayload = {
        indikator_id: 'audit_penempatan_pasien', // Menggunakan nama tabel sebagai indikator ID
        nama_indikator: 'AUDIT PENEMPATAN PASIEN',
        tanggal_waktu: headerData.tanggal_waktu || headerData.waktu || headerData.start_time || new Date().toISOString(),
        observer: headerData.observer || (typeof observer !== 'undefined' ? observer : '') || (typeof selectedSupervisor !== 'undefined' ? selectedSupervisor : ''),
        unit: headerData.unit || (typeof unit !== 'undefined' ? unit : (typeof ruangan !== 'undefined' ? ruangan : '')),
        profesi: headerData.profesi || null,
        jenis_tindakan: headerData.jenis_tindakan || null,
        jumlah_dinilai: headerData.jumlah_dinilai || (typeof stats !== 'undefined' ? stats?.dinilai : null) || 0,
        jumlah_patuh: headerData.jumlah_patuh || (typeof stats !== 'undefined' ? stats?.patuh : null) || 0,
        persentase: headerData.persentase || (typeof stats !== 'undefined' ? stats?.persentase : null) || 0,
        status_kepatuhan: headerData.status_kepatuhan || (typeof stats !== 'undefined' ? (stats?.status || stats?.statusText) : null) || 'Belum Dinilai',
        temuan: headerData.temuan || '',
        rekomendasi: headerData.rekomendasi || '',
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
      const { error } = await supabase.from('audit_penempatan_pasien').insert([payload]);
      // Jika terjadi error pada table lama (mungkin karena skema tidak sesuai), kita hiraukan karena data sudah aman di audit_sessions
      if (error) {
        console.warn("Kesalahan saat menyimpan fallback table (hiraukan jika skema lama un-matched):", error);
      }


      

      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        router.push('/dashboard/input/isolasi');
      }, 2000);
    } catch (err: any) {
      console.error("Gagal menyimpan:", err);
      alert(`Gagal menyimpan data: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-24 px-4 sm:px-6">
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
          <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-gradient">Audit Penempatan Pasien</h1>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-blue-400 mt-1">Audit Kepatuhan Isolasi Standar</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* CARD INPUT UMUM */}
        <div className="glass-card p-6 sm:p-8 rounded-[2rem] border-white/5 shadow-xl space-y-8">
          
          {/* WAKTU AUDIT */}
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 font-heading">
              <Clock className="w-4 h-4 text-blue-400" /> Waktu Audit
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 shadow-inner p-1">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">Tanggal & Waktu</label>
                <input 
                  type="datetime-local" 
                  value={getLocalIsoString(startTime)}
                  onChange={(e) => setStartTime(new Date(e.target.value))}
                  className="w-full bg-navy-dark/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all appearance-none"
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
                {(userRole === 'IPCN' || userRole === 'Admin') && (
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
                  className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-4 text-sm text-white outline-none focus:border-blue-500/50 appearance-none transition-all pr-10 hover:bg-white/8"
                  required
                >
                  <option value="" className="bg-navy-dark text-slate-400">Pilih Supervisor...</option>
                  {observers.map(o => <option key={o.id} value={o.nama} className="bg-navy-dark">{o.nama}</option>)}
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
        </div>

        {/* SECTION: CHECKLIST */}
        <div className="space-y-6">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400 mb-2 font-heading px-2">
            Ceklist Penempatan Pasien
          </h2>
          <div className="space-y-4">
            {checklistItems.map((item, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                key={item.id} 
                className="glass-card p-5 rounded-2xl border-white/5 hover:border-white/10 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group bg-white/[0.01]"
              >
                <p className="text-sm font-medium text-slate-300 leading-relaxed md:max-w-md group-hover:text-white transition-colors">
                  {item.label}
                </p>
                <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleItem(item.id, 'ya')}
                    className={`px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                      data[item.id] === 'ya' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10'
                    }`}
                  >
                    Ya
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleItem(item.id, 'tidak')}
                    className={`px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                      data[item.id] === 'tidak' ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' : 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10'
                    }`}
                  >
                    Tidak
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleItem(item.id, 'na')}
                    className={`px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                      data[item.id] === 'na' ? 'bg-white/10 text-white' : 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10'
                    }`}
                  >
                    N/A
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* TEMUAN & REKOMENDASI */}
        <div className="glass-card p-6 sm:p-8 rounded-[2rem] border-white/5 shadow-xl space-y-6">
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              <FileText className="w-4 h-4 text-blue-400" /> Temuan Monitoring
            </label>
            <textarea 
              value={temuan}
              onChange={(e) => setTemuan(e.target.value)}
              placeholder="Tuliskan temuan monitoring penempatan pasien..."
              className="w-full h-32 bg-white/5 border border-white/5 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition-all shadow-inner resize-none placeholder:text-slate-600"
            />
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              <RefreshCw className="w-4 h-4 text-amber-400" /> Rekomendasi Tindak Lanjut
            </label>
            <textarea 
              value={rekomendasi}
              onChange={(e) => setRekomendasi(e.target.value)}
              placeholder="Tuliskan rekomendasi tindak lanjut..."
              className="w-full h-32 bg-white/5 border border-white/5 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition-all shadow-inner resize-none placeholder:text-slate-600"
            />
          </div>
        </div>

        {/* DOKUMENTASI */}
        <div className="glass-card p-6 sm:p-8 rounded-[2.5rem] border-white/5 space-y-6">
          <DocumentationUploader images={images} setImages={setImages} />
        </div>

        {/* SECTION: SUMMARY STATS */}
        <div className="mt-8 mb-8">
          <LiveStatisticsCard 
            totalDinilai={stats.dinilai}
            totalPatuh={stats.patuh}
            totalTidakPatuh={stats.dinilai - stats.patuh}
            persentase={stats.persentase}
            statusText={stats.statusText}
            title="HASIL OBSERVASI PENEMPATAN"
          />
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-8">
          <motion.button
            type="submit"
            disabled={isSubmitting}
            animate={{
              boxShadow: [
                "0 0 0 0 rgba(37, 99, 235, 0)",
                "0 0 0 15px rgba(37, 99, 235, 0.3)",
                "0 0 0 0 rgba(37, 99, 235, 0)"
              ]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-full flex justify-center items-center gap-4 py-5 bg-blue-600 hover:bg-blue-500 text-white text-base font-bold uppercase tracking-[0.2em] rounded-2xl transition-all border border-blue-400/30 group disabled:opacity-50 overflow-hidden relative shadow-[0_0_20px_rgba(37,99,235,0.4)] glow-blue"
          >
            <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ease-in-out" />
            {isSubmitting ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>Simpan Data</span>
              </>
            )}
          </motion.button>
          <p className="text-center mt-6 text-[9px] font-bold text-slate-600 uppercase tracking-[0.3em]">SMART-PPI | Hospital Integrity System</p>
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
                <button onClick={() => setIsObserverModalOpen(false)} className="p-2 hover:bg-white/5 rounded-xl text-slate-500 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex gap-2 mb-6">
                <input 
                  type="text" 
                  value={newObserverName}
                  onChange={(e) => setNewObserverName(e.target.value)}
                  placeholder="Nama Supervisor..."
                  className="flex-1 bg-navy-dark border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 shadow-inner"
                />
                <button 
                  onClick={saveObserver}
                  className="px-5 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20"
                >
                  {editObserverId ? <RefreshCw className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </button>
              </div>

              <div className="max-h-[350px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {observers.map(o => (
                  <div key={o.id} className="flex items-center justify-between p-4 bg-navy-dark/40 border border-white/5 rounded-2xl group hover:border-blue-500/20 transition-all">
                    <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">{o.nama}</span>
                    <div className="flex gap-2">
                      <button onClick={() => { setNewObserverName(o.nama); setEditObserverId(o.id); }} className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => deleteObserver(o.id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
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
