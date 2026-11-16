import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, FileText, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import F4Page from '@/components/reports/official/F4Page';
import OfficialHeaderKop from '@/components/reports/official/OfficialHeaderKop';
import ZoomableReportViewer from '@/components/reports/ZoomableReportViewer';
import PdfDownloadButton from '@/components/reports/PdfDownloadButton';
import { IcraProgramItem } from '@/utils/icraData';
import { useAppContext } from '@/components/Providers';

interface IcraProgramReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: IcraProgramItem[];
  tahun: number;
}

export default function IcraProgramReportModal({
  isOpen,
  onClose,
  items,
  tahun,
}: IcraProgramReportModalProps) {
  const { hospitalLogoUrl } = useAppContext();

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => (Number(b.total_score) || 0) - (Number(a.total_score) || 0));
  }, [items]);

  const summary = useMemo(() => {
    const high = sortedItems.filter((i) => i.risk_level === 'Tinggi').length;
    const med = sortedItems.filter((i) => i.risk_level === 'Sedang').length;
    const low = sortedItems.filter((i) => i.risk_level === 'Rendah').length;
    const done = sortedItems.filter((i) => i.evaluasi_status === 'Tercapai').length;
    return { total: sortedItems.length, high, med, low, done };
  }, [sortedItems]);

  // Smart pagination for F4 Landscape (height 215mm - 50mm margins = 165mm usable = ~620px content)
  const paginatedPages = useMemo(() => {
    if (sortedItems.length === 0) {
      return [{ pageNumber: 1, isFirstPage: true, isLastPage: true, rows: [] as Array<IcraProgramItem & { rank: number }> }];
    }

    const estimateRowHeightPx = (row: IcraProgramItem) => {
      const masalahLines = Math.max(1, Math.ceil((row.masalah_risiko?.length || 20) / 36));
      const poaLines = Math.max(1, Math.ceil((row.strategi_poa?.length || 20) / 42));
      const tujuanLines = Math.max(1, Math.ceil((row.tujuan_umum?.length || 20) / 28));
      const maxLines = Math.max(masalahLines, poaLines, tujuanLines, 2);
      return 18 + maxLines * 14;
    };

    const pages: Array<{
      pageNumber: number;
      isFirstPage: boolean;
      isLastPage: boolean;
      rows: Array<IcraProgramItem & { rank: number }>;
    }> = [];

    const PAGE1_BUDGET_PX = 355; // Accounts for Kop Surat + Title + Summary Box + Table Header + Footer
    const NEXT_PAGE_BUDGET_PX = 470; // Running Header + Table Header + Footer
    const SIGNATURE_RESERVE_PX = 145; // Space for Legend + Official Signature block on last page

    let currentRows: Array<IcraProgramItem & { rank: number }> = [];
    let currentUsed = 0;

    sortedItems.forEach((item, idx) => {
      const rowWithRank = { ...item, rank: idx + 1 };
      const rowH = estimateRowHeightPx(item);
      const isFirstPage = pages.length === 0;
      const limit = isFirstPage ? PAGE1_BUDGET_PX : NEXT_PAGE_BUDGET_PX;

      if (currentRows.length > 0 && currentUsed + rowH > limit) {
        pages.push({
          pageNumber: pages.length + 1,
          isFirstPage,
          isLastPage: false,
          rows: currentRows,
        });
        currentRows = [rowWithRank];
        currentUsed = rowH;
      } else {
        currentRows.push(rowWithRank);
        currentUsed += rowH;
      }
    });

    if (currentRows.length > 0) {
      const isFirst = pages.length === 0;
      const budgetForLast = isFirst ? PAGE1_BUDGET_PX : NEXT_PAGE_BUDGET_PX;
      const fitsSignatureWithRows = currentUsed + SIGNATURE_RESERVE_PX <= budgetForLast;

      pages.push({
        pageNumber: pages.length + 1,
        isFirstPage: isFirst,
        isLastPage: fitsSignatureWithRows,
        rows: currentRows,
      });

      if (!fitsSignatureWithRows) {
        pages.push({
          pageNumber: pages.length + 1,
          isFirstPage: false,
          isLastPage: true,
          rows: [],
        });
      }
    }

    return pages.map((p, idx) => ({
      ...p,
      isLastPage: idx === pages.length - 1,
    }));
  }, [sortedItems]);

  if (!isOpen) return null;

  const targetId = 'icra-program-official-report';
  const todayStr = format(new Date(), 'dd MMMM yyyy', { locale: idLocale });

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-2 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        className="w-full max-w-[1440px] h-[94vh] bg-[#0e112a] border border-indigo-500/35 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden"
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-[#121536] border-b border-indigo-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-white">
                PRATINJAU LAPORAN RESMI ICRA PROGRAM PPI
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <PdfDownloadButton
              targetElementId={targetId}
              filename={`Laporan_ICRA_Program_PPI_Tahun_${tahun}_RSUD_Al_Mulk.pdf`}
              title="Unduh PDF Resmi Format F4 Landscape (Margin 2,5 cm)"
              orientation="landscape"
              paperSize="f4"
              margin={0}
              size="md"
            />
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer transition-colors"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Report Preview Area */}
        <div className="flex-1 overflow-hidden bg-slate-900/95">
          <ZoomableReportViewer reportId={targetId} showToolbar={false} className="h-full">
            <div id={targetId} data-orientation="landscape" className="w-full flex flex-col items-center py-4">
              {paginatedPages.map((page) => (
                <F4Page
                  key={page.pageNumber}
                  orientation="landscape"
                  pageNumber={page.pageNumber}
                  totalPages={paginatedPages.length}
                  showFooterMeta={true}
                >
                  {/* Page 1: Kop Surat & Judul */}
                  {page.isFirstPage ? (
                    <>
                      <OfficialHeaderKop
                        theme="light"
                        reportTitle={`MATRIKS PENILAIAN RISIKO PENGENDALIAN INFEKSI (ICRA PROGRAM PPI)`}
                        periode={`TAHUN ANGGARAN ${tahun} • PRIORITAS RISIKO & PLAN OF ACTION (POA)`}
                      />

                      {/* Ringkasan Eksekutif */}
                      <div className="grid grid-cols-4 gap-2 mb-3 text-[8.5pt] text-black">
                        <div className="border border-black bg-slate-50 px-2.5 py-1.5 text-center">
                          <span className="block text-[7.5pt] uppercase font-bold text-slate-600">Total Risiko Teridentifikasi</span>
                          <span className="font-black text-[11pt]">{summary.total} Masalah</span>
                        </div>
                        <div className="border border-black bg-rose-50 px-2.5 py-1.5 text-center">
                          <span className="block text-[7.5pt] uppercase font-bold text-rose-800">Risiko Tinggi (Skor &ge; 45)</span>
                          <span className="font-black text-[11pt] text-rose-700">{summary.high} Item</span>
                        </div>
                        <div className="border border-black bg-amber-50 px-2.5 py-1.5 text-center">
                          <span className="block text-[7.5pt] uppercase font-bold text-amber-800">Risiko Sedang (18 – 44)</span>
                          <span className="font-black text-[11pt] text-amber-700">{summary.med} Item</span>
                        </div>
                        <div className="border border-black bg-emerald-50 px-2.5 py-1.5 text-center">
                          <span className="block text-[7.5pt] uppercase font-bold text-emerald-800">Risiko Rendah (&lt; 18)</span>
                          <span className="font-black text-[11pt] text-emerald-700">{summary.low} Item</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Running Header Halaman Lanjutan */
                    <div className="border-b-[1.5px] border-black pb-1.5 mb-2.5 flex items-center justify-between text-[8pt] text-black">
                      <div className="flex items-center gap-2">
                        {hospitalLogoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={hospitalLogoUrl} alt="Logo RS" className="w-5 h-5 object-contain" />
                        ) : (
                          <ShieldCheck className="w-4 h-4 text-black" />
                        )}
                        <span className="font-extrabold uppercase">
                          TIM PPI • UOBK RSUD AL-MULK KOTA SUKABUMI
                        </span>
                      </div>
                      <span className="italic font-semibold">
                        Lanjutan Matriks ICRA Program PPI Tahun {tahun}
                      </span>
                    </div>
                  )}

                  {/* Tabel Data ICRA Program */}
                  {page.rows.length > 0 && (
                    <table className="w-full border-collapse border border-black text-[8pt] leading-snug text-black mb-3">
                      <thead>
                        <tr className="bg-slate-100 text-center font-extrabold" style={{ backgroundColor: '#f1f5f9' }}>
                          <th className="border border-black px-1 py-1.5 w-[3%]">Prioritas</th>
                          <th className="border border-black px-1.5 py-1.5 w-[10%]">Kategori & Unit</th>
                          <th className="border border-black px-2 py-1.5 w-[20%]">Potensi Risiko / Masalah Infeksi</th>
                          <th className="border border-black px-1 py-1.5 w-[4%]" title="Probability">P</th>
                          <th className="border border-black px-1 py-1.5 w-[4%]" title="Impact / Dampak">I</th>
                          <th className="border border-black px-1 py-1.5 w-[4%]" title="Preparedness / Kesiapan">S</th>
                          <th className="border border-black px-1 py-1.5 w-[5%]">Skor</th>
                          <th className="border border-black px-1 py-1.5 w-[7%]">Level</th>
                          <th className="border border-black px-1.5 py-1.5 w-[13%]">Tujuan Umum</th>
                          <th className="border border-black px-2 py-1.5 w-[18%]">Strategi / Plan of Action (POA)</th>
                          <th className="border border-black px-1.5 py-1.5 w-[12%]">PJ, Target & Evaluasi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {page.rows.map((row) => {
                          const lvlBg =
                            row.risk_level === 'Tinggi'
                              ? 'bg-rose-100 text-rose-900 font-black'
                              : row.risk_level === 'Sedang'
                              ? 'bg-amber-100 text-amber-900 font-bold'
                              : 'bg-emerald-100 text-emerald-900 font-bold';
                          return (
                            <tr key={row.id} className="align-top">
                              <td className="border border-black px-1 py-1.5 text-center font-black">
                                #{row.rank}
                              </td>
                              <td className="border border-black px-1.5 py-1.5 text-left">
                                <div className="font-bold">{row.kategori_risiko}</div>
                                <div className="text-[7pt] text-slate-700 mt-0.5">Unit: {row.unit_terkait}</div>
                              </td>
                              <td className="border border-black px-2 py-1.5 text-left">{row.masalah_risiko}</td>
                              <td className="border border-black px-1 py-1.5 text-center">{row.probability}</td>
                              <td className="border border-black px-1 py-1.5 text-center">{row.impact}</td>
                              <td className="border border-black px-1 py-1.5 text-center">{row.preparedness}</td>
                              <td className="border border-black px-1 py-1.5 text-center font-black text-[9pt]">
                                {row.total_score}
                              </td>
                              <td className={`border border-black px-1 py-1.5 text-center uppercase text-[7.5pt] ${lvlBg}`}>
                                {row.risk_level}
                              </td>
                              <td className="border border-black px-1.5 py-1.5 text-left">{row.tujuan_umum}</td>
                              <td className="border border-black px-2 py-1.5 text-left">{row.strategi_poa}</td>
                              <td className="border border-black px-1.5 py-1.5 text-left text-[7.5pt]">
                                <div><strong>PJ:</strong> {row.pj_pelaksana}</div>
                                <div><strong>Target:</strong> {row.target_waktu}</div>
                                <div className="mt-0.5">
                                  <strong>Status:</strong>{' '}
                                  <span className="underline">{row.evaluasi_status}</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}

                  {sortedItems.length === 0 && (
                    <div className="border border-dashed border-slate-400 p-8 text-center text-[10pt] text-slate-600 my-6">
                      Belum ada data risiko ICRA Program PPI untuk tahun {tahun}.
                    </div>
                  )}

                  {/* Keterangan Rumus & Tanda Tangan Resmi (Halaman Terakhir) */}
                  {page.isLastPage && (
                    <div className="mt-auto pt-2 text-[8pt] text-black">
                      <div className="border border-slate-400 bg-slate-50 px-3 py-1.5 mb-3 flex flex-wrap items-center justify-between gap-2 text-[7.5pt]">
                        <span>
                          <strong>Keterangan Skor:</strong> P (Probability 1-5) × I (Impact 1-5) × S (System Preparedness 1-5; makin buruk kesiapan skor makin tinggi).
                        </span>
                        <span>
                          <strong>Kategori:</strong> Tinggi (&ge; 45) • Sedang (18–44) • Rendah (&lt; 18)
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-8 text-center pt-1">
                        <div>
                          <p className="font-bold">Mengetahui,</p>
                          <p className="font-bold mb-14">Ketua Komite / Tim PPI</p>
                          <p className="font-bold underline">dr. Nurul Iman</p>
                          <p className="text-[7.5pt]">UOBK RSUD Al-Mulk Kota Sukabumi</p>
                        </div>
                        <div>
                          <p>Sukabumi, {todayStr}</p>
                          <p className="font-bold mb-14">Penyusun (IPCN)</p>
                          <p className="font-bold underline">Adi Tresa Purnama, A.M.Kep</p>
                          <p className="text-[7.5pt]">Infection Prevention and Control Nurse</p>
                        </div>
                      </div>
                    </div>
                  )}
                </F4Page>
              ))}
            </div>
          </ZoomableReportViewer>
        </div>
      </motion.div>
    </div>
  );
}
