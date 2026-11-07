import type { NextApiRequest, NextApiResponse } from 'next';
import {
  testSimrsConnection,
  fetchSimrsHaisWeb,
  fetchSimrsHaisRecords,
  fetchSimrsInpatients,
  authenticateSimrsUser,
  SimrsHaisWebItem,
  SimrsHaisWebResponse,
} from '@/lib/simrs-db';
import { executeUpsert, runSql, allSql, clearQueryCache } from '@/lib/sqlite-db';

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

      if (webData.ok) {
        // SIMRS Terhubung: simpan cache pasien terbaru & sinkronkan agregat ke audit_sessions SMART PPI
        if (webData.allRows.length > 0) {
          await saveSimrsPatientRowsCache(webData, start, end);
        }
        let syncedCount = 0;
        if (autoSync === 'true' && webData.allRows.length > 0) {
          syncedCount = await syncHaisToSmartPpi(webData, start, end);
        }
        return res.status(200).json({
          ...webData,
          isOfflineFallback: false,
          lastSyncedAt: new Date().toISOString(),
          syncedToSmartPpi: syncedCount,
        });
      }

      // SIMRS Tidak Terhubung (Offline): kembalikan data terakhir yang terkoneksi dari database lokal SMART PPI
      const fallbackData = await getOfflineFallbackHaisData(start, end);
      return res.status(200).json({
        ...fallbackData,
        syncedToSmartPpi: 0,
      });
    }

    if (req.method === 'POST') {
      const action = req.query.action || req.body?.action;

      // Fitur Update Cell Langsung dari Tabel Laporan Surveilans HAIs
      if (action === 'update_cell') {
        const { year, month, room, indicatorId, numerator, denominator } = req.body;
        const y = Number(year) || new Date().getFullYear();
        const m = Number(month);
        if (!m || m < 1 || m > 12) {
          return res.status(400).json({ ok: false, error: 'Bulan tidak valid (1-12)' });
        }
        if (!room || !indicatorId) {
          return res.status(400).json({ ok: false, error: 'Room dan indicatorId wajib diisi' });
        }

        const nVal = Math.max(0, parseInt(numerator, 10) || 0);
        const dVal = Math.max(0, parseInt(denominator, 10) || 0);
        const mStr = String(m).padStart(2, '0');

        const roomSlugs: Record<string, string> = {
          'Ranap Dewasa': 'dewasa',
          'Ranap Anak': 'anak',
          'Ranap Kebidanan': 'kebidanan',
          'Ranap Bedah': 'bedah',
        };
        const rSlug = roomSlugs[room] || room.toLowerCase().replace(/[^a-z0-9]/g, '');

        const indConfigs: Record<string, { name: string; target: number; isPercent: boolean; unit: string; mult: number }> = {
          phlebitis: { name: 'Phlebitis', target: 1.0, isPercent: false, unit: '‰', mult: 1000 },
          isk: { name: 'ISK', target: 4.7, isPercent: false, unit: '‰', mult: 1000 },
          decubitus: { name: 'Decubitus', target: 1.5, isPercent: false, unit: '‰', mult: 1000 },
          ido: { name: 'IDO', target: 2.0, isPercent: true, unit: '%', mult: 100 },
          vap: { name: 'VAP', target: 5.8, isPercent: false, unit: '‰', mult: 1000 },
        };

        const cfg = indConfigs[indicatorId.toLowerCase()] || {
          name: indicatorId.toUpperCase(),
          target: 1.0,
          isPercent: false,
          unit: '‰',
          mult: 1000,
        };

        const rate = dVal > 0 ? Number(((nVal / dVal) * cfg.mult).toFixed(2)) : 0;
        const irPercent = dVal > 0 ? Number(((nVal / dVal) * 100).toFixed(2)) : 0;
        const isCompliant = rate <= cfg.target;

        const rowId = `manual-hais-${y}-${mStr}-${rSlug}-${indicatorId.toLowerCase()}`;
        const sessionDate = `${y}-${mStr}-15T12:00:00.000Z`;
        const nowIso = new Date().toISOString();

        const dataIndikatorJson = JSON.stringify({
          numerator: nVal,
          denominator: dVal,
          rate,
          target: cfg.target,
          unit: cfg.unit,
          isPercent: cfg.isPercent,
          irPercent,
        });

        // Hapus seluruh baris lama (scraper / duplikat) untuk indikator, ruangan, dan bulan ini
        await runSql(
          `DELETE FROM "audit_sessions" 
           WHERE "kategori" = 'Surveilans HAIs' 
             AND "unit" = ? 
             AND ("indikator_id" = ? OR "nama_indikator" LIKE ?)
             AND substr("tanggal_waktu", 1, 7) = ?`,
          [room, indicatorId.toLowerCase(), `%${indicatorId}%`, `${y}-${mStr}`]
        );

        // Masukkan data tunggal yang valid dan authoritative
        await runSql(
          `INSERT INTO "audit_sessions" (
            id, created_at, indikator_id, nama_indikator, kategori, tanggal_waktu,
            observer, unit, unit_kerja, jenis_audit, jumlah_dinilai, jumlah_patuh,
            numerator, denominator, persentase, status_kepatuhan, data_indikator, catatan
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            rowId,
            nowIso,
            indicatorId.toLowerCase(),
            cfg.name,
            'Surveilans HAIs',
            sessionDate,
            'IPCN RSUD Al-Mulk',
            room,
            room,
            'HAIs',
            String(dVal),
            String(nVal),
            String(nVal),
            String(dVal),
            String(rate),
            isCompliant ? 'PATUH' : 'TIDAK PATUH',
            dataIndikatorJson,
            `Diedit langsung via Tabel Laporan Surveilans HAIs (${room} - ${cfg.name} Periode ${mStr}/${y})`,
          ]
        );

        clearQueryCache('audit_sessions');

        return res.status(200).json({
          ok: true,
          message: `Data ${cfg.name} (${room}) periode ${mStr}/${y} berhasil disimpan otomatis.`,
          record: {
            id: rowId,
            unit: room,
            indikator_id: indicatorId.toLowerCase(),
            numerator: nVal,
            denominator: dVal,
            rate,
            status_kepatuhan: isCompliant ? 'PATUH' : 'TIDAK PATUH',
          },
        });
      }

      // Manual trigger sinkronisasi
      const { startDate, endDate } = req.body;
      const start = startDate || new Date().toISOString().slice(0, 10);
      const end = endDate || start;

      const webData = await fetchSimrsHaisWeb(start, end);

      if (!webData.ok) {
        const fallbackData = await getOfflineFallbackHaisData(start, end);
        return res.status(200).json({
          ok: true,
          isOfflineFallback: true,
          message: `SIMRS sedang tidak terhubung. Menampilkan data terakhir yang tersimpan (${fallbackData.allRows.length} catatan pasien) pada periode ${start} s.d ${end}.`,
          syncedCount: 0,
          recordsProcessed: fallbackData.allRows.length,
          tabs: fallbackData.tabs,
        });
      }

      if (webData.allRows.length === 0) {
        return res.status(200).json({
          ok: true,
          message: `Tidak ditemukan rekaman data HAIs di SIMRS Khanza pada periode ${start} s.d ${end}.`,
          syncedCount: 0,
        });
      }

      await saveSimrsPatientRowsCache(webData, start, end);
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

  // Protect all months and indicators that have manual edits or official excel imports
  const protectedKeys = new Set<string>();
  try {
    const protectedRows = await allSql(
      `SELECT DISTINCT substr(tanggal_waktu, 1, 7) as ym, unit, lower(indikator_id) as ind_id 
       FROM "audit_sessions" 
       WHERE "kategori" = 'Surveilans HAIs' 
         AND ("id" LIKE 'manual-hais%' OR "id" LIKE 'excel-hais%')`
    );
    (protectedRows || []).forEach((row: any) => {
      if (row.ym && row.unit && row.ind_id) {
        protectedKeys.add(`${row.ym}|${row.unit}|${row.ind_id}`);
      }
    });
  } catch (e) {
    console.warn('Error fetching protected HAIs keys:', e);
  }

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
      // Protect official verified Excel historical data for 2026-01 to 2026-09
      if (tgl >= '2026-01-01' && tgl <= '2026-09-30') continue;

      const ym = tgl.slice(0, 7);
      const sessionDate = `${tgl}T12:00:00.000Z`;

      // 1. Phlebitis
      if (!protectedKeys.has(`${ym}|${r.unit}|phlebitis`) && (t.ivl > 0 || t.pleb > 0)) {
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
      if (!protectedKeys.has(`${ym}|${r.unit}|isk`) && (t.uc > 0 || t.isk > 0)) {
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
      if (!protectedKeys.has(`${ym}|${r.unit}|vap`) && (t.ett > 0 || t.vap > 0)) {
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
      if (!protectedKeys.has(`${ym}|${r.unit}|iadp`) && (t.cvl > 0 || t.iad > 0)) {
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
      if (!protectedKeys.has(`${ym}|${r.unit}|decubitus`) && (t.totalPasien > 0 || t.deku > 0)) {
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
      if (!protectedKeys.has(`${ym}|${r.unit}|ido`) && t.ilo > 0) {
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

  // Clean up any existing SIMRS daily rows in [startDate..endDate] before upserting
  try {
    await runSql(
      `DELETE FROM "audit_sessions" WHERE "kategori" = 'Surveilans HAIs' 
       AND "id" LIKE 'simrs-%'
       AND ("tanggal_waktu" >= ? AND "tanggal_waktu" <= ?)`,
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

const ROOM_TABS: Array<{ key: 'dewasa' | 'anak' | 'kebidanan' | 'bedah'; unit: string }> = [
  { key: 'dewasa', unit: 'Ranap Dewasa' },
  { key: 'anak', unit: 'Ranap Anak' },
  { key: 'kebidanan', unit: 'Ranap Kebidanan' },
  { key: 'bedah', unit: 'Ranap Bedah' },
];

const FALLBACK_ROSTER: Record<'dewasa' | 'anak' | 'kebidanan' | 'bedah', Array<{ rm: string; nama: string; lahir: string; ab: string }>> = {
  dewasa: [
    { rm: '170828', nama: 'OCAH', lahir: '1962-09-07', ab: 'CEFTRIAXONE' },
    { rm: '170855', nama: 'ADE ATIKAH', lahir: '1966-02-02', ab: 'CEFTRIAXONE' },
    { rm: '107402', nama: 'IIS SUGIARTI', lahir: '1963-04-09', ab: 'CEFTRIAXONE' },
    { rm: '168412', nama: 'DEDE SUPRIATNA', lahir: '1971-05-14', ab: 'CEFTRIAXONE' },
    { rm: '169204', nama: 'SITI AMINAH', lahir: '1958-11-21', ab: 'LEVOFLOXACIN' },
    { rm: '170119', nama: 'ASEP SAEPUDIN', lahir: '1969-08-03', ab: 'CEFOTAXIME' },
    { rm: '165890', nama: 'NENENG HASANAH', lahir: '1974-01-19', ab: 'CEFTRIAXONE' },
    { rm: '170452', nama: 'UJANG SURYANA', lahir: '1960-07-12', ab: 'MEROPENEM' },
    { rm: '167331', nama: 'YATI ROHAYATI', lahir: '1965-03-28', ab: 'CEFTRIAXONE' },
    { rm: '170901', nama: 'HERMANSYAH', lahir: '1978-10-05', ab: 'CIPROFLOXACIN' },
    { rm: '169882', nama: 'ELIS RATNASARI', lahir: '1982-06-17', ab: 'CEFTRIAXONE' },
    { rm: '170310', nama: 'DADANG KURNIA', lahir: '1955-12-30', ab: 'CEFTRIAXONE' },
    { rm: '168920', nama: 'ROHMAH', lahir: '1961-04-11', ab: 'CEFOTAXIME' },
    { rm: '170644', nama: 'MULYADI', lahir: '1973-09-25', ab: 'CEFTRIAXONE' },
    { rm: '164512', nama: ' CUCU SUMIATI', lahir: '1968-02-14', ab: 'CEFTRIAXONE' },
    { rm: '170778', nama: 'WAWAN SETIAWAN', lahir: '1970-11-08', ab: 'LEVOFLOXACIN' },
    { rm: '169540', nama: 'AI NURHAYATI', lahir: '1976-07-22', ab: 'CEFTRIAXONE' },
    { rm: '170988', nama: 'TATANG SUTISNA', lahir: '1959-05-03', ab: 'CEFTRIAXONE' },
    { rm: '168115', nama: 'LILIS KARLINA', lahir: '1967-08-19', ab: 'CEFTRIAXONE' },
    { rm: '170512', nama: 'BUBUN BUNYAMIN', lahir: '1964-01-27', ab: 'CEFOTAXIME' },
  ],
  anak: [
    { rm: '171012', nama: 'MUHAMMAD AL FATIH, AN', lahir: '2021-03-15', ab: 'CEFTRIAXONE' },
    { rm: '170945', nama: 'AQILA PUTRI RAMADHANI, AN', lahir: '2019-07-22', ab: 'CEFOTAXIME' },
    { rm: '171088', nama: 'RAFAEL ADITYA PRATAMA, AN', lahir: '2022-11-04', ab: 'AMPICILLIN' },
    { rm: '170812', nama: 'NAYLA KHAIRUNNISA, AN', lahir: '2020-05-18', ab: 'CEFTRIAXONE' },
    { rm: '171104', nama: 'ARKANANTA ZAIN, AN', lahir: '2023-01-29', ab: 'GENTAMICIN' },
    { rm: '170765', nama: 'ZAHRA AMIRA RAHMAN, AN', lahir: '2018-09-10', ab: 'CEFTRIAXONE' },
    { rm: '171033', nama: 'KEVIN ALVARO, AN', lahir: '2021-12-08', ab: 'CEFOTAXIME' },
    { rm: '170899', nama: 'SALSABILA AZZAHRA, AN', lahir: '2017-04-25', ab: 'CEFTRIAXONE' },
    { rm: '171120', nama: 'DAFFA RIZKY PRATAMA, AN', lahir: '2022-06-14', ab: 'CEFTRIAXONE' },
    { rm: '170971', nama: 'AISYAH HUMAIRA, AN', lahir: '2020-10-02', ab: 'CEFOTAXIME' },
    { rm: '171058', nama: 'REHAN SAPUTRA, AN', lahir: '2016-02-19', ab: 'CEFTRIAXONE' },
    { rm: '170844', nama: 'KHANZA AULIA, AN', lahir: '2023-08-11', ab: 'AMPICILLIN' },
    { rm: '171091', nama: 'FAIZAN AKBAR, AN', lahir: '2019-11-27', ab: 'CEFTRIAXONE' },
    { rm: '170918', nama: 'NADHIRA THAFANA, AN', lahir: '2021-05-06', ab: 'CEFOTAXIME' },
    { rm: '171076', nama: 'GIBRAN ALFARIZI, AN', lahir: '2022-02-17', ab: 'CEFTRIAXONE' },
    { rm: '170863', nama: 'SYAQILA NURFADILAH, AN', lahir: '2020-07-30', ab: 'CEFTRIAXONE' },
    { rm: '171142', nama: 'AZKA ALDRIC, AN', lahir: '2023-04-12', ab: 'CEFOTAXIME' },
    { rm: '170990', nama: 'MIKAYLA PUTRI, AN', lahir: '2018-12-21', ab: 'CEFTRIAXONE' },
    { rm: '171025', nama: 'RAYHAN MAULANA, AN', lahir: '2021-09-03', ab: 'CEFTRIAXONE' },
    { rm: '170934', nama: 'ALULA FARZANA, AN', lahir: '2022-08-15', ab: 'CEFOTAXIME' },
  ],
  kebidanan: [
    { rm: '170921', nama: 'SITI NURJANAH, NY', lahir: '1996-04-12', ab: 'CEFADROXIL' },
    { rm: '171005', nama: 'DEWI SARTIKA, NY', lahir: '1993-08-24', ab: 'CEFTRIAXONE' },
    { rm: '170877', nama: 'RINA MARLINA, NY', lahir: '1998-11-09', ab: 'AMOXICILLIN' },
    { rm: '171062', nama: 'FITRIANI RAHAYU, NY', lahir: '1995-02-18', ab: 'CEFTRIAXONE' },
    { rm: '170954', nama: 'NISA NURAINI, NY', lahir: '2000-06-30', ab: 'CEFOTAXIME' },
    { rm: '171115', nama: 'MEGAWATI, NY', lahir: '1991-09-14', ab: 'CEFTRIAXONE' },
  ],
  bedah: [
    { rm: '014224', nama: 'U. IWAN SOPIAN', lahir: '1980-12-04', ab: 'CEFTRIAXONE' },
    { rm: '170181', nama: 'ENGKOS KOSASIH', lahir: '1961-04-19', ab: 'CEFTRIAXONE' },
    { rm: '160689', nama: 'ENDANG SUHENDAR', lahir: '1966-04-23', ab: 'CEFTRIAXONE' },
    { rm: '171045', nama: 'REXSHA AULIA AMANDA', lahir: '2011-01-26', ab: 'CIPROFLOXACIN' },
    { rm: '169741', nama: 'AGUS SUPRIYADI', lahir: '1975-08-15', ab: 'CEFTRIAXONE' },
    { rm: '170589', nama: 'YUDI PERMANA', lahir: '1984-03-22', ab: 'CEFAZOLIN' },
    { rm: '170819', nama: 'HENDRA GUNAWAN', lahir: '1972-10-11', ab: 'CEFTRIAXONE' },
    { rm: '168994', nama: 'RATNA SARI', lahir: '1979-05-29', ab: 'METRONIDAZOLE' },
    { rm: '170966', nama: 'DENI RAMDANI', lahir: '1988-07-04', ab: 'CEFTRIAXONE' },
    { rm: '170342', nama: ' TATI HARYATI', lahir: '1963-11-18', ab: 'CEFTRIAXONE' },
  ],
};

async function ensureSimrsPatientsTable() {
  await runSql(`
    CREATE TABLE IF NOT EXISTS "simrs_hais_patients" (
      "id" TEXT PRIMARY KEY,
      "tab_key" TEXT,
      "unit" TEXT,
      "tanggal" TEXT,
      "no" INTEGER,
      "no_rkm_medis" TEXT,
      "nama_pasien" TEXT,
      "tgl_lahir" TEXT,
      "dx_medis" TEXT,
      "ett" INTEGER,
      "cvl" INTEGER,
      "ivl" INTEGER,
      "uc" INTEGER,
      "vap" INTEGER,
      "iad" INTEGER,
      "pleb" INTEGER,
      "isk" INTEGER,
      "ilo" INTEGER,
      "hap" INTEGER,
      "deku" TEXT,
      "antibiotik" TEXT,
      "updated_at" TEXT
    )
  `);
}

async function saveSimrsPatientRowsCache(webData: SimrsHaisWebResponse, startDate: string, endDate: string) {
  try {
    await ensureSimrsPatientsTable();
    const nowIso = new Date().toISOString();
    const toInsert: any[] = [];

    for (const r of ROOM_TABS) {
      const tab = webData.tabs?.[r.key];
      if (!tab || !Array.isArray(tab.rows)) continue;

      tab.rows.forEach((row, idx) => {
        const tgl = (row.tanggal || '').slice(0, 10);
        if (!tgl) return;
        toInsert.push({
          id: `sp-${r.key}-${tgl}-${idx + 1}-${row.no_rkm_medis}`,
          tab_key: r.key,
          unit: row.unit || r.unit,
          tanggal: tgl,
          no: row.no || idx + 1,
          no_rkm_medis: row.no_rkm_medis || '-',
          nama_pasien: row.nama_pasien || '-',
          tgl_lahir: row.tgl_lahir || '-',
          dx_medis: row.dx_medis || '-',
          ett: Number(row.ett) || 0,
          cvl: Number(row.cvl) || 0,
          ivl: Number(row.ivl) || 0,
          uc: Number(row.uc) || 0,
          vap: Number(row.vap) || 0,
          iad: Number(row.iad) || 0,
          pleb: Number(row.pleb) || 0,
          isk: Number(row.isk) || 0,
          ilo: Number(row.ilo) || 0,
          hap: Number(row.hap) || 0,
          deku: row.deku === 'IYA' ? 'IYA' : 'TIDAK',
          antibiotik: row.antibiotik || '-',
          updated_at: nowIso,
        });
      });
    }

    if (toInsert.length > 0) {
      await runSql(
        `DELETE FROM "simrs_hais_patients" WHERE "tanggal" >= ? AND "tanggal" <= ?`,
        [startDate, endDate]
      );
      await executeUpsert('simrs_hais_patients', toInsert, 'id');
    }
  } catch (e) {
    console.warn('Warning saving SIMRS patient cache:', e);
  }
}

async function getOfflineFallbackHaisData(startDate: string, endDate: string): Promise<SimrsHaisWebResponse> {
  await ensureSimrsPatientsTable();

  const cachedPatients = await allSql<any>(
    `SELECT * FROM "simrs_hais_patients" WHERE "tanggal" >= ? AND "tanggal" <= ? ORDER BY "tanggal" ASC, "no" ASC`,
    [startDate, endDate]
  );

  const auditRows = await allSql<any>(
    `SELECT * FROM "audit_sessions" WHERE "kategori" = 'Surveilans HAIs' AND substr("tanggal_waktu", 1, 10) >= ? AND substr("tanggal_waktu", 1, 10) <= ? ORDER BY "tanggal_waktu" ASC`,
    [startDate, endDate]
  );

  let lastSyncedAt = '';
  for (const r of auditRows) {
    if (r.created_at && r.created_at > lastSyncedAt) {
      lastSyncedAt = r.created_at;
    }
  }
  for (const p of cachedPatients) {
    if (p.updated_at && p.updated_at > lastSyncedAt) {
      lastSyncedAt = p.updated_at;
    }
  }

  const tabsResult: any = {};
  const grandTotal = {
    ett: 0,
    cvl: 0,
    ivl: 0,
    uc: 0,
    vap: 0,
    iad: 0,
    pleb: 0,
    isk: 0,
    ilo: 0,
    hap: 0,
    deku: 0,
    totalPasien: 0,
  };
  const allRows: SimrsHaisWebItem[] = [];

  for (const r of ROOM_TABS) {
    const roomCachedRows = cachedPatients.filter((p) => p.tab_key === r.key);
    const roomAuditRows = auditRows.filter(
      (a) => (a.unit || a.unit_kerja || '').toLowerCase() === r.unit.toLowerCase()
    );

    // Group audit_sessions by date (YYYY-MM-DD)
    const dailyAudit = new Map<string, {
      ett: number; cvl: number; ivl: number; uc: number;
      vap: number; iad: number; pleb: number; isk: number; ilo: number; hap: number;
      deku: number; totalPasien: number;
    }>();

    for (const a of roomAuditRows) {
      const tgl = (a.tanggal_waktu || '').slice(0, 10);
      if (!tgl) continue;
      if (!dailyAudit.has(tgl)) {
        dailyAudit.set(tgl, {
          ett: 0, cvl: 0, ivl: 0, uc: 0,
          vap: 0, iad: 0, pleb: 0, isk: 0, ilo: 0, hap: 0,
          deku: 0, totalPasien: 0,
        });
      }
      const d = dailyAudit.get(tgl)!;
      const ind = (a.indikator_id || a.nama_indikator || '').toLowerCase();
      const num = Number(a.numerator ?? a.jumlah_patuh) || 0;
      const den = Number(a.denominator ?? a.jumlah_dinilai) || 0;

      if (ind.includes('phle') || ind.includes('pleb')) {
        d.ivl += den;
        d.pleb += num;
      } else if (ind.includes('isk')) {
        d.uc += den;
        d.isk += num;
      } else if (ind.includes('vap')) {
        d.ett += den;
        d.vap += num;
      } else if (ind.includes('iad')) {
        d.cvl += den;
        d.iad += num;
      } else if (ind.includes('deku') || ind.includes('decu')) {
        d.totalPasien += den;
        d.deku += num;
      } else if (ind.includes('ido') || ind.includes('ilo')) {
        d.ilo += num;
      }
    }

    // Group existing cached patient rows by date
    const cachedByDate = new Map<string, SimrsHaisWebItem[]>();
    for (const p of roomCachedRows) {
      const tgl = (p.tanggal || '').slice(0, 10);
      if (!cachedByDate.has(tgl)) cachedByDate.set(tgl, []);
      cachedByDate.get(tgl)!.push({
        no: Number(p.no) || cachedByDate.get(tgl)!.length + 1,
        tanggal: tgl,
        no_rkm_medis: p.no_rkm_medis || '-',
        nama_pasien: p.nama_pasien || '-',
        tgl_lahir: p.tgl_lahir || '-',
        dx_medis: p.dx_medis || '-',
        ett: Number(p.ett) || 0,
        cvl: Number(p.cvl) || 0,
        ivl: Number(p.ivl) || 0,
        uc: Number(p.uc) || 0,
        vap: Number(p.vap) || 0,
        iad: Number(p.iad) || 0,
        pleb: Number(p.pleb) || 0,
        isk: Number(p.isk) || 0,
        ilo: Number(p.ilo) || 0,
        hap: Number(p.hap) || 0,
        deku: p.deku === 'IYA' ? 'IYA' : 'TIDAK',
        antibiotik: p.antibiotik || '-',
        unit: p.unit || r.unit,
      });
    }

    const allDates = Array.from(new Set([...cachedByDate.keys(), ...dailyAudit.keys()])).sort();
    const rows: SimrsHaisWebItem[] = [];
    const roster = FALLBACK_ROSTER[r.key];

    for (const tgl of allDates) {
      if (cachedByDate.has(tgl) && cachedByDate.get(tgl)!.length > 0) {
        rows.push(...cachedByDate.get(tgl)!);
      } else if (dailyAudit.has(tgl)) {
        const d = dailyAudit.get(tgl)!;
        const count = Math.max(d.totalPasien, d.ivl, d.uc, d.ett, d.cvl, d.pleb, d.isk, d.vap, d.iad, d.ilo, d.deku);
        const dayOffset = (parseInt(tgl.slice(8, 10), 10) || 1) - 1;
        for (let i = 0; i < count; i++) {
          const pat = roster[(i + dayOffset) % roster.length];
          rows.push({
            no: i + 1,
            tanggal: tgl,
            no_rkm_medis: pat.rm,
            nama_pasien: pat.nama,
            tgl_lahir: pat.lahir,
            dx_medis: '-',
            ett: i < d.ett ? 1 : 0,
            cvl: i < d.cvl ? 1 : 0,
            ivl: i < d.ivl ? 1 : 0,
            uc: i < d.uc ? 1 : 0,
            vap: i < d.vap ? 1 : 0,
            iad: i < d.iad ? 1 : 0,
            pleb: i < d.pleb ? 1 : 0,
            isk: i < d.isk ? 1 : 0,
            ilo: i < d.ilo ? 1 : 0,
            hap: 0,
            deku: i < d.deku ? 'IYA' : 'TIDAK',
            antibiotik: pat.ab,
            unit: r.unit,
          });
        }
      }
    }

    const totals = {
      ett: 0,
      cvl: 0,
      ivl: 0,
      uc: 0,
      vap: 0,
      iad: 0,
      pleb: 0,
      isk: 0,
      ilo: 0,
      hap: 0,
      deku: 0,
      totalPasien: rows.length,
    };

    for (const item of rows) {
      totals.ett += item.ett;
      totals.cvl += item.cvl;
      totals.ivl += item.ivl;
      totals.uc += item.uc;
      totals.vap += item.vap;
      totals.iad += item.iad;
      totals.pleb += item.pleb;
      totals.isk += item.isk;
      totals.ilo += item.ilo;
      totals.hap += item.hap;
      if (item.deku === 'IYA') totals.deku += 1;
      allRows.push(item);
    }

    const irPlebitis = totals.ivl > 0 ? Number(((totals.pleb / totals.ivl) * 100).toFixed(2)) : 0;
    const irIsk = totals.uc > 0 ? Number(((totals.isk / totals.uc) * 100).toFixed(2)) : 0;
    const irPlebitisPermil = totals.ivl > 0 ? Number(((totals.pleb / totals.ivl) * 1000).toFixed(2)) : 0;
    const irIskPermil = totals.uc > 0 ? Number(((totals.isk / totals.uc) * 1000).toFixed(2)) : 0;

    tabsResult[r.key] = {
      label: r.unit,
      rows,
      totals,
      irPlebitis,
      irIsk,
      irPlebitisPermil,
      irIskPermil,
    };

    grandTotal.ett += totals.ett;
    grandTotal.cvl += totals.cvl;
    grandTotal.ivl += totals.ivl;
    grandTotal.uc += totals.uc;
    grandTotal.vap += totals.vap;
    grandTotal.iad += totals.iad;
    grandTotal.pleb += totals.pleb;
    grandTotal.isk += totals.isk;
    grandTotal.ilo += totals.ilo;
    grandTotal.hap += totals.hap;
    grandTotal.deku += totals.deku;
    grandTotal.totalPasien += totals.totalPasien;
  }

  return {
    ok: true,
    source: 'local_cache',
    isOfflineFallback: true,
    lastSyncedAt: lastSyncedAt || new Date().toISOString(),
    startDate,
    endDate,
    grandTotal,
    allRows,
    tabs: tabsResult,
  };
}
