import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { runSql, getSql } from '@/lib/sqlite-db';
import { authenticateSimrsUser } from '@/lib/simrs-db';

/**
 * API Autentikasi Akun IPCLN (Server Lokal / SQLite)
 * - POST { action: 'register', username, fullName, unit, password }
 * - POST { action: 'login', username, password }
 *
 * Password disimpan dalam bentuk hash (scrypt + salt), bukan teks asli.
 * Tabel ini sengaja diblokir dari endpoint generik /api/db agar data akun tidak bisa dibaca dari browser.
 */

export const IPCLN_ACCOUNTS_TABLE = 'ipcln_accounts';

let tableReady: Promise<void> | null = null;

function ensureTable(): Promise<void> {
  if (!tableReady) {
    tableReady = runSql(
      `CREATE TABLE IF NOT EXISTS "${IPCLN_ACCOUNTS_TABLE}" (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE COLLATE NOCASE,
        full_name TEXT NOT NULL,
        unit TEXT,
        password_hash TEXT NOT NULL,
        password_salt TEXT NOT NULL,
        created_at TEXT NOT NULL
      )`
    ).then(() => undefined).catch((err) => {
      tableReady = null;
      throw err;
    });
  }
  return tableReady;
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function normalizeUsername(raw: unknown): string {
  return typeof raw === 'string' ? raw.trim() : '';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await ensureTable();
    const { action } = req.body || {};

    if (action === 'register') {
      const username = normalizeUsername(req.body.username);
      const fullName = typeof req.body.fullName === 'string' ? req.body.fullName.trim() : '';
      const unit = typeof req.body.unit === 'string' ? req.body.unit.trim() : '';
      const password = typeof req.body.password === 'string' ? req.body.password : '';

      if (!fullName || !username || !unit || !password) {
        return res.status(400).json({ error: 'Semua kolom wajib diisi.' });
      }
      if (!/^[A-Za-z0-9._-]{3,32}$/.test(username)) {
        return res.status(400).json({
          error: 'Username 3-32 karakter, hanya huruf, angka, titik, garis bawah, atau tanda hubung (tanpa spasi).',
        });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password minimal 6 karakter.' });
      }

      const existing = await getSql(
        `SELECT id FROM "${IPCLN_ACCOUNTS_TABLE}" WHERE username = ? COLLATE NOCASE`,
        [username]
      );
      if (existing) {
        return res.status(409).json({ error: 'Username sudah digunakan. Silakan pilih username lain.' });
      }

      const salt = crypto.randomBytes(16).toString('hex');
      await runSql(
        `INSERT INTO "${IPCLN_ACCOUNTS_TABLE}" (id, username, full_name, unit, password_hash, password_salt, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [crypto.randomUUID(), username, fullName, unit, hashPassword(password, salt), salt, new Date().toISOString()]
      );

      return res.status(201).json({ ok: true, user: { username, fullName, unit } });
    }

    if (action === 'login') {
      const username = normalizeUsername(req.body.username);
      const password = typeof req.body.password === 'string' ? req.body.password : '';

      if (!username || !password) {
        return res.status(400).json({ error: 'Harap isi username dan password.' });
      }

      const account = await getSql<{
        username: string;
        full_name: string;
        unit: string;
        password_hash: string;
        password_salt: string;
      }>(
        `SELECT username, full_name, unit, password_hash, password_salt FROM "${IPCLN_ACCOUNTS_TABLE}" WHERE username = ? COLLATE NOCASE`,
        [username]
      );

      const invalidMsg = 'Username atau password tidak cocok di SMART PPI maupun SIMRS Khanza.';
      if (!account) {
        // Coba autentikasi via database SIMRS Khanza
        try {
          const simrsAuth = await authenticateSimrsUser(username, password);
          if (simrsAuth.ok && simrsAuth.user) {
            return res.status(200).json({
              ok: true,
              source: 'simrs',
              user: {
                username: simrsAuth.user.nik,
                fullName: simrsAuth.user.nama,
                unit: simrsAuth.user.jabatan || 'Pelaksana PPI',
              },
            });
          }
        } catch (simrsErr) {
          console.error('SIMRS auth fallback error:', simrsErr);
        }
        return res.status(401).json({ error: invalidMsg });
      }

      const expected = Buffer.from(account.password_hash, 'hex');
      const actual = Buffer.from(hashPassword(password, account.password_salt), 'hex');
      if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
        return res.status(401).json({ error: invalidMsg });
      }

      return res.status(200).json({
        ok: true,
        user: { username: account.username, fullName: account.full_name, unit: account.unit },
      });
    }

    return res.status(400).json({ error: `Aksi tidak dikenal: ${action}` });
  } catch (err: any) {
    console.error('API /api/auth/ipcln error:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server lokal. Coba lagi.' });
  }
}
