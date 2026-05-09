'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import { Calendar, Building2, User, Search, Trash2, Plus, Users, Save, CheckCircle2, ChevronRight, ShieldCheck, Activity, ArrowLeft, RefreshCw } from 'lucide-react';
import DigitalSignatureSection, { DigitalSignatureRef } from '@/components/DigitalSignatureSection';
import { DocumentationUploader, DocImage } from '@/components/DocumentationUploader';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '@/components/providers';
import { uploadImagesToSupabase } from '@/lib/upload';

// --- Interfaces ---
interface ChecklistItem {
  id: number;
  key: string;
  label: string;
  value: 'Ya' | 'Tidak' | 'N/A' | null;
}

export default function ImmunocompromisedPPIInputPage() {
  const [images, setImages] = useState<DocImage[]>([]);
  
  
  const router = useRouter();
  const { userRole } = useAppContext();
  
  // Basic Info State
  const [waktu, setWaktu] = useState(new Date().toISOString().slice(0, 16));
  const ruangan = "Ruang Isolasi"; // Fixed room
  
  // Supervisor Management State
  const [supervisors, setSupervisors] = useState<string[]>(['IPCN_Adi Tresa Purnama']);
  const [selectedSupervisor, setSelectedSupervisor] = useState('IPCN_Adi Tresa Purnama');
  const [isManagingSupervisors, setIsManagingSupervisors] = useState(false);
  const [newSupervisor, setNewSupervisor] = useState('');

  // Form Data State
  const [temuan, setTemuan] = useState('');
  const [rekomendasi, setRekomendasi] = useState('');
  const [fotos, setFotos] = useState<DocImage[]>([]);
  const [pjName, setPjName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{title: string, desc: string, type: 'success' | 'error'} | null>(null);

  // Signatures
  const sigRef = useRef<DigitalSignatureRef>(null);

  // --- Checklist Data ---
  const initialChecklist: ChecklistItem[] = [
    { id: 1, key: 'ruang_terpisah', label: 'Ruangan terpisah (sendiri) / cohorting jarak > 1 meter', value: null },
    { id: 2, key: 'pintu_tertutup', label: 'Pintu ruangan selalu tertutup', value: null },
    { id: 3, key: 'transport_perlu', label: 'Transport pasien bila diperlukan saja', value: null },
    { id: 4, key: 'pasien_masker', label: 'Pasien memakai masker saat keluar ruangan', value: null },
    { id: 5, key: 'fasilitas_ct', label: 'Tersedia fasilitas cuci tangan', value: null },
    { id: 6, key: 'petugas_5momen', label: 'Petugas melakukan cuci tangan sesuai 5 momen', value: null },
    { id: 7, key: 'masker_kontak', label: 'Menggunakan masker saat kontak dengan pasien', value: null },
    { id: 8, key: 'sarungtangan_cairan', label: 'Memakai sarung tangan bila akan kontak dengan cairan tubuh', value: null },
    { id: 9, key: 'goggle_perlu', label: 'Memakai kacamata goggle bila perlu', value: null },
    { id: 10, key: 'gaun_perlu', label: 'Memakai gaun pelindung bila perlu', value: null },
    { id: 11, key: 'edukasi_pasien', label: 'Memberikan edukasi kepada pasien', value: null },
    { id: 12, key: 'edukasi_keluarga', label: 'Memberikan edukasi kepada keluarga pasien', value: null },
    { id: 13, key: 'bersih_desinfektan', label: 'Setelah pasien pulang, bersihkan ruangan dengan cairan desinfektan sesuai standar', value: null },
  ];

  const [checklist, setChecklist] = useState<ChecklistItem[]>(initialChecklist);

  // --- Statistics Calculation (Real-time) ---
  const stats = useMemo(() => {
    let totalDinilai = 0;
    let totalPatuh = 0;
    let totalTidakPatuh = 0;

    checklist.forEach(item => {
      if (item.value === 'Ya') {
        totalDinilai++;
        totalPatuh++;
      } else if (item.value === 'Tidak') {
        totalDinilai++;
        totalTidakPatuh++;
      }
    });

    const persentase = totalDinilai === 0 ? 0 : Math.round((totalPatuh / totalDinilai) * 100);
    
    let statusText = 'Perlu Tindak Lanjut';
    let statusColor = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    if (persentase >= 85) {
      statusText = 'Baik';
      statusColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    } else if (persentase >= 70) {
      statusText = 'Cukup';
      statusColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    }

    return { totalDinilai, totalPatuh, totalTidakPatuh, persentase, statusText, statusColor };
  }, [checklist]);

  // --- Handlers ---
  const handleAddSupervisor = () => {
    if (newSupervisor.trim() && !supervisors.includes(newSupervisor.trim())) {
      setSupervisors(prev => [...prev, newSupervisor.trim()]);
      setSelectedSupervisor(newSupervisor.trim());
      setNewSupervisor('');
    }
  };

  const handleDeleteSupervisor = (sup: string) => {
    if (supervisors.length > 1) {
      setSupervisors(prev => prev.filter(s => s !== sup));
      if (selectedSupervisor === sup) {
        setSelectedSupervisor(supervisors.filter(s => s !== sup)[0]);
      }
    }
  };

  const handleChecklistChange = (id: number, val: 'Ya' | 'Tidak' | 'N/A') => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, value: val } : item));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setToastMessage(null);

    try {
      const isChecklistComplete = checklist.every(item => item.value !== null);
      if (!isChecklistComplete) {
        throw new Error('Mohon lengkapi semua checklist (Pilih Ya, Tidak, atau N/A).');
      }

      if (!pjName.trim()) {
        throw new Error('Mohon isi nama PJ Ruangan.');
      }
      
      const ttdPj = sigRef.current?.getPjSignature();
      const ttdIpcn = sigRef.current?.getSupervisorSignature();

      const supabase = getSupabase();
      
      const uploadedImageUrls = await uploadImagesToSupabase(supabase, fotos, 'monitoring', 'ppi_immuno');

      // Store checklist as JSON
      const checklistJson = checklist.reduce((acc, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {} as any);

      const payload = {
        waktu: new Date(waktu).toISOString(),
        ruangan: ruangan,
        supervisor: selectedSupervisor,
        checklist_json: checklistJson,
        persentase: stats.persentase,
        temuan: temuan.trim() || null,
        rekomendasi: rekomendasi.trim() || null,
        foto: uploadedImageUrls.length > 0 ? uploadedImageUrls : null,
        nama_pj: pjName.trim(),
        ttd_pj: ttdPj,
        ttd_ipcn: ttdIpcn,
      };

      // Modifikasi untuk menggunakan audit_sessions sesuai instruksi
      const sessionPayload = {
        indikator_id: 'penempatan_pasien_immunocompromised',
        nama_indikator: 'PENEMPATAN PASIEN IMMUNOCOMPROMISED',
        tanggal_waktu: payload.waktu,
        observer: payload.supervisor || '',
        unit: payload.ruangan || '',
        profesi: null,
        jumlah_dinilai: stats.totalDinilai || 0,
        jumlah_patuh: stats.totalPatuh || 0,
        persentase: stats.persentase || 0,
        status_kepatuhan: stats.statusText || 'Belum Dinilai',
        temuan: payload.temuan || '',
        rekomendasi: payload.rekomendasi || '',
        nama_pj_ruangan: payload.nama_pj,
        ttd_pj_ruangan: payload.ttd_pj || null,
        ttd_ipcn: payload.ttd_ipcn || null,
        dokumentasi: payload.foto || [],
        data_indikator: checklistJson
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

      // Simpan details
      const detailPayloads = Object.keys(checklistJson).map(key => ({
        session_id: sessionData.id,
        pertanyaan_id: key,
        pertanyaan: checklist.find(c => c.key === key)?.label || key,
        jawaban: String(checklistJson[key])
      })).filter(d => d.jawaban !== 'null');

      if (detailPayloads.length > 0) {
        const { error: detailError } = await supabase.from('audit_details').insert(detailPayloads);
        if (detailError) {
          console.warn("Kesalahan Supabase Simpan Details:", detailError);
        }
      }

      const { error } = await supabase
        .from('penempatan_pasien_immunocompromised')
        .insert([payload]);

      if (error && error.code !== '42P01') {
        console.warn("Kesalahan saat menyimpan fallback table:", error);
      }

      if (error && error.code !== '42P01') throw error;

      setToastMessage({ title: 'Berhasil', desc: 'Data penempatan pasien immunocompromised berhasil disimpan!', type: 'success' });
      
      setTimeout(() => {
        router.push('/dashboard/input/isolasi');
      }, 2000);

    } catch (err: any) {
      console.error(err);
      setToastMessage({ title: 'Gagal', desc: err.message || 'Terjadi kesalahan saat menyimpan data.', type: 'error' });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 lg:space-y-8 pb-32">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 left-1/2 z-[100] p-4 rounded-2xl shadow-2xl flex items-start gap-4 border max-w-sm w-full backdrop-blur-md ${
              toastMessage.type === 'success' 
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-100' 
              : 'bg-rose-500/20 border-rose-500/50 text-rose-100'
            }`}
          >
            {toastMessage.type === 'success' ? <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" /> : <Trash2 className="w-6 h-6 text-rose-400 shrink-0" />}
            <div>
              <h4 className="font-bold">{toastMessage.title}</h4>
              <p className="text-sm opacity-90">{toastMessage.desc}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Info Card */}
      <div className="glass-card p-6 lg:p-10 rounded-[2.5rem] border-white/5 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-4">
          <button 
            onClick={() => router.push('/dashboard/input/isolasi')}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-colors flex items-center justify-center group"
          >
            <ArrowLeft className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
          </button>
          
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl lg:text-3xl font-heading font-bold tracking-wide text-gradient">
              Input Penempatan Pasien Immunocompromised
            </h1>
            <p className="text-sm text-slate-400 mt-1 tracking-wider font-medium">
              Monitoring kepatuhan penempatan pasien immunocompromised sesuai standar PPI Rumah Sakit.
            </p>
          </div>
        </div>
      </div>

      {/* Basic Setup Card */}
      <div className="glass-card p-6 lg:p-8 rounded-[2.5rem] border-white/5 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Waktu Input</label>
            <input 
              type="datetime-local" 
              value={waktu}
              onChange={(e) => setWaktu(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500/50 hover:bg-white/10 transition-colors [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert-[0.6]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Ruangan</label>
            <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-300 text-sm flex items-center gap-2 cursor-not-allowed opacity-80">
              <Building2 className="w-4 h-4 text-blue-400" /> {ruangan}
            </div>
          </div>
          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Supervisor / Observer</label>
              {(userRole === 'IPCN' || userRole === 'Admin') && (
                <button 
                  onClick={() => setIsManagingSupervisors(!isManagingSupervisors)}
                  className="text-[10px] uppercase font-bold text-blue-400 hover:text-blue-300 tracking-widest flex items-center gap-1"
                >
                  <Search className="w-3 h-3" /> Kelola Supervisor
                </button>
              )}
            </div>
            
            {isManagingSupervisors ? (
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-4">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Nama supervisor baru..." 
                    value={newSupervisor}
                    onChange={(e) => setNewSupervisor(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 text-sm text-white focus:border-blue-500 outline-none"
                  />
                  <button 
                    onClick={handleAddSupervisor}
                    className="px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Tambah
                  </button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                  {supervisors.map(sup => (
                    <div key={sup} className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/5">
                      <span className="text-sm text-slate-300">{sup}</span>
                      <button onClick={() => handleDeleteSupervisor(sup)} className="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-md transition-colors flex items-center gap-2 text-xs">
                        <Trash2 className="w-4 h-4" /> Hapus
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="relative group">
                <select 
                  value={selectedSupervisor}
                  onChange={(e) => setSelectedSupervisor(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-10 py-3 text-white text-sm outline-none focus:border-blue-500/50 appearance-none hover:bg-white/10 transition-colors"
                >
                  {supervisors.map(sup => <option key={sup} value={sup} className="bg-[#0f172a] text-white">{sup}</option>)}
                </select>
                <ChevronRight className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none rotate-90" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Checklist Card */}
      <div className="glass-card p-6 lg:p-8 rounded-[2.5rem] border-white/5 shadow-xl space-y-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-blue-400" /> CHECKLIST PENEMPATAN PASIEN IMMUNOCOMPROMISED
        </h3>

        <div className="space-y-4">
          {checklist.map((item) => (
            <div key={item.id} className="p-4 bg-black/20 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
              <p className="text-sm font-medium text-slate-200 mb-4">{item.label}</p>
              <div className="grid grid-cols-3 gap-2">
                {(['Ya', 'Tidak', 'N/A'] as const).map(option => (
                  <button
                    key={option}
                    onClick={() => handleChecklistChange(item.id, option)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      item.value === option
                      ? option === 'Ya' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                        : option === 'Tidak' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                        : 'bg-slate-500 text-white shadow-lg shadow-slate-500/20'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Live Statistics Card */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-white/5">
          {[
            { label: 'Dinilai', val: stats.totalDinilai },
            { label: 'Total Patuh', val: stats.totalPatuh, color: 'text-blue-400' },
            { label: 'Tidak Patuh', val: stats.totalTidakPatuh, color: 'text-rose-400' }
          ].map((s, i) => (
            <div key={i} className="glass-card p-4 rounded-2xl border-white/5 shadow-inner bg-gradient-to-b from-white/[0.02] to-transparent flex flex-col items-center justify-center text-center relative overflow-hidden">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">{s.label}</p>
              <p className={`text-3xl font-black font-heading ${s.color || 'text-white'}`}>{s.val}</p>
            </div>
          ))}
          {/* Modern Progress Circle */}
          <div className="glass-card p-6 sm:p-8 rounded-[32px] border-white/5 flex flex-col md:flex-row items-center justify-center gap-8 relative overflow-hidden mt-6 mb-6">
            
            <h2 className="absolute top-6 left-8 flex items-center gap-2 text-[10px] sm:text-sm font-bold uppercase tracking-widest text-slate-400 z-10"><Activity className="w-4 sm:w-5 h-4 sm:h-5 text-blue-400" /> Hasil Persentase</h2>
          <div className="relative w-48 h-48 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="36" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                <motion.circle 
                  cx="40" cy="40" r="36" fill="transparent" 
                  stroke={stats.persentase < 70 ? '#f43f5e' : stats.persentase < 85 ? '#f59e0b' : '#2563eb'} 
                  strokeWidth="6" 
                  strokeDasharray={2 * Math.PI * 36}
                  strokeDashoffset={2 * Math.PI * 36 - (stats.persentase / 100) * (2 * Math.PI * 36)}
                  strokeLinecap="round"
                  initial={{ strokeDashoffset: 2 * Math.PI * 36 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 36 - (stats.persentase / 100) * (2 * Math.PI * 36) }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-heading font-bold text-white">{stats.persentase}%</span>
          <span className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${stats.statusColor}`}>{stats.statusText}</span>
        </div>
            </div>
            
          </div>
        </div>
      </div>

      {/* Temuan & Rekomendasi */}
      <div className="glass-card p-6 lg:p-8 rounded-[2.5rem] border-white/5 space-y-6">
        <h3 className="text-lg font-bold text-white mb-2">Temuan & Rekomendasi</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-1">Temuan Lapangan</label>
            <textarea 
              value={temuan}
              onChange={e => setTemuan(e.target.value)}
              placeholder="Contoh: Pengunjung tidak memakai masker, Handrub tidak tersedia..."
              className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-blue-500/50 min-h-[100px] resize-y placeholder:text-slate-600"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-1">Rekomendasi Tindak Lanjut</label>
            <textarea 
              value={rekomendasi}
              onChange={e => setRekomendasi(e.target.value)}
              placeholder="Contoh: Lengkapi fasilitas hand hygiene, Edukasi ulang keluarga pasien..."
              className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-blue-500/50 min-h-[100px] resize-y placeholder:text-slate-600"
            />
          </div>
        </div>
      </div>

      {/* Dokumentasi */}
      <div className="glass-card p-6 lg:p-8 rounded-[2.5rem] border-white/5">
        <h3 className="text-lg font-bold text-white mb-6">Fotografi Bukti / Dokumentasi (Opsional)</h3>
        <DocumentationUploader 
          images={fotos}
          setImages={setFotos}
        />
      </div>

      {/* Tanda Tangan */}
      <DigitalSignatureSection 
        ref={sigRef}
        pjName={pjName}
        setPjName={setPjName}
        pjLabel="PJ RUANG ISOLASI"
      />

      {/* TOMBOL SIMPAN - PERMANEN DI BAWAH (No fixed/sticky footer) */}
      <div className="pt-6">
        <motion.button 
          onClick={handleSubmit}
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
      </div>

    </div>
  );
}
