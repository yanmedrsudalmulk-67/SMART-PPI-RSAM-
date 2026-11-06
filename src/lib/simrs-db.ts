import mysql from 'mysql2/promise';

export interface SimrsConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password?: string;
}

export function getSimrsConfig(): SimrsConfig {
  return {
    host: process.env.SIMRS_DB_HOST || '192.168.18.11',
    port: Number(process.env.SIMRS_DB_PORT) || 3306,
    database: process.env.SIMRS_DB_NAME || 'db_almulk',
    user: process.env.SIMRS_DB_USER || 'client',
    password: process.env.SIMRS_DB_PASS || 'rsam2020',
  };
}

let pool: mysql.Pool | null = null;

export function getSimrsPool(): mysql.Pool {
  if (!pool) {
    const config = getSimrsConfig();
    pool = mysql.createPool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 5000,
      dateStrings: true,
    });
  }
  return pool;
}

export interface SimrsHaisWebItem {
  no: number;
  tanggal: string;
  no_rkm_medis: string;
  nama_pasien: string;
  tgl_lahir: string;
  dx_medis: string;
  ett: number;
  cvl: number;
  ivl: number;
  uc: number;
  vap: number;
  iad: number;
  pleb: number;
  isk: number;
  ilo: number;
  hap: number;
  deku: 'IYA' | 'TIDAK';
  antibiotik: string;
  unit: string;
}

export interface SimrsHaisTabSummary {
  label: string;
  rows: SimrsHaisWebItem[];
  totals: {
    ett: number;
    cvl: number;
    ivl: number;
    uc: number;
    vap: number;
    iad: number;
    pleb: number;
    isk: number;
    ilo: number;
    hap: number;
    deku: number;
    totalPasien: number;
  };
  irPlebitis: number; // in % (seperti pada web data_hais1)
  irIsk: number; // in %
  irPlebitisPermil: number; // in ‰ (standar mutu akreditasi Kemenkes)
  irIskPermil: number; // in ‰
}

export interface SimrsHaisWebResponse {
  ok: boolean;
  source: 'simrs_web' | 'simrs_mysql' | 'error';
  startDate: string;
  endDate: string;
  grandTotal: {
    ett: number;
    cvl: number;
    ivl: number;
    uc: number;
    vap: number;
    iad: number;
    pleb: number;
    isk: number;
    ilo: number;
    hap: number;
    deku: number;
    totalPasien: number;
  };
  allRows: SimrsHaisWebItem[];
  tabs: {
    dewasa: SimrsHaisTabSummary;
    anak: SimrsHaisTabSummary;
    kebidanan: SimrsHaisTabSummary;
    bedah: SimrsHaisTabSummary;
  };
  error?: string;
}

export interface SimrsHaisRecord {
  tanggal: string;
  no_rawat: string;
  no_rkm_medis: string;
  nm_pasien: string;
  tgl_lahir?: string;
  dx_medis?: string;
  kd_kamar: string;
  nm_bangsal: string;
  ruangan_kategori?: string;
  ETT: number;
  CVL: number;
  IVL: number;
  UC: number;
  VAP: number;
  IAD: number;
  PLEB: number;
  ISK: number;
  ILO: number;
  HAP: number;
  Tinea: number;
  Scabies: number;
  DEKU: 'IYA' | 'TIDAK';
  SPUTUM?: string;
  DARAH?: string;
  URINE?: string;
  ANTIBIOTIK?: string;
}

export interface SimrsInpatientRecord {
  no_rawat: string;
  no_rkm_medis: string;
  nm_pasien: string;
  jk: string;
  alamat: string;
  kd_kamar: string;
  nm_bangsal: string;
  tgl_masuk: string;
  jam_masuk: string;
  hais_tanggal?: string | null;
  ETT: number;
  CVL: number;
  IVL: number;
  UC: number;
  VAP: number;
  IAD: number;
  PLEB: number;
  ISK: number;
  ILO: number;
  DEKU: 'IYA' | 'TIDAK';
}

