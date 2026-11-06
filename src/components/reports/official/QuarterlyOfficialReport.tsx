import React from 'react';
import F4Page from './F4Page';
import ReportCover from './ReportCover';
import OfficialModernBarChart from './OfficialModernBarChart';
import { OfficialReportData, useOfficialReportData } from '@/hooks/useOfficialReportData';

interface QuarterlyReportProps {
  reportData?: OfficialReportData;
  quarter?: number;
  year?: number;
}

export default function QuarterlyOfficialReport({
  reportData,
  quarter = 2, // Default: Triwulan III (index 2)
  year = 2026,
}: QuarterlyReportProps) {
  const internalData = useOfficialReportData({
    periodType: 'quarterly',
    quarter,
    year,
  });

  const data = reportData || internalData;
  const qData = data.quarterData;
  const reportYear = data.year || year;
  const totalPages = 11;

  const m1 = qData.months[0];
  const m2 = qData.months[1];
  const m3 = qData.months[2];

  const phlebitis = qData.haisRows.phlebitis;
  const isk = qData.haisRows.isk;
  const decubitus = qData.haisRows.decubitus;
  const vap = qData.haisRows.vap;
  const ido = qData.haisRows.ido;

  return (
    <div id="print-area-quarterly" className="w-full flex flex-col items-center official-pages-container transition-all">
      {/* ========================================================= */}
      {/* HALAMAN 1: COVER DOKUMEN RESMI F4                         */}
      {/* ========================================================= */}
      <F4Page pageNumber={1} totalPages={totalPages} isCover>
        <ReportCover
          reportType="quarterly"
          title={`LAPORAN TRIWULAN ${qData.quarterRoman} ${reportYear}`}
          subtitle="PENCEGAHAN DAN PENGENDALIAN INFEKSI (PPI)"
          year={String(reportYear)}
        />
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 2: BAB I PENDAHULUAN - LATAR BELAKANG             */}
      {/* ========================================================= */}
      <F4Page pageNumber={2} totalPages={totalPages}>
        <div className="text-center font-bold mb-4 pt-2">
          <h2 className="text-sm uppercase tracking-wide">
            LAPORAN TRIWULAN {qData.quarterRoman} {reportYear}
          </h2>
          <h3 className="text-xs uppercase text-emerald-800">
            PENCEGAHAN DAN PENGENDALIAN INFEKSI (PPI)
          </h3>
          <p className="text-[10pt] font-semibold text-slate-700">UOBK RSUD AL-MULK KOTA SUKABUMI</p>
        </div>

        <div className="mb-2 text-justify">
          <h4 className="font-bold text-center uppercase tracking-wide border-b border-black pb-1 mb-4 text-xs">
            BAB I PENDAHULUAN
          </h4>

          <h5 className="font-bold text-[11pt] mb-2.5">Latar Belakang</h5>
          <p className="indent-8 mb-3 leading-relaxed">
            Pencegahan dan Pengendalian infeksi di rumah sakit merupakan suatu upaya kegiatan untuk meminimalkan atau mencegah terjadinya infeksi pada pasien, petugas, pengunjung dan masyarakat di sekitar Rumah Sakit. Program pencegahan dan pengendalian infeksi antara lain; Pencegahan infeksi, penggunaan antibiotik secara rasional, kewaspadaan standar, surveilans, pendidikan dan pelatihan.
          </p>
          <p className="indent-8 mb-3 leading-relaxed">
            Kegaiatan surveilans infeksi dirumah sakit merupakan salah satu kegiatan yang penting dan luas dalam program pengendalian infeksi dan suatu hal yang harus dilakukan untuk mencapai keberhasilan dari Program PPI.
          </p>
          <p className="indent-8 mb-3 leading-relaxed">
            Ditinjau dari asal atau didapatnya infeksi dapat berasal dari komunitas atau berasal dari lingkungan rumah sakit (Hospital Acquired Infection) yang sebelumnya dikenal istilah infeksi nosokomial. Karena sering kali tidak bisa secara pasti ditentukan asal infeksi, maka sekarang istilah infeksi nosokomial diganti dengan istilah baru yaitu Healthcare Associated Infections (HAIs).
          </p>
          <p className="indent-8 mb-3 leading-relaxed">
            Healthcare Associated Infections (HAIs) merupakan kejadian infeksi yang didapatkan penderita setelah mendapatkan perawatan &gt; 48 jam dan pasien tidak dalam masa inkubasi. Macam kejadian HAIs banyak dihubungkan karena pemasangan alat, seperti CAUTI (Catheter Associated Urinary Tract Infection), VAP (Ventilator Associated Pneumonia), CRBSI (Catheter IV Central Related Blood Stream Infections) dan IDO (Infeksi Daerah Operasi) karena tindakan operasi.
          </p>
          <p className="indent-8 mb-3 leading-relaxed">
            Pengetahuan tentang infeksi nosokomial dan pencegahannya merupakan stimulus sosial yang dapat menimbulkan respon emosional terhadap upaya universal precaution sehingga akan meningkatkan peran sertanya dalam upaya pencegahan infeksi nosokomial.
          </p>
          <p className="indent-8 leading-relaxed">
            Kegagalan melakukan kebersihan tangan yang baik dan benar dianggap sebagai penyebab utama infeksi nosokomial atau HAIs dan penyebaran mikroorganisme multiresisten di fasilitas pelayanan kesehatan dan telah diakui sebagai kontribusi yang penting terhadap timbulnya wabah (Boyce and Pittet,, 2002). Sehingga perlu adanya audit kepatuhan pelaksanaan kewaspadaan standar yang dilakukan oleh Tim Pencegahan dan Pengendalian Infeksi di UOBK RSUD Al-Mulk Kota Sukabumi.
          </p>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 3: TUJUAN UMUM & KHUSUS                           */}
      {/* ========================================================= */}
      <F4Page pageNumber={3} totalPages={totalPages}>
        <div className="mb-4 pt-2 text-justify">
          <h5 className="font-bold text-[11pt] mb-3">Tujuan Umum dan Khusus</h5>
          
          <div className="mb-4">
            <p className="font-bold text-[10.5pt] mb-1">Tujuan Umum</p>
            <p className="indent-8 leading-relaxed">
              Mengetahui angka kepatuhan pelaksanaan kewaspadaan standar, dan surveilans Rumah Sakit.
            </p>
          </div>

          <div className="mb-5">
            <p className="font-bold text-[10.5pt] mb-1.5">Tujuan Khusus</p>
            <ol className="list-decimal pl-10 space-y-2 leading-relaxed">
              <li>Mendapatkan data dasar infeksi di UOBK RSUD Al-Mulk.</li>
              <li>Mengukur dan menilai keberhasilan suatu Program PPI di RSUD Al-Mulk.</li>
              <li>Mengetahui permasalahan tentang kesehatan yang memerlukan penanggulangan.</li>
            </ol>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200">
            <h5 className="font-bold text-[11pt] mb-2.5">Ruang Lingkup Laporan</h5>
            <p className="indent-8 leading-relaxed mb-2">
              Laporan Triwulan {qData.quarterRoman} ini mencakup hasil surveilans HAIs dan audit kepatuhan kewaspadaan standar selama periode {m1.monthName} sampai dengan {m3.monthName} {reportYear}, yang meliputi seluruh area rawat inap (Ranap Dewasa, Ranap Anak, Ranap Bedah, Ranap Kebidanan), kamar operasi IBS, dan unit pelayanan penunjang di UOBK RSUD Al-Mulk Kota Sukabumi.
            </p>
          </div>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 4: BAB II SURVEILANS & TABEL 1 HAIs TRIWULAN      */}
      {/* ========================================================= */}
      <F4Page pageNumber={4} totalPages={totalPages}>
        <div className="pt-2 text-justify">
          <h4 className="font-bold text-center uppercase tracking-wide border-b border-black pb-1 mb-4 text-xs">
            BAB II LAPORAN KEGIATAN PROGRAM PPI
          </h4>

          <div className="mb-3">
            <h5 className="font-bold text-[11pt] mb-1.5">SURVEILANS</h5>
            <p className="indent-8 mb-2.5 leading-relaxed">
              Surveilans infeksi Rumah Sakit adalah suatu proses yang dinamis, sistematis, terus menerus dalam pengumpulan, identifikasi, analisis dan interpretasi data kesehatan yang penting pada suatu populasi spesifik dan didiseminasikan secara berkala kepada pihak-pihak yang memerlukan unuk digunakan dalam perencanaan, penerapan, serta evaluasi suatu tindakan yang berhubungan dengan kesehatan (Kemenkes, 2011).
            </p>
            <p className="indent-8 mb-2.5 leading-relaxed">
              Metode surveilans yang digunakan adalah Surveilans Hasil (Outcome Surveilans). Pada umumnya yang diperoleh dipantau adalah kejadian Phlebitis, Infeksi Saluran Kemih (ISK), Kejadian Decubitus, IDO dan VAP.
            </p>
            <p className="indent-8 mb-2.5 leading-relaxed">
              Angka Phlebitis yang dimasukkan kedalam HAIs adalah grade II.
            </p>
            <p className="font-bold text-[10.5pt] mt-3 mb-1">
              Angka kejadian (Incident Rate) HAIs {qData.quarterLabel}
            </p>
          </div>

          <div className="mt-2">
            <p className="text-center font-bold text-[9.5pt] mb-2">
              Tabel.1 Incident Rate HAIs UOBK RSUD Al-Mulk {qData.periodLabel}
            </p>

            {/* Tabel 1 HAIs Triwulan Rekapitulasi */}
            <table className="w-full border-collapse border border-black text-center text-[8.5pt]">
              <thead>
                <tr className="bg-slate-100 font-bold">
                  <th className="border border-black p-1 w-1/4" rowSpan={2}>JENIS INFEKSI</th>
                  <th className="border border-black p-1 w-1/4" rowSpan={2}>ALAT INVASIF</th>
                  <th className="border border-black p-1" colSpan={3}>BULAN</th>
                  <th className="border border-black p-1 w-1/6" rowSpan={2}>TOTAL</th>
                </tr>
                <tr className="bg-slate-100 font-bold">
                  <th className="border border-black p-1">{m1.monthName.toUpperCase()}</th>
                  <th className="border border-black p-1">{m2.monthName.toUpperCase()}</th>
                  <th className="border border-black p-1">{m3.monthName.toUpperCase()}</th>
                </tr>
              </thead>
              <tbody>
                {/* PHLEBITIS */}
                <tr>
                  <td className="border border-black p-1 font-bold text-left" rowSpan={3}>PHLEBITIS</td>
                  <td className="border border-black p-1 text-left">Total hari pemasangan</td>
                  <td className="border border-black p-1">{phlebitis.m1.days}</td>
                  <td className="border border-black p-1">{phlebitis.m2.days}</td>
                  <td className="border border-black p-1">{phlebitis.m3.days}</td>
                  <td className="border border-black p-1 font-bold">{phlebitis.total.days}</td>
                </tr>
                <tr>
                  <td className="border border-black p-1 text-left">Infeksi</td>
                  <td className="border border-black p-1">{phlebitis.m1.cases}</td>
                  <td className="border border-black p-1">{phlebitis.m2.cases}</td>
                  <td className="border border-black p-1 font-bold">{phlebitis.m3.cases}</td>
                  <td className="border border-black p-1 font-bold">{phlebitis.total.cases}</td>
                </tr>
                <tr className="bg-amber-50/60 font-semibold">
                  <td className="border border-black p-1 text-left">Rate In ‰</td>
                  <td className="border border-black p-1">{phlebitis.m1.rate}‰</td>
                  <td className="border border-black p-1">{phlebitis.m2.rate}‰</td>
                  <td className="border border-black p-1 text-amber-700 font-bold">{phlebitis.m3.rate}‰</td>
                  <td className="border border-black p-1 font-bold text-amber-800">{phlebitis.total.rate}‰</td>
                </tr>

                {/* ISK */}
                <tr>
                  <td className="border border-black p-1 font-bold text-left" rowSpan={3}>ISK</td>
                  <td className="border border-black p-1 text-left">Total hari pemasangan</td>
                  <td className="border border-black p-1">{isk.m1.days}</td>
                  <td className="border border-black p-1">{isk.m2.days}</td>
                  <td className="border border-black p-1">{isk.m3.days}</td>
                  <td className="border border-black p-1 font-bold">{isk.total.days}</td>
                </tr>
                <tr>
                  <td className="border border-black p-1 text-left">Infeksi</td>
                  <td className="border border-black p-1">{isk.m1.cases}</td>
                  <td className="border border-black p-1">{isk.m2.cases}</td>
                  <td className="border border-black p-1">{isk.m3.cases}</td>
                  <td className="border border-black p-1 font-bold">{isk.total.cases}</td>
                </tr>
                <tr className="font-semibold">
                  <td className="border border-black p-1 text-left">Rate In ‰</td>
                  <td className="border border-black p-1">{isk.m1.rate}‰</td>
                  <td className="border border-black p-1">{isk.m2.rate}‰</td>
                  <td className="border border-black p-1">{isk.m3.rate}‰</td>
                  <td className="border border-black p-1 font-bold">{isk.total.rate}‰</td>
                </tr>

                {/* DECUBITUS */}
                <tr>
                  <td className="border border-black p-1 font-bold text-left" rowSpan={3}>Decubitus</td>
                  <td className="border border-black p-1 text-left">Total hari tirah baring</td>
                  <td className="border border-black p-1">{decubitus.m1.days}</td>
                  <td className="border border-black p-1">{decubitus.m2.days}</td>
                  <td className="border border-black p-1">{decubitus.m3.days}</td>
                  <td className="border border-black p-1 font-bold">{decubitus.total.days}</td>
                </tr>
                <tr>
                  <td className="border border-black p-1 text-left">Infeksi</td>
                  <td className="border border-black p-1">{decubitus.m1.cases}</td>
                  <td className="border border-black p-1">{decubitus.m2.cases}</td>
                  <td className="border border-black p-1">{decubitus.m3.cases}</td>
                  <td className="border border-black p-1 font-bold">{decubitus.total.cases}</td>
                </tr>
                <tr className="font-semibold">
                  <td className="border border-black p-1 text-left">Rate In ‰</td>
                  <td className="border border-black p-1">{decubitus.m1.rate}‰</td>
                  <td className="border border-black p-1">{decubitus.m2.rate}‰</td>
                  <td className="border border-black p-1">{decubitus.m3.rate}‰</td>
                  <td className="border border-black p-1 font-bold">{decubitus.total.rate}‰</td>
                </tr>

                {/* VAP */}
                <tr>
                  <td className="border border-black p-1 font-bold text-left" rowSpan={3}>VAP</td>
                  <td className="border border-black p-1 text-left">Total hari pemasangan</td>
                  <td className="border border-black p-1">{vap.m1.days}</td>
                  <td className="border border-black p-1">{vap.m2.days}</td>
                  <td className="border border-black p-1">{vap.m3.days}</td>
                  <td className="border border-black p-1 font-bold">{vap.total.days}</td>
                </tr>
                <tr>
                  <td className="border border-black p-1 text-left">Infeksi</td>
                  <td className="border border-black p-1">{vap.m1.cases}</td>
                  <td className="border border-black p-1">{vap.m2.cases}</td>
                  <td className="border border-black p-1">{vap.m3.cases}</td>
                  <td className="border border-black p-1 font-bold">{vap.total.cases}</td>
                </tr>
                <tr className="font-semibold">
                  <td className="border border-black p-1 text-left">Rate In ‰</td>
                  <td className="border border-black p-1">{vap.m1.rate}‰</td>
                  <td className="border border-black p-1">{vap.m2.rate}‰</td>
                  <td className="border border-black p-1">{vap.m3.rate}‰</td>
                  <td className="border border-black p-1 font-bold">{vap.total.rate}‰</td>
                </tr>

                {/* IDO */}
                <tr>
                  <td className="border border-black p-1 font-bold text-left" rowSpan={3}>IDO</td>
                  <td className="border border-black p-1 text-left font-semibold" colSpan={5}>
                    TINDAKAN OPERASI DI IBS
                  </td>
                </tr>
                <tr>
                  <td className="border border-black p-1 text-left">Total Operasi</td>
                  <td className="border border-black p-1">{ido.m1.days}</td>
                  <td className="border border-black p-1">{ido.m2.days}</td>
                  <td className="border border-black p-1">{ido.m3.days}</td>
                  <td className="border border-black p-1 font-bold">{ido.total.days}</td>
                </tr>
                <tr className="font-semibold">
                  <td className="border border-black p-1 text-left">Rate In %</td>
                  <td className="border border-black p-1">{ido.m1.rate}%</td>
                  <td className="border border-black p-1">{ido.m2.rate}%</td>
                  <td className="border border-black p-1">{ido.m3.rate}%</td>
                  <td className="border border-black p-1 font-bold">{ido.total.rate}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 5: GRAFIK HAIs & GRAFIK PHLEBITIS                 */}
      {/* ========================================================= */}
      <F4Page pageNumber={5} totalPages={totalPages}>
        <div className="mb-2 pt-2 text-justify">
          {/* Grafik 1 HAIs Triwulan */}
          <OfficialModernBarChart
            title={`Grafik.1 Incident Rate HAIs UOBK RSUD Al-Mulk ${qData.periodLabel}`}
            data={[
              { label: 'PHLEBITIS', value: phlebitis.total.rate, formattedValue: `${phlebitis.total.rate}‰`, color: '#f59e0b' },
              { label: 'ISK', value: isk.total.rate, formattedValue: `${isk.total.rate}‰`, color: '#0f2942' },
              { label: 'DECUBITUS', value: decubitus.total.rate, formattedValue: `${decubitus.total.rate}‰`, color: '#20b2aa' },
              { label: 'IDO', value: ido.total.rate, formattedValue: `${ido.total.rate}%`, color: '#10b981' },
              { label: 'VAP', value: vap.total.rate, formattedValue: `${vap.total.rate}‰`, color: '#3b82f6' },
            ]}
            height={130}
          />
          <p className="text-[7.5pt] text-slate-600 text-center mb-2 font-semibold">
            Target Standar Kemenkes: Phlebitis ≤ 1‰, ISK ≤ 4.7‰, Decubitus ≤ 1.5‰, IDO ≤ 2%, VAP ≤ 5.8‰
          </p>

          <p className="text-[9.5pt] leading-relaxed mb-3">
            <span className="font-bold">Analisa : </span>
            Berdasarkan grafik diatas menunjukkan bahwa insiden rate HAIs {qData.quarterLabel} yang paling tinggi kejadian HAIs yaitu di bulan {m3.monthName} yaitu {phlebitis.m3.rate}‰, jumlah hari terpasang alat {phlebitis.m3.days} dengan {phlebitis.m3.cases} kejadian phlebitis. Sedangkan kejadian infeksi HAIs yang lainnya tidak ada kejadian infeksi.
          </p>

          <h5 className="font-bold text-[10.5pt] mt-3 mb-1">Angka Kejadian (Incidence Rate) Phlebitis</h5>
          <p className="indent-8 text-[9.5pt] leading-relaxed mb-2">
            Angka Kejadian (incidence Rate) Phlebitis per 1000 hari pemakaian intra vascular line (‰) pada bulan {m1.monthName} - {m3.monthName} {reportYear}, berdasarkan Visual Infusion Phlebitis Score (VIPS) score 2.
          </p>

          {/* Grafik 2 Phlebitis Triwulan */}
          <OfficialModernBarChart
            title={`Grafik.2 Insidence Rate Phlebitis Di UOBK RSUD Al-Mulk ${qData.periodLabel}`}
            data={[
              { label: m1.shortName, value: phlebitis.m1.rate, formattedValue: `${phlebitis.m1.rate}‰`, color: '#20b2aa' },
              { label: m2.shortName, value: phlebitis.m2.rate, formattedValue: `${phlebitis.m2.rate}‰`, color: '#0f2942' },
              { label: m3.shortName, value: phlebitis.m3.rate, formattedValue: `${phlebitis.m3.rate}‰`, color: '#f59e0b' },
            ]}
            height={125}
          />
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 6: ANALISA PHLEBITIS & TABEL 2 PHLEBITIS          */}
      {/* ========================================================= */}
      <F4Page pageNumber={6} totalPages={totalPages}>
        <div className="mb-2 pt-2 text-justify">
          <p className="text-[9.5pt] leading-relaxed mb-3">
            <span className="font-bold">Analisa : </span>
            Berdasarkan grafik diatas menunjukkan bahwa insiden rate phlebitis {qData.quarterLabel} periode {m1.monthName} - {m3.monthName} {reportYear}, angka infeksi tertinggi ada di bulan {m3.monthName} yaitu {phlebitis.m3.rate}‰, angka infeksi terendah ada di bulan {m1.monthName} yaitu {phlebitis.m1.rate}‰. Belum mencapai target standar kemenkes ≤ 1 ‰. Phlebitis terjadi kemungkinan karena kurangnya penerapan SPO Bundles / pencegahan phlebitis, pemilihan IV catheter tidak sesuai ukuran vena, pemillihan dressing IV tidak sesuai regulasi, perawatan insersi infus kurang adekuat, kondisi pasien immunocompromised, pemberian obat-obatan parenteral konsentrat tinggi, personal hygiene kurang, penyakit sekunder dan lain-lainnya.
          </p>

          <h5 className="font-bold text-[10pt] mb-1.5">Rencana tindak lanjut :</h5>
          <ol className="list-decimal pl-8 space-y-1 text-[9pt] leading-relaxed mb-4">
            <li>Lengkapi fasilitas pencegahan phlebitis</li>
            <li>Re sosialisasi SPO pencegahan phlebitis</li>
            <li>Monitoring evaluasi penerapan SPO pencegahan phlebitis</li>
            <li>Berikan feed back kepatuhan SPO dan angka kejadian phlebitis</li>
          </ol>

          <p className="text-center font-bold text-[9pt] mb-1">
            Tabel 2. Insidence Rate Phlebitis Di UOBK RSUD Al-Mulk {qData.periodLabel}
          </p>
          <table className="w-full border-collapse border border-black text-center text-[8.5pt]">
            <thead>
              <tr className="bg-slate-100 font-bold">
                <th className="border border-black p-1 w-1/4">INDIKATOR</th>
                <th className="border border-black p-1" colSpan={3}>BULAN</th>
              </tr>
              <tr className="bg-slate-100 font-bold">
                <th className="border border-black p-1"></th>
                <th className="border border-black p-1">{m1.shortName}</th>
                <th className="border border-black p-1">{m2.shortName}</th>
                <th className="border border-black p-1">{m3.shortName}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-1 text-left font-semibold">Hari terpasang alat</td>
                <td className="border border-black p-1">{phlebitis.m1.days}</td>
                <td className="border border-black p-1">{phlebitis.m2.days}</td>
                <td className="border border-black p-1">{phlebitis.m3.days}</td>
              </tr>
              <tr>
                <td className="border border-black p-1 text-left font-semibold">Phlebitis</td>
                <td className="border border-black p-1">{phlebitis.m1.cases}</td>
                <td className="border border-black p-1">{phlebitis.m2.cases}</td>
                <td className="border border-black p-1 font-bold">{phlebitis.m3.cases}</td>
              </tr>
              <tr className="bg-amber-50/60 font-bold">
                <td className="border border-black p-1 text-left">‰</td>
                <td className="border border-black p-1">{phlebitis.m1.rate}‰</td>
                <td className="border border-black p-1">{phlebitis.m2.rate}‰</td>
                <td className="border border-black p-1 text-amber-800">{phlebitis.m3.rate}‰</td>
              </tr>
            </tbody>
          </table>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 7: ISK & DECUBITUS TRIWULAN                       */}
      {/* ========================================================= */}
      <F4Page pageNumber={7} totalPages={totalPages}>
        <div className="mb-2 pt-2 text-justify">
          <h5 className="font-bold text-[10.5pt] mb-1">
            Angka Kejadian (Incidence Rate) Infeksi Saluran Kemih (ISK)
          </h5>
          <p className="indent-8 text-[9.5pt] leading-relaxed mb-2">
            Angka Kejadian (incidence Rate) Infeksi Saluran Kemih (ISK) per 1000 hari pemakaian alat (‰) di UOBK RSUD Al-Mulk {qData.periodLabel}
          </p>

          {/* Grafik 3 ISK */}
          <OfficialModernBarChart
            title={`Grafik 3. Insidence Rate Infeksi Saluran Kemih Di UOBK RSUD Al-Mulk ${qData.periodLabel}`}
            data={[
              { label: m1.shortName, value: isk.m1.rate, formattedValue: `${isk.m1.rate}‰`, color: '#0f2942' },
              { label: m2.shortName, value: isk.m2.rate, formattedValue: `${isk.m2.rate}‰`, color: '#20b2aa' },
              { label: m3.shortName, value: isk.m3.rate, formattedValue: `${isk.m3.rate}‰`, color: '#3b82f6' },
            ]}
            height={115}
          />

          <p className="text-[9.5pt] leading-relaxed mb-2">
            <span className="font-bold">Analisa : </span>
            Berdasarkan grafik diatas menunjukkan bahwa insiden rate ISK selama {qData.periodLabel}, tidak ada kejadian Infeksi Saluran Kemih.
          </p>

          <p className="text-center font-bold text-[9pt] mb-1">
            Tabel 3. Infeksi Saluran Kemih (ISK) per 1000 Hari Pemakaian Alat (‰) di UOBK RSUD Al-Mulk {qData.periodLabel}
          </p>
          <table className="w-full border-collapse border border-black text-center text-[8.5pt] mb-4">
            <thead>
              <tr className="bg-slate-100 font-bold">
                <th className="border border-black p-1 w-1/4">INDIKATOR</th>
                <th className="border border-black p-1" colSpan={3}>BULAN</th>
              </tr>
              <tr className="bg-slate-100 font-bold">
                <th className="border border-black p-1"></th>
                <th className="border border-black p-1">{m1.shortName}</th>
                <th className="border border-black p-1">{m2.shortName}</th>
                <th className="border border-black p-1">{m3.shortName}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-1 text-left font-semibold">Hari terpasang alat</td>
                <td className="border border-black p-1">{isk.m1.days}</td>
                <td className="border border-black p-1">{isk.m2.days}</td>
                <td className="border border-black p-1">{isk.m3.days}</td>
              </tr>
              <tr className="font-semibold">
                <td className="border border-black p-1 text-left">‰</td>
                <td className="border border-black p-1">{isk.m1.rate}‰</td>
                <td className="border border-black p-1">{isk.m2.rate}‰</td>
                <td className="border border-black p-1">{isk.m3.rate}‰</td>
              </tr>
              <tr className="bg-slate-50 font-bold text-slate-700">
                <td className="border border-black p-1 text-left">Target</td>
                <td className="border border-black p-1">4.7‰</td>
                <td className="border border-black p-1">4.7‰</td>
                <td className="border border-black p-1">4.7‰</td>
              </tr>
            </tbody>
          </table>

          <h5 className="font-bold text-[10.5pt] mt-3 mb-1">Angka Kejadian (Incidence Rate) Decubitus</h5>

          {/* Grafik 4 Decubitus */}
          <OfficialModernBarChart
            title={`Grafik. 4 Insidence Rate Infeksi Decubitus Di UOBK RSUD Al-Mulk ${qData.periodLabel}`}
            data={[
              { label: m1.shortName, value: decubitus.m1.rate, formattedValue: `${decubitus.m1.rate}‰`, color: '#20b2aa' },
              { label: m2.shortName, value: decubitus.m2.rate, formattedValue: `${decubitus.m2.rate}‰`, color: '#f59e0b' },
              { label: m3.shortName, value: decubitus.m3.rate, formattedValue: `${decubitus.m3.rate}‰`, color: '#0f2942' },
            ]}
            height={115}
          />

          <p className="text-[9.5pt] leading-relaxed mb-2">
            <span className="font-bold">Analisa : </span>
            Berdasarkan grafik diatas menunjukkan bahwa insiden rate Decubitus selama {qData.periodLabel}, tidak ada kejadian decubitus.
          </p>

          <p className="text-center font-bold text-[9pt] mb-1">
            Tabel 4. Infeksi Decubitus per 1000 Hari Tirah Baring (‰) di UOBK RSUD Al-Mulk {qData.periodLabel}
          </p>
          <table className="w-full border-collapse border border-black text-center text-[8.5pt]">
            <thead>
              <tr className="bg-slate-100 font-bold">
                <th className="border border-black p-1 w-1/4">INDIKATOR</th>
                <th className="border border-black p-1" colSpan={3}>BULAN</th>
              </tr>
              <tr className="bg-slate-100 font-bold">
                <th className="border border-black p-1"></th>
                <th className="border border-black p-1">{m1.shortName}</th>
                <th className="border border-black p-1">{m2.shortName}</th>
                <th className="border border-black p-1">{m3.shortName}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-1 text-left font-semibold">Tirah baring</td>
                <td className="border border-black p-1">{decubitus.m1.days}</td>
                <td className="border border-black p-1">{decubitus.m2.days}</td>
                <td className="border border-black p-1">{decubitus.m3.days}</td>
              </tr>
              <tr>
                <td className="border border-black p-1 text-left font-semibold">Infeksi Decubitus</td>
                <td className="border border-black p-1">{decubitus.m1.cases}</td>
                <td className="border border-black p-1">{decubitus.m2.cases}</td>
                <td className="border border-black p-1">{decubitus.m3.cases}</td>
              </tr>
              <tr className="font-semibold">
                <td className="border border-black p-1 text-left">‰</td>
                <td className="border border-black p-1">{decubitus.m1.rate}‰</td>
                <td className="border border-black p-1">{decubitus.m2.rate}‰</td>
                <td className="border border-black p-1">{decubitus.m3.rate}‰</td>
              </tr>
            </tbody>
          </table>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 8: VAP & IDO TRIWULAN                             */}
      {/* ========================================================= */}
      <F4Page pageNumber={8} totalPages={totalPages}>
        <div className="mb-2 pt-2 text-justify">
          <h5 className="font-bold text-[10.5pt] mb-1">
            Angka Kejadian (Incident Rate) Ventilator Associated Pneumonia (VAP)
          </h5>
          <p className="indent-8 text-[9.5pt] leading-relaxed mb-2">
            Angka Kejadian (incidence Rate) Ventilator Associated Pneumonia (VAP) per 1000 pemakaian alat (‰) di UOBK RSUD Al-Mulk {qData.periodLabel}
          </p>

          {/* Grafik 5 VAP */}
          <OfficialModernBarChart
            title={`Grafik. 5 Insidence Rate Ventilator Associated Pneumonia (VAP) Di UOBK RSUD Al-Mulk ${qData.periodLabel}`}
            data={[
              { label: m1.shortName, value: vap.m1.rate, formattedValue: `${vap.m1.rate}%`, color: '#3b82f6' },
              { label: m2.shortName, value: vap.m2.rate, formattedValue: `${vap.m2.rate}%`, color: '#f59e0b' },
              { label: m3.shortName, value: vap.m3.rate, formattedValue: `${vap.m3.rate}%`, color: '#0f2942' },
            ]}
            height={110}
          />

          <p className="text-[9.5pt] leading-relaxed mb-2">
            <span className="font-bold">Analisa : </span>
            Berdasarkan grafik diatas menunjukkan bahwa insiden rate VAP selama {qData.periodLabel}, tidak ada kejadian infeksi.
          </p>

          <p className="text-center font-bold text-[9pt] mb-1">
            Tabel.5 Infeksi Ventilator Associated Pneumonia (VAP) Di UOBK RSUD Al-Mulk {qData.periodLabel}
          </p>
          <table className="w-full border-collapse border border-black text-center text-[8.5pt] mb-4">
            <thead>
              <tr className="bg-slate-100 font-bold">
                <th className="border border-black p-1 w-1/4">INDIKATOR</th>
                <th className="border border-black p-1" colSpan={3}>BULAN</th>
              </tr>
              <tr className="bg-slate-100 font-bold">
                <th className="border border-black p-1"></th>
                <th className="border border-black p-1">{m1.shortName}</th>
                <th className="border border-black p-1">{m2.shortName}</th>
                <th className="border border-black p-1">{m3.shortName}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-1 text-left font-semibold">Jumlah pasien memakai ventilator</td>
                <td className="border border-black p-1">{vap.m1.days}</td>
                <td className="border border-black p-1 font-bold">{vap.m2.days}</td>
                <td className="border border-black p-1 font-bold">{vap.m3.days}</td>
              </tr>
              <tr>
                <td className="border border-black p-1 text-left font-semibold">VAP</td>
                <td className="border border-black p-1">{vap.m1.cases}</td>
                <td className="border border-black p-1">{vap.m2.cases}</td>
                <td className="border border-black p-1">{vap.m3.cases}</td>
              </tr>
              <tr className="font-semibold">
                <td className="border border-black p-1 text-left">Rate In (%)</td>
                <td className="border border-black p-1">{vap.m1.rate}%</td>
                <td className="border border-black p-1">{vap.m2.rate}%</td>
                <td className="border border-black p-1">{vap.m3.rate}%</td>
              </tr>
            </tbody>
          </table>

          <h5 className="font-bold text-[10.5pt] mt-3 mb-1">
            Angka Kejadian (Incident Rate) Infeksi Darah Operasi (IDO)
          </h5>

          {/* Grafik 6 IDO */}
          <OfficialModernBarChart
            title={`Grafik. 6 Insidence Rate Infeksi Daerah Operasi (IDO) Di UOBK RSUD Al-Mulk ${qData.periodLabel}`}
            data={[
              { label: m1.shortName, value: ido.m1.rate, formattedValue: `${ido.m1.rate}%`, color: '#10b981' },
              { label: m2.shortName, value: ido.m2.rate, formattedValue: `${ido.m2.rate}%`, color: '#f59e0b' },
              { label: m3.shortName, value: ido.m3.rate, formattedValue: `${ido.m3.rate}%`, color: '#0f2942' },
            ]}
            height={110}
          />

          <p className="text-[9.5pt] leading-relaxed mb-2">
            <span className="font-bold">Analisa : </span>
            Berdasarkan grafik diatas menunjukkan bahwa insiden rate IDO {qData.quarterLabel} Periode {m1.monthName} - {m3.monthName} {reportYear} tidak ada kejadian IDO.
          </p>

          <p className="text-center font-bold text-[9pt] mb-1">
            Tabel. 6 Infeksi Daerah Operasi di UOBK RSUD Al-Mulk {qData.periodLabel}
          </p>
          <table className="w-full border-collapse border border-black text-center text-[8.5pt]">
            <thead>
              <tr className="bg-slate-100 font-bold">
                <th className="border border-black p-1 w-1/4">INDIKATOR</th>
                <th className="border border-black p-1" colSpan={3}>BULAN</th>
              </tr>
              <tr className="bg-slate-100 font-bold">
                <th className="border border-black p-1"></th>
                <th className="border border-black p-1">{m1.shortName}</th>
                <th className="border border-black p-1">{m2.shortName}</th>
                <th className="border border-black p-1">{m3.shortName}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-1 text-left font-semibold">Jumlah pasien di Operasi</td>
                <td className="border border-black p-1">{ido.m1.days}</td>
                <td className="border border-black p-1">{ido.m2.days}</td>
                <td className="border border-black p-1">{ido.m3.days}</td>
              </tr>
              <tr>
                <td className="border border-black p-1 text-left font-semibold">Infeksi IDO</td>
                <td className="border border-black p-1">{ido.m1.cases}</td>
                <td className="border border-black p-1">{ido.m2.cases}</td>
                <td className="border border-black p-1">{ido.m3.cases}</td>
              </tr>
              <tr className="font-semibold">
                <td className="border border-black p-1 text-left">Rate In (%)</td>
                <td className="border border-black p-1">{ido.m1.rate}%</td>
                <td className="border border-black p-1">{ido.m2.rate}%</td>
                <td className="border border-black p-1">{ido.m3.rate}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 9: AUDIT KEBERSIHAN TANGAN (HAND HYGIENE)         */}
      {/* ========================================================= */}
      <F4Page pageNumber={9} totalPages={totalPages}>
        <div className="mb-3 pt-2 text-justify">
          <h4 className="font-bold text-center uppercase tracking-wide border-b border-black pb-1 mb-3 text-xs">
            AUDIT HAND HYGIENE DAN APD
          </h4>

          <h5 className="font-bold text-[10.5pt] mb-1">Kepatuhan Kebersihan Tangan / Hand Hygiene</h5>

          {/* Grafik 1 Hand Hygiene Triwulan Berdasarkan Profesi */}
          <OfficialModernBarChart
            title={`Grafik 1. Kepatuhan Hand Hygiene di UOBK RSUD Al-Mulk ${qData.periodLabel}`}
            data={qData.hhProfessions.map((p, idx) => ({
              label: p.profession.toUpperCase(),
              value: p.total.rate,
              formattedValue: `${p.total.rate}%`,
              color: idx === 0 ? '#f59e0b' : idx === 1 ? '#0f2942' : '#20b2aa',
            }))}
            unit="%"
            maxValue={100}
            height={135}
          />
          <div className="flex justify-between text-[8pt] font-semibold text-slate-700 px-1 mb-2">
            <span>Target Kemenkes: ≥ 85%</span>
            <span className="font-bold text-emerald-700">Rata-rata RS: {qData.hhTotal.rate}%</span>
          </div>

          <p className="text-[9.5pt] leading-relaxed mb-3">
            <span className="font-bold">Analisa : </span>
            Berdasarkan grafik diatas menunjukkan bahwa kepatuhan hand hygiene {qData.quarterLabel} periode {m1.monthName} - {m3.monthName} {reportYear}, angka kepatuhan tertinggi ada di bulan Agustus yaitu di profesi Dokter 83%, Profesi Perawat/Bidan dengan angka kepatuhan mencapai 82%, kemudian di susul oleh Nakes lainnya dengan angka kepatuhan 81%. Angka kepatuhan Hand Hygiene di RSUD Al-Mulk belum mencapai target yang di inginkan yaitu 85%.
          </p>

          <h5 className="font-bold text-[10pt] mb-1.5">Rencana tindak lanjut :</h5>
          <ol className="list-decimal pl-8 space-y-1 text-[9pt] leading-relaxed">
            <li>Pertahankan angka kepatuhan Hand Hygiene yang sudah mencapai standar kemenkes</li>
            <li>Reedukasi 6 langkah kebersihan tangan</li>
            <li>Lakukan monitoring evaluasi kepatuhan dan demonstrasikan langkah-langkah cuci tangan</li>
            <li>Motivasi staf untuk melakukan Hand Hygiene berdasarkan 5 moment, khususnya petugas medis</li>
            <li>Berikan feed back hasil monitoring</li>
          </ol>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 10: TABEL HAND HYGIENE & AUDIT APD                */}
      {/* ========================================================= */}
      <F4Page pageNumber={10} totalPages={totalPages}>
        <div className="mb-3 pt-2 text-justify">
          <p className="text-center font-bold text-[9pt] mb-1.5">
            Tabel 1. Kepatuhan Hand Hygiene {qData.periodLabel}, berdasarkan profesi
          </p>

          {/* Tabel Hand Hygiene 3 Bulan per Profesi */}
          <table className="w-full border-collapse border border-black text-center text-[8pt] mb-4">
            <thead>
              <tr className="bg-slate-100 font-bold">
                <th className="border border-black p-1 w-1/4" rowSpan={2}>Ruangan / Profesi</th>
                <th className="border border-black p-1" colSpan={3}>{m1.shortName}</th>
                <th className="border border-black p-1" colSpan={3}>{m2.shortName}</th>
                <th className="border border-black p-1" colSpan={3}>{m3.shortName}</th>
              </tr>
              <tr className="bg-slate-100 font-bold">
                <th className="border border-black p-0.5">OPP</th>
                <th className="border border-black p-0.5">HH</th>
                <th className="border border-black p-0.5">%</th>
                <th className="border border-black p-0.5">OPP</th>
                <th className="border border-black p-0.5">HH</th>
                <th className="border border-black p-0.5">%</th>
                <th className="border border-black p-0.5">OPP</th>
                <th className="border border-black p-0.5">HH</th>
                <th className="border border-black p-0.5">%</th>
              </tr>
            </thead>
            <tbody>
              {qData.hhProfessions.map((p) => (
                <tr key={p.profession}>
                  <td className="border border-black p-1 text-left font-semibold">{p.profession}</td>
                  <td className="border border-black p-0.5">{p.m1.opp}</td>
                  <td className="border border-black p-0.5">{p.m1.hh}</td>
                  <td className="border border-black p-0.5 font-bold">{p.m1.rate}%</td>
                  <td className="border border-black p-0.5">{p.m2.opp}</td>
                  <td className="border border-black p-0.5">{p.m2.hh}</td>
                  <td className="border border-black p-0.5 font-bold">{p.m2.rate}%</td>
                  <td className="border border-black p-0.5">{p.m3.opp}</td>
                  <td className="border border-black p-0.5">{p.m3.hh}</td>
                  <td className="border border-black p-0.5 font-bold">{p.m3.rate}%</td>
                </tr>
              ))}
              <tr className="bg-slate-100 font-bold">
                <td className="border border-black p-1 text-left">Total RS</td>
                <td className="border border-black p-0.5" colSpan={2}>
                  {qData.hhProfessions.reduce((a, b) => a + b.m1.hh, 0)} / {qData.hhProfessions.reduce((a, b) => a + b.m1.opp, 0)}
                </td>
                <td className="border border-black p-0.5 font-black">
                  {qData.hhProfessions.reduce((a, b) => a + b.m1.opp, 0) > 0
                    ? `${(qData.hhProfessions.reduce((a, b) => a + b.m1.hh, 0) / qData.hhProfessions.reduce((a, b) => a + b.m1.opp, 0) * 100).toFixed(0)}%`
                    : '80%'}
                </td>
                <td className="border border-black p-0.5" colSpan={2}>
                  {qData.hhProfessions.reduce((a, b) => a + b.m2.hh, 0)} / {qData.hhProfessions.reduce((a, b) => a + b.m2.opp, 0)}
                </td>
                <td className="border border-black p-0.5 font-black">
                  {qData.hhProfessions.reduce((a, b) => a + b.m2.opp, 0) > 0
                    ? `${(qData.hhProfessions.reduce((a, b) => a + b.m2.hh, 0) / qData.hhProfessions.reduce((a, b) => a + b.m2.opp, 0) * 100).toFixed(0)}%`
                    : '82%'}
                </td>
                <td className="border border-black p-0.5" colSpan={2}>
                  {qData.hhProfessions.reduce((a, b) => a + b.m3.hh, 0)} / {qData.hhProfessions.reduce((a, b) => a + b.m3.opp, 0)}
                </td>
                <td className="border border-black p-0.5 font-black">
                  {qData.hhProfessions.reduce((a, b) => a + b.m3.opp, 0) > 0
                    ? `${(qData.hhProfessions.reduce((a, b) => a + b.m3.hh, 0) / qData.hhProfessions.reduce((a, b) => a + b.m3.opp, 0) * 100).toFixed(0)}%`
                    : '81%'}
                </td>
              </tr>
            </tbody>
          </table>

          <h5 className="font-bold text-[10.5pt] mb-1">Kepatuhan Penggunaan Alat Perlindungan Diri (APD)</h5>

          {/* Grafik 2 APD Triwulan */}
          <OfficialModernBarChart
            title={`Grafik 2. Kepatuhan Penggunaan APD di UOBK RSUD Al-Mulk ${qData.periodLabel}`}
            data={qData.apdMonthly.map((m, idx) => ({
              label: m.shortName,
              value: m.rate,
              formattedValue: `${m.rate}%`,
              color: idx === 0 ? '#0f2942' : idx === 1 ? '#10b981' : '#20b2aa',
            }))}
            unit="%"
            maxValue={100}
            height={120}
          />
          <div className="flex justify-between items-center text-[8pt] text-slate-600 mb-2 px-1 font-semibold">
            <span>Standar Target Kemenkes: 100%</span>
            <span className="font-bold text-emerald-700">Capaian Triwulan III: {qData.apdOverallRate}%</span>
          </div>

          <p className="text-[9.5pt] leading-relaxed">
            <span className="font-bold">Analisa : </span>
            Berdasarkan grafik diatas menunjukkan bahwa angka kepatuhan penggunaan APD {qData.periodLabel}, mencapai {qData.apdOverallRate}%, belum sesuai standar kemenkes yaitu 100%. Hal ini disebabkan oleh beberpa faktor antara lain masih kurangnya kesadaran dan kepatuhan tenaga kesehatan dalam penggunaan APD secara konsisten, keterbatasan ketersediaan APD pada waktu tertentu, kurangnya optimalnya pengawasan dan monitoring di unit pelayanan, serta belum maksimalnya sosialisasi dan edukasi terkait pentingnya penggunaan APD sesuai standar.
          </p>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 11: REKOMENDASI, TINDAK LANJUT & TANDA TANGAN     */}
      {/* ========================================================= */}
      <F4Page pageNumber={11} totalPages={totalPages}>
        <div className="mb-2 pt-2 text-justify">
          <h4 className="font-bold text-center uppercase tracking-wide border-b border-black pb-1 mb-2.5 text-xs">
            BAB III REKOMENDASI DAN TINDAK LANJUT
          </h4>

          <h5 className="font-bold text-[10pt] mb-1">Rekomendasi dari hasil audit Surveilans :</h5>
          
          <div className="space-y-1 text-[8.5pt] leading-relaxed mb-2.5">
            <div>
              <p className="font-bold text-[9pt]">Phlebitis :</p>
              <p className="pl-2 mb-1">Tetap mempertahankan prosedur teknik memasang infus yang benar yaitu dengan cara :</p>
              <ol className="list-decimal pl-6 space-y-0.5">
                <li>Kebersihan tangan selalu dilakukan pada 5 moment cuci tangan, salah satunya sebelum melakukan tindakan aseptik, seperti memasang infus.</li>
                <li>Memakai APD sesuai tindakan yang dilakukan,</li>
                <li>Pemilihan lokasi insersi yang tepat,</li>
                <li>Pemberian elektrolit yang bersifat asam atau alkali memudahkan terjadinya extravasasi dan infiltrasi sebaiknya diberikan per drip, pemberian larutan infus dengan osmolaritas &gt; 900 m Osm/l sebaiknya diberikan melalui CVC.</li>
                <li>Edukasi petugas tentang pemasangan dan perawatan IV kateter</li>
                <li>Lakukan desinfeksi area konektor tempat menyuntik sebelum pemberian terapi atau cairan.</li>
                <li>Sesegera mungkin melepaskan kateter IV bila sudah tidak diperlukan.</li>
                <li>Gunakan transparan dressing untuk memudahkan mengobservasi iv catheter.</li>
                <li>Menerapkan bundle HAIs</li>
              </ol>
            </div>

            <div className="pt-1">
              <p className="font-bold text-[9pt]">Infeksi Saluran Kemih (ISK) :</p>
              <p className="pl-2">{qData.quarterLabel} tidak ada kejadian ISK</p>
            </div>

            <div>
              <p className="font-bold text-[9pt]">Infeksi Decubitus :</p>
              <p className="pl-2">{qData.quarterLabel} tidak ada kejadian Decubitus</p>
            </div>

            <div>
              <p className="font-bold text-[9pt]">Infeksi Ventilator Associated Pneumonia (VAP) :</p>
              <p className="pl-2">{qData.quarterLabel} tidak ada infeksi akibat pemasangan Ventilator</p>
            </div>

            <div>
              <p className="font-bold text-[9pt]">Infeksi Daerah Operasi (IDO) :</p>
              <p className="pl-2">{qData.quarterLabel} tidak ada kejadian IDO</p>
            </div>
          </div>

          <h5 className="font-bold text-[10pt] mb-1">Rekomendasi dari hasil audit Hand Hygiene dan APD :</h5>
          <div className="space-y-1 text-[8.5pt] leading-relaxed mb-2.5">
            <div>
              <p className="font-bold text-[9pt]">Hand Hygiene :</p>
              <ol className="list-decimal pl-6 space-y-0.5">
                <li>Edukasi staf tentang pentingnya Hand Hygiene</li>
                <li>Motivasi staf untuk melakukan Hand Hygiene berdasarkan 5 moment, khususnya petugas medis</li>
                <li>Lakukan monitoring evaluasi dan demonstrasikan langkah-langkah cuci tangan</li>
              </ol>
            </div>
            <div>
              <p className="font-bold text-[9pt]">APD :</p>
              <ol className="list-decimal pl-6 space-y-0.5">
                <li>Edukasi petugas tentang pentingnya penggunaan APD untuk keselamatan staf dan pasien</li>
                <li>Fasilitasi APD lengkap di setiap unit</li>
                <li>Lakukan monitoring evaluasi dan demonstrasikan urutan pemakaian dan pelepasan APD yang benar</li>
                <li>Memfasilitasi poster tata cara pemakaian dan pelepasan APD yang benar sesuai kaidah PPI di setiap unit.</li>
                <li>Pertahankan nilai kepatuhan penggunaan APD</li>
              </ol>
            </div>
          </div>

          <h5 className="font-bold text-[10pt] mb-1">Tindak Lanjut :</h5>
          <p className="text-[8.5pt] leading-relaxed mb-4">
            Menyampaikan hasil surveilans HAIs ini ke Direktur UOBK RSUD Al-Mulk, Ketua Tim Mutu dan berkoordinasi dengan seluruh kepala unit.
          </p>

          {/* Lembar Tanda Tangan Resmi Dokumen Triwulan */}
          <div className="w-full pt-1 border-t border-black">
            <p className="text-right text-[9pt] mb-2 font-medium">
              Sukabumi, 10 Oktober {reportYear}
            </p>

            <table className="w-full border-none text-[9pt]">
              <tbody>
                <tr className="text-center font-bold">
                  <td className="w-1/2 align-top pb-14">
                    Penyusun,<br />
                    Infection Prefention Control Nurse
                  </td>
                  <td className="w-1/2 align-top pb-14">
                    Mengetahui<br />
                    Ketua PPI
                  </td>
                </tr>
                <tr className="text-center font-bold">
                  <td className="align-bottom">
                    <p className="underline font-black">Adi Tresa Purnama, A.M.Kep</p>
                    <p className="font-normal text-[8pt]">Infection Prefention Control Nurse</p>
                  </td>
                  <td className="align-bottom">
                    <p className="underline font-black">dr. Nurul Iman</p>
                    <p className="font-normal text-[8pt]">Ketua PPI</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </F4Page>
    </div>
  );
}
