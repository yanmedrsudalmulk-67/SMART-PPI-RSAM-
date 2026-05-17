import React, { useState } from 'react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import Image from 'next/image';
import { ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '@/components/Providers';

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

  return (
    <div className="relative w-full font-sans bg-white text-slate-900 border border-slate-300 print:border-none p-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 border-b-4 border-slate-300 pb-6">
          <div className="flex items-center gap-5 w-full justify-center text-center">
             <div className="w-20 h-20 bg-white flex items-center justify-center p-1 border-2 border-slate-300 relative">
               {hospitalLogoUrl ? (
                 <Image src={hospitalLogoUrl} alt="Logo RS" fill className="object-contain" referrerPolicy="no-referrer" />
               ) : (
                 <ShieldCheck className="w-12 h-12 text-black" />
               )}
             </div>
             <div className="text-left">
               <h1 className="text-2xl font-black tracking-tight leading-tight uppercase text-black"> TIM PENCEGAHAN & PENGENDALIAN INFEKSI</h1>
               <p className="text-sm font-bold uppercase text-black tracking-widest mt-1">UOBK RSUD AL-MULK KOTA SUKABUMI</p>
             </div>
          </div>
      </div>

      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-black w-full text-center">LAPORAN AUDIT <br className="md:hidden" /> {title}</h2>
      </div>

      <div className="w-full mb-8 border-t border-l border-r border-slate-300 grid grid-cols-3 bg-white">
        <div className="border-b border-slate-300 p-3 border-r text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Waktu Pelaksanaan</p>
          <div className="font-bold text-sm text-black">{auditDate ? format(new Date(auditDate), 'dd MMM yyyy HH:mm', { locale: idLocale }) : '-'}</div>
        </div>
        <div className="border-b border-slate-300 p-3 border-r text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Supervisor / IPCN</p>
          <p className="font-bold text-sm uppercase text-black">{inspector || '-'}</p>
        </div>
        <div className="border-b border-slate-300 p-3 text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Unit / Ruangan</p>
          <p className="font-bold text-sm uppercase text-black">{unit || '-'}</p>
        </div>
      </div>

      <div className="mb-10 overflow-x-auto print:overflow-visible">
        <table className="w-full min-w-[600px] border-collapse text-left text-sm bg-white text-black border border-slate-300">
          <thead>
            <tr className="bg-slate-50 text-slate-900 font-bold uppercase tracking-widest text-[11px] border-b border-slate-300">
              <th className="px-4 py-3 w-12 text-center border-r border-slate-300">NO</th>
              <th className="px-6 py-3 border-r border-slate-300 font-bold">INDIKATOR</th>
              <th className="px-4 py-3 w-16 text-center border-r border-slate-300">YA</th>
              <th className="px-4 py-3 w-16 text-center border-r border-slate-300">TDK</th>
              <th className="px-4 py-3 w-16 text-center border-r border-slate-300">N/A</th>
              <th className="px-4 py-3 border-r border-slate-300 text-center">KETERANGAN</th>
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
                    <td className="px-4 py-3 text-center border-r border-slate-300">{status === 'ya' && '✓'}</td>
                    <td className="px-4 py-3 text-center border-r border-slate-300">{status === 'tidak' && '✓'}</td>
                    <td className="px-4 py-3 text-center border-r border-slate-300">{status === 'na' && '✓'}</td>
                    <td className="px-4 py-3 text-xs border-r border-slate-300">{keterangan}</td>
                  </tr>
                );
              })
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
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
             <p className="text-5xl font-black mb-2 text-black">{data.persentase}%</p>
          </div>
      </div>

      {images.length > 0 && (
         <div className="mb-12 space-y-4">
           <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 border-b border-slate-300 pb-2">Dokumentasi</h4>
           <div className="grid grid-cols-4 gap-4">
             {images.map((url, i) => (
               <div key={i} onClick={() => setZoomedImage(url)} className="relative aspect-video border border-slate-300 cursor-zoom-in">
                 <Image src={url} alt="Dokumentasi" fill className="object-cover" referrerPolicy="no-referrer" />
               </div>
             ))}
           </div>
         </div>
      )}

      <div className="grid grid-cols-2 gap-12 mt-12 mb-8">
        <div className="text-center space-y-4">
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">PJ Ruangan / Auditee</p>
          <div className="h-20 relative w-full flex justify-center items-center">
            {data.ttd_pj && <Image src={data.ttd_pj} fill className="object-contain" alt="TTD PJ" referrerPolicy="no-referrer" />}
          </div>
          <div className="pt-2 border-t border-slate-300 w-full">
            <p className="font-bold text-xs uppercase tracking-wider text-black">( ............................... )</p>
          </div>
        </div>
        <div className="text-center space-y-4">
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">Auditor / IPCN</p>
          <div className="h-20 relative w-full flex justify-center items-center">
            {data.ttd_ipcn && <Image src={data.ttd_ipcn} fill className="object-contain" alt="TTD IPCN" referrerPolicy="no-referrer" />}
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
  );
}
