import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase";
import {
  CheckCircle2,
  Trash2,
  ClipboardCheck,
  FileText,
  Edit,
  ShieldCheck,
  Download,
  Loader2,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "@/components/Providers";
import { useSafeRouter as useRouter } from "@/hooks/useSafeRouter";

interface EtikaBatukData {
  id: string;
  waktu: string;
  observer: string;
  unit: string;
  materi_edukasi: string[];
  sasaran_edukasi: string[];
  dokumentasi: string[];
  tanda_tangan_1: string;
  tanda_tangan_2: string;
  nama_pj_ruangan: string;
}

export default function EtikaBatukReport({
  tableName,
  title,
  extraFilter,
  filters,
}: {
  tableName: string;
  indicatorItems?: any[];
  title: string;
  extraFilter?: any;
  filters: { searchQuery: string; periode: string; type: string; unitFilter?: string };
}) {
  const router = useRouter();
  const { hospitalLogoUrl } = useAppContext();
  const [data, setData] = useState<EtikaBatukData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleEditClick = (recordId: string) => {
    router.push(`/dashboard/input/etika-batuk?id=${recordId}&mode=edit`);
  };

  const normalizeItem = useCallback((item: any): EtikaBatukData => {
    const jsonFallback = item.data_indikator || item.checklist_json || {};
    return {
      id: item.id,
      waktu: item.tanggal_waktu || item.waktu || item.created_at,
      observer: item.observer || item.supervisor || item.ipcn || "",
      unit: item.unit || item.ruangan || "",
      materi_edukasi: jsonFallback.materi_edukasi || [],
      sasaran_edukasi: jsonFallback.sasaran_edukasi || [],
      dokumentasi: item.dokumentasi || item.foto || jsonFallback.dokumentasi || [],
      tanda_tangan_1:
        item.ttd_pj_ruangan ||
        item.ttd_pj ||
        jsonFallback.ttd_pj_ruangan ||
        jsonFallback.tanda_tangan_pj ||
        "",
      tanda_tangan_2:
        item.ttd_ipcn ||
        jsonFallback.ttd_ipcn ||
        jsonFallback.tanda_tangan_ipcn ||
        "",
      nama_pj_ruangan:
        item.nama_pj_ruangan ||
        item.nama_pj ||
        jsonFallback.nama_pj_ruangan ||
        jsonFallback.nama_pj ||
        "",
    };
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let sessionQuery = supabase
        .from("audit_sessions")
        .select("*")
        .eq("indikator_id", tableName);
      if (extraFilter) sessionQuery = sessionQuery.match(extraFilter);
      const { data: sessionData } = await sessionQuery.order("tanggal_waktu", { ascending: true });
      
      const normalized = (sessionData || []).map(normalizeItem)
        .sort((a, b) => new Date(a.waktu || 0).getTime() - new Date(b.waktu || 0).getTime());
        
      setData(normalized);
      if (normalized.length > 0 && selectedRecordId === null) {
        setSelectedRecordId(normalized[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tableName, extraFilter, selectedRecordId, normalizeItem]);

  useEffect(() => {
    fetchData();

    const ch = supabase
      .channel('etika_batuk_realtime_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_sessions', filter: `indikator_id=eq.${tableName}` }, () => {
        fetchData();
      })
      .on('broadcast', { event: 'audit_submitted' }, (payload) => {
        if (payload?.payload?.indikator_id === tableName || payload?.payload?.tableName === tableName) {
          fetchData();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [fetchData, tableName]);

  // Ensure scroll resets to top when data loading finishes
  useEffect(() => {
    const scrollToTop = () => {
      const mainEl = document.querySelector("main");
      if (mainEl) {
        mainEl.scrollTop = 0;
        try {
          mainEl.scrollTo({ top: 0, behavior: "instant" as any });
        } catch (_) {}
      }
      const scrollableElements = document.querySelectorAll('.overflow-y-auto, [data-scroll-container]');
      scrollableElements.forEach(el => {
        el.scrollTop = 0;
      });

      const headerEl = document.getElementById('report-detail-header') || document.getElementById('report-top-anchor');
      if (headerEl) {
        try {
          headerEl.scrollIntoView({ behavior: 'instant' as any, block: 'start' });
        } catch (_) {}
      }

      try {
        window.scrollTo({ top: 0, behavior: "instant" as any });
      } catch (_) {}
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    scrollToTop();
    requestAnimationFrame(scrollToTop);
    setTimeout(scrollToTop, 30);
    setTimeout(scrollToTop, 100);
    setTimeout(scrollToTop, 250);
    setTimeout(scrollToTop, 500);
  }, [loading]);

  const filteredData = data.filter((d) => {
    if (!d.waktu) return false;
    const isMatchedQuery =
      filters.searchQuery === "" ||
      d.unit?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
      d.observer?.toLowerCase().includes(filters.searchQuery.toLowerCase());

    const itemDate = new Date(d.waktu);
    const filterDate = new Date(filters.periode);

    let isMatchedPeriode = true;
    if (filters.type === "Bulanan") {
      isMatchedPeriode =
        itemDate.getUTCMonth() === filterDate.getUTCMonth() &&
        itemDate.getUTCFullYear() === filterDate.getUTCFullYear();
    } else if (filters.type === "Triwulan") {
      const itemQuarter = Math.floor(itemDate.getUTCMonth() / 3);
      const filterQuarter = Math.floor(filterDate.getUTCMonth() / 3);
      isMatchedPeriode =
        itemQuarter === filterQuarter &&
        itemDate.getUTCFullYear() === filterDate.getUTCFullYear();
    } else if (filters.type === "Semester") {
      const itemSemester = Math.floor(itemDate.getUTCMonth() / 6);
      const filterSemester = Math.floor(filterDate.getUTCMonth() / 6);
      isMatchedPeriode =
        itemSemester === filterSemester &&
        itemDate.getUTCFullYear() === filterDate.getUTCFullYear();
    } else if (filters.type === "Tahunan") {
      isMatchedPeriode = itemDate.getUTCFullYear() === filterDate.getUTCFullYear();
    }

    const isMatchedUnit =
      !filters.unitFilter ||
      filters.unitFilter === "Semua Unit" ||
      d.unit === filters.unitFilter;

    return isMatchedQuery && isMatchedPeriode && isMatchedUnit;
  });

  const selectedRecord = filteredData.find((d) => d.id === selectedRecordId) || filteredData[0];

  const [downloading, setDownloading] = useState(false);

  const handleDownloadPdf = async () => {
    if (!selectedRecord) return;
    setDownloading(true);
    try {
      const element = document.getElementById("etika-batuk-official-report");
      if (!element) {
        setDownloading(false);
        return;
      }
      
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf")
      ]);
      
      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });
      
      const imgData = canvas.toDataURL("image/jpeg", 0.98);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const printWidth = pageWidth - (margin * 2);
      const printHeight = (canvas.height * printWidth) / canvas.width;
      
      let heightLeft = printHeight;
      let position = margin;
      
      pdf.addImage(imgData, "JPEG", margin, position, printWidth, printHeight);
      heightLeft -= (pageHeight - (margin * 2));
      
      while (heightLeft > 0) {
        position = heightLeft - printHeight + margin;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", margin, position, printWidth, printHeight);
        heightLeft -= (pageHeight - (margin * 2));
      }
      
      const filename = `Laporan_Edukasi_Etika_Batuk_${selectedRecord.unit || "Unit"}_${format(new Date(), "yyyyMMdd_HHmmss")}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error("PDF download error:", err);
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  const deleteRecordUrl = async () => {
    if (!deleteConfirmId) return;
    try {
      await supabase.from("audit_sessions").delete().eq("id", deleteConfirmId);
      setData((prev) => prev.filter((d) => d.id !== deleteConfirmId));
      if (selectedRecordId === deleteConfirmId) setSelectedRecordId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setShowDeleteConfirm(false);
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Judul di atas Laporan Resmi */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div className="pt-2">
          <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 pl-1">Laporan Resmi</h4>
        </div>
      </div>

      {/* Lembar Laporan Resmi - Dipaksa Putih Bersih di Dark Mode */}
      {selectedRecord ? (
        <div 
          id="etika-batuk-official-report"
          className="p-4 sm:p-8 rounded-none sm:rounded-2xl shadow-[0_15px_35px_-8px_rgba(0,0,0,0.15),0_6px_15px_-4px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.95),0_10px_25px_-6px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.12),inset_0_0_0_1px_rgba(255,255,255,0.05)] print-container print:shadow-none print:w-full print:p-0 min-h-[800px] print:min-h-0 mx-auto max-w-[210mm] border border-slate-200/80 dark:border-white/10 bg-force-white text-force-black report-card-premium relative"
          style={{
            backgroundColor: "#ffffff",
            color: "#000000",
            pageBreakAfter: "always",
          }}
        >
          {/* Header Kop Surat */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-slate-800 pb-3 mb-6" id="kop-surat" style={{ borderColor: "#000000" }}>
            <div className="flex items-center gap-2 sm:gap-4 w-full justify-center text-center max-w-full">
              <div className="w-10 h-10 sm:w-16 sm:h-16 flex-shrink-0 flex items-center justify-center p-1">
                {hospitalLogoUrl ? (
                  <img
                    src={hospitalLogoUrl}
                    alt="Logo RS"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                    crossOrigin="anonymous"
                  />
                ) : (
                  <ShieldCheck className="w-10 h-10 sm:w-16 sm:h-16 text-force-black shrink-0" />
                )}
              </div>
              <div className="text-left">
                <h1 className="text-[9px] min-[400px]:text-[11px] sm:text-[13px] md:text-[15px] font-black tracking-tight leading-tight uppercase font-heading text-force-black whitespace-nowrap">
                  TIM PENCEGAHAN & PENGENDALIAN INFEKSI (PPI)
                </h1>
                <p className="text-[7.5px] min-[400px]:text-[8.5px] sm:text-[10px] md:text-[12px] font-bold uppercase text-force-black tracking-widest mt-0.5 whitespace-nowrap">
                  UOBK RSUD AL-MULK KOTA SUKABUMI
                </p>
                <p className="text-[6.5px] min-[400px]:text-[7px] sm:text-[8px] md:text-[9px] text-force-black mt-0.5 italic whitespace-nowrap">
                  Jl. Pelabuhan II No. Km.6, Lembursitu, Kec. Lembursitu, Kota Sukabumi, Jawa Barat.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-[16px] sm:text-[18px] font-black tracking-tight font-heading text-force-black w-full text-center uppercase">
              LAPORAN EDUKASI ETIKA BATUK
            </h2>
          </div>

          {/* Informasi Pelaksanaan */}
          <div className="w-full mb-6 border-2 border-slate-800 border-collapse grid grid-cols-3 bg-force-white" style={{ borderColor: "#000000" }}>
            <div className="border-r border-slate-800 p-2 text-center flex flex-col items-center justify-center" style={{ borderRightColor: "#000000", backgroundColor: "#f8fafc" }}>
              <p className="text-[8px] font-black uppercase tracking-widest text-force-black mb-0.5" style={{ color: "#000000" }}>Waktu Pelaksanaan</p>
              <div className="font-bold text-[10px] sm:text-[11px] text-force-black" style={{ color: "#000000" }}>
                {selectedRecord.waktu && format(parseISO(selectedRecord.waktu), "dd MMM yyyy HH:mm", { locale: idLocale })}
              </div>
            </div>
            <div className="border-r border-slate-800 p-2 text-center flex flex-col items-center justify-center" style={{ borderRightColor: "#000000", backgroundColor: "#f8fafc" }}>
              <p className="text-[8px] font-black uppercase tracking-widest text-force-black mb-0.5" style={{ color: "#000000" }}>Supervisor</p>
              <div className="font-bold text-[10px] sm:text-[11px] text-force-black" style={{ color: "#000000" }}>{selectedRecord.observer}</div>
            </div>
            <div className="p-2 text-center flex flex-col items-center justify-center" style={{ backgroundColor: "#f8fafc" }}>
              <p className="text-[8px] font-black uppercase tracking-widest text-force-black mb-0.5" style={{ color: "#000000" }}>Unit / Ruangan</p>
              <div className="font-bold text-[10px] sm:text-[11px] text-force-black" style={{ color: "#000000" }}>{selectedRecord.unit}</div>
            </div>
          </div>

          {/* Edukasi Details */}
          <div className="space-y-6">
            {/* Materi Edukasi */}
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-widest mb-3 border-b-2 border-slate-800 pb-1 text-force-black" style={{ borderColor: "#000000", color: "#000000" }}>
                MATERI EDUKASI
              </h3>
              <ul className="space-y-3 pl-2">
                {(selectedRecord.materi_edukasi && selectedRecord.materi_edukasi.length > 0) ? (
                  selectedRecord.materi_edukasi.map((materi, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-[11px] sm:text-[13px] text-force-black font-semibold" style={{ color: "#000000" }}>
                      <div className="w-4 h-4 border-2 border-black rounded-sm flex items-center justify-center shrink-0 font-black pb-0.5" style={{ borderColor: "#000000", color: "#000000" }}>✓</div> {materi}
                    </li>
                  ))
                ) : (
                  <li className="text-[11px] text-slate-500 italic">Tidak ada materi dicatat.</li>
                )}
              </ul>
            </div>

            {/* Sasaran Edukasi */}
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-widest mb-3 border-b-2 border-slate-800 pb-1 text-force-black" style={{ borderColor: "#000000", color: "#000000" }}>
                SASARAN EDUKASI
              </h3>
              <ul className="space-y-3 pl-2">
                {(selectedRecord.sasaran_edukasi && selectedRecord.sasaran_edukasi.length > 0) ? (
                  selectedRecord.sasaran_edukasi.map((sasaran, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-[11px] sm:text-[13px] text-force-black font-semibold" style={{ color: "#000000" }}>
                      <div className="w-4 h-4 border-2 border-black rounded-sm flex items-center justify-center shrink-0 font-black pb-0.5" style={{ borderColor: "#000000", color: "#000000" }}>✓</div> {sasaran}
                    </li>
                  ))
                ) : (
                  <li className="text-[11px] text-slate-500 italic">Tidak ada sasaran dicatat.</li>
                )}
              </ul>
            </div>

            {/* Foto Dokumentasi */}
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-widest mb-3 border-b-2 border-slate-800 pb-1 text-force-black" style={{ borderColor: "#000000", color: "#000000" }}>
                FOTO DOKUMENTASI
              </h3>
              {selectedRecord.dokumentasi && selectedRecord.dokumentasi.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 print:page-break-inside-avoid px-2">
                  {selectedRecord.dokumentasi.slice(0, 4).map((url, idx) => (
                     <div key={idx} onClick={() => setZoomedImage(url)} className="relative pt-[75%] border border-slate-800 p-1 cursor-zoom-in bg-white shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-none transition-all" style={{ borderColor: "#000000" }}>
                       <img
                         src={url}
                         alt={`Dokumentasi ${idx + 1}`}
                         className="absolute inset-0 w-full h-full object-cover p-1"
                         onError={(e) => { e.currentTarget.style.display = "none"; }}
                       />
                     </div>
                  ))}
                </div>
              ) : (
                <blockquote className="text-[11px] text-slate-500 border-l-2 border-slate-400 pl-3 italic font-medium ml-2" style={{ borderLeftColor: "#94a3b8" }}>
                  Belum ada foto dokumentasi yang diunggah.
                </blockquote>
              )}
            </div>
          </div>

          {/* Tanda Tangan */}
          <div className="grid grid-cols-2 gap-8 mt-12 pt-4 break-inside-avoid border-t-2 border-slate-800 border-dashed" style={{ borderColor: "#000000" }}>
            <div className="text-center space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-force-black mb-2" style={{ color: "#000000" }}>PJ Ruangan</p>
              <div className="h-16 lg:h-20 relative w-full flex justify-center items-center">
                {selectedRecord.tanda_tangan_1 ? (
                  <img src={selectedRecord.tanda_tangan_1} className="object-contain h-full relative z-10 mix-blend-multiply" alt="TTD PJ" />
                ) : (
                  <span className="text-[9px] text-gray-500 uppercase tracking-widest font-black italic">Tanpa Tanda Tangan</span>
                )}
              </div>
              <div className="pt-1 border-t border-slate-300 w-[90%] md:w-56 mx-auto" style={{ borderTopColor: "#cbd5e1" }}>
                <p className="font-bold text-[11px] uppercase tracking-wider text-force-black mt-1 text-wrap text-center" style={{ color: "#000000" }}>
                  {selectedRecord.nama_pj_ruangan ? `( ${selectedRecord.nama_pj_ruangan} )` : "( ........................................ )"}
                </p>
              </div>
            </div>

            <div className="text-center space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-force-black mb-2" style={{ color: "#000000" }}>TIM PPI RS</p>
              <div className="h-16 lg:h-20 relative w-full flex justify-center items-center">
                {selectedRecord.tanda_tangan_2 ? (
                  <img src={selectedRecord.tanda_tangan_2} className="object-contain h-full relative z-10 mix-blend-multiply" alt="TTD IPCN" />
                ) : (
                  <span className="text-[9px] text-gray-500 uppercase tracking-widest font-black italic">Tanpa Tanda Tangan</span>
                )}
              </div>
              <div className="pt-1 border-t border-slate-300 w-[90%] md:w-56 mx-auto" style={{ borderTopColor: "#cbd5e1" }}>
                <p className="font-bold text-[11px] uppercase tracking-wider text-force-black mt-1 text-wrap text-center" style={{ color: "#000000" }}>
                  {selectedRecord.observer ? `( ${selectedRecord.observer} )` : "( ........................................ )"}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-full bg-slate-50 dark:bg-[#111827]/80 rounded-[2rem] border border-slate-200 dark:border-white/10 flex flex-col items-center justify-center p-12 md:p-20 text-center text-slate-500 shadow-sm min-h-[400px]">
          <FileText className="w-16 h-16 md:w-20 md:h-20 mb-6 text-slate-300 dark:text-slate-700" />
          <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mb-2">
            Belum Ada Data Edukasi
          </h2>
          <p className="text-xs md:text-sm max-w-sm">
            Data laporan edukasi etika batuk untuk unit dan periode yang dipilih saat ini belum tersedia.
          </p>
        </div>
      )}

      {/* Tombol Download Laporan di bawah Laporan Resmi */}
      {selectedRecord && (
        <div className="flex justify-center items-center print:hidden pt-2">
          <button
            onClick={handleDownloadPdf}
            disabled={filteredData.length === 0 || downloading}
            className="flex justify-center items-center gap-2 px-6 py-3 bg-[#4F46E5] hover:bg-[#4338CA] disabled:bg-slate-400 text-white text-sm font-bold rounded-xl transition-all duration-300 shadow-md select-none cursor-pointer w-full sm:w-auto min-w-[220px]"
          >
            {downloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Mengunduh PDF...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" /> Download Laporan (PDF)
              </>
            )}
          </button>
        </div>
      )}

      {/* Tabel Riwayat Laporan (Posisinya Di Bawah Laporan Resmi) */}
      <div className="bg-white/90 dark:bg-[#111827]/90 backdrop-blur-md rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-[0_15px_35px_-8px_rgba(0,0,0,0.12),0_6px_15px_-4px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.95),0_10px_25px_-6px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.12),inset_0_0_0_1px_rgba(255,255,255,0.05)] overflow-hidden relative group print:hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
        <div className="p-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-850 dark:text-white tracking-tight flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-blue-500" />
              Tabel Riwayat Laporan
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Daftar laporan edukasi yang tercatat pada sistem</p>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 dark:bg-white/5 text-[11px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-white/10">
                <th className="py-4 px-6 w-16 text-center">No</th>
                <th className="py-4 px-6">Tanggal Edukasi</th>
                <th className="py-4 px-6">Unit / Ruangan</th>
                <th className="py-4 px-6">Supervisor / IPCN</th>
                <th className="py-4 px-6">Materi Edukasi</th>
                <th className="py-4 px-6">Sasaran Edukasi</th>
                <th className="py-4 px-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-sm">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-bold uppercase tracking-wider">
                    Belum Ada Data Laporan Edukasi
                  </td>
                </tr>
              ) : (
                filteredData.map((row, idx) => {
                  const isActive = row.id === selectedRecordId;
                  
                  return (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedRecordId(row.id)}
                      className={`cursor-pointer transition-all ${
                        isActive
                          ? "bg-blue-600/10 hover:bg-blue-600/15 border-l-4 border-l-blue-500"
                          : "hover:bg-slate-50/50 dark:hover:bg-white/[0.02]"
                      }`}
                    >
                      <td className="py-4 px-6 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-4 px-6 text-slate-700 dark:text-slate-300 font-medium font-mono text-xs">
                        {row.waktu ? format(parseISO(row.waktu), "dd MMMM yyyy HH:mm", { locale: idLocale }) : "-"}
                      </td>
                      <td className="py-4 px-6 text-slate-800 dark:text-white font-semibold">
                        {row.unit || "-"}
                      </td>
                      <td className="py-4 px-6 text-slate-600 dark:text-slate-400 italic">
                        {row.observer || "-"}
                      </td>
                      <td className="py-4 px-6 text-slate-700 dark:text-slate-300 max-w-xs truncate" title={row.materi_edukasi.join(", ")}>
                        {row.materi_edukasi.join(", ") || "-"}
                      </td>
                      <td className="py-4 px-6 text-slate-700 dark:text-slate-300 max-w-xs truncate" title={row.sasaran_edukasi.join(", ")}>
                        {row.sasaran_edukasi.join(", ") || "-"}
                      </td>
                      <td className="py-3 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEditClick(row.id)}
                            type="button"
                            className="p-2 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-all duration-300 shadow-md border border-blue-500/20 group/btn select-none"
                            title="Edit Laporan"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteConfirmId(row.id);
                              setShowDeleteConfirm(true);
                            }}
                            type="button"
                            className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 shadow-md border border-red-500/20 group/btn select-none"
                            title="Hapus Data"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ZOOM IMAGE MODAL */}
      <AnimatePresence>
        {zoomedImage && typeof document !== 'undefined' &&
          createPortal(
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-10">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setZoomedImage(null)} className="absolute inset-0 bg-black/90 backdrop-blur-sm cursor-zoom-out" />
              <motion.img initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} src={zoomedImage} alt="Zoomed view" className="relative z-10 max-w-full max-h-full object-contain rounded-lg shadow-2xl pointer-events-none" />
            </div>,
            document.body
          )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {showDeleteConfirm && typeof document !== 'undefined' &&
          createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDeleteConfirm(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 relative z-10 shadow-2xl border border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-red-100 dark:bg-red-500/20 text-red-600 rounded-xl"><Trash2 className="w-6 h-6" /></div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Hapus Laporan</h3>
                    <p className="text-sm text-slate-500">Aksi ini tidak dapat dibatalkan.</p>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl">Batal</button>
                  <button onClick={deleteRecordUrl} className="flex-1 py-3 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl">Ya, Hapus</button>
                </div>
              </motion.div>
            </div>,
            document.body
          )}
      </AnimatePresence>
    </div>
  );
}
