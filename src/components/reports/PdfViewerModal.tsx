import React, { useState, useEffect } from 'react';
import { 
  X, Download, Share2, ZoomIn, ZoomOut, 
  RotateCcw, FileText, ChevronLeft, ChevronRight, CheckCircle2,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface PdfViewerData {
  filename: string;
  pageImages: string[];
  pdfBase64?: string;
  file?: File;
  downloadUrl?: string;
  totalElementsCount?: number;
}

interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PdfViewerData | null;
  onDownload?: () => Promise<void>;
  onShare?: () => Promise<void>;
}

export default function PdfViewerModal({
  isOpen,
  onClose,
  data,
  onDownload,
  onShare,
}: PdfViewerModalProps) {
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [canShare, setCanShare] = useState<boolean>(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      setCanShare(true);
    }
    setCurrentPage(0);
    setZoom(1);
    setIsActionLoading(null);
    setActionSuccess(null);
  }, [isOpen, data]);

  if (!isOpen || !data) return null;

  const totalPages = data.pageImages.length;
  const currentImage = data.pageImages[currentPage] || data.pageImages[0];

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.2, 2.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.2, 0.4));
  const handleResetZoom = () => setZoom(1);

  const handleShareClick = async () => {
    if (!data) return;
    setIsActionLoading('share');
    try {
      if (onShare) {
        await onShare();
      } else if (data.file && typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [data.file] })) {
        await navigator.share({
          files: [data.file],
          title: data.filename,
          text: 'Laporan Resmi SMART-PPI RSUD AL-MULK',
        });
      } else {
        // Fallback: trigger download
        if (onDownload) await onDownload();
      }
      setActionSuccess('Berhasil dibuka / dibagikan');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Share error, fallback to download:', err);
        if (onDownload) await onDownload();
      }
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleDownloadClick = async () => {
    setIsActionLoading('download');
    try {
      if (onDownload) {
        await onDownload();
      } else if (data.downloadUrl) {
        window.location.href = data.downloadUrl;
      }
      setActionSuccess('Unduhan diproses');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setIsActionLoading(null);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden animate-in fade-in duration-200">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-5xl h-[92vh] flex flex-col bg-[#14172f] rounded-2xl md:rounded-3xl border border-indigo-900/60 shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-[#0f1124] border-b border-indigo-900/40 select-none">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-red-600 flex items-center justify-center text-white shadow-md shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-tight truncate">
                  Pratinjau Laporan Resmi PDF
                </h3>
                <p className="text-[10px] sm:text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md">
                  {data.filename}
                </p>
              </div>
            </div>

            {/* Top Right Controls - Only Close Button */}
            <div className="flex items-center">
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                title="Tutup Pratinjau"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Secondary Sub-toolbar for Zoom and Multi-page Navigation */}
          <div className="flex items-center justify-between px-4 py-2 bg-[#121429] border-b border-indigo-950/80 text-xs text-slate-300 select-none">
            {/* Multi-page controls */}
            {totalPages > 1 ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="p-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all"
                  title="Halaman Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-mono font-bold text-[11px] text-cyan-300">
                  Halaman {currentPage + 1} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage === totalPages - 1}
                  className="p-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all"
                  title="Halaman Berikutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Dokumen 1 Halaman (F4)
              </span>
            )}

            {/* Notification Badge */}
            {actionSuccess && (
              <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-bold animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{actionSuccess}</span>
              </div>
            )}

            {/* Zoom Controls */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoom <= 0.4}
                className="p-1 text-slate-300 hover:text-white rounded transition-all disabled:opacity-30"
                title="Perkecil"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="px-1.5 py-0.5 font-mono text-[10px] font-bold text-cyan-300 hover:bg-white/10 rounded transition-all"
                title="Reset Zoom 100%"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoom >= 2.5}
                className="p-1 text-slate-300 hover:text-white rounded transition-all disabled:opacity-30"
                title="Perbesar"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              {zoom !== 1 && (
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="p-1 text-slate-400 hover:text-white rounded transition-all ml-0.5"
                  title="Reset"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Main Content Area: High-Res Rendered Page */}
          <div className="flex-1 overflow-auto bg-slate-950/80 p-3 sm:p-6 flex items-start justify-center custom-scrollbar">
            {currentImage ? (
              <div 
                className="relative transition-transform duration-150 ease-out origin-top shadow-2xl rounded-sm overflow-hidden bg-white"
                style={{
                  transform: `scale(${zoom})`,
                  maxWidth: '100%',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentImage}
                  alt={`Pratinjau PDF Halaman ${currentPage + 1}`}
                  className="block w-full h-auto object-contain select-none pointer-events-none"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
                <p className="text-xs font-bold">Sedang memuat pratinjau halaman PDF...</p>
              </div>
            )}
          </div>

          {/* Bottom Action Bar: Buka di Viewer & Unduh PDF */}
          <div className="px-4 py-3 bg-[#0f1124] border-t border-indigo-900/40 flex items-center justify-between sm:justify-end gap-2.5 sm:gap-4">
            <button
              type="button"
              onClick={handleShareClick}
              disabled={isActionLoading !== null}
              className="flex-1 sm:flex-initial sm:min-w-[170px] py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 shadow-md transition-all cursor-pointer"
            >
              {isActionLoading === 'share' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
              <span>Buka di Viewer</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadClick}
              disabled={isActionLoading !== null}
              className="flex-1 sm:flex-initial sm:min-w-[170px] py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 shadow-md transition-all cursor-pointer"
            >
              {isActionLoading === 'download' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Unduh PDF</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
