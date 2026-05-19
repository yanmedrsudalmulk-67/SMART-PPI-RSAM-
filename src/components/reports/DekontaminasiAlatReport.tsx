import React, { useState, useEffect, useMemo, useRef } from 'react';
import { utils, writeFile } from 'xlsx';
import { getSupabase } from '@/lib/supabase';
import { Check, ShieldCheck, FileText, Camera, Printer, Trash2, Edit, Plus, FileSpreadsheet } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import Image from 'next/image';
import { useAppContext } from '@/components/Providers';

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
  tanda_tangan_1?: string;
  tanda_tangan_2?: string;
  tanda_tangan?: string[];
  nama_pj_ruangan?: string;
}

const indicatorItems = [
  { id: 'peralatan_tersedia', label: 'Peralatan tersedia dan tersusun baik di meja dan lemari', key: 'peralatan_tersedia', type: 'positive' },
  { id: 'peralatan_berkarat', label: 'Adakah peralatan sarana dan prasarana kesehatan yang berkarat', key: 'peralatan_berkarat', type: 'negative' },
  { id: 'sterilisasi_tersentral', label: 'Sterilisasi tersentral', key: 'sterilisasi_tersentral', type: 'positive' },
  { id: 'alat_reused', label: 'Alat used reused sesuai aturan', key: 'alat_reused', type: 'positive' },
  { id: 'metode_dekontaminasi', label: 'Petugas dapat menjelaskan metoda dekontaminasi peralatan yang biasa digunakan pasien', key: 'metode_dekontaminasi', type: 'positive' },
  { id: 'dekontaminasi_lokal', label: 'Dekontaminasi lokal dari instrumen bedah tidak dilakukan di area klinis', key: 'dekontaminasi_lokal', type: 'positive' },
  { id: 'expired_date', label: 'Tanggal kadaluarsa peralatan steril belum terlewati', key: 'expired_date', type: 'positive' },
  { id: 'instrumen_bekas', label: 'Tidak terlihat debu / darah tertinggal di instrumen bekas pakai', key: 'instrumen_bekas', type: 'positive' }
];

const getStatus = (checklist: any, itemId: string) => {
  const val = checklist[itemId];
  if (val && typeof val === 'object' && 'status' in val) return val.status?.toLowerCase();
  return val?.toLowerCase();
};

