import type { NextApiRequest, NextApiResponse } from 'next';
import { randomUUID } from 'crypto';

interface CachedPdf {
  buffer: Buffer;
  filename: string;
  expires: number;
}

// In-memory temporary cache for short-lived PDF download tokens (TTL: 3 minutes)
const pdfCache = new Map<string, CachedPdf>();

// Periodically clean up expired entries
function cleanupExpired() {
  const now = Date.now();
  for (const [key, val] of pdfCache.entries()) {
    if (val.expires < now) {
      pdfCache.delete(key);
    }
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '30mb',
    },
    responseLimit: '30mb',
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  cleanupExpired();

  // 1. GET Request: Download by Token
  if (req.method === 'GET') {
    const { token, download } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Token diperlukan untuk mengunduh PDF' });
    }

    const cached = pdfCache.get(token);
    if (!cached || cached.expires < Date.now()) {
      pdfCache.delete(token);
      return res.status(404).send('Link unduh PDF sudah kedaluwarsa atau tidak ditemukan. Silakan generate ulang.');
    }

    const filename = cached.filename || 'Laporan_Resmi_SMART_PPI.pdf';
    const dispositionType = download === 'false' ? 'inline' : 'attachment';

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `${dispositionType}; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.setHeader('Content-Length', cached.buffer.length);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    return res.status(200).send(cached.buffer);
  }

  // 2. POST Request: Register PDF and get Download Token or Direct Download
  if (req.method === 'POST') {
    try {
      let base64Data: string = '';
      let filename: string = 'Laporan_Resmi_SMART_PPI.pdf';

      if (typeof req.body === 'object' && req.body !== null) {
        base64Data = req.body.pdfBase64 || req.body.data || '';
        filename = req.body.filename || filename;
      } else if (typeof req.body === 'string') {
        try {
          const parsed = JSON.parse(req.body);
          base64Data = parsed.pdfBase64 || parsed.data || '';
          filename = parsed.filename || filename;
        } catch {
          base64Data = req.body;
        }
      }

      // Strip data URI prefix if present
      if (base64Data.includes(',')) {
        base64Data = base64Data.split(',')[1];
      }

      if (!base64Data) {
        return res.status(400).json({ error: 'Data PDF kosong' });
      }

      const buffer = Buffer.from(base64Data, 'base64');
      if (buffer.length === 0) {
        return res.status(400).json({ error: 'Format data PDF tidak valid' });
      }

      // If direct download is requested via form submission
      if (req.query.direct === 'true') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
        res.setHeader('Content-Length', buffer.length);
        return res.status(200).send(buffer);
      }

      // Create token for safe HTTPS download (valid for 3 minutes)
      const token = randomUUID();
      pdfCache.set(token, {
        buffer,
        filename,
        expires: Date.now() + 3 * 60 * 1000,
      });

      const downloadUrl = `/api/download-pdf?token=${token}`;
      return res.status(200).json({
        success: true,
        token,
        filename,
        downloadUrl,
      });
    } catch (err: any) {
      console.error('Error handling PDF download:', err);
      return res.status(500).json({ error: 'Gagal memproses file PDF', details: err?.message });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end(`Metode ${req.method} tidak didukung`);
}
