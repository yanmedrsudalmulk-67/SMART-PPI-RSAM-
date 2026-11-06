import type { NextApiRequest, NextApiResponse } from 'next';
import {
  testSimrsConnection,
  fetchSimrsHaisWeb,
  fetchSimrsHaisRecords,
  fetchSimrsInpatients,
  authenticateSimrsUser,
  SimrsHaisWebItem,
} from '@/lib/simrs-db';
import { executeUpsert, runSql, clearQueryCache } from '@/lib/sqlite-db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { action, startDate, endDate, autoSync } = req.query;

      if (action === 'test') {
        const result = await testSimrsConnection();
        return res.status(200).json(result);
      }

      if (action === 'inpatients') {
        const inpatients = await fetchSimrsInpatients();
        return res.status(200).json({ ok: true, data: inpatients });
      }

      if (action === 'auth') {
        const username = req.query.username as string;
        const password = req.query.password as string;
        if (!username || !password) {
          return res.status(400).json({ ok: false, error: 'Username dan password wajib diisi' });
        }
        const authResult = await authenticateSimrsUser(username, password);
        return res.status(200).json(authResult);
      }

      // Default: Ambil data HAIs realtime format web http://192.168.18.11/almulk/ranap/data_hais1
      const start = (startDate as string) || new Date().toISOString().slice(0, 10);
      const end = (endDate as string) || start;

      const webData = await fetchSimrsHaisWeb(start, end);

      // Jika parameter autoSync=true diminta, sinkronkan agregat ke audit_sessions SMART PPI
      let syncedCount = 0;
      if (autoSync === 'true' && webData.ok && webData.allRows.length > 0) {
        syncedCount = await syncHaisToSmartPpi(webData, start, end);
      }

      return res.status(200).json({
        ...webData,
        syncedToSmartPpi: syncedCount,
      });
    }

    if (req.method === 'POST') {
      // Manual trigger sinkronisasi
      const { startDate, endDate } = req.body;
      const start = startDate || new Date().toISOString().slice(0, 10);
      const end = endDate || start;

      const webData = await fetchSimrsHaisWeb(start, end);

      if (!webData.ok || webData.allRows.length === 0) {
        return res.status(200).json({
          ok: true,
          message: `Tidak ditemukan rekaman data HAIs di SIMRS Khanza pada periode ${start} s.d ${end}.`,
          syncedCount: 0,
        });
      }

      const syncedCount = await syncHaisToSmartPpi(webData, start, end);

      return res.status(200).json({
        ok: true,
        message: `Berhasil menyinkronkan data HAIs (${webData.allRows.length} catatan pasien) dari SIMRS Khanza ke Laporan SMART PPI!`,
        syncedCount,
        recordsProcessed: webData.allRows.length,
        tabs: webData.tabs,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('SIMRS HAIs Error:', error);
    return res.status(500).json({
      ok: false,
      error: error.message || 'Internal Server Error pada integrasi SIMRS',
    });
  }
}

/**
 * Menyimpan data agregasi HAIs per ruangan ke tabel `audit_sessions` SMART PPI
 * agar Laporan Bulanan, Triwulan, dan Tahunan PPI otomatis terisi secara realtime.
 */
async function syncHaisToSmartPpi(webData: any, startDate: string, endDate: string): Promise<number> {
  const rooms = [
    { key: 'dewasa', unit: 'Ranap Dewasa' },
    { key: 'anak', unit: 'Ranap Anak' },
    { key: 'kebidanan', unit: 'Ranap Kebidanan' },
    { key: 'bedah', unit: 'Ranap Bedah' },
  ];

  const nowIso = new Date().toISOString();
  const rowsToInsert: any[] = [];

  for (const r of rooms) {
    const tab = webData.tabs?.[r.key];
    if (!tab || !Array.isArray(tab.rows)) continue;

    // Group rows by tanggal (YYYY-MM-DD) so any queried date range updates exact daily buckets without overlap
    const byDate = new Map<string, {
      ett: number; cvl: number; ivl: number; uc: number;
      vap: number; iad: number; pleb: number; isk: number; ilo: number; hap: number;
      deku: number; totalPasien: number;
    }>();

    for (const item of tab.rows) {
      const tgl = (item.tanggal || '').slice(0, 10);
      if (!tgl || !/^\d{4}-\d{2}-\d{2}$/.test(tgl)) continue;
      if (!byDate.has(tgl)) {
        byDate.set(tgl, {
          ett: 0, cvl: 0, ivl: 0, uc: 0,
          vap: 0, iad: 0, pleb: 0, isk: 0, ilo: 0, hap: 0,
          deku: 0, totalPasien: 0,
        });
      }
      const d = byDate.get(tgl)!;
      d.ett += Number(item.ett) || 0;
      d.cvl += Number(item.cvl) || 0;
      d.ivl += Number(item.ivl) || 0;
      d.uc += Number(item.uc) || 0;
      d.vap += Number(item.vap) || 0;
      d.iad += Number(item.iad) || 0;
      d.pleb += Number(item.pleb) || 0;
      d.isk += Number(item.isk) || 0;
      d.ilo += Number(item.ilo) || 0;
      d.hap += Number(item.hap) || 0;
      if (String(item.deku || '').toUpperCase() === 'IYA') d.deku += 1;
      d.totalPasien += 1;
    }

    for (const [tgl, t] of byDate.entries()) {
      const sessionDate = `${tgl}T12:00:00.000Z`;

      // 1. Phlebitis
      if (t.ivl > 0 || t.pleb > 0) {
        const rate = t.ivl > 0 ? Number(((t.pleb / t.ivl) * 1000).toFixed(2)) : 0;
        const irPercent = t.ivl > 0 ? Number(((t.pleb / t.ivl) * 100).toFixed(2)) : 0;
        rowsToInsert.push({
          id: `simrs-pleb-${r.key}-${tgl}`,
          unit_kerja: r.unit,
          unit: r.unit,
          jenis_audit: 'HAIs',
          kategori: 'Surveilans HAIs',
          indikator_id: 'phlebitis',
          nama_indikator: 'Phlebitis',
          numerator: t.pleb,
          denominator: t.ivl,
          jumlah_patuh: t.pleb,
          jumlah_dinilai: t.ivl,
          persentase: rate,
          data_indikator: JSON.stringify({
            numerator: t.pleb,
            denominator: t.ivl,
            rate,
            isPercent: false,
            irPercent,
          }),
          tanggal_waktu: sessionDate,
          observer: 'SIMRS Khanza Realtime',
          catatan: `Sinkronisasi otomatis dari SIMRS Khanza (${tgl}) - Tindakan IVL: ${t.ivl}, Infeksi Pleb: ${t.pleb}`,
          created_at: nowIso,
        });
      }

      // 2. ISK
      if (t.uc > 0 || t.isk > 0) {
        const rate = t.uc > 0 ? Number(((t.isk / t.uc) * 1000).toFixed(2)) : 0;
        const irPercent = t.uc > 0 ? Number(((t.isk / t.uc) * 100).toFixed(2)) : 0;
        rowsToInsert.push({
          id: `simrs-isk-${r.key}-${tgl}`,
          unit_kerja: r.unit,
          unit: r.unit,
          jenis_audit: 'HAIs',
          kategori: 'Surveilans HAIs',
          indikator_id: 'isk',
          nama_indikator: 'ISK',
          numerator: t.isk,
          denominator: t.uc,
          jumlah_patuh: t.isk,
          jumlah_dinilai: t.uc,
          persentase: rate,
          data_indikator: JSON.stringify({
            numerator: t.isk,
            denominator: t.uc,
            rate,
            isPercent: false,
            irPercent,
          }),
          tanggal_waktu: sessionDate,
          observer: 'SIMRS Khanza Realtime',
          catatan: `Sinkronisasi otomatis dari SIMRS Khanza (${tgl}) - Tindakan UC: ${t.uc}, Infeksi ISK: ${t.isk}`,
          created_at: nowIso,
        });
      }

      // 3. VAP
      if (t.ett > 0 || t.vap > 0) {
        const rate = t.ett > 0 ? Number(((t.vap / t.ett) * 1000).toFixed(2)) : 0;
        rowsToInsert.push({
          id: `simrs-vap-${r.key}-${tgl}`,
          unit_kerja: r.unit,
          unit: r.unit,
          jenis_audit: 'HAIs',
          kategori: 'Surveilans HAIs',
          indikator_id: 'vap',
          nama_indikator: 'VAP',
          numerator: t.vap,
          denominator: t.ett,
          jumlah_patuh: t.vap,
          jumlah_dinilai: t.ett,
          persentase: rate,
          data_indikator: JSON.stringify({ numerator: t.vap, denominator: t.ett, rate, isPercent: false }),
          tanggal_waktu: sessionDate,
          observer: 'SIMRS Khanza Realtime',
          catatan: `Sinkronisasi otomatis dari SIMRS Khanza (${tgl})`,
          created_at: nowIso,
        });
      }

      // 4. IADP
      if (t.cvl > 0 || t.iad > 0) {
        const rate = t.cvl > 0 ? Number(((t.iad / t.cvl) * 1000).toFixed(2)) : 0;
        rowsToInsert.push({
          id: `simrs-iadp-${r.key}-${tgl}`,
          unit_kerja: r.unit,
          unit: r.unit,
          jenis_audit: 'HAIs',
          kategori: 'Surveilans HAIs',
          indikator_id: 'iadp',
          nama_indikator: 'IADP',
          numerator: t.iad,
          denominator: t.cvl,
          jumlah_patuh: t.iad,
          jumlah_dinilai: t.cvl,
          persentase: rate,
          data_indikator: JSON.stringify({ numerator: t.iad, denominator: t.cvl, rate, isPercent: false }),
          tanggal_waktu: sessionDate,
          observer: 'SIMRS Khanza Realtime',
          catatan: `Sinkronisasi otomatis dari SIMRS Khanza (${tgl})`,
          created_at: nowIso,
        });
      }

      // 5. Decubitus
      if (t.totalPasien > 0 || t.deku > 0) {
        const den = t.totalPasien > 0 ? t.totalPasien : 1;
        const rate = Number(((t.deku / den) * 1000).toFixed(2));
        rowsToInsert.push({
          id: `simrs-deku-${r.key}-${tgl}`,
          unit_kerja: r.unit,
          unit: r.unit,
          jenis_audit: 'HAIs',
          kategori: 'Surveilans HAIs',
          indikator_id: 'decubitus',
          nama_indikator: 'Decubitus',
          numerator: t.deku,
          denominator: den,
          jumlah_patuh: t.deku,
          jumlah_dinilai: den,
          persentase: rate,
          data_indikator: JSON.stringify({ numerator: t.deku, denominator: den, rate, isPercent: false }),
          tanggal_waktu: sessionDate,
          observer: 'SIMRS Khanza Realtime',
          catatan: `Sinkronisasi otomatis dari SIMRS Khanza (${tgl})`,
          created_at: nowIso,
        });
      }

      // 6. IDO
      if (t.ilo > 0) {
        const den = t.totalPasien > 0 ? t.totalPasien : t.ilo;
        const rate = Number(((t.ilo / den) * 100).toFixed(2));
        rowsToInsert.push({
          id: `simrs-ido-${r.key}-${tgl}`,
          unit_kerja: r.unit,
          unit: r.unit,
          jenis_audit: 'HAIs',
          kategori: 'Surveilans HAIs',
          indikator_id: 'ido',
          nama_indikator: 'IDO',
          numerator: t.ilo,
          denominator: den,
          jumlah_patuh: t.ilo,
          jumlah_dinilai: den,
          persentase: rate,
          data_indikator: JSON.stringify({ numerator: t.ilo, denominator: den, rate, isPercent: true }),
          tanggal_waktu: sessionDate,
          observer: 'SIMRS Khanza Realtime',
          catatan: `Sinkronisasi otomatis dari SIMRS Khanza (${tgl})`,
          created_at: nowIso,
        });
      }
    }
  }

  // Clean up any existing HAIs rows in [startDate..endDate] and any legacy non-daily HAIs rows before upserting
  try {
    await runSql(
      `DELETE FROM "audit_sessions" WHERE "kategori" = 'Surveilans HAIs' AND (
        ("tanggal_waktu" >= ? AND "tanggal_waktu" <= ?)
        OR "id" NOT LIKE 'simrs-%'
        OR LENGTH("id") > 32
      )`,
      [`${startDate}T00:00:00.000Z`, `${endDate}T23:59:59.999Z`]
    );
    clearQueryCache('audit_sessions');
  } catch (e) {
    console.warn('Warning cleaning old HAIs rows:', e);
  }

  if (rowsToInsert.length > 0) {
    await executeUpsert('audit_sessions', rowsToInsert, 'id');
  }

  return rowsToInsert.length;
}
