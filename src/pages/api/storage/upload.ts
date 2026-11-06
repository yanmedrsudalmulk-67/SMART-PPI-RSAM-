import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { bucket = 'uploads', path: filePath, base64, contentType } = req.body;

    if (!filePath || !base64) {
      return res.status(400).json({ error: 'Missing path or base64 data' });
    }

    // Clean up base64 prefix if present (e.g. data:image/png;base64,...)
    const cleanBase64 = base64.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    const uploadsDir = path.resolve(process.cwd(), 'public/uploads', bucket);
    const targetFile = path.resolve(uploadsDir, filePath);

    // Prevent directory traversal
    if (!targetFile.startsWith(uploadsDir)) {
      return res.status(400).json({ error: 'Invalid file path' });
    }

    const targetDir = path.dirname(targetFile);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    fs.writeFileSync(targetFile, buffer);

    const publicUrl = `/uploads/${bucket}/${filePath}`;
    return res.status(200).json({
      data: {
        path: filePath,
        publicUrl,
      },
      error: null,
    });
  } catch (err: any) {
    console.error('Storage upload error:', err);
    return res.status(500).json({ error: { message: err.message || 'Upload failed' } });
  }
}
