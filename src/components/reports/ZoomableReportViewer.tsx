import React, { useState, useRef, useEffect, useCallback, ReactNode } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Smartphone, 
  Monitor, 
  Minus, 
  Plus, 
  Columns3, 
  FileText, 
  Maximize2 
} from 'lucide-react';

interface ZoomableReportViewerProps {
  children: ReactNode;
  /** Optional custom report container ID for direct access */
  reportId?: string;
  className?: string;
  /** Whether to show the top zoom toolbar (Default: false) */
  showToolbar?: boolean;
  /** Whether to show the bottom-right Word-style floating zoom slider bar (Default: true) */
  showBottomZoomBar?: boolean;
}

export default function ZoomableReportViewer({
  children,
  reportId,
  className = '',
  showToolbar = false,
  showBottomZoomBar = true,
}: ZoomableReportViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Content dimensions (defaults to standard F4 portrait 813x1150)
  const [contentDimensions, setContentDimensions] = useState<{ width: number; height: number }>({ width: 813, height: 1150 });
  const [containerWidth, setContainerWidth] = useState<number>(813);
  const [isPinching, setIsPinching] = useState(false);
  const [isSliding, setIsSliding] = useState(false);
  const [pageCount, setPageCount] = useState<number>(0);
  const hasUserInteractedRef = useRef(false);

  // Compute fit zoom on mobile/narrow viewports
  const calculateFitZoom = useCallback((cWidth: number, pWidth: number = 813) => {
    if (cWidth < pWidth) {
      const horizontalPadding = cWidth <= 480 ? 12 : 16;
      const availableWidth = Math.max(cWidth - horizontalPadding, 240);
      const fitZoom = Number((availableWidth / pWidth).toFixed(2));
      return Math.min(Math.max(fitZoom, 0.20), 1.0);
    }
    return 1.0;
  }, []);

  // Initialize zoom so first render on mobile is fitted, desktop is 100%
  const [zoom, setZoom] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const winWidth = window.innerWidth;
      if (winWidth < 850) {
        const horizontalPadding = winWidth <= 480 ? 12 : 16;
        const fit = (winWidth - horizontalPadding) / 813;
        return Math.min(Math.max(Number(fit.toFixed(2)), 0.20), 1.0);
      }
    }
    return 1.0;
  });

  // Multi-page mode is triggered whenever zoom is under 50% (< 0.50)
  const isMultiPage = zoom < 0.50;

  // Touch tracking for pinch-to-zoom
  const touchStateRef = useRef<{
    initialDist: number;
    initialZoom: number;
    lastTap: number;
  }>({
    initialDist: 0,
    initialZoom: 1,
    lastTap: 0,
  });

  // Measure content & container dimensions
  const updateDimensions = useCallback(() => {
    if (containerRef.current) {
      const cWidth = containerRef.current.clientWidth;
      setContainerWidth(cWidth);

      const isMulti = zoom < 0.50;
      const hasLandscape = Boolean(
        contentRef.current?.querySelector('.f4-page-landscape, [data-orientation="landscape"]')
      );
      // 3 pages side-by-side with 28px gaps: 813 * 3 + 28 * 2 = 2495px ~ 2520px
      const pWidth = isMulti ? 2520 : hasLandscape ? 1248 : 813;

      let pHeight = 1247;
      if (contentRef.current) {
        const pages = contentRef.current.querySelectorAll('.f4-page');
        const count = pages.length;
        if (count > 0) {
          setPageCount(count);
          if (isMulti) {
            const numRows = Math.ceil(count / 3);
            const rowHeight = 1247 + 28;
            pHeight = Math.max(contentRef.current.scrollHeight || 0, numRows * rowHeight + 50);
          } else {
            let totalH = 0;
            pages.forEach((p) => {
              const el = p as HTMLElement;
              totalH += (el.offsetHeight || 1247) + 36;
            });
            pHeight = totalH + 20;
          }
        } else {
          pHeight = contentRef.current.scrollHeight || 1247;
        }
      }

      setContentDimensions({ width: pWidth, height: pHeight });

      // Auto-fit on initial render or resize if user hasn't touched controls
      if (!hasUserInteractedRef.current && cWidth > 0 && !isMulti) {
        const optimal = calculateFitZoom(cWidth, 813);
        setZoom(optimal);
      }
    }
  }, [zoom, calculateFitZoom]);

  useEffect(() => {
    updateDimensions();
    const timer = setTimeout(updateDimensions, 80);

    window.addEventListener('resize', updateDimensions);
    const ro = new ResizeObserver(() => updateDimensions());
    if (containerRef.current) ro.observe(containerRef.current);
    if (contentRef.current) ro.observe(contentRef.current);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateDimensions);
      ro.disconnect();
    };
  }, [updateDimensions]);

  // Update page count when children change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (contentRef.current) {
        const pages = contentRef.current.querySelectorAll('.f4-page');
        setPageCount(pages.length);
        updateDimensions();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [children, updateDimensions]);

  // Handle Zoom In (+)
  const handleZoomIn = () => {
    hasUserInteractedRef.current = true;
    setZoom((prev) => Math.min(Number((prev + 0.05).toFixed(2)), 1.50));
  };

  // Handle Zoom Out (-)
  const handleZoomOut = () => {
    hasUserInteractedRef.current = true;
    setZoom((prev) => Math.max(Number((prev - 0.05).toFixed(2)), 0.20));
  };

  // Handle Reset to 100%
  const handleResetZoom = () => {
    hasUserInteractedRef.current = true;
    setZoom(1.0);
  };

  // Handle Fit to Screen Width (Pas Layar)
  const handleFitWidth = () => {
    hasUserInteractedRef.current = true;
    if (containerRef.current) {
      const cWidth = containerRef.current.clientWidth;
      const optimal = calculateFitZoom(cWidth, 813);
      setZoom(optimal);
    }
  };

  // Toggle between 100% and 45% (Multi-page view)
  const handleToggleMultiPage = () => {
    hasUserInteractedRef.current = true;
    if (zoom < 0.50) {
      setZoom(1.0);
    } else {
      setZoom(0.45);
    }
  };

  // Touch Event Handlers for Pinch to Zoom on Touchscreens
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      setIsPinching(true);
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStateRef.current.initialDist = dist;
      touchStateRef.current.initialZoom = zoom;
    } else if (e.touches.length === 1) {
      const now = Date.now();
      const timeSinceLastTap = now - touchStateRef.current.lastTap;
      if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
        handleToggleMultiPage();
      }
      touchStateRef.current.lastTap = now;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && isPinching) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (touchStateRef.current.initialDist > 0) {
        hasUserInteractedRef.current = true;
        const factor = dist / touchStateRef.current.initialDist;
        const newZoom = Number((touchStateRef.current.initialZoom * factor).toFixed(2));
        setZoom(Math.min(Math.max(newZoom, 0.20), 1.50));
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      setIsPinching(false);
    }
  };

  const paperWidth = isMultiPage ? 2520 : (contentDimensions.width || 813);
  const paperHeight = contentDimensions.height || 1247;
  const scaledWidth = Math.round(paperWidth * zoom);
  const scaledHeight = Math.round(paperHeight * zoom);

  return (
    <div className={`w-full flex flex-col items-center relative ${className}`}>
      {/* Global CSS for switching between Single-Column & Multi-Page (Side-by-Side) */}
      <style jsx global>{`
        .report-multipage-view .official-pages-container {
          display: flex !important;
          flex-direction: row !important;
          flex-wrap: wrap !important;
          justify-content: center !important;
          align-items: flex-start !important;
          gap: 28px !important;
          width: 2520px !important;
          max-width: 2520px !important;
        }
        .report-multipage-view .f4-page {
          margin-left: 0 !important;
          margin-right: 0 !important;
          margin-bottom: 28px !important;
          flex-shrink: 0 !important;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3) !important;
        }
        .report-singlepage-view .official-pages-container {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          width: 100% !important;
          max-width: 100% !important;
        }
        /* Range slider glowing styling */
        .report-zoom-slider::-webkit-slider-thumb {
          appearance: none;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #ffffff;
          box-shadow: 0 0 4px rgba(255, 255, 255, 0.9);
          cursor: pointer;
        }
        .report-zoom-slider::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
        .report-zoom-slider::-moz-range-thumb {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #ffffff;
          box-shadow: 0 0 4px rgba(255, 255, 255, 0.9);
          cursor: pointer;
          border: none;
        }
      `}</style>

      {/* Top Toolbar (Legacy Optional) */}
      {showToolbar && (
        <div 
          className="w-full flex flex-wrap items-center justify-between gap-2 mb-4 px-3 py-2 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-300 shadow-md no-print select-none text-slate-800"
          data-html2canvas-ignore="true"
        >
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
            <button
              type="button"
              onClick={handleFitWidth}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all ${
                zoom < 0.95
                  ? 'bg-emerald-600 text-white shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Pas Layar</span>
            </button>

            <button
              type="button"
              onClick={handleResetZoom}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all ${
                zoom >= 0.95 && zoom <= 1.05
                  ? 'bg-indigo-600 text-white shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>100%</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[11px] font-semibold text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Format Kertas F4 (215 x 330 mm) - Lembar Kerja Resmi</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= 0.20}
              className="p-1.5 text-slate-700 hover:text-slate-950 hover:bg-white rounded-lg transition-all disabled:opacity-30 disabled:pointer-events-none active:scale-95"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleResetZoom}
              className="px-2.5 py-1 text-[11px] sm:text-xs font-mono font-black text-emerald-700 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-all"
            >
              {Math.round(zoom * 100)}%
            </button>

            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= 1.50}
              className="p-1.5 text-slate-700 hover:text-slate-950 hover:bg-white rounded-lg transition-all disabled:opacity-30 disabled:pointer-events-none active:scale-95"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Outer Scrollable & Touch-enabled Viewport */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="w-full flex justify-center items-start overflow-x-auto overflow-y-visible py-8 px-1 sm:px-4 rounded-2xl bg-[#0f1228] border border-indigo-950/40 custom-scrollbar transition-all min-h-[85vh]"
        style={{
          touchAction: 'pan-x pan-y pinch-zoom',
          backgroundColor: '#0f1228',
        }}
      >
        {/* Scaled Wrapper Sized Exactly to Visual Rendered Dimensions */}
        <div
          style={{
            width: `${scaledWidth}px`,
            height: `${scaledHeight}px`,
            position: 'relative',
            flexShrink: 0,
            margin: '0 auto',
            transition: isSliding || isPinching ? 'none' : 'width 0.15s ease-out, height 0.15s ease-out',
          }}
        >
          <div
            ref={contentRef}
            id={reportId}
            className={`report-zoom-stage origin-top-left ${isMultiPage ? 'report-multipage-view' : 'report-singlepage-view'}`}
            style={{
              width: `${paperWidth}px`,
              minWidth: `${paperWidth}px`,
              maxWidth: `${paperWidth}px`,
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              position: 'absolute',
              top: 0,
              left: 0,
              transition: isSliding || isPinching ? 'none' : 'transform 0.15s ease-out, width 0.15s ease-out',
            }}
          >
            {children}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ULTRA-COMPACT WORD/OFFICE ZOOM STATUS BAR DI POJOK KANAN BAWAH           */}
      {/* ========================================================================= */}
      {showBottomZoomBar && (
        <aside 
          className="fixed bottom-2 right-2 sm:bottom-3 sm:right-4 z-40 select-none no-print shadow-lg"
          data-html2canvas-ignore="true"
          aria-label="Kontrol Zoom Laporan Resmi"
        >
          <div className="flex items-center gap-1.5 sm:gap-2 bg-[#121429]/95 backdrop-blur-md border border-slate-700/60 rounded-lg px-2 py-0.5 sm:py-1 shadow-md text-white text-xs">
            
            {/* 3 View Mode Icons (Ultra compact 14px) */}
            <div className="flex items-center gap-0.5">
              {/* Multi-Page Mode (< 50%) */}
              <button
                type="button"
                onClick={() => {
                  hasUserInteractedRef.current = true;
                  setZoom(0.45);
                }}
                className={`p-1 rounded transition-colors ${
                  isMultiPage
                    ? 'text-cyan-300 bg-white/10'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Mode Multi-Halaman Samping (< 50%)"
                aria-label="Mode Multi-Halaman"
              >
                <Columns3 className="w-3.5 h-3.5" />
              </button>

              {/* 100% Print Layout */}
              <button
                type="button"
                onClick={handleResetZoom}
                className={`p-1 rounded transition-colors ${
                  !isMultiPage && zoom >= 0.95 && zoom <= 1.05
                    ? 'text-cyan-300 bg-white/10'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Tata Letak Cetak Asli (100%)"
                aria-label="Ukuran Asli 100%"
              >
                <FileText className="w-3.5 h-3.5" />
              </button>

              {/* Fit Width */}
              <button
                type="button"
                onClick={handleFitWidth}
                className={`p-1 rounded transition-colors ${
                  !isMultiPage && (zoom < 0.95 || zoom > 1.05)
                    ? 'text-cyan-300 bg-white/10'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Pas Lebar Layar"
                aria-label="Pas Layar"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Subtle Divider */}
            <div className="h-3 w-px bg-slate-700 mx-0.5" />

            {/* Zoom Steppers & Ultra-Thin Slider */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              {/* Zoom Out Button (–) */}
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoom <= 0.20}
                className="p-0.5 text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none"
                title="Perkecil Zoom (Zoom Out)"
                aria-label="Zoom Out"
              >
                <Minus className="w-3 h-3" />
              </button>

              {/* Thin Minimal Slider */}
              <div className="relative flex items-center">
                <input
                  type="range"
                  min={20}
                  max={150}
                  step={1}
                  value={Math.round(zoom * 100)}
                  onMouseDown={() => setIsSliding(true)}
                  onMouseUp={() => setIsSliding(false)}
                  onTouchStart={() => setIsSliding(true)}
                  onTouchEnd={() => setIsSliding(false)}
                  onChange={(e) => {
                    hasUserInteractedRef.current = true;
                    setZoom(Number((Number(e.target.value) / 100).toFixed(2)));
                  }}
                  className="report-zoom-slider w-16 sm:w-20 md:w-24 h-1 bg-slate-700/80 rounded-full appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
                  title="Geser untuk mengatur ukuran zoom"
                  aria-label="Slider Ukuran Zoom"
                />
              </div>

              {/* Zoom In Button (+) */}
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoom >= 1.50}
                className="p-0.5 text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none"
                title="Perbesar Zoom (Zoom In)"
                aria-label="Zoom In"
              >
                <Plus className="w-3 h-3" />
              </button>

              {/* Minimal Percentage Text */}
              <button
                type="button"
                onClick={handleToggleMultiPage}
                className="min-w-[32px] text-right text-[11px] font-mono text-slate-300 hover:text-cyan-300 transition-colors ml-0.5 cursor-pointer font-semibold"
                title={isMultiPage ? "Multi-Halaman Aktif (< 50%). Klik untuk kembali ke 100%" : "Klik untuk Multi-Halaman (45%)"}
                aria-label={`Ukuran zoom ${Math.round(zoom * 100)}%`}
              >
                {Math.round(zoom * 100)}%
              </button>
            </div>

          </div>
        </aside>
      )}
    </div>
  );
}
