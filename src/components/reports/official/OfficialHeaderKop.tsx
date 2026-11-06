import React from 'react';
import Image from 'next/image';
import { useAppContext } from '@/components/Providers';

export default function OfficialHeaderKop({
  documentTitle = 'TIM PENCEGAHAN DAN PENGENDALIAN INFEKSI (PPI)',
  subTitle = 'UOBK RSUD AL-MULK KOTA SUKABUMI',
}: {
  documentTitle?: string;
  subTitle?: string;
}) {
  const { hospitalLogoUrl } = useAppContext();

  return (
    <div className="w-full pb-3 mb-6 border-b-2 border-black">
      <div className="flex items-center justify-between gap-4">
        {/* Logo Pemkot / RSUD */}
        <div className="w-20 h-20 flex-shrink-0 flex items-center justify-center">
          {hospitalLogoUrl ? (
            <img 
              src={hospitalLogoUrl} 
              alt="Logo RSUD Al-Mulk" 
              className="max-h-20 max-w-20 object-contain"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-2xl">
              +
            </div>
          )}
        </div>

        {/* Text Header Resmi Kop Surat */}
        <div className="flex-1 text-center font-calibri text-black leading-tight">
          <p className="text-xs sm:text-sm font-bold tracking-wider uppercase text-slate-800">
            PEMERINTAH KOTA SUKABUMI
          </p>
          <p className="text-xs sm:text-sm font-bold tracking-wider uppercase text-slate-800">
            DINAS KESEHATAN
          </p>
          <h2 className="text-base sm:text-lg font-black tracking-wide uppercase text-black mt-0.5">
            {subTitle}
          </h2>
          <p className="text-[10px] sm:text-[11px] text-slate-700 mt-1">
            Jl. Pelabuhan II Km. 6 No. 273 Lembursitu, Kota Sukabumi, Jawa Barat 43169
          </p>
          <p className="text-[10px] sm:text-[11px] text-slate-700">
            Telepon: (0266) 6243088 | WhatsApp: 0858-6434-4464 | Email: rsud.almulk@sukabumikota.go.id
          </p>
          <div className="mt-1 font-bold text-xs uppercase tracking-wide text-emerald-800">
            {documentTitle}
          </div>
        </div>

        {/* Logo PPI / Akreditasi Right Placeholder */}
        <div className="w-20 h-20 flex-shrink-0 hidden sm:flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border border-slate-300 p-1 flex items-center justify-center bg-slate-50">
            <span className="text-[10px] font-black text-emerald-700 text-center leading-tight">
              TIM<br/>PPI
            </span>
          </div>
        </div>
      </div>
      {/* Garis Ganda Standar Kop Surat Resmi */}
      <div className="w-full mt-3 h-[1px] bg-black" />
    </div>
  );
}