export async function testSimrsConnection(): Promise<{ ok: boolean; message: string; host: string; database: string }> {
  const config = getSimrsConfig();
  try {
    const p = getSimrsPool();
    await p.query('SELECT 1 as test');
    return {
      ok: true,
      message: 'Koneksi ke SIMRS Khanza (db_almulk) Berhasil!',
      host: config.host,
      database: config.database,
    };
  } catch (err: any) {
    return {
      ok: false,
      message: err.message || 'Gagal terhubung ke database SIMRS Khanza',
      host: config.host,
      database: config.database,
    };
  }
}

/**
 * Mengambil dan mem-parsing data HAIs langsung dari web internal SIMRS Khanza:
 * http://192.168.18.11/almulk/ranap/data_hais1
 * Menghasilkan data yang 100% presisi dengan format tampilan SIMRS RSUD Al-Mulk.
 */
export async function fetchSimrsHaisWeb(startDate: string, endDate: string): Promise<SimrsHaisWebResponse> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    const res = await fetch('http://192.168.18.11/almulk/ranap/data_hais1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `date1=${startDate}&date2=${endDate}`,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`HTTP response ${res.status} dari web SIMRS`);
    }

    const html = await res.text();

    const tabsDef: Array<{ key: 'dewasa' | 'anak' | 'kebidanan' | 'bedah'; label: string; id: string }> = [
      { key: 'dewasa', label: 'Ranap Dewasa', id: 'nav-dewasa' },
      { key: 'anak', label: 'Ranap Anak', id: 'nav-anak' },
      { key: 'kebidanan', label: 'Ranap Kebidanan', id: 'nav-kebidanan' },
      { key: 'bedah', label: 'Ranap Bedah', id: 'nav-bedah' },
    ];

    const results: any = {};
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

    for (let i = 0; i < tabsDef.length; i++) {
      const tab = tabsDef[i];
      const startIdx = html.indexOf(`id="${tab.id}"`);
      if (startIdx === -1) {
        results[tab.key] = {
          label: tab.label,
          rows: [],
          totals: { ett: 0, cvl: 0, ivl: 0, uc: 0, vap: 0, iad: 0, pleb: 0, isk: 0, ilo: 0, hap: 0, deku: 0, totalPasien: 0 },
          irPlebitis: 0,
          irIsk: 0,
          irPlebitisPermil: 0,
          irIskPermil: 0,
        };
        continue;
      }

      const nextTabIdx = i < tabsDef.length - 1 ? html.indexOf(`id="${tabsDef[i + 1].id}"`) : html.length;
      const tabHtml = html.substring(startIdx, nextTabIdx);

      const plebMatch = tabHtml.match(/IR Plebitis.*?adalah\s*([\d\.,]+)\s*%/i);
      const iskMatch = tabHtml.match(/IR ISK.*?adalah\s*([\d\.,]+)\s*%/i);
      const rawPleb = plebMatch ? parseFloat(plebMatch[1].replace(',', '.')) : null;
      const rawIsk = iskMatch ? parseFloat(iskMatch[1].replace(',', '.')) : null;

      const trs = tabHtml.match(/<tr>[\s\S]*?<\/tr>/gi) || [];
      const rows: SimrsHaisWebItem[] = [];
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
        totalPasien: 0,
      };

      for (let r = 2; r < trs.length; r++) {
        const tr = trs[r];
        const tds = (tr.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || []).map((td) =>
          td.replace(/<[^>]+>/g, '').trim()
        );
        if (tds.length === 0) continue;

        if (tds[0]?.toLowerCase().includes('total')) {
          totals.ett = parseInt(tds[1]) || 0;
          totals.cvl = parseInt(tds[2]) || 0;
          totals.ivl = parseInt(tds[3]) || 0;
          totals.uc = parseInt(tds[4]) || 0;
          totals.vap = parseInt(tds[5]) || 0;
          totals.iad = parseInt(tds[6]) || 0;
          totals.pleb = parseInt(tds[7]) || 0;
          totals.isk = parseInt(tds[8]) || 0;
          totals.ilo = parseInt(tds[9]) || 0;
          totals.hap = parseInt(tds[10]) || 0;
        } else if (tds.length >= 18) {
          const item: SimrsHaisWebItem = {
            no: parseInt(tds[0]) || rows.length + 1,
            tanggal: tds[1],
            no_rkm_medis: tds[2],
            nama_pasien: tds[3],
            tgl_lahir: tds[4],
            dx_medis: tds[5],
            ett: parseInt(tds[6]) || 0,
            cvl: parseInt(tds[7]) || 0,
            ivl: parseInt(tds[8]) || 0,
            uc: parseInt(tds[9]) || 0,
            vap: parseInt(tds[10]) || 0,
            iad: parseInt(tds[11]) || 0,
            pleb: parseInt(tds[12]) || 0,
            isk: parseInt(tds[13]) || 0,
            ilo: parseInt(tds[14]) || 0,
            hap: parseInt(tds[15]) || 0,
            deku: (tds[16] || '').toUpperCase() === 'IYA' ? 'IYA' : 'TIDAK',
            antibiotik: tds[17] || '',
            unit: tds[18] || tab.label,
          };
          rows.push(item);
          allRows.push(item);
          if (item.deku === 'IYA') totals.deku++;
        }
      }

      totals.totalPasien = rows.length;
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

      const irPleb = rawPleb !== null
        ? Number(rawPleb.toFixed(2))
        : (totals.ivl > 0 ? Number(((totals.pleb / totals.ivl) * 100).toFixed(2)) : 0);
      const irIsk = rawIsk !== null
        ? Number(rawIsk.toFixed(2))
        : (totals.uc > 0 ? Number(((totals.isk / totals.uc) * 100).toFixed(2)) : 0);

      results[tab.key] = {
        label: tab.label,
        rows,
        totals,
        irPlebitis: irPleb,
        irIsk: irIsk,
        irPlebitisPermil: totals.ivl > 0 ? Number(((totals.pleb / totals.ivl) * 1000).toFixed(2)) : 0,
        irIskPermil: totals.uc > 0 ? Number(((totals.isk / totals.uc) * 1000).toFixed(2)) : 0,
      };
    }

    return {
      ok: true,
      source: 'simrs_web',
      startDate,
      endDate,
      grandTotal,
      allRows,
      tabs: results,
    };
  } catch (err: any) {
    console.warn('Web SIMRS unreachable, falling back to direct MySQL data_HAIs:', err.message);
    return fetchSimrsHaisFallbackMysql(startDate, endDate);
  }
}

