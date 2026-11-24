import React, { useRef, useEffect, useState, useCallback } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Eraser, PenLine, RotateCcw } from 'lucide-react';
import { exportBlackSignatureCanvas } from '@/utils/signatureUtils';

interface ParafPadInputProps {
  value?: string;
  onChange: (dataUrl: string) => void;
  label?: string;
}

/**
 * Converts a black-ink PNG data URL / image URL into crisp white ink
 * for clean preview against dark navy UI surfaces.
 */
function toWhiteInkPreview(src: string): Promise<string> {
  return new Promise((resolve) => {
    if (!src || typeof window === 'undefined') return resolve(src || '');
    const img = new Image();
    if (src.startsWith('http')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      try {
        const w = img.naturalWidth || img.width || 240;
        const h = img.naturalHeight || img.height || 80;
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return resolve(src);

        ctx.drawImage(img, 0, 0, w, h);
        const imgData = ctx.getImageData(0, 0, w, h);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          if (d[i + 3] > 10) {
            d[i] = 255;
            d[i + 1] = 255;
            d[i + 2] = 255;
          }
        }
        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(src);
      }
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
}

/**
 * High-precision responsive signature/paraf canvas for ICRA 5-party signoffs.
 * Syncs canvas internal pixel grid 1:1 with actual CSS container dimensions & DPR,
 * renders bright white ink on dark navy background while signing, and exports
 * trimmed pure black-ink PNG data URLs for white F4 official reports.
 */
export default function ParafPadInput({ value = '', onChange, label = 'Paraf' }: ParafPadInputProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sigRef = useRef<SignatureCanvas>(null);
  const internalExportRef = useRef<string>('');
  const lastSizeRef = useRef<{ width: number; height: number; dpr: number }>({
    width: 0,
    height: 0,
    dpr: 1,
  });

  // If value already came from external source (DB / preloaded), show clean preview until user redraws
  const [isDrawingMode, setIsDrawingMode] = useState<boolean>(() => !value);
  const [hasInk, setHasInk] = useState<boolean>(Boolean(value));
  const [whitePreview, setWhitePreview] = useState<string>('');

  // Respond only to EXTERNAL value changes (project load, sheet switch, reset)
  useEffect(() => {
    if (value === internalExportRef.current) {
      return;
    }

    if (!value) {
      internalExportRef.current = '';
      setWhitePreview('');
      setHasInk(false);
      setIsDrawingMode(true);
      sigRef.current?.clear();
      return;
    }

    let cancelled = false;
    setIsDrawingMode(false);
    setHasInk(true);
    toWhiteInkPreview(value).then((whiteUrl) => {
      if (!cancelled) setWhitePreview(whiteUrl);
    });
    return () => {
      cancelled = true;
    };
  }, [value]);

  // Calibrate canvas pixel resolution 1:1 with container CSS box & devicePixelRatio
  const syncCanvasDimensions = useCallback(() => {
    const container = containerRef.current;
    const sigComponent = sigRef.current;
    if (!container || !sigComponent) return;

    const cssWidth = Math.round(container.clientWidth);
    const cssHeight = Math.round(container.clientHeight);
    if (cssWidth <= 0 || cssHeight <= 0) return;

    const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 1), 2);
    const prev = lastSizeRef.current;
    if (prev.width === cssWidth && prev.height === cssHeight && prev.dpr === dpr) {
      return;
    }

    const canvas = sigComponent.getCanvas();
    const pad = sigComponent.getSignaturePad();
    const savedStrokes = !pad.isEmpty() ? pad.toData() : null;

    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    lastSizeRef.current = { width: cssWidth, height: cssHeight, dpr };

    if (savedStrokes && savedStrokes.length > 0) {
      pad.clear();
      pad.fromData(savedStrokes);
    }
  }, []);

  useEffect(() => {
    if (!isDrawingMode) return;
    const container = containerRef.current;
    if (!container) return;

    // Initial calibration across mount + modal animation settle frame
    const rafId = requestAnimationFrame(syncCanvasDimensions);
    const settleTimer = window.setTimeout(syncCanvasDimensions, 220);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        syncCanvasDimensions();
      });
      observer.observe(container);
    }

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(settleTimer);
      observer?.disconnect();
    };
  }, [isDrawingMode, syncCanvasDimensions]);

  const handleBegin = () => {
    syncCanvasDimensions();
    setHasInk(true);
  };

  const handleEnd = () => {
    const sig = sigRef.current;
    if (!sig || sig.isEmpty()) return;

    let targetCanvas: HTMLCanvasElement;
    try {
      targetCanvas = sig.getTrimmedCanvas();
      if (targetCanvas.width === 0 || targetCanvas.height === 0) {
        targetCanvas = sig.getCanvas();
      }
    } catch {
      targetCanvas = sig.getCanvas();
    }

    const exportedBlack = exportBlackSignatureCanvas(targetCanvas);
    internalExportRef.current = exportedBlack;
    setHasInk(true);
    onChange(exportedBlack);
  };

  const handleClearOrRedraw = () => {
    internalExportRef.current = '';
    setWhitePreview('');
    setHasInk(false);
    setIsDrawingMode(true);
    lastSizeRef.current = { width: 0, height: 0, dpr: 1 };
    sigRef.current?.clear();
    onChange('');
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-indigo-300">
          <PenLine className="w-3 h-3" />
          <span>{label}</span>
        </span>
        {(hasInk || !isDrawingMode) && (
          <button
            type="button"
            onClick={handleClearOrRedraw}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/20 hover:bg-rose-500/35 border border-rose-400/30 text-rose-200 text-[10px] font-bold cursor-pointer transition-colors"
          >
            {isDrawingMode ? <Eraser className="w-2.5 h-2.5" /> : <RotateCcw className="w-2.5 h-2.5" />}
            <span>{isDrawingMode ? 'Hapus' : 'Ubah / Hapus'}</span>
          </button>
        )}
      </div>

      <div
        ref={containerRef}
        className="relative w-full h-[96px] rounded-xl border border-indigo-400/40 focus-within:border-cyan-400/80 hover:border-indigo-300/60 bg-[#080a1c] overflow-hidden shadow-inner transition-colors"
      >
        {isDrawingMode ? (
          <>
            {!hasInk && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[11px] font-medium text-slate-400/80 select-none">
                Goreskan tanda tangan / paraf di sini
              </div>
            )}
            <SignatureCanvas
              ref={sigRef}
              penColor="#ffffff"
              minWidth={1.3}
              maxWidth={2.6}
              minDistance={1}
              throttle={0}
              velocityFilterWeight={0.55}
              dotSize={2}
              clearOnResize={false}
              onBegin={handleBegin}
              onEnd={handleEnd}
              canvasProps={{
                className: 'w-full h-full cursor-crosshair block touch-none select-none',
              }}
            />
          </>
        ) : (
          <button
            type="button"
            onClick={handleClearOrRedraw}
            title="Klik untuk menggambar ulang paraf"
            className="w-full h-full flex flex-col items-center justify-center p-2 cursor-pointer group hover:bg-white/[0.03] transition-colors"
          >
            {whitePreview ? (
              <img
                src={whitePreview}
                alt={label}
                className="max-h-[68px] max-w-[90%] object-contain pointer-events-none select-none"
              />
            ) : (
              <span className="text-[11px] text-slate-400">Paraf tersimpan</span>
            )}
            <span className="text-[9px] font-semibold text-indigo-300/60 group-hover:text-cyan-300 mt-0.5 transition-colors">
              Klik untuk ubah paraf
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
