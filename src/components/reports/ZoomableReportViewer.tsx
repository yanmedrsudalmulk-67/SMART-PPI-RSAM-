import React, { useState, useRef, useEffect, useCallback, ReactNode } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Smartphone,
  Monitor,
  Minus,
  Plus,
  LayoutGrid,
  FileText,
  Maximize2,
} from 'lucide-react';

type ReportViewMode = 'two-page' | 'single' | 'fit';

interface ZoomableReportViewerProps {
  children: ReactNode;
  /** Optional custom report container ID for direct access */
  reportId?: string;
  className?: string;
  /** Whether to show the top zoom toolbar (Default: false) */
  showToolbar?: boolean;
  /** Whether to show the right-edge vertical zoom & view-mode control bar (Default: true) */
  showBottomZoomBar?: boolean;
  /** Preferred initial view mode on wide screens with >= 2 pages (Default: 'two-page') */
  defaultViewMode?: ReportViewMode;
}

const MIN_ZOOM = 0.20;
const MAX_ZOOM = 1.50;
const TWO_PAGE_STAGE_WIDTH = 1656; // 813 * 2 + 28px gap + 2px safety
const SINGLE_PAGE_WIDTH = 813;

export default function ZoomableReportViewer({
  children,
  reportId,
  className = '',
  showToolbar = false,
  showBottomZoomBar = true,
  defaultViewMode = 'two-page',
}: ZoomableReportViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const sliderTrackRef = useRef<HTMLDivElement>(null);

  // Content dimensions (defaults to standard F4 portrait)
  const [contentDimensions, setContentDimensions] = useState<{ width: number; height: number }>({
    width: SINGLE_PAGE_WIDTH,
    height: 1247,
  });
  const [isPinching, setIsPinching] = useState(false);
  const [isSliding, setIsSliding] = useState(false);
  const [pageCount, setPageCount] = useState<number>(0);
  const [isWideViewport, setIsWideViewport] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 900 : true
  );
  const [viewMode, setViewMode] = useState<ReportViewMode>(() =>
    typeof window !== 'undefined' && window.innerWidth >= 900 ? defaultViewMode : 'fit'
  );
  const hasUserInteractedRef = useRef(false);

  // Compute fit zoom for any target stage width cleanly leaving room for right-edge floating control bar
  const calculateFitZoom = useCallback((cWidth: number, stageWidth: number = SINGLE_PAGE_WIDTH) => {
    if (cWidth <= 0) return 1.0;
    const isDesktop = cWidth >= 760;
    const horizontalAllowance = isDesktop ? 88 : 20;
    const availableWidth = Math.max(cWidth - horizontalAllowance, 240);
    if (availableWidth < stageWidth || stageWidth > SINGLE_PAGE_WIDTH) {
      const fitZoom = Number((availableWidth / stageWidth).toFixed(2));
      return Math.min(Math.max(fitZoom, MIN_ZOOM), 1.0);
    }
    return 1.0;
  }, []);

  // Initialize zoom so first render fits smoothly
  const [zoom, setZoom] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const winWidth = window.innerWidth;
      if (winWidth < 900) {
        const fit = (winWidth - 24) / SINGLE_PAGE_WIDTH;
        return Math.min(Math.max(Number(fit.toFixed(2)), MIN_ZOOM), 1.0);
      }
      const approxStage = defaultViewMode === 'two-page' ? TWO_PAGE_STAGE_WIDTH : SINGLE_PAGE_WIDTH;
      const avail = Math.max(winWidth - 360, 400);
      const fit = avail / approxStage;
      return Math.min(Math.max(Number(fit.toFixed(2)), MIN_ZOOM), 1.0);
    }
    return 0.56;
  });

  // Touch tracking for pinch-to-zoom
  const touchStateRef = useRef<{
    initialDist: number;
    initialZoom: number;
  }>({
    initialDist: 0,
    initialZoom: 1,
  });

  // Measure content & container dimensions
  const updateDimensions = useCallback(() => {
    if (!containerRef.current) return;
    const cWidth = containerRef.current.clientWidth;
    const wide = typeof window !== 'undefined' ? window.innerWidth >= 900 : cWidth >= 820;
    setIsWideViewport(wide);

    const pages = contentRef.current ? contentRef.current.querySelectorAll('.f4-page') : null;
    const count = pages ? pages.length : 0;
    if (count !== pageCount) {
      setPageCount(count);
    }

    // Active multi-page (2 pages side-by-side) when enabled, screen is wide enough, and there are >= 2 pages
    const activeTwoPage =
      viewMode === 'two-page' && wide && count >= 2;

    const hasLandscape = Boolean(
      contentRef.current?.querySelector('.f4-page-landscape, [data-orientation="landscape"]')
    );

    const pWidth = activeTwoPage
      ? TWO_PAGE_STAGE_WIDTH
      : hasLandscape
      ? 1248
      : SINGLE_PAGE_WIDTH;

    let pHeight = 1247;
    if (contentRef.current) {
      if (pages && count > 0) {
        if (activeTwoPage) {
          let rowSum = 0;
          const pageArr = Array.from(pages) as HTMLElement[];
          for (let idx = 0; idx < pageArr.length; ) {
            const cur = pageArr[idx];
            const curLandscape =
              cur.classList.contains('f4-page-landscape') ||
              cur.getAttribute('data-orientation') === 'landscape';
            const curH = cur.offsetHeight || 1247;
            if (curLandscape || idx + 1 >= pageArr.length) {
              rowSum += curH + 28;
              idx += 1;
            } else {
              const nxt = pageArr[idx + 1];
              const nxtLandscape =
                nxt.classList.contains('f4-page-landscape') ||
                nxt.getAttribute('data-orientation') === 'landscape';
              if (nxtLandscape) {
                rowSum += curH + 28;
                idx += 1;
              } else {
                const nxtH = nxt.offsetHeight || 1247;
                rowSum += Math.max(curH, nxtH) + 28;
                idx += 2;
              }
            }
          }
          pHeight = Math.max(contentRef.current.scrollHeight || 0, rowSum + 24);
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

    // Auto-fit cleanly on load/resize before user overrides zoom manually
    if (!hasUserInteractedRef.current && cWidth > 0) {
      if (wide && count >= 2 && defaultViewMode === 'two-page') {
        if (viewMode !== 'two-page') setViewMode('two-page');
        setZoom(calculateFitZoom(cWidth, TWO_PAGE_STAGE_WIDTH));
      } else {
        if (!wide && viewMode === 'two-page') setViewMode('fit');
        setZoom(calculateFitZoom(cWidth, hasLandscape ? 1248 : SINGLE_PAGE_WIDTH));
      }
    }
  }, [viewMode, pageCount, defaultViewMode, calculateFitZoom]);

  useEffect(() => {
    updateDimensions();
    const timer = setTimeout(updateDimensions, 80);
    const timer2 = setTimeout(updateDimensions, 260);

    window.addEventListener('resize', updateDimensions);
    const ro = new ResizeObserver(() => updateDimensions());
    if (containerRef.current) ro.observe(containerRef.current);
    if (contentRef.current) ro.observe(contentRef.current);

    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
      window.removeEventListener('resize', updateDimensions);
      ro.disconnect();
    };
  }, [updateDimensions]);

  // Update page count when children change
  useEffect(() => {
    const timer = setTimeout(() => {
      updateDimensions();
    }, 100);
    return () => clearTimeout(timer);
  }, [children, updateDimensions]);

  // Handle Zoom In (+)
  const handleZoomIn = () => {
    hasUserInteractedRef.current = true;
    setZoom((prev) => Math.min(Number((prev + 0.05).toFixed(2)), MAX_ZOOM));
  };

  // Handle Zoom Out (-)
  const handleZoomOut = () => {
    hasUserInteractedRef.current = true;
    setZoom((prev) => Math.max(Number((prev - 0.05).toFixed(2)), MIN_ZOOM));
  };

  // Mode 1: Two-page Side-by-Side (2 Halaman Berdampingan)
  const handleSetTwoPage = () => {
    hasUserInteractedRef.current = true;
    setViewMode('two-page');
    if (containerRef.current) {
      setZoom(calculateFitZoom(containerRef.current.clientWidth, TWO_PAGE_STAGE_WIDTH));
    } else {
      setZoom(0.56);
    }
  };

  // Mode 2: 100% Original Print Layout (1 Halaman Asli)
  const handleResetZoom = () => {
    hasUserInteractedRef.current = true;
    setViewMode('single');
    setZoom(1.0);
  };

  // Mode 3: Fit Single Page Width (1 Halaman Pas Layar)
  const handleFitWidth = () => {
    hasUserInteractedRef.current = true;
    setViewMode('fit');
    if (containerRef.current) {
      const hasLandscape = Boolean(
        contentRef.current?.querySelector('.f4-page-landscape, [data-orientation="landscape"]')
      );
      setZoom(
        calculateFitZoom(
          containerRef.current.clientWidth,
          hasLandscape ? 1248 : SINGLE_PAGE_WIDTH
        )
      );
    }
  };

  // Toggle between 2-Page Spread and 100% Single Page when clicking percentage readout
  const handleToggleTwoPageOrSingle = () => {
    hasUserInteractedRef.current = true;
    if (isWideViewport && pageCount >= 2) {
      if (viewMode === 'two-page') {
        handleResetZoom();
      } else {
        handleSetTwoPage();
      }
    } else if (zoom >= 0.95) {
      handleFitWidth();
    } else {
      handleResetZoom();
    }
  };

  // Vertical Slider Pointer Logic (Bottom = MIN_ZOOM 20%, Top = MAX_ZOOM 150%)
  const updateZoomFromPointerY = useCallback((clientY: number) => {
    const track = sliderTrackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    if (rect.height <= 0) return;
    const ratioFromBottom = 1 - Math.max(0, Math.min(clientY - rect.top, rect.height)) / rect.height;
    const nextZoom = Number((MIN_ZOOM + ratioFromBottom * (MAX_ZOOM - MIN_ZOOM)).toFixed(2));
    hasUserInteractedRef.current = true;
    setZoom(Math.min(Math.max(nextZoom, MIN_ZOOM), MAX_ZOOM));
  }, []);

  const handleSliderPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsSliding(true);
    updateZoomFromPointerY(e.clientY);
  };

  const handleSliderPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isSliding) return;
    updateZoomFromPointerY(e.clientY);
  };

  const handleSliderPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isSliding) return;
    setIsSliding(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
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
        setZoom(Math.min(Math.max(newZoom, MIN_ZOOM), MAX_ZOOM));
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      setIsPinching(false);
    }
  };

  const isTwoPage = viewMode === 'two-page' && isWideViewport && pageCount >= 2;
  const paperWidth = isTwoPage ? TWO_PAGE_STAGE_WIDTH : contentDimensions.width || SINGLE_PAGE_WIDTH;
  const paperHeight = contentDimensions.height || 1247;
  const scaledWidth = Math.round(paperWidth * zoom);
  const scaledHeight = Math.round(paperHeight * zoom);
  const sliderPercent = Math.round(((zoom - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM)) * 100);

  return (
    <div className={`w-full flex flex-col items-center relative ${className}`}>
      {/* Global CSS for switching between 1-Page Vertical & 2-Page Book Spread Side-by-Side */}
      <style jsx global>{`
        .report-twopage-view .official-pages-container,
        .report-twopage-view [data-orientation='portrait'].flex-col {
          display: flex !important;
          flex-direction: row !important;
          flex-wrap: wrap !important;
          justify-content: center !important;
          align-items: flex-start !important;
          gap: 28px !important;
          width: 1656px !important;
          max-width: 1656px !important;
          margin-left: auto !important;
          margin-right: auto !important;
        }
        .report-twopage-view .f4-page {
          margin-left: 0 !important;
          margin-right: 0 !important;
          margin-bottom: 0 !important;
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
                viewMode === 'fit'
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
                viewMode === 'single'
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
              disabled={zoom <= MIN_ZOOM}
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
              disabled={zoom >= MAX_ZOOM}
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
        className="w-full flex justify-center items-start overflow-x-auto overflow-y-visible py-7 px-2 sm:pl-4 sm:pr-14 rounded-2xl bg-[#0f1228] border border-indigo-950/40 custom-scrollbar transition-all min-h-[85vh]"
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
            className={`report-zoom-stage origin-top-left ${
              isTwoPage ? 'report-twopage-view' : 'report-singlepage-view'
            }`}
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
      {/* FLOATING VERTICAL ZOOM & VIEW-MODE CONTROL BAR AT MIDDLE-RIGHT EDGE       */}
      {/* ========================================================================= */}
      {showBottomZoomBar && (
        <aside
          className="fixed right-2.5 sm:right-4 bottom-24 md:bottom-auto md:top-1/2 md:-translate-y-1/2 z-40 select-none no-print"
          data-html2canvas-ignore="true"
          aria-label="Kontrol Tampilan dan Zoom Laporan"
        >
          <div className="flex flex-col items-center gap-1.5 bg-white/95 border border-slate-200/90 rounded-full px-1.5 py-2.5 shadow-[0_8px_28px_rgba(0,0,0,0.45)] text-slate-600 w-[42px] sm:w-[44px]">
            {/* View Mode Icons */}
            {pageCount >= 2 && (
              <button
                type="button"
                onClick={handleSetTwoPage}
                className={`hidden md:flex items-center justify-center w-7 h-7 rounded-full transition-all cursor-pointer ${
                  isTwoPage
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="Tampilan 2 Halaman Berdampingan"
                aria-label="Tampilan 2 Halaman Berdampingan"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={handleResetZoom}
              className={`flex items-center justify-center w-7 h-7 rounded-full transition-all cursor-pointer ${
                !isTwoPage && viewMode === 'single'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="1 Halaman Ukuran Asli (100%)"
              aria-label="1 Halaman Ukuran Asli 100%"
            >
              <FileText className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleFitWidth}
              className={`flex items-center justify-center w-7 h-7 rounded-full transition-all cursor-pointer ${
                !isTwoPage && viewMode === 'fit'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="Pas Lebar Layar"
              aria-label="Pas Lebar Layar"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            <div className="w-5 h-px bg-slate-200 my-0.5" />

            {/* Zoom In (+) */}
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= MAX_ZOOM}
              className="flex items-center justify-center w-7 h-7 rounded-full text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="Perbesar Tampilan"
              aria-label="Perbesar Zoom"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2.4} />
            </button>

            {/* Cross-Browser Vertical Slider Track */}
            <div
              ref={sliderTrackRef}
              role="slider"
              tabIndex={0}
              aria-label="Slider Pengatur Ukuran Zoom Laporan"
              aria-valuemin={20}
              aria-valuemax={150}
              aria-valuenow={Math.round(zoom * 100)}
              onPointerDown={handleSliderPointerDown}
              onPointerMove={handleSliderPointerMove}
              onPointerUp={handleSliderPointerUp}
              onPointerCancel={handleSliderPointerUp}
              onKeyDown={(e) => {
                if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
                  e.preventDefault();
                  handleZoomIn();
                } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
                  e.preventDefault();
                  handleZoomOut();
                }
              }}
              className="relative w-7 h-24 sm:h-28 flex items-center justify-center cursor-pointer touch-none focus:outline-none"
              title="Geser ke atas/bawah untuk memperbesar atau memperkecil laporan"
            >
              <div className="relative w-[3px] h-full rounded-full bg-slate-200 overflow-visible">
                <div
                  className="absolute bottom-0 inset-x-0 rounded-full bg-emerald-600"
                  style={{ height: `${Math.max(0, Math.min(sliderPercent, 100))}%` }}
                />
                <div
                  className={`absolute left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-emerald-600 border-2 border-white shadow-[0_1px_5px_rgba(5,150,105,0.65)] transition-transform ${
                    isSliding ? 'scale-125' : 'hover:scale-110'
                  }`}
                  style={{ bottom: `calc(${Math.max(0, Math.min(sliderPercent, 100))}% - 7px)` }}
                />
              </div>
            </div>

            {/* Zoom Out (-) */}
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= MIN_ZOOM}
              className="flex items-center justify-center w-7 h-7 rounded-full text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="Perkecil Tampilan"
              aria-label="Perkecil Zoom"
            >
              <Minus className="w-3.5 h-3.5" strokeWidth={2.4} />
            </button>

            <div className="w-5 h-px bg-slate-200 my-0.5" />

            {/* Live Percentage Readout */}
            <button
              type="button"
              onClick={handleToggleTwoPageOrSingle}
              className="w-full py-0.5 text-center text-[10px] font-bold text-slate-700 hover:text-emerald-700 transition-colors cursor-pointer tabular-nums"
              title={
                isTwoPage
                  ? 'Mode 2 Halaman aktif. Klik untuk beralih ke 100%'
                  : 'Klik untuk beralih antara 2 Halaman & 100%'
              }
              aria-label={`Ukuran zoom ${Math.round(zoom * 100)}%`}
            >
              {Math.round(zoom * 100)}%
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}