/**
 * Fallback jika web HTTP tidak dapat diakses:
 * Query langsung ke tabel MySQL `data_HAIs` dengan join reg_periksa, pasien, dokter / spesialis.
 */
async function fetchSimrsHaisFallbackMysql(startDate: string, endDate: string): Promise<SimrsHaisWebResponse> {
  try {
    const raw = await fetchSimrsHaisRecords(startDate, endDate);

    const tabsDef: Array<{ key: 'dewasa' | 'anak' | 'kebidanan' | 'bedah'; label: string }> = [
      { key: 'dewasa', label: 'Ranap Dewasa' },
      { key: 'anak', label: 'Ranap Anak' },
      { key: 'kebidanan', label: 'Ranap Kebidanan' },
      { key: 'bedah', label: 'Ranap Bedah' },
    ];

    const results: any = {};
    const grandTotal = {
      ett: 0, cvl: 0, ivl: 0, uc: 0,
      vap: 0, iad: 0, pleb: 0, isk: 0, ilo: 0, hap: 0,
      deku: 0, totalPasien: 0,
    };
    const allRows: SimrsHaisWebItem[] = [];

    tabsDef.forEach((t) => {
      results[t.key] = {
        label: t.label,
        rows: [],
        totals: { ett: 0, cvl: 0, ivl: 0, uc: 0, vap: 0, iad: 0, pleb: 0, isk: 0, ilo: 0, hap: 0, deku: 0, totalPasien: 0 },
        irPlebitis: 0,
        irIsk: 0,
        irPlebitisPermil: 0,
        irIskPermil: 0,
      };
    });

    raw.forEach((r, idx) => {
      const roomCat = mapBangsalToSmartPpi(r.nm_bangsal);
      let tabKey: 'dewasa' | 'anak' | 'kebidanan' | 'bedah' = 'dewasa';
      if (roomCat === 'Ranap Anak') tabKey = 'anak';
      else if (roomCat === 'Ranap Kebidanan') tabKey = 'kebidanan';
      else if (roomCat === 'Ranap Bedah') tabKey = 'bedah';

      const item: SimrsHaisWebItem = {
        no: results[tabKey].rows.length + 1,
        tanggal: r.tanggal,
        no_rkm_medis: r.no_rkm_medis,
        nama_pasien: r.nm_pasien,
        tgl_lahir: r.tgl_lahir || '-',
        dx_medis: r.dx_medis || '-',
        ett: Number(r.ETT) || 0,
        cvl: Number(r.CVL) || 0,
        ivl: Number(r.IVL) || 0,
        uc: Number(r.UC) || 0,
        vap: Number(r.VAP) || 0,
        iad: Number(r.IAD) || 0,
        pleb: Number(r.PLEB) || 0,
        isk: Number(r.ISK) || 0,
        ilo: Number(r.ILO) || 0,
        hap: Number(r.HAP) || 0,
        deku: r.DEKU === 'IYA' ? 'IYA' : 'TIDAK',
        antibiotik: r.ANTIBIOTIK || '',
        unit: results[tabKey].label,
      };

      results[tabKey].rows.push(item);
      allRows.push(item);

      const tot = results[tabKey].totals;
      tot.ett += item.ett;
      tot.cvl += item.cvl;
      tot.ivl += item.ivl;
      tot.uc += item.uc;
      tot.vap += item.vap;
      tot.iad += item.iad;
      tot.pleb += item.pleb;
      tot.isk += item.isk;
      tot.ilo += item.ilo;
      tot.hap += item.hap;
      if (item.deku === 'IYA') tot.deku++;
      tot.totalPasien++;

      grandTotal.ett += item.ett;
      grandTotal.cvl += item.cvl;
      grandTotal.ivl += item.ivl;
      grandTotal.uc += item.uc;
      grandTotal.vap += item.vap;
      grandTotal.iad += item.iad;
      grandTotal.pleb += item.pleb;
      grandTotal.isk += item.isk;
      grandTotal.ilo += item.ilo;
      grandTotal.hap += item.hap;
      if (item.deku === 'IYA') grandTotal.deku++;
      grandTotal.totalPasien++;
    });

    // Hitung IR
    tabsDef.forEach((t) => {
      const tot = results[t.key].totals;
      results[t.key].irPlebitis = tot.ivl > 0 ? Number(((tot.pleb / tot.ivl) * 100).toFixed(2)) : 0;
      results[t.key].irIsk = tot.uc > 0 ? Number(((tot.isk / tot.uc) * 100).toFixed(2)) : 0;
      results[t.key].irPlebitisPermil = tot.ivl > 0 ? (tot.pleb / tot.ivl) * 1000 : 0;
      results[t.key].irIskPermil = tot.uc > 0 ? (tot.isk / tot.uc) * 1000 : 0;
    });

    return {
      ok: true,
      source: 'simrs_mysql',
      startDate,
      endDate,
      grandTotal,
      allRows,
      tabs: results,
    };
  } catch (err: any) {
    return {
      ok: false,
      source: 'error',
      startDate,
      endDate,
      grandTotal: { ett: 0, cvl: 0, ivl: 0, uc: 0, vap: 0, iad: 0, pleb: 0, isk: 0, ilo: 0, hap: 0, deku: 0, totalPasien: 0 },
      allRows: [],
      tabs: {} as any,
      error: err.message,
    };
  }
}

