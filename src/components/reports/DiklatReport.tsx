'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  CheckCircle2, Trash2, FileText, Download, Eye, Loader2, Calendar, 
  MapPin, User, Users, X, Edit, AlertTriangle, Sparkles, FileSpreadsheet, Presentation
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '@/components/Providers';
import { useSafeRouter } from '@/hooks/useSafeRouter';

export interface TrainingMaterial {
  id: string;
  kegiatan_id: string;
  nama_file: string;
  jenis_file: string;
  ukuran_file: number;
  storage_path: string;
  public_url: string;
  uploaded_by: string;
  created_at?: string;
}

interface DiklatSessionData {
  id: string;
  waktu: string;
  observer: string;
  unit: string;
  judul: string;
  peserta: string[];
  materials: TrainingMaterial[];
  images: string[];
}

export default function DiklatReport({
  filters,
}: {
  tableName: string;
  title: string;
  filters: { searchQuery: string; periode: string; type: string; unitFilter?: string };
}) {
  const router = useSafeRouter();
  const { hospitalLogoUrl } = useAppContext();
  const [sessions, setSessions] = useState<DiklatSessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [previewMaterial, setPreviewMaterial] = useState<TrainingMaterial | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [deleteConfirmSession, setDeleteConfirmSession] = useState<DiklatSessionData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Realtime subscription setup details
  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_sessions')
        .select('*')
        .eq('indikator_id', 'diklat_ppi')
        .order('tanggal_waktu', { ascending: false });

      if (error) throw error;

      const normalized: DiklatSessionData[] = (data || []).map((item: any) => {
        const json = item.data_indikator || {};
        return {
          id: item.id,
          waktu: item.tanggal_waktu || item.created_at,
          observer: item.observer || "Assessor Staff",
          unit: item.unit || "Semua Unit",
          judul: json.judul || "Pendidikan & Pelatihan PPI",
          peserta: json.peserta || [],
          materials: json.materials || [],
          images: json.images || [],
        };
      });

      setSessions(normalized);
    } catch (err) {
      console.error("Gagal mengambil data pelatihan:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();

    const channel = supabase.channel('diklat_sessions_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_sessions', filter: "indikator_id=eq.diklat_ppi" }, () => {
        fetchSessions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSessions]);

  // Ensure scroll resets to top when data loading finishes
  useEffect(() => {
    const scrollToTop = () => {
      const mainEl = document.querySelector("main");
      if (mainEl) {
        mainEl.scrollTop = 0;
        mainEl.scrollTo({ top: 0, behavior: "instant" as any });
      }
      const scrollableElements = document.querySelectorAll('.overflow-y-auto');
      scrollableElements.forEach(el => {
        el.scrollTop = 0;
      });
      window.scrollTo({ top: 0, behavior: "instant" as any });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    if (!loading) {
      scrollToTop();
      requestAnimationFrame(scrollToTop);
      setTimeout(scrollToTop, 50);
      setTimeout(scrollToTop, 150);
    }
  }, [loading]);

  useEffect(() => {
    if (sessions.length > 0) {
      if (!selectedSessionId || !sessions.some(s => s.id === selectedSessionId)) {
        setSelectedSessionId(sessions[0].id);
      }
    } else {
      setSelectedSessionId(null);
    }
  }, [sessions, selectedSessionId]);

  const filteredSessions = sessions.filter(session => {
    // 1. Search Query Filter
    const query = (filters.searchQuery || "").toLowerCase();
    const matchSearch = query === "" || 
      (session.judul || "").toLowerCase().includes(query) ||
      (session.observer || "").toLowerCase().includes(query) ||
      (session.unit || "").toLowerCase().includes(query);

    // 2. Unit Filter
    const matchUnit = !filters.unitFilter || 
      filters.unitFilter === "Semua Unit" || 
      session.unit === filters.unitFilter;

    // 3. Period Filter
    const sessionDate = new Date(session.waktu);
    const filterDate = new Date(filters.periode || new Date().toISOString());
    let matchPeriod = true;

    if (filters.type === "Bulanan") {
      matchPeriod = sessionDate.getMonth() === filterDate.getMonth() &&
                    sessionDate.getFullYear() === filterDate.getFullYear();
    } else if (filters.type === "Triwulan") {
      const sQuarter = Math.floor(sessionDate.getMonth() / 3);
      const fQuarter = Math.floor(filterDate.getMonth() / 3);
      matchPeriod = sQuarter === fQuarter && sessionDate.getFullYear() === filterDate.getFullYear();
    } else if (filters.type === "Semester") {
      const sSemester = Math.floor(sessionDate.getMonth() / 6);
      const fSemester = Math.floor(filterDate.getMonth() / 6);
      matchPeriod = sSemester === fSemester && sessionDate.getFullYear() === filterDate.getFullYear();
    } else if (filters.type === "Tahunan") {
      matchPeriod = sessionDate.getFullYear() === filterDate.getFullYear();
    }

    return matchSearch && matchUnit && matchPeriod;
  });

  const selectedSession = filteredSessions.find(s => s.id === selectedSessionId) || filteredSessions[0];

  const handleConfirmDelete = async () => {
    if (!deleteConfirmSession) return;
    setIsDeleting(true);
    const idToDelete = deleteConfirmSession.id;
    try {
      // Remove attached materials from storage if any
      if (deleteConfirmSession.materials && deleteConfirmSession.materials.length > 0) {
        const filePaths = deleteConfirmSession.materials
          .map(m => m.storage_path)
          .filter(Boolean);
        if (filePaths.length > 0) {
          try {
            await supabase.storage.from('public').remove(filePaths);
          } catch (storageErr) {
            console.warn("Storage deletion warning:", storageErr);
          }
        }
      }

      const { error } = await supabase
        .from('audit_sessions')
        .delete()
        .eq('id', idToDelete);

      if (error) throw error;
      
      setSessions(prev => prev.filter(s => s.id !== idToDelete));
      if (selectedSessionId === idToDelete) {
        const remaining = filteredSessions.filter(s => s.id !== idToDelete);
        setSelectedSessionId(remaining.length > 0 ? remaining[0].id : null);
      }
      setDeleteConfirmSession(null);
    } catch (e: any) {
      console.error("Gagal menghapus sesi diklat:", e);
      alert("Gagal menghapus kegiatan: " + (e.message || e));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditSession = (sessionId: string) => {
    router.push(`/dashboard/input/diklat?editId=${sessionId}`);
  };

  // Helper to render file thumbnail/cover banner
  const renderMaterialCover = (m: TrainingMaterial) => {
    const ext = m.nama_file.split('.').pop()?.toLowerCase() || '';
    const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext);
    const isPdf = ext === 'pdf';
    const isPpt = ['ppt', 'pptx'].includes(ext);
    const isDoc = ['doc', 'docx'].includes(ext);
    const isXls = ['xls', 'xlsx', 'csv'].includes(ext);

    if (isImage) {
      return (
        <div className="relative w-full h-40 bg-slate-100 overflow-hidden group cursor-pointer" onClick={() => setPreviewMaterial(m)}>
          <img 
            src={m.public_url} 
            alt={m.nama_file} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
          <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-white">
            <span className="px-2 py-0.5 bg-emerald-600/90 rounded text-[9px] font-black uppercase tracking-wider">
              GAMBAR / COVER
            </span>
            <span className="text-[10px] font-mono font-bold drop-shadow">
              {(m.ukuran_file / 1024 / 1024).toFixed(2)} MB
            </span>
          </div>
        </div>
      );
    }

    if (isPdf) {
      return (
        <div className="relative w-full h-40 bg-gradient-to-br from-rose-600 via-red-600 to-rose-700 p-4 text-white flex flex-col justify-between overflow-hidden shadow-inner">
          {/* Subtle Document Watermark */}
          <div className="absolute -right-4 -bottom-6 text-white/10 font-black text-8xl select-none pointer-events-none">
            PDF
          </div>
          
          <div className="flex items-center justify-between relative z-10">
            <span className="px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-md text-[10px] font-black tracking-widest uppercase border border-white/20">
              PDF DOCUMENT
            </span>
            <span className="text-[10px] font-mono font-bold text-rose-100">
              {(m.ukuran_file / 1024 / 1024).toFixed(2)} MB
            </span>
          </div>

          <div className="relative z-10 space-y-1 my-auto">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-black text-white line-clamp-2 leading-snug drop-shadow-sm">
                  {m.nama_file}
                </p>
                <p className="text-[9px] text-rose-200 uppercase font-semibold tracking-wider">
                  Materi Paparan Resmi PPI
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-1.5 text-[9px] text-rose-100 font-medium">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>Dokumen Pelatihan Terverifikasi</span>
          </div>
        </div>
      );
    }

    if (isPpt) {
      return (
        <div className="relative w-full h-40 bg-gradient-to-br from-amber-500 via-orange-600 to-amber-700 p-4 text-white flex flex-col justify-between overflow-hidden shadow-inner">
          {/* Subtle PPT Watermark */}
          <div className="absolute -right-4 -bottom-6 text-white/10 font-black text-8xl select-none pointer-events-none">
            PPT
          </div>

          <div className="flex items-center justify-between relative z-10">
            <span className="px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-md text-[10px] font-black tracking-widest uppercase border border-white/20">
              POWERPOINT SLIDE
            </span>
            <span className="text-[10px] font-mono font-bold text-amber-100">
              {(m.ukuran_file / 1024 / 1024).toFixed(2)} MB
            </span>
          </div>

          <div className="relative z-10 space-y-1 my-auto">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
                <Presentation className="w-6 h-6 text-white" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-black text-white line-clamp-2 leading-snug drop-shadow-sm">
                  {m.nama_file}
                </p>
                <p className="text-[9px] text-amber-200 uppercase font-semibold tracking-wider">
                  Slide Presentasi Pelatihan
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-1.5 text-[9px] text-amber-100 font-medium">
            <Sparkles className="w-3 h-3 text-yellow-300" />
            <span>Slide Paparan Materi Diklat</span>
          </div>
        </div>
      );
    }

    if (isDoc) {
      return (
        <div className="relative w-full h-40 bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 p-4 text-white flex flex-col justify-between overflow-hidden shadow-inner">
          <div className="absolute -right-4 -bottom-6 text-white/10 font-black text-8xl select-none pointer-events-none">
            DOC
          </div>

          <div className="flex items-center justify-between relative z-10">
            <span className="px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-md text-[10px] font-black tracking-widest uppercase border border-white/20">
              WORD DOCUMENT
            </span>
            <span className="text-[10px] font-mono font-bold text-blue-100">
              {(m.ukuran_file / 1024 / 1024).toFixed(2)} MB
            </span>
          </div>

          <div className="relative z-10 space-y-1 my-auto">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-black text-white line-clamp-2 leading-snug drop-shadow-sm">
                  {m.nama_file}
                </p>
                <p className="text-[9px] text-blue-200 uppercase font-semibold tracking-wider">
                  Modul & Handout Diklat
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-1.5 text-[9px] text-blue-100 font-medium">
            <Sparkles className="w-3 h-3 text-cyan-300" />
            <span>Berkas Dokumen Pelatihan</span>
          </div>
        </div>
      );
    }

    // Default / Generic Cover
    return (
      <div className="relative w-full h-40 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 p-4 text-white flex flex-col justify-between overflow-hidden shadow-inner">
        <div className="flex items-center justify-between relative z-10">
          <span className="px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-md text-[10px] font-black tracking-widest uppercase border border-white/20">
            {ext.toUpperCase() || 'FILE'}
          </span>
          <span className="text-[10px] font-mono font-bold text-slate-300">
            {(m.ukuran_file / 1024 / 1024).toFixed(2)} MB
          </span>
        </div>

        <div className="relative z-10 space-y-1 my-auto">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-black text-white line-clamp-2 leading-snug drop-shadow-sm">
                {m.nama_file}
              </p>
              <p className="text-[9px] text-slate-300 uppercase font-semibold tracking-wider">
                Materi Lampiran
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-1.5 text-[9px] text-slate-300 font-medium">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span>Berkas Lampiran Resmi</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="text-xs uppercase tracking-widest font-bold">Sinkronisasi dokumen realtime...</span>
      </div>
    );
  }

  if (filteredSessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center bg-white/5 backdrop-blur-sm rounded-3xl border border-white/5">
        <FileText className="w-12 h-12 text-slate-600 mb-4" />
        <h3 className="text-lg font-bold text-white mb-2">Belum Ada Laporan Pendidikan & Pelatihan</h3>
        <p className="text-xs text-slate-400 max-w-sm mb-4">
          Data kegiatan pelatihan yang diinput akan muncul di sini lengkap dengan materi dan dokumentasi.
        </p>
        {sessions.length > 0 && (
           <p className="text-xs text-amber-500 font-bold border border-amber-500/20 bg-amber-500/10 p-2 rounded-lg">
             Catatan: Terdapat {sessions.length} data tersimpan, namun tidak sesuai dengan filter pencarian / tanggal aktif.
           </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 relative items-center w-full">
      
      {/* PREVIEW & OFFICIAL REPORT */}
      <div className="w-full max-w-4xl space-y-6">
        
        {/* OFFICIAL PRINT-READY CONTAINER */}
        <div 
          id="diklat-official-report"
          className="bg-white text-slate-900 border border-slate-200 shadow-2xl rounded-[2.5rem] p-8 sm:p-12 relative overflow-hidden print:shadow-none print:border-none print:p-0 print:m-0"
        >
          {/* STYLING MEDIA PRINT INLINE */}
          <style dangerouslySetInnerHTML={{__html: `
            @media print {
              body * {
                visibility: hidden;
              }
              #diklat-official-report, #diklat-official-report * {
                visibility: visible;
              }
              #diklat-official-report {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                color: #000 !important;
                background: #fff !important;
                padding: 0 !important;
                margin: 0 !important;
              }
              .no-print {
                display: none !important;
              }
              .print-checkmark::before {
                content: "✓ " !important;
                color: #000 !important;
                font-weight: bold !important;
              }
              .print-materi-card {
                border: 1px solid #cbd5e1 !important;
                page-break-inside: avoid !important;
              }
            }
          `}} />

          {/* HOSPITAL LOGO & LETTERHEAD (No PPI-09 code in top right) */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 border-b-4 border-slate-900 pb-6 mb-8 text-center sm:text-left">
            {hospitalLogoUrl ? (
              <img 
                src={hospitalLogoUrl} 
                alt="Hospital Logo" 
                className="w-20 h-20 object-contain shrink-0 filter contrast-125"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300 font-extrabold shrink-0 border border-slate-200">
                LOGO
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 leading-tight">
                Tim Pencegahan Dan Pengendalian Infeksi (PPI)
              </h2>
              <p className="text-xs uppercase tracking-widest text-slate-500 font-bold mt-1">
                UOBK RSUD AL-MULK KOTA SUKABUMI
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed font-mono">
                Jl. Pelabuhan II No. Km.6, Lembursitu, Kec. Lembursitu, Kota Sukabumi, Jawa Barat.
              </p>
            </div>
          </div>

          {/* REPORT CONTENT:
              1. Data Pelaksanaan 
              2. Materi Pelatihan Terlampir (With Visual Covers / Thumbnails)
              3. Foto Dokumentasi Kegiatan */}
          {selectedSession && (
            <div className="space-y-8">
              
              {/* 1. Data Pelaksanaan */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b-2 border-slate-200 pb-2 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-3.5 bg-blue-600 rounded-full" />
                  I. DATA PELAKSANAAN KEGIATAN
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100/50 rounded-xl sm:col-span-2">
                    <div className="flex-1">
                      <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Topik / Judul Pelatihan</p>
                      <p className="text-sm font-black text-slate-900 mt-0.5">{selectedSession.judul}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100/50 rounded-xl">
                    <Calendar className="w-5 h-5 text-blue-500 shrink-0" />
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Waktu Pelaksanaan</p>
                      <p className="text-xs font-bold text-slate-800">
                        {format(parseISO(selectedSession.waktu), 'EEEE, d MMMM yyyy, HH:mm', { locale: idLocale })} WIB
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100/50 rounded-xl">
                    <MapPin className="w-5 h-5 text-emerald-500 shrink-0" />
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Tempat / Lokasi</p>
                      <p className="text-xs font-bold text-slate-800">{selectedSession.unit}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100/50 rounded-xl">
                    <User className="w-5 h-5 text-purple-500 shrink-0" />
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Narasumber / Instruktur</p>
                      <p className="text-xs font-bold text-slate-800">{selectedSession.observer}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100/50 rounded-xl">
                    <Users className="w-5 h-5 text-teal-500 shrink-0" />
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Profesi Sasaran Peserta</p>
                      <p className="text-xs font-bold text-slate-800">
                        {selectedSession.peserta.join(', ') || "Semua Staf Terkait"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Materi Pelatihan Terlampir (Visual Covers / Thumbnails) */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b-2 border-slate-200 pb-2 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-3.5 bg-blue-600 rounded-full" />
                  II. MATERI PELATIHAN TERLAMPIR
                </h4>
                
                {selectedSession.materials.length === 0 ? (
                  <p className="text-slate-400 italic text-xs py-4 pl-2">Tidak ada berkas materi pelatihan yang dilampirkan.</p>
                ) : (
                  <div>
                    {/* VISUAL COVER / THUMBNAILS GRID (Interactive on Web & Print-friendly) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      {selectedSession.materials.map((m, idx) => (
                        <div 
                          key={m.id || idx}
                          className="bg-white border border-slate-200 hover:border-blue-400 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between print-materi-card"
                        >
                          {/* Cover / Thumbnail Illustration */}
                          {renderMaterialCover(m)}

                          {/* Card Content & Action Bar */}
                          <div className="p-4 bg-white flex flex-col justify-between flex-1 gap-3">
                            <div>
                              <p className="text-xs font-black text-slate-800 line-clamp-1" title={m.nama_file}>
                                {m.nama_file}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-mono text-slate-500 uppercase">
                                  {m.jenis_file || 'Dokumen'} • {(m.ukuran_file / 1024 / 1024).toFixed(2)} MB
                                </span>
                              </div>
                            </div>

                            {/* Digital Action Buttons */}
                            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 no-print">
                              <button
                                type="button"
                                onClick={() => setPreviewMaterial(m)}
                                className="flex-1 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-black uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
                              >
                                <Eye className="w-3.5 h-3.5" /> Pratinjau
                              </button>
                              <a
                                href={m.public_url}
                                download={m.nama_file}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-black uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
                              >
                                <Download className="w-3.5 h-3.5" /> Unduh
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Foto Dokumentasi Kegiatan */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b-2 border-slate-200 pb-2 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-3.5 bg-blue-600 rounded-full" />
                  III. FOTO DOKUMENTASI KEGIATAN
                </h4>
                
                {selectedSession.images.length === 0 ? (
                  <p className="text-slate-400 italic text-xs py-4 pl-2">Tidak ada foto dokumentasi yang dilampirkan.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {selectedSession.images.map((img, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => setZoomedImage(img)}
                        className="aspect-video bg-slate-50 border border-slate-100 rounded-xl overflow-hidden relative group cursor-pointer"
                      >
                        <img 
                          src={img} 
                          alt={`Dokumentasi Pelatihan ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all no-print">
                          <span className="p-2 bg-white/90 text-slate-900 rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-lg">Zoom</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

      </div>

      {/* BOTTOM SECTION: Daftar Kegiatan Pelatihan with Edit & Trash Icons */}
      <div className="w-full max-w-4xl space-y-4 no-print mt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
            Daftar Kegiatan Pelatihan ({filteredSessions.length})
          </h3>
          <span className="text-[10px] text-slate-500 font-medium">
            Klik kartu untuk melihat detail laporan resmi
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
          {filteredSessions.map((s) => (
            <div
              key={s.id}
              onClick={() => setSelectedSessionId(s.id)}
              className={`p-4 rounded-2xl border text-left cursor-pointer transition-all relative overflow-hidden ${
                selectedSession?.id === s.id
                  ? 'bg-blue-600/10 border-blue-500/40 shadow-lg shadow-blue-500/5'
                  : 'bg-white/2 hover:bg-white/5 border-white/5'
              }`}
            >
              <div className="flex justify-between items-start gap-2 mb-2">
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[9px] font-bold rounded-md uppercase tracking-wider">
                  {s.unit}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {format(parseISO(s.waktu), 'dd/MM/yyyy')}
                </span>
              </div>
              <h4 className="text-xs font-black text-slate-100 uppercase tracking-tight line-clamp-2">
                {s.judul}
              </h4>
              <div className="flex justify-between items-center mt-4 border-t border-white/5 pt-3">
                <span className="text-[10px] text-slate-400 font-medium truncate max-w-[140px]">
                  👤 {s.observer}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-cyan-400">
                    📎 {s.materials.length} File
                  </span>
                  
                  {/* EDIT BUTTON */}
                  <button 
                    type="button"
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      handleEditSession(s.id); 
                    }}
                    className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 rounded-lg transition-all"
                    title="Edit Data Pelatihan"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>

                  {/* TRASH / DELETE BUTTON */}
                  <button 
                    type="button"
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setDeleteConfirmSession(s); 
                    }}
                    className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition-all"
                    title="Hapus Data Pelatihan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CONFIRMATION MODAL: HAPUS DATA PELATIHAN */}
      <AnimatePresence>
        {deleteConfirmSession && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[350] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-500/20 text-red-400 rounded-2xl">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-tight">Hapus Data Pelatihan</h3>
                  <p className="text-xs text-slate-400">Tindakan ini tidak dapat dibatalkan</p>
                </div>
              </div>

              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                <p className="text-xs font-bold text-white uppercase line-clamp-2">
                  {deleteConfirmSession.judul}
                </p>
                <p className="text-[10px] text-slate-400">
                  {deleteConfirmSession.unit} • {format(parseISO(deleteConfirmSession.waktu), 'dd MMMM yyyy', { locale: idLocale })}
                </p>
              </div>

              <p className="text-xs text-slate-300">
                Apakah Anda yakin ingin menghapus data kegiatan pelatihan ini beserta berkas materi dan foto dokumentasi terkait?
              </p>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeleteConfirmSession(null)}
                  className="flex-1 py-3 bg-white/10 hover:bg-white/15 text-slate-300 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menghapus...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Ya, Hapus</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: Zoomed Image Preview */}
      <AnimatePresence>
        {zoomedImage && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={() => setZoomedImage(null)}
            className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-10 cursor-zoom-out"
          >
            <div className="relative max-w-4xl max-h-full">
              <img 
                src={zoomedImage} 
                alt="Zoomed Dokumentasi" 
                className="w-full h-auto max-h-[85vh] object-contain rounded-2xl border border-white/10 shadow-2xl"
                referrerPolicy="no-referrer"
              />
              <button 
                onClick={() => setZoomedImage(null)}
                className="absolute -top-12 right-0 p-3 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: Training Material Document Live Viewer */}
      <AnimatePresence>
        {previewMaterial && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[250] flex items-center justify-center p-4 sm:p-10 bg-black/95 backdrop-blur-md"
          >
            <div className="bg-slate-900 w-full max-w-5xl h-full rounded-[2.5rem] border border-white/10 overflow-hidden flex flex-col shadow-2xl relative">
              <div className="p-5 bg-slate-800 border-b border-white/10 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-blue-400" />
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-widest truncate max-w-xs sm:max-w-md">
                      Pratinjau Materi Pelatihan
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-xs sm:max-w-md">
                      {previewMaterial.nama_file}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setPreviewMaterial(null)} 
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-auto bg-slate-950 flex justify-center p-4">
                <div className="w-full h-full flex flex-col justify-between relative bg-slate-950 rounded-xl overflow-hidden p-3 border border-white/5 animate-fade-in">
                  <iframe 
                    src={`https://docs.google.com/gview?url=${encodeURIComponent(previewMaterial.public_url)}&embedded=true`}
                    className="w-full h-full rounded-2xl bg-white border border-white/10 shadow-inner"
                    title="Google Viewer Frame"
                  />
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 border border-white/10 p-4 rounded-xl flex flex-col sm:flex-row items-center gap-4 text-center shadow-2xl">
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                      Gunakan download langsung untuk pratinjau penuh atau resolusi asli.
                    </p>
                    <a 
                      href={previewMaterial.public_url} 
                      download={previewMaterial.nama_file}
                      className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-[10px] uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 select-none"
                    >
                      <Download className="w-4 h-4" /> Download File
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
