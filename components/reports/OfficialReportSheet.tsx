import React, { useState } from 'react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import Image from 'next/image';
import { Check, X, ShieldAlert, FileText, Camera, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '@/components/providers';

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
  profesi?: string;
  checklist_json?: Record<string, any>;
  data_indikator?: Record<string, any>;
  persentase: number;
  temuan?: string;
  rekomendasi?: string;
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
    if (val && typeof val === 'object' && 'status' in val) return val.status?.toLowerCase();
    return val?.toLowerCase();
  };

  const getKeterangan = (itemId: string) => {
    const val = checklist[itemId];
    if (val && typeof val === 'object' && 'keterangan' in val) return val.keterangan;
    return '';
  };

  const images = Array.isArray(data.foto) ? data.foto : (typeof data.foto === 'string' ? [data.foto] : []);
  const generatedDate = format(new Date(), 'dd MMMM yyyy HH:mm', { locale: idLocale });

  return (
    <div className="relative w-full font-sans bg-force-white text-force-black border border-slate-300 print:border-none">
      
      {/* Header Resmi */}
      <div className="p-8 pb-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 border-b-4 border-slate-300 pb-6">
          <div className="flex items-center gap-5 w-full justify-center text-center">
             <div className="w-20 h-20 bg-force-white flex items-center justify-center p-1 border-2 border-slate-300">
               {hospitalLogoUrl ? (
                 // eslint-disable-next-line @next/next/no-img-element
                 <img src={hospitalLogoUrl} alt="Logo RS" className="w-full h-full object-contain" />
               ) : (
                 <ShieldCheck className="w-12 h-12 text-force-black" />
               )}
             </div>
             <div className="text-left">
               <h1 className="text-2xl font-black tracking-tight leading-tight uppercase font-heading text-force-black">
                 TIM PENCEGAHAN & PENGENDALIAN INFEKSI
               </h1>
               <p className="text-sm font-bold uppercase text-force-black tracking-widest mt-1">UOBK RSUD AL-MULK KOTA SUKABUMI</p>
               <p className="text-xs text-force-black mt-1 italic">Jl. Pelabuhan II, Kec. Lembursitu, Kota Sukabumi, Jawa Barat</p>
             </div>
          </div>
        </div>

        {/* Judul Laporan */}
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight font-heading text-force-black w-full text-center">
            LAPORAN AUDIT <br className="md:hidden" /> {title}
          </h2>
        </div>

        {/* Info Audit Grid */}
        <div className="w-full mb-8 border-t border-l border-r border-slate-300 border-collapse grid grid-cols-3 bg-force-white">
          <div className="border-b border-slate-300 p-3 border-r text-center flex flex-col items-center justify-center min-h-[80px]">
            <p className="text-[10px] font-black uppercase tracking-widest text-force-black flex items-center justify-center gap-2 mb-2 w-full text-center">
              Waktu Pelaksanaan
            </p>
            <div className="font-bold text-sm text-force-black w-full text-center">
              {auditDate ? format(new Date(auditDate), 'dd MMM yyyy HH:mm', { locale: idLocale }) : '-'}
            </div>
          </div>
          <div className="border-b border-slate-300 p-3 border-r text-center flex flex-col items-center justify-center min-h-[80px]">
            <p className="text-[10px] font-black uppercase tracking-widest text-force-black flex items-center justify-center gap-2 mb-2 w-full text-center">
              Supervisor / IPCN
            </p>
            <p className="font-bold text-sm uppercase text-force-black w-full text-center">{inspector || '-'}</p>
          </div>
          <div className="border-b border-slate-300 p-3 text-center flex flex-col items-center justify-center min-h-[80px]">
            <p className="text-[10px] font-black uppercase tracking-widest text-force-black flex items-center justify-center gap-2 mb-2 w-full text-center">
              Unit / Ruangan
            </p>
            <p className="font-bold text-sm uppercase text-force-black w-full text-center">{unit || '-'}</p>
          </div>
        </div>

        {/* Tabel Audit Utama */}
        <div className="mb-10 overflow-x-auto print:overflow-visible">
          <table className="w-full min-w-[700px] border-collapse text-left text-sm bg-force-white text-force-black border border-slate-300">
            <thead>
              <tr className="bg-force-white text-force-black font-bold uppercase tracking-widest text-[11px] border-b border-slate-300">
                <th className="px-4 py-3 w-12 text-center border-r border-slate-300 bg-force-white text-force-black">NO</th>
                <th className="px-6 py-3 border-r border-slate-300 bg-force-white text-force-black text-center">ITEM STANDAR AUDIT</th>
                <th className="px-4 py-3 w-16 text-center border-r border-slate-300 bg-force-white text-force-black">YA</th>
                <th className="px-4 py-3 w-16 text-center border-r border-slate-300 bg-force-white text-force-black">TIDAK</th>
                <th className="px-4 py-3 w-16 text-center border-r border-slate-300 bg-force-white text-force-black">N/A</th>
                <th className="px-6 py-3 bg-force-white text-force-black text-center">KETERANGAN</th>
              </tr>
            </thead>
            <tbody className="bg-force-white text-force-black">
              {categories.map((cat, catIdx) => (
                <React.Fragment key={cat.id}>
                  {categories.length > 1 && (
                    <tr className="bg-slate-50 font-black text-[12px] uppercase tracking-wider text-slate-800 border-b border-slate-300">
                      <td className="px-4 py-3 text-center border-r border-slate-300">{String.fromCharCode(65 + catIdx)}</td>
                      <td className="px-6 py-3 border-slate-300" colSpan={5}>{cat.title}</td>
                    </tr>
                  )}
                  {cat.items.map((item, itemIdx) => {
                    const status = getStatus(item.id);
                    const ket = getKeterangan(item.id);
                    return (
                      <tr key={item.id} className="border-b border-slate-300 text-force-black">
                        <td className="px-4 py-3 text-center font-bold text-force-black border-r border-slate-300">{itemIdx + 1}</td>
                        <td className="px-6 py-3 font-semibold text-force-black border-r border-slate-300 leading-snug">{item.label.replace(/^\d+\.\s*/, '')}</td>
                        <td className="px-4 py-3 text-center text-force-black border-r border-slate-300 align-middle">
                          {status === 'ya' && <span className="font-bold text-lg">✓</span>}
                        </td>
                        <td className="px-4 py-3 text-center text-force-black border-r border-slate-300 align-middle">
                          {status === 'tidak' && <span className="font-bold text-lg">✓</span>}
                        </td>
                        <td className="px-4 py-3 text-center text-force-black border-r border-slate-300 align-middle">
                          {status === 'na' && <span className="font-bold text-lg">✓</span>}
                        </td>
                        <td className="px-6 py-3 text-xs italic text-force-black bg-force-white border-slate-300">{ket}</td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Hasil & Kepatuhan */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="md:col-span-3 grid grid-cols-3 gap-6">
            <div className="p-4 border border-slate-300 text-center flex flex-col justify-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-force-black mb-2">Patuh (Ya)</p>
              <p className="text-3xl font-black text-force-black font-mono">
                {Object.values(checklist).filter(v => (typeof v === 'string' ? v.toLowerCase() : v?.status?.toLowerCase()) === 'ya').length}
              </p>
            </div>
            <div className="p-4 border border-slate-300 text-center flex flex-col justify-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-force-black mb-2">Tidak Patuh</p>
              <p className="text-3xl font-black text-force-black font-mono">
                {Object.values(checklist).filter(v => (typeof v === 'string' ? v.toLowerCase() : v?.status?.toLowerCase()) === 'tidak').length}
              </p>
            </div>
            <div className="p-4 border border-slate-300 text-center flex flex-col justify-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-force-black mb-2">N/A</p>
              <p className="text-3xl font-black text-force-black font-mono">
                {Object.values(checklist).filter(v => (typeof v === 'string' ? v.toLowerCase() : v?.status?.toLowerCase()) === 'na').length}
              </p>
            </div>
          </div>
          <div className="border border-slate-300 p-4 flex flex-col items-center justify-center text-center">
             <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-force-black">Compliance Rate</p>
             <p className="text-5xl font-black font-heading mb-2 text-force-black">{data.persentase}%</p>
             <div className="text-[11px] font-black uppercase tracking-widest py-1 text-force-black">
               {data.persentase >= 85 ? 'SESUAI STANDAR' : 'TIDAK SESUAI'}
             </div>
          </div>
        </div>

        {/* Temuan & Rekomendasi */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="border border-slate-300 p-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-force-black mb-4 border-b border-slate-300 pb-2">
              Rincian Temuan Lapangan
            </h4>
            <div className="text-sm text-force-black leading-relaxed whitespace-pre-wrap">
              {data.temuan || <span className="italic">Tidak ada temuan spesifik yang dicatat.</span>}
            </div>
          </div>
          <div className="border border-slate-300 p-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-force-black mb-4 border-b border-slate-300 pb-2">
              Rekomendasi & Tindak Lanjut
            </h4>
            <div className="text-sm text-force-black leading-relaxed whitespace-pre-wrap">
              {data.rekomendasi || <span className="italic">Sesuai dengan standar prosedur operasional yang berlaku.</span>}
            </div>
          </div>
        </div>

        {/* Dokumentasi Grid */}
        {images.length > 0 && (
           <div className="mb-12 space-y-4">
             <h4 className="text-xs font-black uppercase tracking-widest text-force-black mb-4 border-b border-slate-300 pb-2">
               Lampiran Dokumentasi
             </h4>
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
               {images.map((url, i) => (
                 <div 
                   key={i} 
                   onClick={() => setZoomedImage(url)}
                   className="relative w-full aspect-video border border-slate-300 cursor-zoom-in"
                 >
                   <Image src={url} alt={`Dokumentasi ${i+1}`} fill className="object-cover" unoptimized />
                 </div>
               ))}
             </div>
           </div>
        )}

        {/* Tanda Tangan */}
        <div className="grid grid-cols-2 gap-12 mt-12 mb-8 page-break-inside-avoid">
          <div className="text-center space-y-4">
            <p className="text-[11px] font-black uppercase tracking-widest text-force-black mb-6">Penanggung Jawab / Auditee</p>
            <div className="h-24 relative w-full flex justify-center items-center">
              {data.ttd_pj ? (
                <Image src={data.ttd_pj} fill className="object-contain" alt="TTD PJ" unoptimized />
              ) : (
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black italic">Tanpa Tanda Tangan</span>
              )}
            </div>
            <div className="pt-2 border-t border-slate-300 inline-block w-64 mx-auto">
              <p className="font-bold text-xs uppercase tracking-wider text-force-black mt-1">( ........................................ )</p>
            </div>
          </div>

          <div className="text-center space-y-4">
            <p className="text-[11px] font-black uppercase tracking-widest text-force-black mb-6">Auditor / Tim IPCN</p>
            <div className="h-24 relative w-full flex justify-center items-center">
              {data.ttd_ipcn ? (
                <Image src={data.ttd_ipcn} fill className="object-contain" alt="TTD IPCN" unoptimized />
              ) : (
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black italic">Tanpa Tanda Tangan</span>
              )}
            </div>
            <div className="pt-2 border-t border-slate-300 inline-block w-64 mx-auto">
              <p className="font-bold text-xs uppercase tracking-wider text-force-black mt-1">
                {inspector ? `( ${inspector.substring(0, 15)}${inspector.length > 15 ? '...' : ''} )` : '( ........................................ )'}
              </p>
            </div>
          </div>
        </div>

        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.4em] text-center mt-12 pt-8 border-t border-slate-300 italic">
          SMART-PPI DIGITAL AUDIT SYSTEM • GENERATED REPORT
        </div>
      </div>

      {/* Image Modal for Web View */}
      <AnimatePresence>
        {zoomedImage && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setZoomedImage(null)}
            className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out print:hidden"
          >
            <img src={zoomedImage} alt="Zoomed Dokumentasi" className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border border-white/10" />
            <div className="absolute top-6 right-6 px-4 py-2 bg-white/10 rounded-full text-white text-xs font-bold uppercase tracking-widest">Tutup</div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @media print {
          body { 
            background: white !important; 
            margin: 0; 
            padding: 0;
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
          }
          body * { visibility: hidden; }
          .printable-container, .printable-container * { visibility: visible; }
          .printable-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background-color: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>
    </div>
  );
}
