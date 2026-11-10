import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { useAppContext } from '@/components/Providers';

export interface OfficialHeaderKopProps {
  reportTitle?: string;
  periode?: string;
  className?: string;
  showDoubleLine?: boolean;
}

export default function OfficialHeaderKop({
  reportTitle,
  periode,
  className = '',
  showDoubleLine = true,
}: OfficialHeaderKopProps) {
  const { hospitalLogoUrl } = useAppContext();

  return (
    <div className={`w-full bg-white text-black font-sans ${className}`}>
      {/* KOP SURAT RESMI RSUD AL-MULK (PERSIS GAMBAR STANDAR DINAS) */}
      <div className="border-b-[2.5px] border-black pb-2 mb-1">
        <div className="flex items-center justify-center gap-4 sm:gap-6 max-w-4xl mx-auto">
          {/* Logo Rumah Sakit */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center">
            {hospitalLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={hospitalLogoUrl}
                alt="Logo RSUD Al-Mulk"
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <ShieldCheck className="w-12 h-12 text-black" />
            )}
          </div>

          {/* Text Header Resmi */}
          <div className="text-center">
            <h1 className="text-sm sm:text-base md:text-lg font-black uppercase tracking-wide leading-tight text-black">
              TIM PENCEGAHAN DAN PENGENDALIAN INFEKSI (PPI)
            </h1>
            <h2 className="text-sm sm:text-base md:text-lg font-black uppercase tracking-wider leading-tight text-black mt-0.5">
              UOBK RSUD AL-MULK KOTA SUKABUMI
            </h2>
            <p className="text-[10px] sm:text-xs text-black italic mt-0.5 leading-tight">
              Jl. Pelabuhan II No. Km.6, Lembursitu, Kec. Lembursitu, Kota Sukabumi, Jawa Barat 43168
            </p>
          </div>
        </div>
      </div>

      {/* Garis batas ganda kop surat standar dinas */}
      {showDoubleLine && <div className="border-b border-black mb-3" />}

      {/* Judul & Periode Laporan (Jika Diberikan) */}
      {(reportTitle || periode) && (
        <div className="text-center mt-2.5 mb-2">
          {reportTitle && (
            <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-black">
              {reportTitle}
            </h3>
          )}
          {periode && (
            <p className="text-xs sm:text-sm font-bold text-slate-700 uppercase mt-0.5">
              {periode}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