export async function fetchSimrsHaisRecords(startDate: string, endDate: string): Promise<SimrsHaisRecord[]> {
  const p = getSimrsPool();
  // Menggunakan `data_HAIs` dengan huruf besar sesuai struktur case-sensitive MySQL Linux
  const sql = `
    SELECT 
      dh.tanggal,
      dh.no_rawat,
      COALESCE(rp.no_rkm_medis, '-') AS no_rkm_medis,
      COALESCE(p.nm_pasien, CONCAT('Pasien ', dh.no_rawat)) AS nm_pasien,
      COALESCE(p.tgl_lahir, '-') AS tgl_lahir,
      COALESCE(dp_diag.kd_penyakit, '-') AS dx_medis,
      COALESCE(dh.kd_kamar, ki.kd_kamar, '-') AS kd_kamar,
      COALESCE(b.nm_bangsal, b2.nm_bangsal, 'Rawat Inap') AS nm_bangsal,
      COALESCE(dh.ETT, 0) AS ETT,
      COALESCE(dh.CVL, 0) AS CVL,
      COALESCE(dh.IVL, 0) AS IVL,
      COALESCE(dh.UC, 0) AS UC,
      COALESCE(dh.VAP, 0) AS VAP,
      COALESCE(dh.IAD, 0) AS IAD,
      COALESCE(dh.PLEB, 0) AS PLEB,
      COALESCE(dh.ISK, 0) AS ISK,
      COALESCE(dh.ILO, 0) AS ILO,
      COALESCE(dh.HAP, 0) AS HAP,
      COALESCE(dh.Tinea, 0) AS Tinea,
      COALESCE(dh.Scabies, 0) AS Scabies,
      COALESCE(dh.DEKU, 'TIDAK') AS DEKU,
      COALESCE(dh.SPUTUM, '') AS SPUTUM,
      COALESCE(dh.DARAH, '') AS DARAH,
      COALESCE(dh.URINE, '') AS URINE,
      COALESCE(dh.ANTIBIOTIK, '') AS ANTIBIOTIK
    FROM \`data_HAIs\` dh
    LEFT JOIN reg_periksa rp ON dh.no_rawat = rp.no_rawat
    LEFT JOIN pasien p ON rp.no_rkm_medis = p.no_rkm_medis
    LEFT JOIN kamar k ON dh.kd_kamar = k.kd_kamar
    LEFT JOIN bangsal b ON k.kd_bangsal = b.kd_bangsal
    LEFT JOIN kamar_inap ki ON dh.no_rawat = ki.no_rawat AND ki.stts_pulang = '-'
    LEFT JOIN kamar k2 ON ki.kd_kamar = k2.kd_kamar
    LEFT JOIN bangsal b2 ON k2.kd_bangsal = b2.kd_bangsal
    LEFT JOIN (
      SELECT no_rawat, kd_penyakit 
      FROM diagnosa_pasien 
      WHERE prioritas = 1
      GROUP BY no_rawat
    ) dp_diag ON dh.no_rawat = dp_diag.no_rawat
    WHERE dh.tanggal BETWEEN ? AND ?
    ORDER BY dh.tanggal DESC, dh.no_rawat DESC
  `;
  const [rows] = await p.query(sql, [startDate, endDate]);
  return rows as SimrsHaisRecord[];
}

