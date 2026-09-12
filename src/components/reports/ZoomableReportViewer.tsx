import React, { useState, useRef, useEffect, useCallback, ReactNode } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Smartphone, Monitor } from 'lucide-react';

interface ZoomableReportViewerProps {
  children: ReactNode;
  /** Optional custom report container ID for direct access */
  reportId?: string;
  className?: string;
}

export default function ZoomableReportViewer({
  children,
  reportId,
  className = '',
}: ZoomableReportViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Content dimensions (defaults to standard F4 portrait 813x1150)
  const [contentDimensions, setContentDimensions] = useState<{ width: number; height: number }>({ width: 813, height: 1150 });
  const [containerWidth, setContainerWidth] = useState<number>(813);
  const [isPinching, setIsPinching] = useState(false);
  const hasUserInteractedRef = useRef(false);

  // Compute fit zoom on mobile/narrow viewports
  const calculateFitZoom = useCallback((cWidth: number, pWidth: number = 813) => {
    if (cWidth < pWidth) {
      // Leave slight 12-16px margin on mobile for neat, professional framing
      const horizontalPadding = cWidth <= 480 ? 12 : 16;
      const availableWidth = Math.max(cWidth - horizontalPadding, 240);
      const fitZoom = Number((availableWidth / pWidth).toFixed(2));
      return Math.min(Math.max(fitZoom, 0.25), 1.0);
    }
    return 1.0;
  }, []);

  // Initialize zoom so first render on mobile is ALREADY fitted!
  const [zoom, setZoom] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const winWidth = window.innerWidth;
      if (winWidth < 850) {
        const horizontalPadding = winWidth <= 480 ? 12 : 16;
        const fit = (winWidth - horizontalPadding) / 813;
        return Math.min(Math.max(Number(fit.toFixed(2)), 0.25), 1.0);
      }
    }
    return 1;
  });

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

      let pWidth = 813;
      let pHeight = 1150;

      if (contentRef.current) {
        const paper = (contentRef.current.querySelector('.official-report-paper') as HTMLElement) || contentRef.current;
        if (paper) {
          pWidth = paper.offsetWidth || 813;
          pHeight = paper.offsetHeight || 1150;
          setContentDimensions({ width: pWidth, height: pHeight });
        }
      }

      // Auto-fit on initial render or container resize if user hasn't manually customized zoom
      if (!hasUserInteractedRef.current && cWidth > 0) {
        const optimal = calculateFitZoom(cWidth, pWidth);
        setZoom(optimal);
      }
    }
  }, [calculateFitZoom]);

  useEffect(() => {
    updateDimensions();
    const timer = setTimeout(updateDimensions, 60);

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

  // Handle Zoom In (+)
  const handleZoomIn = () => {
    hasUserInteractedRef.current = true;
    setZoom((prev) => Math.min(Number((prev + 0.15).toFixed(2)), 2.0));
  };

  // Handle Zoom Out (-)
  const handleZoomOut = () => {
    hasUserInteractedRef.current = true;
    setZoom((prev) => Math.max(Number((prev - 0.15).toFixed(2)), 0.25));
  };

  // Handle Reset to 100%
  const handleResetZoom = () => {
    hasUserInteractedRef.current = true;
    setZoom(1);
  };

  // Handle Fit to Screen Width (Pas Layar)
  const handleFitWidth = () => {
    if (containerRef.current) {
      const cWidth = containerRef.current.clientWidth;
      const targetWidth = contentDimensions.width || 813;
      const optimal = calculateFitZoom(cWidth, targetWidth);
      setZoom(optimal);
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
        // Double Tap detected: Toggle Fit <-> 100%
        hasUserInteractedRef.current = true;
        if (zoom < 0.95) {
          setZoom(1);
        } else {
          handleFitWidth();
        }
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
        setZoom(Math.min(Math.max(newZoom, 0.25), 2.0));
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      setIsPinching(false);
    }
  };

  const paperWidth = contentDimensions.width || 813;
  const paperHeight = contentDimensions.height || 1150;
  const scaledWidth = Math.round(paperWidth * zoom);
  const scaledHeight = Math.round(paperHeight * zoom);

  return (
    <div className={`w-full flex flex-col items-center ${className}`}>
      {/* Sleek Zoom Control Toolbar */}
      <div 
        className="w-full flex items-center justify-between gap-2 mb-3 px-1 no-print select-none"
        data-html2canvas-ignore="true"
      >
        {/* Left: Quick Mode Buttons */}
        <div className="flex items-center gap-1.5 bg-[#14172f]/90 backdrop-blur-md p-1 rounded-xl border border-indigo-900/50 shadow-md">
          <button
            type="button"
            onClick={handleFitWidth}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${
              zoom < 0.95
                ? 'bg-cyan-500 text-slate-950 shadow-sm font-black'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
            title="Perkecil agar pas 1 layar (Fit Layar)"
            aria-label="Fit Layar"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Pas Layar</span>
          </button>

          <button
            type="button"
            onClick={handleResetZoom}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${
              zoom >= 0.95 && zoom <= 1.05
                ? 'bg-indigo-600 text-white shadow-sm font-black'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
            title="Tampilan ukuran asli (100%)"
            aria-label="Ukuran Asli 100%"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>100%</span>
          </button>
        </div>

        {/* Right: Step Zoom Controls (+, -, %, Reset) */}
        <div className="flex items-center gap-1 bg-[#14172f]/90 backdrop-blur-md p-1 rounded-xl border border-indigo-900/50 shadow-md">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoom <= 0.25}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-all disabled:opacity-30 disabled:pointer-events-none active:scale-95"
            title="Perkecil Tampilan (Zoom Out)"
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          <button
            type="button"
            onClick={handleResetZoom}
            className="px-2 py-1 text-[10px] sm:text-xs font-mono font-black text-cyan-300 hover:bg-white/10 rounded-lg transition-all"
            title="Klik untuk reset ke 100%"
          >
            {Math.round(zoom * 100)}%
          </button>

          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoom >= 2.0}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-all disabled:opacity-30 disabled:pointer-events-none active:scale-95"
            title="Perbesar Tampilan (Zoom In)"
            aria-label="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {zoom !== 1 && (
            <button
              type="button"
              onClick={handleResetZoom}
              className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-white/10 rounded-lg transition-all ml-0.5"
              title="Reset Zoom"
              aria-label="Reset Zoom"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Outer Scrollable & Touch-enabled Viewport */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="w-full flex justify-center items-start overflow-x-auto overflow-y-visible pb-6 px-1 custom-scrollbar transition-all"
        style={{
          touchAction: 'pan-x pan-y pinch-zoom',
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
            transition: isPinching ? 'none' : 'width 0.15s ease-out, height 0.15s ease-out',
          }}
        >
          <div
            ref={contentRef}
            id={reportId}
            className="report-zoom-stage origin-top-left"
            style={{
              width: `${paperWidth}px`,
              minWidth: `${paperWidth}px`,
              maxWidth: `${paperWidth}px`,
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              position: 'absolute',
              top: 0,
              left: 0,
              transition: isPinching ? 'none' : 'transform 0.15s ease-out',
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
