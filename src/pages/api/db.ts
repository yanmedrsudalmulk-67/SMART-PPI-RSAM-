import type { NextApiRequest, NextApiResponse } from 'next';
import {
  executeSelect,
  executeInsert,
  executeUpdate,
  executeUpsert,
  executeDelete
} from '@/lib/sqlite-db';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
    responseLimit: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, table, options, rows, updates, filters, onConflict } = req.body;

    if (!table || typeof table !== 'string') {
      return res.status(400).json({ error: 'Missing table name' });
    }

    // Tabel akun IPCLN hanya boleh diakses lewat /api/auth/ipcln
    if (table.toLowerCase() === 'ipcln_accounts') {
      return res.status(403).json({ data: null, error: { message: 'Akses tabel ini tidak diizinkan.' } });
    }

    switch (action) {
      case 'select': {
        const result = await executeSelect(table, options || {});
        return res.status(200).json({ data: result.data, count: result.count, error: null });
      }

      case 'insert': {
        const result = await executeInsert(table, rows || []);
        return res.status(200).json({ data: result.data, error: null });
      }

      case 'upsert': {
        const result = await executeUpsert(table, rows || [], onConflict || 'id');
        return res.status(200).json({ data: result.data, error: null });
      }

      case 'update': {
        const result = await executeUpdate(table, updates || {}, filters || []);
        return res.status(200).json({ data: result.data, error: null });
      }

      case 'delete': {
        const result = await executeDelete(table, filters || []);
        return res.status(200).json({ data: result.data, error: null });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err: any) {
    console.error('API /api/db error:', err);
    return res.status(500).json({ data: null, error: { message: err.message || 'Internal database error' } });
  }
}
