import React from 'react';
import F4Page from './F4Page';
import { 
  FileText, Calendar, BarChart3, TrendingUp, Award, ShieldCheck, 
  ArrowRight
} from 'lucide-react';

interface OverviewProps {
  onSelectSheet: (sheet: 'monthly' | 'quarterly' | 'semester' | 'annual') => void;
}

export default function OverviewOfficialReport({ onSelectSheet }: OverviewProps) {
  const reportCards = [
    {
      id: 'monthly' as const,
      title: 'Laporan Bulanan IPCN',
      period: 'Bulan September 2026',
      badge: 'Bulan Berjalan',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
      description: 'Laporan resmi bulanan IPCN mencakup surveilans HAIs (Phlebitis, ISK, Decubitus, VAP, IDO) per ruangan serta audit Hand Hygiene & APD.',
      highlights: ['Phlebitis: 9,1‰', 'ISK: 0‰', 'IDO: 0%', 'Hand Hygiene: 81%', 'APD: 99%'],
      icon: Calendar,
      btnColor: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
    {
      id: 'quarterly' as const,
      title: 'Laporan Triwulan PPI',
      period: 'Triwulan I (Januari - Maret 2026)',
      badge: 'Evaluasi 3 Bulan',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      description: 'Laporan penyerahan resmi kepada Direktur dengan analisis tren bulanan, evaluasi indikator HAIs, dan rekomendasi tindak lanjut.',
      highlights: ['Lembar Penyerahan Direktur', 'Phlebitis: 8,0‰', 'Hand Hygiene: 81%', 'APD: 98,6%'],
      icon: BarChart3,
      btnColor: 'bg-amber-600 hover:bg-amber-700 text-white',
    },
    {
      id: 'semester' as const,
      title: 'Laporan Semester PPI',
      period: 'Semester I & II 2026',
      badge: 'Evaluasi 6 Bulan',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
      description: 'Analisis kinerja 6 bulan pertama dan kedua program PPI rumah sakit dengan evaluasi trend dan perbandingan standar mutu Kemenkes.',
      highlights: ['Tren Semester HAIs', 'Evaluasi Ruangan', 'Capaian Mutu Nasional'],
      icon: TrendingUp,
      btnColor: 'bg-purple-600 hover:bg-purple-700 text-white',
    },
    {
      id: 'annual' as const,
      title: 'Laporan Tahunan PPI',
      period: 'Tahun 2025 Lengkap',
      badge: 'Dokumen Utama',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      description: 'Dokumen laporan tahunan komprehensif lengkap dengan Sambutan Direktur, Foto, Kaligrafi, Tabel IPAL 12 Bulan, dan Evaluasi HAIs 12 Bulan.',
      highlights: ['Sambutan & Foto Direktur', 'Tabel IPAL 12 Bulan', 'Tabel Evaluasi HAIs', 'BAB I - V Lengkap'],
      icon: Award,
      btnColor: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
  ];

  return (
    <div id="print-area-overview" className="w-full flex flex-col items-center">
      <F4Page pageNumber={1} totalPages={1}>
        {/* Header Title */}
        <div className="text-center my-2">
          <h2 className="text-sm font-bold uppercase tracking-wide">
            ARSIP LAPORAN RESMI PENCEGAHAN DAN PENGENDALIAN INFEKSI
          </h2>
          <p className="text-xs font-semibold text-emerald-800 uppercase">
            UOBK RSUD AL-MULK KOTA SUKABUMI
          </p>
          <p className="text-[8.5pt] text-slate-500">
            Dokumen Resmi Standar Akreditasi &amp; Pelaporan Terintegrasi
          </p>
        </div>

        {/* Deskripsi Pengantar */}
        <div className="mb-3 p-3 rounded-lg bg-slate-50 border border-slate-200 text-[9.5pt] text-justify leading-relaxed">
          <p className="indent-8">
            Portal <strong>Laporan Resmi Tim Pencegahan dan Pengendalian Infeksi (PPI)</strong> UOBK RSUD Al-Mulk Kota Sukabumi menyajikan dokumentasi laporan berkala yang tersusun rapi dalam format kertas resmi F4 (Indonesian Folio: 215mm x 330mm). Seluruh data indikator klinis terhubung secara langsung dengan input data surveilans dan audit harian untuk menjamin akurasi pelaporan rumah sakit.
          </p>
        </div>

        {/* Grid 4 Kartu Dokumen Resmi */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {reportCards.map((card) => {
            const Icon = card.icon;
            return (
              <div 
                key={card.id}
                className="p-3 rounded-lg border border-slate-300 bg-white hover:border-emerald-500 transition-all shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5">
                      <div className="p-1 rounded bg-emerald-50 text-emerald-700">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <h3 className="font-bold text-[9pt] text-slate-900 leading-tight">
                        {card.title}
                      </h3>
                    </div>
                    <span className={`text-[7pt] px-1.5 py-0.5 rounded-full font-bold uppercase border ${card.badgeColor}`}>
                      {card.badge}
                    </span>
                  </div>

                  <p className="text-[8pt] font-bold text-emerald-800 mb-1">
                    {card.period}
                  </p>

                  <p className="text-[7.5pt] text-slate-600 mb-2 leading-tight">
                    {card.description}
                  </p>

                  <div className="flex flex-wrap gap-1 mb-2">
                    {card.highlights.map((h, i) => (
                      <span 
                        key={i} 
                        className="text-[7pt] bg-slate-100 text-slate-700 px-1 py-0.2 rounded font-medium border border-slate-200"
                      >
                        ✓ {h}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectSheet(card.id)}
                  className={`w-full py-1.5 px-2 rounded font-bold text-[8pt] flex items-center justify-center gap-1 transition-all ${card.btnColor} cursor-pointer shadow-sm no-print`}
                >
                  <span>Buka Lembar Resmi</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Standar Regulasi & Landasan Hukum */}
        <div className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/50 text-[8pt] text-slate-800">
          <h4 className="font-bold text-emerald-950 uppercase mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            Landasan Hukum &amp; Regulasi Dokumen
          </h4>
          <ul className="list-disc list-inside space-y-0.5 text-justify">
            <li>Peraturan Menteri Kesehatan Republik Indonesia Nomor 27 Tahun 2017 tentang Pedoman Pencegahan dan Pengendalian Infeksi di Fasilitas Pelayanan Kesehatan.</li>
            <li>Standar Akreditasi Rumah Sakit Kementerian Kesehatan (STARKES) Bab Pencegahan dan Pengendalian Infeksi.</li>
            <li>Surat Keputusan Direktur UOBK RSUD Al-Mulk Kota Sukabumi tentang Pembentukan Tim Pencegahan dan Pengendalian Infeksi.</li>
          </ul>
        </div>
      </F4Page>
    </div>
  );
}
