'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  CheckCircle2, Trash2, FileText, Download, Eye, Loader2, Calendar, 
  MapPin, User, Users, ChevronRight, X, Printer, ShieldCheck 
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '@/components/Providers';

// Setup react-pdf safely
// using google docs viewer for all preview


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
  tableName,
  title,
  filters,
}: {
  tableName: string;
  title: string;
  filters: { searchQuery: string; periode: string; type: string; unitFilter?: string };
}) {
  const { hospitalLogoUrl } = useAppContext();
  const [sessions, setSessions] = useState<DiklatSessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [previewMaterial, setPreviewMaterial] = useState<TrainingMaterial | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  
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

  useEffect(() => {
    if (sessions.length > 0) {
      if (!selectedSessionId || !sessions.some(s => s.id === selectedSessionId)) {
        setSelectedSessionId(sessions[0].id);
      }
    } else {
      setSelectedSessionId(null);
    }
  }, [sessions, selectedSessionId]);

  const handlePrint = () => {
    window.print();
  };

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

  const handleDeleteSession = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data pelatihan & dokumen terkait?")) return;
    try {
      // Delete from storage files first
      const session = sessions.find(s => s.id === id);
      if (session && session.materials.length > 0) {
        const filePaths = session.materials.map(m => m.storage_path);
        await supabase.storage.from('public').remove(filePaths);
      }

      const { error } = await supabase
        .from('audit_sessions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setSessions(prev => prev.filter(s => s.id !== id));
      if (selectedSessionId === id) {
        setSelectedSessionId(null);
      }
      alert("Laporan kegiatan pelatihan berhasil dihapus");
    } catch (e: any) {
      alert("Gagal menghapus: " + e.message);
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') {
      return <span className="text-lg mr-2">📄</span>;
    } else if (['doc', 'docx'].includes(ext || '')) {
      return <span className="text-lg mr-2">📘</span>;
    } else if (['ppt', 'pptx'].includes(ext || '')) {
      return <span className="text-lg mr-2">📊</span>;
    }
    return <span className="text-lg mr-2">📎</span>;
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
        <p className="text-xs text-slate-400 max-w-sm mb-4">Maksimal 5MB untuk dokumen PPT, PDF, atau Word yang diunggah di menu input kegiatan pelatihan.</p>
        {sessions.length > 0 && (
           <p className="text-xs text-amber-500 font-bold border border-amber-500/20 bg-amber-500/10 p-2 rounded-lg">
             DEBUG: Terdapat {sessions.length} data di database, namun tidak sesuai dengan filter tanggal atau unit.
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
              .print-materi-item {
                border-bottom: 1px dashed #ccc !important;
                padding: 8px 0 !important;
              }
            }
          `}} />

          {/* HOSPITAL LOGO & LETTERHEAD */}
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
            <div className="hidden sm:block text-right">
              <span className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-800 text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-sm">
                Form No: PPI-09
              </span>
            </div>
          </div>

          {/* CONTENT ACCORDING TO USER'S EXACT FLOW:
              1. Data Pelaksanaan 
              2. Materi Pelatihan 
              3. Foto Dokumentasi 
              4. Tanda Tangan */}

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
                        {selectedSession.peserta.join(', ') || "Belum ditentukan"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Materi Pelatihan */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b-2 border-slate-200 pb-2 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-3.5 bg-blue-600 rounded-full" />
                  II. MATERI PELATIHAN TERLAMPIR
                </h4>
                
                {selectedSession.materials.length === 0 ? (
                  <p className="text-slate-400 italic text-xs py-4 pl-2">Tidak ada berkas materi pelatihan yang dilampirkan.</p>
                ) : (
                  <div>
                    {/* DIGITAL EXCLUSIVE CONTROLS */}
                    <div className="no-print space-y-2 mb-6">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Materi yang digunakan pada kegiatan:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {selectedSession.materials.map((m, idx) => (
                          <div 
                            key={m.id || idx}
                            className="p-4 bg-slate-50 border border-slate-200 hover:border-blue-300 rounded-xl flex items-center justify-between gap-3 group transition-all"
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              {getFileIcon(m.nama_file)}
                              <span className="text-xs font-extrabold text-slate-700 truncate max-w-[180px] group-hover:text-blue-600">
                                {m.nama_file}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => setPreviewMaterial(m)}
                                className="p-1 px-2.5 bg-blue-50 hover:bg-blue-100 text-[10px] font-black uppercase text-blue-600 rounded-lg transition-all flex items-center gap-1"
                                title="Buka Pratinjau"
                              >
                                <Eye className="w-3 h-3" /> Preview
                              </button>
                              <a
                                href={m.public_url}
                                download={m.nama_file}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-[10px] font-black uppercase text-emerald-600 rounded-lg transition-all flex items-center gap-1"
                                title="Download"
                              >
                                <Download className="w-3 h-3" /> Unduh
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* PRINT / PDF VERSION TABLE */}
                    <div className="hidden print:block space-y-2 font-serif text-slate-900 border border-slate-200 rounded-xl p-4">
                      <p className="text-xs font-bold italic mb-3">Materi Pelatihan Terlampir pada Berkas Kegiatan Resmi:</p>
                      {selectedSession.materials.map((m, idx) => (
                        <div key={m.id || idx} className="flex justify-between items-center print-materi-item py-1">
                          <span className="text-xs font-bold text-slate-800 print-checkmark">
                            {m.nama_file}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 uppercase">
                            [ {m.jenis_file || 'PDF'} • {(m.ukuran_file / 1024 / 1024).toFixed(2)} MB ]
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Foto Dokumentasi */}
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

      {/* LEFT SIDEBAR -> NOW BOTTOM SECTION: List of records */}
      <div className="w-full max-w-4xl space-y-4 no-print mt-8">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
          Daftar Kegiatan Pelatihan ({filteredSessions.length})
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
          {filteredSessions.map((s) => (
            <div
              key={s.id}
              onClick={() => setSelectedSessionId(s.id)}
              className={`p-4 rounded-2xl border text-left cursor-pointer transition-all relative overflow-hidden ${
                selectedSession?.id === s.id
                  ? 'bg-blue-600/10 border-blue-500/30'
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
                <span className="text-[10px] text-slate-400 font-medium truncate max-w-[150px]">
                  👤 {s.observer}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-cyan-400">
                    📎 {s.materials.length} File
                  </span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteSession(s.id); }}
                    className="p-1 hover:bg-red-500/20 rounded text-slate-500 hover:text-red-400 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

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
                  <span className="text-xl">📄</span>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-widest truncate max-w-xs">Pratinjau Materi Laporan resmi</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-xs">{previewMaterial.nama_file}</p>
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
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 border border-white/10 p-4 rounded-xl flex flex-col sm:flex-row items-center gap-4 text-center">
                      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Gunakan download langsung untuk pratinjau penuh.</p>
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
