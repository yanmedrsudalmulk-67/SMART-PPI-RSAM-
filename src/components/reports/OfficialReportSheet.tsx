import React, { useState } from 'react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import Image from 'next/image';
import { ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '@/components/Providers';
import PdfDownloadButton from '@/components/reports/PdfDownloadButton';
import ZoomableReportViewer from '@/components/reports/ZoomableReportViewer';

interface Item {
  id: string;
  label: string;
}

interface Category {
  id: string;
  title: string;
  items: Item[];
}

interface AuditRecord {
  id: string;
  waktu?: string;
  tanggal_waktu?: string;
  supervisor?: string;
  observer?: string;
  unit?: string;
  ruangan?: string;
  nama_pj_ruangan?: string;
  nama_pj?: string;
  profesi?: string;
  checklist_json?: Record<string, any>;
  data_indikator?: Record<string, any>;
  persentase: number;
  temuan?: string;
  rekomendasi?: string;
  upaya_perbaikan?: string;
  waktu_perbaikan?: string;
  tanggal_perbaikan?: string;
  foto_perbaikan?: string[] | string;
  foto?: string[] | string;
  ttd_pj?: string;
  ttd_ipcn?: string;
}

export default function OfficialReportSheet({
  data,
  title,
  categories
}: {
  data: AuditRecord;
  title: string;
  categories: Category[];
}) {
  const { hospitalLogoUrl } = useAppContext();
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const auditDate = data.tanggal_waktu || data.waktu;
  const inspector = data.supervisor || data.observer;
  const unit = data.ruangan || data.unit;
  
  const checklist = data.checklist_json || data.data_indikator || {};
  
  const getStatus = (itemId: string) => {
    const val = checklist[itemId];
    if (typeof val === 'string') return val.toLowerCase();
    if (val && typeof val === 'object' && 'status' in val && typeof val.status === 'string') {
      return val.status.toLowerCase();
    }
    return undefined;
  };

  const getSafeStatus = (v: any) => {
    if (typeof v === 'string') return v.toLowerCase();
    if (v && typeof v === 'object' && 'status' in v && typeof v.status === 'string') return v.status.toLowerCase();
    return undefined;
  };

  const getKeterangan = (itemId: string) => {
    const val = checklist[itemId];
    if (val && typeof val === 'object' && 'keterangan' in val && typeof val.keterangan === 'string') {
      return val.keterangan;
    }
    return '';
  };

  const images = Array.isArray(data.foto) ? data.foto : (typeof data.foto === 'string' ? [data.foto] : []);
  const upayaText = data.upaya_perbaikan || (checklist && checklist.upaya_perbaikan) || (checklist && checklist.upayaPerbaikan) || '';
  const waktuPerbaikan = data.waktu_perbaikan || data.tanggal_perbaikan || (checklist && checklist.waktu_perbaikan) || (checklist && checklist.tanggal_perbaikan) || '';
  const perbaikanRaw = data.foto_perbaikan || (checklist && checklist.foto_perbaikan) || (checklist && checklist.dokumentasi_perbaikan);
  const perbaikanImages = Array.isArray(perbaikanRaw) ? perbaikanRaw : (typeof perbaikanRaw === 'string' ? [perbaikanRaw] : []);

  return (
    <div className="w-full">
      <ZoomableReportViewer>
        <div 
          id="official-report-sheet" 
          data-pdf-page="true"
          className="official-report-paper official-pdf-page relative w-full min-w-[650px] sm:min-w-0 sm:w-full bg-force-white text-black border border-slate-300 print:border-none p-6 sm:p-10 rounded-2xl shadow-xl max-w-[215mm] mx-auto"
          style={{
            backgroundColor: "#ffffff",
            color: "#000000",
            fontFamily: "'Calibri', 'Carlito', 'Candara', 'Segoe UI', Arial, sans-serif",
            fontSize: "11pt",
          }}
        >
      {/* PDF Download Button - Hidden when printing / exporting */}
      <div className="absolute top-6 right-6 z-20 no-print" data-html2canvas-ignore="true">
        <PdfDownloadButton
          targetElementId="official-report-sheet"
          filename={`Laporan_Resmi_${title.replace(/[^a-zA-Z0-9]/g, '_')}_${(data.unit || data.ruangan || 'Unit').replace(/[^a-zA-Z0-9]/g, '_')}_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`}
          title="Download PDF Laporan Resmi"
        />
      </div>

      <div className="mb-6 border-b-4 border-slate-900 pb-4">
        <div className="flex items-center justify-center gap-4 sm:gap-5 max-w-2xl mx-auto">
          <div className="w-14 h-14 bg-white flex items-center justify-center relative shrink-0">
            {hospitalLogoUrl ? (
              <Image src={hospitalLogoUrl} alt="Logo RS" fill sizes="56px" className="object-contain" referrerPolicy="no-referrer" />
            ) : (
              <ShieldCheck className="w-10 h-10 text-black" />
            )}
          </div>
          <div className="text-center">
            <h1 className="text-lg sm:text-xl font-black tracking-tight leading-tight uppercase text-black">
              TIM PENCEGAHAN DAN PENGENDALIAN INFEKSI (PPI)
            </h1>
            <p className="text-xs sm:text-sm font-black uppercase text-black tracking-wider mt-0.5">
              UOBK RSUD AL-MULK KOTA SUKABUMI
            </p>
            <p className="text-[10px] sm:text-[11px] text-slate-600 italic mt-0.5">
              Jl. Pelabuhan II No. Km.6, Lembursitu, Kec. Lembursitu, Kota Sukabumi, Jawa Barat 43168
            </p>
          </div>
        </div>
      </div>

      <div className="text-center mb-6">
        <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-black w-full text-center">LAPORAN AUDIT <br className="md:hidden" /> {title}</h2>
      </div>

      <div className="w-full mb-6 border-t border-l border-r border-slate-300 grid grid-cols-1 md:grid-cols-3 bg-white">
        <div className="border-b border-slate-300 p-2.5 border-r text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Waktu Pelaksanaan</p>
          <div className="font-bold text-xs sm:text-sm text-black">{auditDate ? format(new Date(auditDate), 'dd MMM yyyy HH:mm', { locale: idLocale }) : '-'}</div>
        </div>
        <div className="border-b border-slate-300 p-2.5 border-r text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Supervisor</p>
          <p className="font-bold text-xs sm:text-sm uppercase text-black">{inspector || '-'}</p>
        </div>
        <div className="border-b border-slate-300 p-2.5 text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Unit / Ruangan</p>
          <p className="font-bold text-xs sm:text-sm uppercase text-black">{unit || '-'}</p>
        </div>
      </div>

      <div className="mb-8 overflow-x-auto print:overflow-visible">
        <table className="w-full min-w-[600px] border-collapse text-sm bg-white text-black border border-slate-300">
          <thead>
            <tr className="bg-slate-50 text-slate-900 font-bold uppercase tracking-widest text-[11px] border-b border-slate-300">
              <th className="px-3 py-2.5 w-12 text-center border-r border-slate-300">NO</th>
              <th className="px-4 py-2.5 text-center border-r border-slate-300 font-bold">INDIKATOR</th>
              <th className="px-3 py-2.5 w-14 text-center border-r border-slate-300">YA</th>
              <th className="px-3 py-2.5 w-14 text-center border-r border-slate-300">TDK</th>
              <th className="px-3 py-2.5 w-14 text-center border-r border-slate-300">N/A</th>
              <th className="px-4 py-2.5 text-center border-r border-slate-300">KETERANGAN</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              cat.items.map((item, itemIdx) => {
                const status = getStatus(item.id);
                const keterangan = getKeterangan(item.id);
                return (
                  <tr key={item.id} className="border-b border-slate-300 text-black">
                    <td className="px-4 py-3 text-center border-r border-slate-300">{itemIdx + 1}</td>
                    <td className="px-6 py-3 font-semibold border-r border-slate-300">{item.label}</td>
                    <td className="px-4 py-3 text-center border-r border-slate-300 font-bold text-emerald-600">{status === 'ya' && '✓'}</td>
                    <td className="px-4 py-3 text-center border-r border-slate-300 font-bold text-red-600">{status === 'tidak' && '✗'}</td>
                    <td className="px-4 py-3 text-center border-r border-slate-300 font-bold text-slate-500">{(status === 'na' || status === 'n/a') && '-'}</td>
                    <td className="px-4 py-3 text-xs border-r border-slate-300">{keterangan}</td>
                  </tr>
                );
              })
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="md:col-span-3 grid grid-cols-3 gap-6">
            <div className="p-4 border border-slate-300 text-center flex flex-col justify-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Patuh</p>
              <p className="text-3xl font-black text-black">{Object.values(checklist).filter(v => getSafeStatus(v) === 'ya').length}</p>
            </div>
            <div className="p-4 border border-slate-300 text-center flex flex-col justify-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Tdk Patuh</p>
              <p className="text-3xl font-black text-black">{Object.values(checklist).filter(v => getSafeStatus(v) === 'tidak').length}</p>
            </div>
            <div className="p-4 border border-slate-300 text-center flex flex-col justify-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">N/A</p>
              <p className="text-3xl font-black text-black">{Object.values(checklist).filter(v => getSafeStatus(v) === 'na').length}</p>
            </div>
          </div>
          <div className="border border-slate-300 p-4 flex flex-col items-center justify-center text-center">
             <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-slate-500">Capaian</p>
             <p className="text-5xl font-black mb-2 text-black">
               {(() => {
                 const patuh = Object.values(checklist).filter(v => getSafeStatus(v) === 'ya').length;
                 const tidak = Object.values(checklist).filter(v => getSafeStatus(v) === 'tidak').length;
                 const total = patuh + tidak;
                 return total > 0 ? Math.round((patuh / total) * 100) : (data.persentase || 0);
               })()}%
             </p>
          </div>
      </div>

      {/* Temuan & Rekomendasi */}
      {(data.temuan || data.rekomendasi) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="p-4 border border-slate-300 bg-white">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 border-b border-slate-200 pb-1">Temuan Lapangan</h4>
            <p className="text-xs text-black leading-relaxed whitespace-pre-wrap">{data.temuan || '-'}</p>
          </div>
          <div className="p-4 border border-slate-300 bg-white">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 border-b border-slate-200 pb-1">Rekomendasi / Tindak Lanjut</h4>
            <p className="text-xs text-black leading-relaxed whitespace-pre-wrap">{data.rekomendasi || '-'}</p>
          </div>
        </div>
      )}

      {/* Foto Dokumentasi */}
      {images.length > 0 && (
         <div className="mb-8 space-y-4">
           <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 border-b border-slate-300 pb-2">Dokumentasi Audit</h4>
           <div className="grid grid-cols-2 gap-4 print:page-break-inside-avoid px-2">
             {images.map((url, i) => (
               <div key={i} onClick={() => setZoomedImage(url)} className="relative pt-[75%] border border-slate-300 p-1 cursor-zoom-in bg-white shadow-sm">
                 <Image src={url} alt="Dokumentasi" fill sizes="50vw" className="absolute inset-0 w-full h-full object-cover p-1" referrerPolicy="no-referrer" />
               </div>
             ))}
           </div>
         </div>
      )}

      {/* Upaya Perbaikan & Bukti Perbaikan */}
      {(upayaText || waktuPerbaikan || perbaikanImages.length > 0) && (
         <div className="mb-8 p-4 border-2 border-amber-600 bg-amber-50/40 rounded-xl space-y-3">
           <h4 className="text-xs font-black uppercase tracking-widest text-amber-900 border-b border-amber-400 pb-2 flex items-center justify-between">
             <span>🛠️ Upaya Perbaikan & Tindak Lanjut</span>
             <span className="text-[9px] px-2 py-0.5 bg-amber-200 text-amber-900 rounded font-bold">HASIL PERBAIKAN</span>
           </h4>
           {waktuPerbaikan && (
             <div className="text-[10px] font-bold text-amber-900 bg-amber-200/60 px-2 py-0.5 rounded w-fit border border-amber-300">
               📅 Tanggal &amp; Jam Perbaikan: {waktuPerbaikan.includes('T') ? waktuPerbaikan.replace('T', ' ') : waktuPerbaikan}
             </div>
           )}
           {upayaText && (
             <p className="text-xs text-black leading-relaxed whitespace-pre-wrap font-medium">{upayaText}</p>
           )}
           {perbaikanImages.length > 0 && (
             <div className="pt-2">
               <p className="text-[10px] font-bold text-amber-900 mb-2 uppercase tracking-wider">Foto Bukti Upaya Perbaikan:</p>
               <div className="grid grid-cols-2 gap-4 print:page-break-inside-avoid px-2">
                 {perbaikanImages.map((url, i) => (
                   <div key={i} onClick={() => setZoomedImage(url)} className="relative pt-[75%] border-2 border-amber-500 bg-white p-1 cursor-zoom-in rounded-lg overflow-hidden shadow-sm">
                     <Image src={url} alt="Foto Upaya Perbaikan" fill sizes="50vw" className="absolute inset-0 w-full h-full object-cover p-1" referrerPolicy="no-referrer" />
                   </div>
                 ))}
               </div>
             </div>
           )}
         </div>
      )}

      {/* Tanda Tangan Pengesahan (Paling Bawah - Tunggal) */}
      <div className="grid grid-cols-2 gap-12 mt-10 mb-6">
        <div className="text-center space-y-4">
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">Petugas / PJ Ruangan</p>
          <div className="h-20 relative w-full flex justify-center items-center">
            {data.ttd_pj && <Image src={data.ttd_pj} fill sizes="200px" className="object-contain filter brightness-0" alt="TTD PJ" referrerPolicy="no-referrer" />}
          </div>
          <div className="pt-2 border-t border-slate-300 w-full">
            <p className="font-bold text-xs uppercase tracking-wider text-black">
              {data.nama_pj_ruangan || data.nama_pj
                ? `( ${data.nama_pj_ruangan || data.nama_pj} )`
                : "( ............................... )"}
            </p>
          </div>
        </div>
        <div className="text-center space-y-4">
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">Tim PPI</p>
          <div className="h-20 relative w-full flex justify-center items-center">
            {data.ttd_ipcn && <Image src={data.ttd_ipcn} fill sizes="200px" className="object-contain filter brightness-0" alt="TTD IPCN" referrerPolicy="no-referrer" />}
          </div>
          <div className="pt-2 border-t border-slate-300 w-full">
            <p className="font-bold text-xs uppercase tracking-wider text-black">{inspector || '( ............................... )'}</p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {zoomedImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setZoomedImage(null)}
            className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
          >
            <img src={zoomedImage} alt="Zoomed" className="max-w-full max-h-full object-contain rounded-2xl" />
          </motion.div>
        )}
      </AnimatePresence>
        </div>
      </ZoomableReportViewer>
    </div>
  );
}