export async function fetchSimrsInpatients(): Promise<SimrsInpatientRecord[]> {
  const p = getSimrsPool();
  const sql = `
    SELECT 
      ki.no_rawat,
      rp.no_rkm_medis,
      p.nm_pasien,
      p.jk,
      p.alamat,
      ki.kd_kamar,
      COALESCE(b.nm_bangsal, 'Ruang Rawat Inap') AS nm_bangsal,
      ki.tgl_masuk,
      ki.jam_masuk,
      dh.tanggal AS hais_tanggal,
      COALESCE(dh.ETT, 0) AS ETT,
      COALESCE(dh.CVL, 0) AS CVL,
      COALESCE(dh.IVL, 0) AS IVL,
      COALESCE(dh.UC, 0) AS UC,
      COALESCE(dh.VAP, 0) AS VAP,
      COALESCE(dh.IAD, 0) AS IAD,
      COALESCE(dh.PLEB, 0) AS PLEB,
      COALESCE(dh.ISK, 0) AS ISK,
      COALESCE(dh.ILO, 0) AS ILO,
      COALESCE(dh.DEKU, 'TIDAK') AS DEKU
    FROM kamar_inap ki
    JOIN reg_periksa rp ON ki.no_rawat = rp.no_rawat
    JOIN pasien p ON rp.no_rkm_medis = p.no_rkm_medis
    JOIN kamar k ON ki.kd_kamar = k.kd_kamar
    JOIN bangsal b ON k.kd_bangsal = b.kd_bangsal
    LEFT JOIN \`data_HAIs\` dh ON ki.no_rawat = dh.no_rawat AND dh.tanggal = CURDATE()
    WHERE ki.stts_pulang = '-'
    ORDER BY b.nm_bangsal ASC, ki.tgl_masuk DESC
  `;
  const [rows] = await p.query(sql);
  return rows as SimrsInpatientRecord[];
}

