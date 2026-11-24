import React, { useRef, useEffect, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Eraser, PenLine } from 'lucide-react';
import { exportBlackSignatureCanvas, ensureBlackSignature } from '@/utils/signatureUtils';

interface ParafPadInputProps {
  value?: string;
  onChange: (dataUrl: string) => void;
  label?: string;
}

/**
 * Compact interactive signature/paraf canvas for 5-party ICRA checklist signoffs.
 * Exports crisp black-ink PNG data URLs that render cleanly on white F4 reports.
 */
export default function ParafPadInput({ value = '', onChange, label = 'Paraf' }: ParafPadInputProps) {
  const sigRef = useRef<SignatureCanvas>(null);
  const [hasDrawn, setHasDrawn] = useState(Boolean(value));
  const lastLoadedRef = useRef<string>('');

  useEffect(() => {
    let active = true;
    const pad = sigRef.current;
    if (!pad) return;

    if (!value) {
      if (lastLoadedRef.current !== '') {
        pad.clear();
        lastLoadedRef.current = '';
      }
      setHasDrawn(false);
      return;
    }

    if (value === lastLoadedRef.current) {
      setHasDrawn(true);
      return;
    }

    ensureBlackSignature(value).then((blackUrl) => {
      if (!active || !sigRef.current) return;
      try {
        sigRef.current.clear();
        sigRef.current.fromDataURL(blackUrl, { width: 280, height: 76 });
        lastLoadedRef.current = value;
        setHasDrawn(true);
      } catch {
        setHasDrawn(Boolean(value));
      }
    });

    return () => {
      active = false;
    };
  }, [value]);

  const handleEnd = () => {
    if (!sigRef.current || sigRef.current.isEmpty()) return;
    const exported = exportBlackSignatureCanvas(sigRef.current.getCanvas());
    lastLoadedRef.current = exported;
    setHasDrawn(true);
    onChange(exported);
  };

  const handleClear = () => {
    sigRef.current?.clear();
    lastLoadedRef.current = '';
    setHasDrawn(false);
    onChange('');
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-indigo-300">
          <PenLine className="w-3 h-3" />
          <span>{label}</span>
        </span>
        {hasDrawn && (
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/35 text-rose-200 text-[10px] font-bold cursor-pointer"
          >
            <Eraser className="w-2.5 h-2.5" />
            <span>Hapus</span>
          </button>
        )}
      </div>

      <div className="relative rounded-lg border border-indigo-400/40 bg-white overflow-hidden h-[76px]">
        {!hasDrawn && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[10px] font-medium text-slate-400">
            Tanda tangan / paraf di sini
          </div>
        )}
        <SignatureCanvas
          ref={sigRef}
          penColor="#000000"
          minWidth={1.1}
          maxWidth={2.4}
          onEnd={handleEnd}
          canvasProps={{
            width: 280,
            height: 76,
            className: 'w-full h-[76px] cursor-crosshair block',
          }}
        />
      </div>
    </div>
  );
}
