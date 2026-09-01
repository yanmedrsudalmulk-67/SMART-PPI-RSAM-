'use client';

import { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Eraser, Check } from 'lucide-react';

interface SignaturePadProps {
  label: string;
  onSave: (signatureDataUrl: string | null) => void;
  defaultValue?: string | null;
}

const toWhiteSignature = (dataUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    if (!dataUrl || typeof dataUrl !== 'string') {
      return resolve(dataUrl);
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width || 300;
        canvas.height = img.height || 150;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(dataUrl);

        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imgData.data;

        for (let i = 0; i < d.length; i += 4) {
          const alpha = d[i + 3];
          if (alpha > 10) {
            d[i] = 255;     // R
            d[i + 1] = 255; // G
            d[i + 2] = 255; // B
          }
        }

        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (e) {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
};

export default function SignaturePad({ label, onSave, defaultValue }: SignaturePadProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(!defaultValue);

  useEffect(() => {
    if (defaultValue && sigCanvas.current) {
      toWhiteSignature(defaultValue).then((whiteSig) => {
        if (sigCanvas.current) {
          sigCanvas.current.clear();
          sigCanvas.current.fromDataURL(whiteSig);
          requestAnimationFrame(() => {
            setIsEmpty(false);
          });
        }
      });
    }
  }, [defaultValue]);

  const clear = () => {
    sigCanvas.current?.clear();
    setIsEmpty(true);
    onSave(null);
  };

  const handleEnd = () => {
    if (sigCanvas.current?.isEmpty()) {
      setIsEmpty(true);
      onSave(null);
    } else {
      setIsEmpty(false);
      // Fallback to getCanvas() if getTrimmedCanvas() causes issues with trim-canvas dependency
      const canvas = sigCanvas.current?.getCanvas();
      onSave(canvas ? canvas.toDataURL('image/png') : null);
    }
  };

  return (
    <div className="space-y-3" id="signature-pad-container">
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">{label}</label>
        <div className="flex items-center gap-2">
          {!isEmpty && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
              <Check className="w-3 h-3" /> Signed
            </span>
          )}
          <button
            id="clear-signature-btn"
            type="button"
            onClick={clear}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-400 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg transition-colors"
          >
            <Eraser className="w-3 h-3" />
            Clear
          </button>
        </div>
      </div>
      
      <div className="relative rounded-2xl border-2 border-dashed border-white/10 bg-white/5 overflow-hidden group hover:border-blue-500/30 transition-colors">
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-20">
          <span className="text-xl font-heading font-black text-slate-600 select-none">Tanda Tangan Di Sini</span>
        </div>
        <SignatureCanvas 
          ref={sigCanvas}
          onEnd={handleEnd}
          penColor="#ffffff"
          canvasProps={{
            className: "w-full h-40 cursor-crosshair relative z-10 touch-none",
            style: { width: '100%', height: '160px' }
          }}
        />
        {!isEmpty && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500/0 via-blue-500/50 to-blue-500/0" />
        )}
      </div>
    </div>
  );
}