const DekontaminasiAlatReportPage = ({ record, indicatorItems, hospitalLogoUrl, idLocale, onDelete, onEdit }: { record: any, indicatorItems: any[], hospitalLogoUrl: string|null, idLocale: any, onDelete?: (id: string) => void, onEdit?: (record: any) => void }) => {
  const checklist = useMemo(() => record?.checklist_json || {}, [record]);

  const { patuh, tidakPatuh, na } = useMemo(() => {
    let p = 0; let tp = 0; let n = 0;
    indicatorItems.forEach(item => {
      const val = getStatus(checklist, item.key);
      if (val === 'na') { n++; return; }
      if (!val) return;
      const isPatuh = item.type === 'positive' ? (val === 'ya') : (val === 'tidak');
      if (isPatuh) p++; else tp++;
    });
    return { patuh: p, tidakPatuh: tp, na: n };
  }, [checklist, indicatorItems]);

  const auditDate = record.tanggal_waktu || record.waktu;
  const inspector = record.supervisor || record.observer;
  const unit = record.ruangan || record.unit;

  const getKeterangan = (itemId: string) => {
    const val = checklist[itemId];
    if (val && typeof val === 'object' && 'keterangan' in val) return val.keterangan;
    return '';
  };

  const rawFoto = record.foto;
  const images = (Array.isArray(rawFoto) ? rawFoto : (typeof rawFoto === 'string' ? [rawFoto] : []))
    .map(item => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object' && 'url' in item) return (item as any).url;
      return '';
    })
    .filter(item => typeof item === 'string' && item.length > 0);

  return (
    <div className="p-4 md:p-6 print:p-0 relative break-inside-avoid w-full max-w-[800px] mx-auto bg-force-white mb-8 border border-slate-200 dark:border-white/10 rounded-2xl print:border-none print:rounded-none print:mb-0 font-sans" style={{ pageBreakAfter: 'always', fontFamily: 'var(--font-sans), Poppins, sans-serif' }}>
      
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 mb-4 border-b-2 border-slate-800 pb-3 w-full text-center mt-6 print:mt-0">
        <div className="flex items-center gap-2 sm:gap-4 w-full justify-center text-center">
           <div className="w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0 flex items-center justify-center p-1">
             {hospitalLogoUrl ? (
               // eslint-disable-next-line @next/next/no-img-element
               <img src={hospitalLogoUrl} alt="Logo RS" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} crossOrigin="anonymous" />
             ) : (
               <ShieldCheck className="w-8 h-8 text-force-black" />
             )}
           </div>
           <div className="text-left w-full overflow-hidden">
             <h1 className="text-[11px] sm:text-[13px] md:text-[15px] font-black tracking-tight leading-tight uppercase font-heading text-force-black truncate">
               TIM PENCEGAHAN & PENGENDALIAN INFEKSI (PPI)
             </h1>
             <p className="text-[8.5px] sm:text-[10px] md:text-[12px] font-bold uppercase text-force-black tracking-widest mt-0.5 truncate">UOBK RSUD AL-MULK KOTA SUKABUMI</p>
             <p className="text-[7.5px] sm:text-[8px] md:text-[9px] text-force-black mt-0.5 italic truncate">Jl. Pelabuhan II No. Km.6, Lembursitu, Kec. Lembursitu, Kota Sukabumi, Jawa Barat.</p>
           </div>
        </div>
      </div>

      <div className="text-center mb-3">
        <h2 className="text-[16px] sm:text-[18px] font-black tracking-tight font-heading text-force-black w-full text-center">
          Laporan Audit Dekontaminasi Alat
        </h2>
      </div>

      <div className="w-full mb-4 border-2 border-slate-800 border-collapse grid grid-cols-3">
        <div className="border-r border-slate-800 p-2 text-center flex flex-col items-center justify-center bg-slate-50">
          <p className="text-[8px] font-black uppercase tracking-widest text-force-black flex items-center justify-center gap-1 mb-0.5">
            Waktu Pelaksanaan
          </p>
          <div className="font-bold text-[10px] sm:text-[11px] text-force-black">
            {auditDate ? format(new Date(auditDate), 'dd MMM yyyy HH:mm', { locale: idLocale }) : '-'}
          </div>
        </div>
        <div className="border-r border-slate-800 p-2 text-center flex flex-col items-center justify-center bg-slate-50">
          <p className="text-[8px] font-black uppercase tracking-widest text-force-black flex items-center justify-center gap-1 mb-0.5">
            Supervisor / IPCN
          </p>
          <p className="font-bold text-[10px] sm:text-[11px] uppercase text-force-black">{inspector || '-'}</p>
        </div>
        <div className="p-2 text-center flex flex-col items-center justify-center bg-slate-50">
          <p className="text-[8px] font-black uppercase tracking-widest text-force-black flex items-center justify-center gap-1 mb-0.5">
            Unit / Ruangan
          </p>
          <p className="font-bold text-[10px] sm:text-[11px] uppercase text-force-black">{unit || '-'}</p>
        </div>
      </div>

      <div className="mb-4 overflow-x-auto print:overflow-hidden w-full">
        <table className="w-full border-collapse text-left text-[10px] text-force-black bg-force-white border-2 border-slate-800 min-w-[500px]">
          <thead>
            <tr className="bg-slate-50 font-black tracking-widest text-[9px] uppercase border-b-2 border-slate-800">
              <th className="px-2 py-2 w-8 text-center border-r border-slate-800 text-force-black">No</th>
              <th className="px-3 py-2 border-r border-slate-800 text-force-black text-center">Indikator</th>
              <th className="px-2 py-2 w-10 text-center border-r border-slate-800 text-force-black">Ya</th>
              <th className="px-2 py-2 w-12 text-center border-r border-slate-800 text-force-black">Tidak</th>
              <th className="px-2 py-2 w-10 text-center border-r border-slate-800 text-force-black">N/A</th>
              <th className="px-3 py-2 text-force-black text-center w-32">Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {indicatorItems.map((item, itemIdx) => {
              const status = getStatus(checklist, item.key);
              const ket = getKeterangan(item.key);
              return (
                <tr key={item.id} className="border-b border-slate-800 hover:bg-slate-50/50 transition-colors text-force-black">
                  <td className="px-2 py-2 text-center border-r border-slate-800 font-bold leading-tight">{itemIdx + 1}</td>
                  <td className="px-3 py-2 font-medium border-r border-slate-800 leading-tight">{item.label.replace(/^\d+\.\s*/, '')}</td>
                  <td className="px-2 py-2 text-center border-r border-slate-800 align-middle">
                    {status === 'ya' && (
                      <span className={`font-black text-[12px] ${item.key === 'peralatan_berkarat' ? 'text-red-600' : 'text-blue-600'}`}>✓</span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-center border-r border-slate-800 align-middle">
                    {status === 'tidak' && (
                      <span className={`font-black text-[12px] ${item.key === 'peralatan_berkarat' ? 'text-blue-600' : 'text-red-600'}`}>✓</span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-center border-r border-slate-800 align-middle">
                    {status === 'na' && <span className="font-black text-[12px] text-slate-500">✓</span>}
                  </td>
                  <td className="px-3 py-2 text-[10px] italic border-slate-800 leading-tight break-words">{ket}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col md:grid md:grid-cols-4 gap-0 mb-4 break-inside-avoid border-2 border-slate-800">
        <div className="w-full md:col-span-3 grid grid-cols-3 gap-0 border-b-2 border-slate-800 md:border-b-0 md:border-r-2">
          <div className="p-3 border-r border-slate-800 text-center flex flex-col justify-center bg-slate-50">
            <p className="text-[10px] font-black uppercase tracking-widest text-force-black mb-1">Patuh</p>
            <p className="text-xl sm:text-2xl font-black text-force-black font-mono leading-none">{patuh}</p>
          </div>
          <div className="p-3 border-r border-slate-800 text-center flex flex-col justify-center bg-slate-50">
            <p className="text-[10px] font-black uppercase tracking-widest text-force-black mb-1">Tdk Patuh</p>
            <p className="text-xl sm:text-2xl font-black text-force-black font-mono leading-none">{tidakPatuh}</p>
          </div>
          <div className="p-3 text-center flex flex-col justify-center bg-slate-50">
            <p className="text-[10px] font-black uppercase tracking-widest text-force-black mb-1">N/A</p>
            <p className="text-xl sm:text-2xl font-black text-force-black font-mono leading-none">{na}</p>
          </div>
        </div>
        <div className="w-full md:col-span-1 p-3 flex flex-col items-center justify-center text-center bg-blue-50/50">
           <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-force-black">Persentase Capaian</p>
           <p className="text-2xl sm:text-3xl font-black font-heading mb-1.5 text-blue-700 leading-none">{record.persentase || 0}%</p>
           <div className={`text-[9px] font-black uppercase tracking-widest py-0.5 px-2 rounded-full ${
             (record.persentase || 0) >= 85 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
           } print:bg-transparent print:text-force-black print:p-0`}>
             {(record.persentase || 0) >= 85 ? 'SESUAI STANDAR' : 'TIDAK SESUAI'}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 break-inside-avoid">
        <div className="border-2 border-slate-800 p-3 bg-slate-50/50">
          <h4 className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-force-black mb-2 border-b-2 border-slate-800 pb-1 flex items-center gap-2">
            Temuan Lapangan
          </h4>
          <div className="text-xs sm:text-sm text-force-black leading-tight whitespace-pre-wrap">
            {record.temuan || <span className="italic">Tidak ada temuan spesifik yang dicatat.</span>}
          </div>
        </div>
        <div className="border-2 border-slate-800 p-3 bg-slate-50/50">
          <h4 className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-force-black mb-2 border-b-2 border-slate-800 pb-1 flex items-center gap-2">
            Rekomendasi & Tindak Lanjut
          </h4>
          <div className="text-xs sm:text-sm text-force-black leading-tight whitespace-pre-wrap">
            {record.rekomendasi || <span className="italic">Sesuai dengan standar prosedur operasional yang berlaku.</span>}
          </div>
        </div>
      </div>

      {images.length > 0 && (
         <div className="mb-4 break-inside-avoid">
           <h4 className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-force-black mb-3 flex items-center gap-2">
             <Camera className="w-4 h-4 text-force-black" /> Lampiran Dokumentasi
           </h4>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
             {images.map((url, i) => (
               <div key={i} className="aspect-video relative border border-slate-300 p-1">
                 {/* eslint-disable-next-line @next/next/no-img-element */}
                 <img src={url} alt={`Dokumentasi ${i+1}`} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} crossOrigin="anonymous" />
               </div>
             ))}
           </div>
         </div>
      )}

      <div className="grid grid-cols-2 gap-8 mt-4 mb-2 break-inside-avoid">
        <div className="text-center space-y-2">
          <p className="text-[9px] font-black uppercase tracking-widest text-force-black mb-2">PJ Ruangan</p>
          <div className="h-16 relative w-full flex justify-center items-center">
            {record.tanda_tangan_1 ? (
              <img src={record.tanda_tangan_1} className="object-contain h-full relative z-10 mix-blend-multiply" alt="TTD PJ" onError={(e) => { e.currentTarget.style.display = 'none'; }} crossOrigin="anonymous" />
            ) : (
              <span className="text-[8px] text-gray-500 uppercase tracking-widest font-black italic">Tanpa Tanda Tangan</span>
            )}
          </div>
          <div className="pt-1 border-t border-slate-300 w-[90%] md:w-48 mx-auto">
            <p className="font-bold text-[10px] uppercase tracking-wider text-force-black mt-1 text-wrap">
              {record.nama_pj_ruangan ? `( ${record.nama_pj_ruangan} )` : '( ........................................ )'}
            </p>
          </div>
        </div>

        <div className="text-center space-y-2">
          <p className="text-[9px] font-black uppercase tracking-widest text-force-black mb-2">Tim PPI</p>
          <div className="h-16 relative w-full flex justify-center items-center">
            {record.tanda_tangan_2 ? (
              <img src={record.tanda_tangan_2} className="object-contain h-full relative z-10 mix-blend-multiply" alt="TTD IPCN" onError={(e) => { e.currentTarget.style.display = 'none'; }} crossOrigin="anonymous" />
            ) : (
              <span className="text-[8px] text-gray-500 uppercase tracking-widest font-black italic">Tanpa Tanda Tangan</span>
            )}
          </div>
          <div className="pt-1 border-t border-slate-300 w-[90%] md:w-48 mx-auto">
            <p className="font-bold text-[10px] uppercase tracking-wider text-force-black mt-1 text-wrap">
              {inspector ? `( ${inspector} )` : '( ........................................ )'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function DekontaminasiAlatReport({ 
  filters 
}: { 
  filters?: { dateRange?: { from: string; to: string }; unitFilter?: string; searchQuery?: string; periode?: string; type?: string; }
}) {
  const [data, setData] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { hospitalLogoUrl } = useAppContext();
  
  const supabase = getSupabase();

  useEffect(() => {
    const handleExportExcel = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.indicator === 'dekontaminasi_alat') {
        if (!data || data.length === 0) {
          alert('Tidak ada data untuk diekspor');
          return;
        }

        const wb = utils.book_new();
        
        // Export Overview
        const wsData = data.map((item: any) => ({
          'ID': item.id,
          'Waktu': item.waktu ? format(parseISO(item.waktu), 'dd/MM/yyyy HH:mm') : '',
          'Supervisor': item.supervisor || item.observer || '-',
          'Unit/Ruangan': item.unit || item.ruangan || '-',
          'Profesi/Pasien': item.profesi || item.nama_pasien || '-',
          'Skor Kepatuhan (%)': item.persentase || 0,
          'Temuan': item.temuan || '-',
          'Rekomendasi': item.rekomendasi || '-'
        }));
        const ws = utils.json_to_sheet(wsData);
        utils.book_append_sheet(wb, ws, "Rekap Audit");

        writeFile(wb, `Laporan_Dekontaminasi_Alat_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`);
      }
    };
    window.addEventListener('export-excel', handleExportExcel);
    return () => window.removeEventListener('export-excel', handleExportExcel);
  }, [data]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: result, error } = await supabase
        .from('audit_sessions')
        .select('*')
        .eq('indikator_id', 'dekontaminasi_alat')
        .order('tanggal_waktu', { ascending: false });
        
      if (!error && result) {
        const normalized = result.map((item: any) => ({
          ...item,
          waktu: item.tanggal_waktu || item.created_at,
          checklist_json: item.data_indikator || item.checklist_data || {},
          persentase: item.persentase || 0,
          tanda_tangan_1: item.ttd_pj_ruangan || item.tanda_tangan?.[0] || item.data_indikator?.tanda_tangan_pj,
          tanda_tangan_2: item.ttd_ipcn || item.tanda_tangan?.[1] || item.data_indikator?.tanda_tangan_ipcn,
          foto: item.data_indikator?.dokumentasi || item.dokumentasi || [],
          nama_pj_ruangan: item.nama_pj_ruangan || item.data_indikator?.nama_pj_ruangan || '',
        }));
        setData(normalized);
      }
      setLoading(false);
    };
    fetchData();
  }, [supabase]);

  const filteredRecords = useMemo(() => {
    let filteredData = data;
    if (filters) {
      filteredData = data.filter(item => {
        if (filters.periode) {
           if (!item.waktu) return false;
           
           const itemDate = new Date(item.waktu);
           const filterDate = new Date(filters.periode);
           const type = filters.type || 'Tahunan';
           
           if (type === 'Bulanan') {
             if (itemDate.getMonth() !== filterDate.getMonth() || itemDate.getFullYear() !== filterDate.getFullYear()) return false;
           } else if (type === 'Triwulan') {
             const qtItem = Math.floor(itemDate.getMonth() / 3);
             const qtFilter = Math.floor(filterDate.getMonth() / 3);
             if (qtItem !== qtFilter || itemDate.getFullYear() !== filterDate.getFullYear()) return false;
           } else if (type === 'Semester') {
             const sItem = Math.floor(itemDate.getMonth() / 6);
             const sFilter = Math.floor(filterDate.getMonth() / 6);
             if (sItem !== sFilter || itemDate.getFullYear() !== filterDate.getFullYear()) return false;
           } else if (type === 'Tahunan') {
             if (itemDate.getFullYear() !== filterDate.getFullYear()) return false;
           }
        }
        if (filters.unitFilter && filters.unitFilter !== 'Semua Unit') {
          if (item.unit !== filters.unitFilter && item.ruangan !== filters.unitFilter) return false;
        }
        if (filters.searchQuery) {
          const query = filters.searchQuery.toLowerCase();
          if (!item.observer?.toLowerCase().includes(query) && 
              !item.unit?.toLowerCase().includes(query) &&
              !item.ruangan?.toLowerCase().includes(query)) {
            return false;
          }
        }
        return true;
      });
    }
    return filteredData;
  }, [data, filters]);

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const componentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const triggerPrint = async () => {
      // Only execute print if we have data to print
      if (filteredRecords.length > 0 && componentRef.current) {
        setIsGeneratingPDF(true);
        try {
          const html2pdf = (await import('html2pdf.js')).default;
          
          const unitSlug = (filters?.unitFilter || 'Semua_Unit').replace(/[^a-zA-Z0-9]/g, '_');
          const dateStr = format(new Date(), 'dd-MM-yyyy');
          
          const opt = {
            margin:       [8, 8, 8, 8], // top, left, bottom, right in mm
            filename:     `Laporan_Dekontaminasi_Alat_${unitSlug}_${dateStr}.pdf`,
            image:        { type: 'jpeg', quality: 1 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'mm', format: [210, 330], orientation: 'portrait', compress: true },
            pagebreak:    { mode: ['avoid-all'] }
          } as any;

          await html2pdf().set(opt).from(componentRef.current).save();
        } catch (error) {
          console.error("PDF generation error:", error);
          alert('Gagal membuat PDF, silakan coba lagi.');
        } finally {
          setIsGeneratingPDF(false);
        }
      }
    };

    const triggerEdit = () => {
      if (filteredRecords.length === 1) {
        handleEdit(filteredRecords[0]);
      } else if (filteredRecords.length > 1) {
        alert('Terdapat lebih dari satu laporan. Silakan filter berdasarkan unit spesifik terlebih dahulu sebelum mengedit.');
      } else {
        alert('Tidak ada laporan untuk diedit.');
      }
    };

    const triggerDelete = () => {
      if (filteredRecords.length === 1) {
        handleDelete(filteredRecords[0].id);
      } else if (filteredRecords.length > 1) {
        alert('Terdapat lebih dari satu laporan. Silakan filter berdasarkan unit spesifik terlebih dahulu sebelum menghapus.');
      } else {
        alert('Tidak ada laporan untuk dihapus.');
      }
    };
    
    window.addEventListener('print-dekontaminasi', triggerPrint);
    window.addEventListener('edit-dekontaminasi', triggerEdit);
    window.addEventListener('delete-dekontaminasi', triggerDelete);
    
    return () => {
      window.removeEventListener('print-dekontaminasi', triggerPrint);
      window.removeEventListener('edit-dekontaminasi', triggerEdit);
      window.removeEventListener('delete-dekontaminasi', triggerDelete);
    };
  }, [filteredRecords, filters]);

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus laporan ini? Data yang dihapus tidak dapat dikembalikan.')) {
      try {
        const { error } = await supabase.from('audit_sessions').delete().eq('id', id);
        if (error) throw error;
        setData(prev => prev.filter(item => item.id !== id));
      } catch (err: any) {
        console.error("Gagal menghapus:", err);
        alert('Gagal menghapus laporan: ' + err.message);
      }
    }
  };

  const handleEdit = (record: any) => {
    alert('Fitur edit akan mengarahkan ke form input dengan data ini. (Belum diimplementasi)');
    // In actual implementation, we might navigate to:
    // router.push(`/dashboard/input/isolasi?edit=${record.id}&type=dekontaminasi_alat`)
  };

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center p-20 animate-pulse">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (filteredRecords.length === 0) {
    return (
       <div className="w-full bg-force-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 font-bold uppercase tracking-widest print:hidden">
         Belum ada data untuk laporan ini.
       </div>
    );
  }

  return (
    <div className="w-full font-sans bg-force-white text-force-black print:bg-force-white print:text-force-black print:m-0 z-50 print:z-[9999] relative">
      {isGeneratingPDF && (
        <div className="fixed inset-0 z-[9999] bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-blue-600 font-bold text-lg animate-pulse">Generating PDF...</p>
        </div>
      )}
      <div ref={componentRef} className="flex flex-col gap-8 print:gap-0 bg-transparent print:p-0">
        {filteredRecords.map((record, index) => (
          <React.Fragment key={record.id}>
            {index > 0 && (
              <div 
                data-html2canvas-ignore="true"
                className="w-full flex items-center justify-center print:hidden relative my-4"
              >
                <div className="w-full border-t-4 border-dashed border-slate-300 dark:border-slate-700"></div>
                <div className="absolute left-1/2 -top-2.5 -translate-x-1/2 bg-slate-100 dark:bg-slate-800 px-4 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest rounded-full shadow-sm">
                  Pembatas Laporan
                </div>
              </div>
            )}
            <div className="w-full">
              <DekontaminasiAlatReportPage 
                record={record} 
                indicatorItems={indicatorItems} 
                hospitalLogoUrl={hospitalLogoUrl} 
                idLocale={idLocale} 
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
