'use client';

import { useRef, useImperativeHandle, forwardRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { User, Eraser } from 'lucide-react';

interface DigitalSignatureSectionProps {
  pjName: string;
  setPjName: (name: string) => void;
  pjLabel?: string;
  supervisorLabel?: string;
}

export interface DigitalSignatureRef {
  getPjSignature: () => string | null;
  getSupervisorSignature: () => string | null;
  clearAll: () => void;
}

const DigitalSignatureSection = forwardRef<DigitalSignatureRef, DigitalSignatureSectionProps>(
  ({ pjName, setPjName, pjLabel = 'PJ RUANGAN', supervisorLabel = 'IPCN / IPCLN (SUPERVISOR)' }, ref) => {
    const sigPadPJ = useRef<SignatureCanvas>(null);
    const sigPadSupervisor = useRef<SignatureCanvas>(null);

    useImperativeHandle(ref, () => ({
      getPjSignature: () => {
        if (sigPadPJ.current && !sigPadPJ.current.isEmpty()) {
          return sigPadPJ.current.getCanvas().toDataURL('image/png');
        }
        return null;
      },
      getSupervisorSignature: () => {
        if (sigPadSupervisor.current && !sigPadSupervisor.current.isEmpty()) {
          return sigPadSupervisor.current.getCanvas().toDataURL('image/png');
        }
        return null;
      },
      clearAll: () => {
        sigPadPJ.current?.clear();
        sigPadSupervisor.current?.clear();
      }
    }));

    return (
      <div className="glass-card p-6 sm:p-8 rounded-[2rem] border-white/5 shadow-2xl space-y-8 bg-gradient-to-br from-navy-light/50 to-navy-dark/50 backdrop-blur-xl relative overflow-hidden group">
        {/* Glow effect */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 blur-[100px] rounded-full group-hover:bg-blue-500/20 transition-all duration-700" />
        
        <div className="relative z-10">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-8 flex items-center gap-3">
            <div className="w-2 h-8 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.5)]" />
            Verifikasi Digital
          </h2>

          <div className="space-y-6">
            {/* Input Nama PJ */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2 pl-1">
                NAMA PJ RUANGAN
              </label>
              <div className="relative group/input">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-slate-500 group-focus-within/input:text-blue-400 transition-colors" />
                </div>
                <input
                  type="text"
                  value={pjName}
                  onChange={(e) => setPjName(e.target.value)}
                  placeholder="Ketik nama PJ ruangan"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Area Tanda Tangan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Kolom 1: PJ Ruangan */}
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500/80">
                    {pjLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() => sigPadPJ.current?.clear()}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    <Eraser className="w-3 h-3" />
                    CLEAR
                  </button>
                </div>
                <div className="relative rounded-[1.5rem] border border-white/10 bg-navy-dark/40 overflow-hidden h-[160px] group/pad hover:border-blue-500/30 transition-all shadow-inner backdrop-blur-md">
                   <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03]">
                    <span className="text-xl font-black uppercase tracking-tighter select-none">Tanda Tangan Di Sini</span>
                  </div>
                  <SignatureCanvas
                    ref={sigPadPJ}
                    penColor="#3b82f6"
                    canvasProps={{
                      className: 'sigCanvas w-full h-full cursor-crosshair relative z-10 touch-none',
                    }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent opacity-0 group-hover/pad:opacity-100 transition-opacity" />
                </div>
              </div>

              {/* Kolom 2: IPCN / Supervisor */}
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500/80">
                    {supervisorLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() => sigPadSupervisor.current?.clear()}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    <Eraser className="w-3 h-3" />
                    CLEAR
                  </button>
                </div>
                <div className="relative rounded-[1.5rem] border border-white/10 bg-navy-dark/40 overflow-hidden h-[160px] group/pad hover:border-blue-500/30 transition-all shadow-inner backdrop-blur-md">
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03]">
                    <span className="text-xl font-black uppercase tracking-tighter select-none">Tanda Tangan Di Sini</span>
                  </div>
                  <SignatureCanvas
                    ref={sigPadSupervisor}
                    penColor="#3b82f6"
                    canvasProps={{
                      className: 'sigCanvas w-full h-full cursor-crosshair relative z-10 touch-none',
                    }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent opacity-0 group-hover/pad:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

DigitalSignatureSection.displayName = 'DigitalSignatureSection';

export default DigitalSignatureSection;
