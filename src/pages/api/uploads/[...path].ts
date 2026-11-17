import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';

const MIME_TYPES: Record<string, string> = {
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.bmp': 'image/bmp',
  '.ico': 'image/x-icon',
  '.avif': 'image/avif',
  '.jfif': 'image/jpeg',
  '.pdf': 'application/pdf',
  '.mp4': 'video/mp4',
};

export const config = {
  api: {
    responseLimit: false,
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle CORS preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { path: rawPath } = req.query;
    if (!rawPath) {
      return res.status(400).json({ error: 'Missing path parameter' });
    }

    const segments = Array.isArray(rawPath) ? rawPath : [rawPath];
    const decodedSegments = segments.map((seg) => {
      try {
        return decodeURIComponent(seg);
      } catch {
        return seg;
      }
    });

    let subPath = decodedSegments.join('/');
    // Strip accidental leading 'uploads/' prefix if passed
    if (subPath.startsWith('uploads/')) {
      subPath = subPath.replace(/^uploads\//, '');
    }

    // Base directories to look for uploaded files
    const uploadsBase = path.resolve(process.cwd(), 'public/uploads');
    const publicBase = path.resolve(process.cwd(), 'public');

    let targetFile = path.resolve(uploadsBase, subPath);

    // Prevent directory traversal attacks
    if (!targetFile.startsWith(uploadsBase) && !targetFile.startsWith(publicBase)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Fallback 1: check public/uploads/<subPath>
    if (!fs.existsSync(targetFile)) {
      // Fallback 2: check public/<subPath>
      const altFile = path.resolve(publicBase, subPath);
      if (altFile.startsWith(publicBase) && fs.existsSync(altFile)) {
        targetFile = altFile;
      } else {
        return res.status(404).json({ error: 'File not found', path: subPath });
      }
    }

    const stat = fs.statSync(targetFile);
    if (!stat.isFile()) {
      return res.status(404).json({ error: 'Not a file' });
    }

    const ext = path.extname(targetFile).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Last-Modified', stat.mtime.toUTCString());

    if (req.method === 'HEAD') {
      return res.status(200).end();
    }

    const stream = fs.createReadStream(targetFile);
    stream.on('error', (streamErr) => {
      console.error('File stream error:', streamErr);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error streaming file' });
      }
    });

    return stream.pipe(res);
  } catch (err: any) {
    console.error('Uploads handler error:', err);
    if (!res.headersSent) {
      return res.status(500).json({ error: err.message || 'Internal server error' });
    }
  }
}
