import React from 'react';

export interface ReportCoverProps {
  reportType?: 'monthly' | 'quarterly' | 'semester' | 'annual' | 'icra';
  title?: string;
  subtitle?: string;
  periodText?: string;
  year?: string | number;
  documentNumber?: string;
  hospitalText?: string;
}

export default function ReportCover({
  reportType,
  title,
  subtitle,
  periodText,
  year = '2026',
  hospitalText = 'UOBK RSUD AL-MULK KOTA SUKABUMI',
}: ReportCoverProps) {
  const displayYear = String(year);

  // Auto-detect report type if not explicitly supplied
  const detectedType: 'monthly' | 'quarterly' | 'semester' | 'annual' | 'icra' =
    reportType ||
    (title?.toUpperCase().includes('ICRA')
      ? 'icra'
      : title?.toUpperCase().includes('TRIWULAN')
      ? 'quarterly'
      : title?.toUpperCase().includes('SEMESTER')
      ? 'semester'
      : title?.toUpperCase().includes('IPCN') || periodText?.toUpperCase().includes('BULAN')
      ? 'monthly'
      : 'annual');

  const mainTitle =
    title ||
    (detectedType === 'annual'
      ? `LAPORAN TAHUNAN ${displayYear}`
      : detectedType === 'monthly'
      ? 'LAPORAN IPCN'
      : `LAPORAN TRIWULAN III ${displayYear}`);

  return (
    <div 
      className="w-full h-full relative bg-white overflow-hidden font-sans"
      style={{ color: '#ffffff' }}
    >
      {/* High-resolution official RSUD Al-Mulk book cover template */}
      <img 
        src="/reports/assets/cover_rsud_almulk.png" 
        alt="Cover RSUD Al-Mulk"
        className="w-full h-full object-fill absolute inset-0 z-0 pointer-events-none select-none"
      />

      {/* Dynamic Report Title & Content positioned exactly in the blue banner box */}
      <div 
        className="cover-title absolute left-0 right-0 flex flex-col justify-center items-center text-center px-6 z-10"
        style={{ 
          top: '66.5%', 
          height: '20%', 
          color: '#ffffff',
          WebkitTextFillColor: '#ffffff' 
        }}
      >
        {/* ========================================================= */}
        {/* FORMAT 1: LAPORAN TAHUNAN (Sesuai Gambar 1)                */}
        {/* Line 1: LAPORAN TAHUNAN [TAHUN]                           */}
        {/* Line 2: PENCEGAHAN DAN                                    */}
        {/* Line 3: PENGENDALIAN INFEKSI (PPI)                        */}
        {/* ========================================================= */}
        {detectedType === 'annual' && (
          <div className="flex flex-col items-center justify-center text-center">
            <h1 
              className="cover-title-text font-bold uppercase tracking-wide font-sans text-center"
              style={{ 
                fontSize: '28pt', 
                lineHeight: '1.25',
                color: '#ffffff', 
                WebkitTextFillColor: '#ffffff',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)'
              }}
            >
              {mainTitle}
            </h1>
            <div className="mt-1 flex flex-col items-center text-center">
              <h2 
                className="cover-title-text font-bold uppercase tracking-wide font-sans text-center"
                style={{ 
                  fontSize: '26pt', 
                  lineHeight: '1.25',
                  color: '#ffffff', 
                  WebkitTextFillColor: '#ffffff',
                  textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                }}
              >
                PENCEGAHAN DAN
              </h2>
              <h2 
                className="cover-title-text font-bold uppercase tracking-wide font-sans text-center"
                style={{ 
                  fontSize: '26pt', 
                  lineHeight: '1.25',
                  color: '#ffffff', 
                  WebkitTextFillColor: '#ffffff',
                  textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                }}
              >
                PENGENDALIAN INFEKSI (PPI)
              </h2>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* FORMAT 2: LAPORAN TRIWULAN / SEMESTER (Sesuai Gambar 2)   */}
        {/* Line 1: LAPORAN TRIWULAN [ROMAN] [TAHUN]                  */}
        {/* Line 2: PENCEGAHAN DAN PENGENDALIAN INFEKSI (PPI)         */}
        {/* Line 3: UOBK RSUD AL-MULK KOTA SUKABUMI                   */}
        {/* ========================================================= */}
        {(detectedType === 'quarterly' || detectedType === 'semester') && (
          <div className="flex flex-col items-center justify-center text-center">
            <h1 
              className="cover-title-text font-bold uppercase tracking-wide font-sans text-center"
              style={{ 
                fontSize: '28pt', 
                lineHeight: '1.25',
                color: '#ffffff', 
                WebkitTextFillColor: '#ffffff',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)'
              }}
            >
              {mainTitle}
            </h1>
            <div className="mt-2.5 flex flex-col items-center text-center gap-1.5">
              <h2 
                className="cover-title-text font-bold uppercase tracking-wide font-sans text-center whitespace-nowrap"
                style={{ 
                  fontSize: '18.5pt', 
                  lineHeight: '1.25',
                  color: '#ffffff', 
                  WebkitTextFillColor: '#ffffff',
                  textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                }}
              >
                {subtitle || 'PENCEGAHAN DAN PENGENDALIAN INFEKSI (PPI)'}
              </h2>
              <h3 
                className="cover-title-text font-bold uppercase tracking-wide font-sans text-center whitespace-nowrap"
                style={{ 
                  fontSize: '18.5pt', 
                  lineHeight: '1.25',
                  color: '#ffffff', 
                  WebkitTextFillColor: '#ffffff',
                  textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                }}
              >
                {hospitalText}
              </h3>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* FORMAT 3: LAPORAN BULANAN (Sesuai Gambar 3)               */}
        {/* Line 1: LAPORAN IPCN                                      */}
        {/* Line 2: BULAN [BULAN] [TAHUN]                             */}
        {/* Line 3: PENCEGAHAN DAN                                    */}
        {/* Line 4: PENGENDALIAN INFEKSI (PPI)                        */}
        {/* ========================================================= */}
        {detectedType === 'monthly' && (
          <div className="flex flex-col items-center justify-center text-center">
            <h1 
              className="cover-title-text font-bold uppercase tracking-wide font-sans text-center"
              style={{ 
                fontSize: '26pt', 
                lineHeight: '1.2',
                color: '#ffffff', 
                WebkitTextFillColor: '#ffffff',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)'
              }}
            >
              {mainTitle}
            </h1>
            <h2 
              className="cover-title-text font-bold uppercase tracking-wide font-sans text-center mt-1"
              style={{ 
                fontSize: '22.5pt', 
                lineHeight: '1.2',
                color: '#ffffff', 
                WebkitTextFillColor: '#ffffff',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)'
              }}
            >
              {periodText || `BULAN ${displayYear}`}
            </h2>
            <div className="mt-1 flex flex-col items-center text-center">
              <h3 
                className="cover-title-text font-bold uppercase tracking-wide font-sans text-center"
                style={{ 
                  fontSize: '22.5pt', 
                  lineHeight: '1.2',
                  color: '#ffffff', 
                  WebkitTextFillColor: '#ffffff',
                  textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                }}
              >
                PENCEGAHAN DAN
              </h3>
              <h3 
                className="cover-title-text font-bold uppercase tracking-wide font-sans text-center"
                style={{ 
                  fontSize: '22.5pt', 
                  lineHeight: '1.2',
                  color: '#ffffff', 
                  WebkitTextFillColor: '#ffffff',
                  textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                }}
              >
                PENGENDALIAN INFEKSI (PPI)
              </h3>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* FORMAT 4: LAPORAN ICRA KONSTRUKSI / RENOVASI              */}
        {/* Line 1: LAPORAN PELAKSANAAN INFECTION CONTROL RISK        */}
        {/*         ASSESSMENT (ICRA)                                 */}
        {/* Line 2: PADA KEGIATAN [NAMA PROYEK]                       */}
        {/* Line 3: UOBK RSUD AL-MULK KOTA SUKABUMI                   */}
        {/* Line 4: TAHUN [TAHUN]                                     */}
        {/* ========================================================= */}
        {detectedType === 'icra' && (
          <div className="flex flex-col items-center justify-center text-center px-2">
            <h1
              className="cover-title-text font-bold uppercase font-sans text-center whitespace-nowrap m-0"
              style={{
                fontSize: '14.2pt',
                lineHeight: '1.5',
                letterSpacing: '0.01em',
                color: '#ffffff',
                WebkitTextFillColor: '#ffffff',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              }}
            >
              {title || 'LAPORAN PELAKSANAAN INFECTION CONTROL RISK ASSESSMENT (ICRA)'}
            </h1>
            <h2
              className="cover-title-text font-bold uppercase font-sans text-center px-2 m-0"
              style={{
                fontSize: '14.2pt',
                lineHeight: '1.5',
                letterSpacing: '0.01em',
                color: '#ffffff',
                WebkitTextFillColor: '#ffffff',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              }}
            >
              {(() => {
                const sub =
                  subtitle ||
                  'PADA KEGIATAN PEMELIHARAAN, PERBAIKAN, RENOVASI DAN KONSTRUKSI SARANA PRASARANA';
                const splitMatch = sub.match(
                  /^(PADA KEGIATAN PEMELIHARAAN, PERBAIKAN, RENOVASI)\s+(DAN KONSTRUKSI SARANA PRASARANA)$/i
                );
                if (splitMatch) {
                  return (
                    <>
                      {splitMatch[1]}
                      <br />
                      {splitMatch[2]}
                    </>
                  );
                }
                return sub;
              })()}
            </h2>
            <h3
              className="cover-title-text font-bold uppercase font-sans text-center whitespace-nowrap m-0"
              style={{
                fontSize: '14.2pt',
                lineHeight: '1.5',
                letterSpacing: '0.01em',
                color: '#ffffff',
                WebkitTextFillColor: '#ffffff',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              }}
            >
              {hospitalText}
            </h3>
            <p
              className="cover-title-text font-bold uppercase font-sans text-center m-0"
              style={{
                fontSize: '14.2pt',
                lineHeight: '1.5',
                letterSpacing: '0.01em',
                color: '#ffffff',
                WebkitTextFillColor: '#ffffff',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              }}
            >
              TAHUN {displayYear}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
