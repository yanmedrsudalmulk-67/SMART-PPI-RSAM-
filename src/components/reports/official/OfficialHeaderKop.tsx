import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { useAppContext } from '@/components/Providers';

export interface OfficialHeaderKopProps {
  reportTitle?: string;
  periode?: string;
  className?: string;
  showDoubleLine?: boolean;
  theme?: 'dark' | 'light';
}

export default function OfficialHeaderKop({
  reportTitle,
  periode,
  className = '',
  showDoubleLine = true,
  theme = 'dark',
}: OfficialHeaderKopProps) {
  const { hospitalLogoUrl } = useAppContext();
  const isDark = theme === 'dark';

  return (
    <div className={`w-full font-sans ${isDark ? 'text-white' : 'bg-white text-black'} ${className}`}>
      {/* KOP SURAT RESMI RSUD AL-MULK (PERSIS GAMBAR STANDAR DINAS) */}
      <div className={`border-b-[2.5px] pb-2 mb-1 ${isDark ? 'border-white/40' : 'border-black'}`}>
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
              <ShieldCheck className={`w-12 h-12 ${isDark ? 'text-cyan-400' : 'text-black'}`} />
            )}
          </div>

          {/* Text Header Resmi */}
          <div className="text-center">
            <h1 className={`text-sm sm:text-base md:text-lg font-black uppercase tracking-wide leading-tight ${isDark ? 'text-white' : 'text-black'}`}>
              TIM PENCEGAHAN DAN PENGENDALIAN INFEKSI (PPI)
            </h1>
            <h2 className={`text-sm sm:text-base md:text-lg font-black uppercase tracking-wider leading-tight mt-0.5 ${isDark ? 'text-white' : 'text-black'}`}>
              UOBK RSUD AL-MULK KOTA SUKABUMI
            </h2>
            <p className={`text-[10px] sm:text-xs italic mt-0.5 leading-tight ${isDark ? 'text-slate-300' : 'text-black'}`}>
              Jl. Pelabuhan II No. Km.6, Lembursitu, Kec. Lembursitu, Kota Sukabumi, Jawa Barat 43168
            </p>
          </div>
        </div>
      </div>

      {/* Garis batas ganda kop surat standar dinas */}
      {showDoubleLine && (
        <div className={`border-b mb-3 ${isDark ? 'border-white/20' : 'border-black'}`} />
      )}

      {/* Judul & Periode Laporan (Jika Diberikan) */}
      {(reportTitle || periode) && (
        <div className="text-center mt-2.5 mb-2">
          {reportTitle && (
            <h3 className={`text-base sm:text-lg font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
              {reportTitle}
            </h3>
          )}
          {periode && (
            <p className={`text-xs sm:text-sm font-bold uppercase mt-0.5 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
              {periode}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