export async function authenticateSimrsUser(username: string, password: string): Promise<{ ok: boolean; user?: any; error?: string }> {
  try {
    const p = getSimrsPool();
    const sql = `
      SELECT 
        p.nik,
        p.nama,
        p.jbtn,
        p.departemen
      FROM user u
      JOIN pegawai p ON AES_DECRYPT(u.id_user, 'nur') = p.nik
      WHERE AES_DECRYPT(u.id_user, 'nur') = ?
        AND u.password = AES_ENCRYPT(?, 'windi')
      LIMIT 1
    `;
    const [rows]: any = await p.query(sql, [username.trim(), password]);
    if (rows && rows.length > 0) {
      return {
        ok: true,
        user: {
          nik: rows[0].nik,
          nama: rows[0].nama,
          jabatan: rows[0].jbtn,
          departemen: rows[0].departemen,
        }
      };
    }
    return { ok: false, error: 'Username atau password SIMRS Khanza tidak cocok' };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

// Map nama bangsal SIMRS Khanza ke 4 kategori ruangan standar RSUD Al-Mulk
export function mapBangsalToSmartPpi(nmBangsal: string): string {
  const upper = (nmBangsal || '').toUpperCase();
  if (upper.includes('PERINATO') || upper.includes('ANAK') || upper.includes('FATIMAH')) return 'Ranap Anak';
  if (upper.includes('ZAENAB') || upper.includes('KEBIDANAN') || upper.includes('BERSALIN') || upper.includes('VK') || upper.includes('KHADIJAH')) return 'Ranap Kebidanan';
  if (upper.includes('BEDAH') || upper.includes('ALI BIN ABU THALIB') || upper.includes('MUSAB')) return 'Ranap Bedah';
  if (upper.includes('AISYAH') || upper.includes('MARYAM') || upper.includes('SUMAYAH') || upper.includes('USMAN')) return 'Ranap Dewasa';
  if (upper.includes('HCU') || upper.includes('ICU')) return 'Ranap Dewasa';
  if (upper.includes('UGD') || upper.includes('IGD')) return 'IGD';
  return 'Ranap Dewasa';
}
