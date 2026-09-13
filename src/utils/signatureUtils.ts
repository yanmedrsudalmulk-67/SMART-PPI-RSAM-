/**
 * Utility to ensure signatures drawn with light ink (e.g. white pen on dark signature pad)
 * are cleanly converted to pure black ink (#000000) for official reports and PDF exports.
 * This ensures signatures render with 100% visibility on white paper in HTML2Canvas / jsPDF.
 */

export function exportBlackSignatureCanvas(rawCanvas: HTMLCanvasElement): string {
  if (!rawCanvas) return '';
  try {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = rawCanvas.width;
    tempCanvas.height = rawCanvas.height;
    const ctx = tempCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return rawCanvas.toDataURL('image/png');

    ctx.drawImage(rawCanvas, 0, 0);
    const imgData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const data = imgData.data;

    let hasInk = false;
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      if (alpha > 15) {
        hasInk = true;
        // Convert any colored/white ink to pure solid black while preserving anti-aliased alpha
        data[i] = 0;     // R
        data[i + 1] = 0; // G
        data[i + 2] = 0; // B
      }
    }

    if (hasInk) {
      ctx.putImageData(imgData, 0, 0);
      return tempCanvas.toDataURL('image/png');
    }
    return rawCanvas.toDataURL('image/png');
  } catch (err) {
    console.warn('exportBlackSignatureCanvas error, falling back:', err);
    return rawCanvas.toDataURL('image/png');
  }
}

export function ensureBlackSignature(src: string): Promise<string> {
  return new Promise((resolve) => {
    if (!src || typeof window === 'undefined') {
      return resolve(src || '');
    }

    // Only process images (data urls, http URLs, blobs)
    if (!src.startsWith('data:image') && !src.startsWith('http') && !src.startsWith('blob:')) {
      return resolve(src);
    }

    const img = new Image();
    // Only set crossOrigin for remote http URLs to prevent CORS errors on data: URIs
    if (src.startsWith('http')) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 300;
        canvas.height = img.naturalHeight || img.height || 150;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          return resolve(src);
        }

        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        let hasLightInk = false;
        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3];
          if (alpha > 15) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            // If the ink is light/white/colored (e.g. drawn with white pen)
            if (r > 60 || g > 60 || b > 60) {
              hasLightInk = true;
              data[i] = 0;     // R -> black
              data[i + 1] = 0; // G -> black
              data[i + 2] = 0; // B -> black
            }
          }
        }

        if (hasLightInk) {
          ctx.putImageData(imgData, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          // Already dark ink or empty
          resolve(src);
        }
      } catch (err) {
        console.warn('ensureBlackSignature processing error, using original src:', err);
        resolve(src);
      }
    };

    img.onerror = () => {
      resolve(src);
    };

    img.src = src;
  });
}
