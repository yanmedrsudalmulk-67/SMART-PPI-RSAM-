import React from 'react';
import AnnualPages1to10 from './annual/AnnualPages1to10';
import AnnualPages11to20 from './annual/AnnualPages11to20';
import AnnualPages21to30 from './annual/AnnualPages21to30';
import AnnualPages31to40 from './annual/AnnualPages31to40';
import AnnualPages41to46 from './annual/AnnualPages41to46';
import { OfficialReportData } from '@/hooks/useOfficialReportData';

interface AnnualReportProps {
  year?: number;
  reportData?: OfficialReportData;
}

export default function AnnualOfficialReport({
  year = 2025,
  reportData,
}: AnnualReportProps) {
  return (
    <div id="print-area-annual" className="w-full flex flex-col items-center official-pages-container transition-all">
      {/* Bagian 1: Halaman 1 s/d 10 (Cover, i, ii, iii, Hal 1-6) */}
      <AnnualPages1to10 year={year} reportData={reportData} />

      {/* Bagian 2: Halaman 11 s/d 20 (Hal 7-16) */}
      <AnnualPages11to20 year={year} reportData={reportData} />

      {/* Bagian 3: Halaman 21 s/d 30 (Hal 17-26: HAIs 12 Bulan & Bundles) */}
      <AnnualPages21to30 year={year} reportData={reportData} />

      {/* Bagian 4: Halaman 31 s/d 40 (Hal 27-36: Pembahasan Komprehensif) */}
      <AnnualPages31to40 year={year} />

      {/* Bagian 5: Halaman 41 s/d 46 (Hal 37-42: Bundles, Diklat, Penutup & Lembar Pengesahan) */}
      <AnnualPages41to46 year={year} />
    </div>
  );
}
