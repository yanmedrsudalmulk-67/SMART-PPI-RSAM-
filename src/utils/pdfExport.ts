/**
 * Utility for exporting official reports to high-fidelity A4 PDF.
 * Generates exact 1:1 visual match with on-screen view, supports multi-page A4
 * with smart pagination that avoids cutting through table rows and cards.
 */

/**
 * Utility for exporting official reports to high-fidelity A4 PDF.
 * Generates exact 1:1 visual match with on-screen view, supports multi-page A4
 * with page-by-page capture to guarantee zero text/row cutting.
 */

import { ensureBlackSignature } from '@/utils/signatureUtils';

export interface ExportPdfOptions {
  filename?: string;
  margin?: number; // margin in mm, default: 25 (2.5 cm standard official margin)
  scale?: number; // canvas scale, default: 2 (crisp retina)
  title?: string;
  orientation?: 'portrait' | 'landscape';
  paperSize?: 'f4' | 'a4'; // default: 'f4'
  action?: 'download' | 'preview' | 'open' | 'auto';
  onGenerated?: (result: PdfExportResult) => void;
}

export interface PdfExportResult {
  pdf: any;
  blob: Blob;
  file: File;
  dataUri: string;
  base64: string;
  filename: string;
  pageImages: string[];
  downloadUrl?: string;
}

/**
 * Safely delivers a generated PDF to the user's device without triggering
 * "Can not handle uri: blob:..." on Android/mobile.
 */
export async function deliverPdf(
  result: PdfExportResult,
  action: 'download' | 'preview' | 'open' | 'auto' = 'auto'
): Promise<void> {
  const { filename, file, blob, base64 } = result;
  const isMobile =
    typeof navigator !== 'undefined' &&
    /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // If explicit action is preview, do not trigger external download
  if (action === 'preview') {
    return;
  }

  // 1. Explicit 'open' / Share action (when user specifically requested sharing/viewing)
  if (
    action === 'open' &&
    typeof navigator !== 'undefined' &&
    navigator.canShare &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({
        files: [file],
        title: filename,
        text: 'Laporan Resmi SMART-PPI RSUD AL-MULK',
      });
      return;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // User dismissed share sheet, do not force duplicate download
        return;
      }
      console.warn('Navigator share error, falling back to direct download:', err);
    }
  }

  // 2. Direct client-side download via jsPDF built-in save (cross-browser standard):
  if (result.pdf && typeof result.pdf.save === 'function') {
    try {
      result.pdf.save(filename);
      return;
    } catch (saveErr) {
      console.warn('pdf.save error, trying blob url fallback:', saveErr);
    }
  }

  // 3. Direct client-side Blob URL download
  if (blob && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
    try {
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      link.rel = 'noopener noreferrer';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        try {
          if (link.parentNode) link.parentNode.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        } catch {}
      }, 60000); // 60s keeps it active so the browser completes the download stream safely
      return;
    } catch (blobErr) {
      console.warn('Blob URL download error, trying API fallback:', blobErr);
    }
  }

  // 4. API fallback via /api/download-pdf (for environments blocking blob: downloads)
  if (base64) {
    try {
      const res = await fetch('/api/download-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfBase64: base64,
          filename,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.downloadUrl) {
          result.downloadUrl = data.downloadUrl;
          const link = document.createElement('a');
          link.href = data.downloadUrl;
          link.download = filename;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          setTimeout(() => {
            if (link.parentNode) link.parentNode.removeChild(link);
          }, 3000);
          return;
        }
      }
    } catch (apiErr) {
      console.warn('API download route failed:', apiErr);
    }
  }

  // 5. Final fallback: Data URI
  if (base64) {
    try {
      const link = document.createElement('a');
      link.href = base64.startsWith('data:') ? base64 : `data:application/pdf;base64,${base64}`;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        if (link.parentNode) link.parentNode.removeChild(link);
      }, 3000);
    } catch (dataUriErr) {
      console.error('Data URI download failed:', dataUriErr);
    }
  }
}

/**
 * Renders the official running header (Kop Surat Lanjutan PPI RSUD AL-MULK) on page 2 and subsequent pages.
 * Strictly adheres to 2.5 cm (25 mm) top margin while giving official hospital identity and
 * ample visual breathing room so content is never "mepet ke atas".
 */
export function drawHospitalRunningHeader(
  pdf: any,
  pageNumber: number,
  pageWidthMm: number,
  marginLeftMm: number,
  marginRightMm: number,
  marginTopMm: number,
  isLandscape: boolean = false
): number {
  // Official Kop Surat Lanjutan PPI RSUD AL-MULK
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(isLandscape ? 9 : 8.5);
  pdf.setTextColor(15, 23, 42); // slate-900
  pdf.text('TIM PENCEGAHAN DAN PENGENDALIAN INFEKSI (PPI)', marginLeftMm, marginTopMm + 3.5);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(isLandscape ? 8 : 7.5);
  pdf.setTextColor(51, 65, 85); // slate-700
  pdf.text('UOBK RSUD AL-MULK KOTA SUKABUMI', marginLeftMm, marginTopMm + 7.2);

  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(isLandscape ? 7.5 : 7);
  pdf.setTextColor(100, 116, 139); // slate-500
  pdf.text('Lembar Laporan Audit Resmi (Lanjutan)', marginLeftMm, marginTopMm + 10.8);

  // Right-aligned page indicator
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(isLandscape ? 8 : 7.5);
  pdf.setTextColor(15, 23, 42);
  pdf.text(`Halaman ${pageNumber}`, pageWidthMm - marginRightMm, marginTopMm + 7.2, { align: 'right' });

  // Official Double rule divider (garis ganda kop surat resmi)
  const dividerY = marginTopMm + 13;
  pdf.setDrawColor(15, 23, 42);
  pdf.setLineWidth(0.4);
  pdf.line(marginLeftMm, dividerY, pageWidthMm - marginRightMm, dividerY);
  pdf.setLineWidth(0.15);
  pdf.line(marginLeftMm, dividerY + 0.6, pageWidthMm - marginRightMm, dividerY + 0.6);

  // Total running header clearance: 13.6mm divider + 4.4mm breathing room = 18mm
  return 18;
}

/**
 * Creates an exact high-res preview canvas representing the full physical sheet with 2.5 cm margins
 * on all 4 sides and the official running header on subsequent pages for the in-app viewer modal.
 */
export function createFullPagePreviewCanvas(
  chunkCanvas: HTMLCanvasElement,
  pageIndex: number,
  pageWidthMm: number,
  pageHeightMm: number,
  marginLeftMm: number,
  marginRightMm: number,
  marginTopMm: number,
  runningHeaderHeightMm: number
): string {
  const printableWidthMm = pageWidthMm - marginLeftMm - marginRightMm;
  const pxPerMm = chunkCanvas.width / printableWidthMm;
  const fullWidthPx = Math.round(pageWidthMm * pxPerMm);
  const fullHeightPx = Math.round(pageHeightMm * pxPerMm);
  const marginLeftPx = Math.round(marginLeftMm * pxPerMm);
  const marginRightPx = Math.round(marginRightMm * pxPerMm);
  const marginTopPx = Math.round(marginTopMm * pxPerMm);

  const previewCanvas = document.createElement('canvas');
  previewCanvas.width = fullWidthPx;
  previewCanvas.height = fullHeightPx;
  const ctx = previewCanvas.getContext('2d');
  if (!ctx) return chunkCanvas.toDataURL('image/png');

  // Background: pure white paper sheet
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, fullWidthPx, fullHeightPx);

  if (pageIndex > 0 && runningHeaderHeightMm > 0) {
    // Draw Running Header text in canvas for preview
    ctx.fillStyle = '#0f172a';
    ctx.font = `bold ${Math.round(8.5 * pxPerMm * 0.35)}px Calibri, Carlito, Arial, sans-serif`;
    ctx.fillText('TIM PENCEGAHAN DAN PENGENDALIAN INFEKSI (PPI)', marginLeftPx, marginTopPx + Math.round(3.5 * pxPerMm));

    ctx.fillStyle = '#334155';
    ctx.font = `bold ${Math.round(7.5 * pxPerMm * 0.35)}px Calibri, Carlito, Arial, sans-serif`;
    ctx.fillText('UOBK RSUD AL-MULK KOTA SUKABUMI', marginLeftPx, marginTopPx + Math.round(7.2 * pxPerMm));

    ctx.fillStyle = '#64748b';
    ctx.font = `italic ${Math.round(7 * pxPerMm * 0.35)}px Calibri, Carlito, Arial, sans-serif`;
    ctx.fillText('Lembar Laporan Audit Resmi (Lanjutan)', marginLeftPx, marginTopPx + Math.round(10.8 * pxPerMm));

    // Page indicator
    ctx.fillStyle = '#0f172a';
    ctx.font = `bold ${Math.round(7.5 * pxPerMm * 0.35)}px Calibri, Carlito, Arial, sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText(`Halaman ${pageIndex + 1}`, fullWidthPx - marginRightPx, marginTopPx + Math.round(7.2 * pxPerMm));
    ctx.textAlign = 'left';

    // Double rule
    const divY = marginTopPx + Math.round(13 * pxPerMm);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = Math.max(1, Math.round(0.4 * pxPerMm));
    ctx.beginPath();
    ctx.moveTo(marginLeftPx, divY);
    ctx.lineTo(fullWidthPx - marginRightPx, divY);
    ctx.stroke();

    ctx.lineWidth = Math.max(1, Math.round(0.15 * pxPerMm));
    ctx.beginPath();
    ctx.moveTo(marginLeftPx, divY + Math.round(0.6 * pxPerMm));
    ctx.lineTo(fullWidthPx - marginRightPx, divY + Math.round(0.6 * pxPerMm));
    ctx.stroke();

    // Draw content chunk below running header
    const contentPosYPx = marginTopPx + Math.round(runningHeaderHeightMm * pxPerMm);
    ctx.drawImage(chunkCanvas, marginLeftPx, contentPosYPx);
  } else {
    // Page 1: draw chunkCanvas at (marginLeftPx, marginTopPx)
    ctx.drawImage(chunkCanvas, marginLeftPx, marginTopPx);
  }

  return previewCanvas.toDataURL('image/png');
}

/**
 * Injects CSS overrides into the cloned document to guarantee desktop-perfect F4/A4 dimensions
 * and layouts, preventing mobile-responsive wrapping and text overlapping during PDF capture.
 */
export function injectPrintStyles(clonedDoc: Document, isLandscape: boolean = false, paperSize: 'f4' | 'a4' = 'f4'): void {
  const isF4 = paperSize !== 'a4';
  const targetWidth = isLandscape
    ? (isF4 ? '1248px' : '1123px')
    : (isF4 ? '813px' : '794px');

  const pageSizeRule = isF4
    ? (isLandscape ? '330mm 215mm' : '215mm 330mm')
    : `A4 ${isLandscape ? 'landscape' : 'portrait'}`;

  // Copy all style and link tags from host document to cloned document to guarantee 100% styling and font parity
  if (typeof document !== 'undefined') {
    // 1. Copy all style tags
    const styles = document.querySelectorAll('style');
    styles.forEach((style) => {
      clonedDoc.head.appendChild(style.cloneNode(true));
    });

    // 2. Copy all link tags (stylesheets and fonts)
    const links = document.querySelectorAll('link[rel="stylesheet"], link[href*="fonts.googleapis.com"], link[href*="fonts.gstatic.com"]');
    links.forEach((link) => {
      clonedDoc.head.appendChild(link.cloneNode(true));
    });
  }

  const style = clonedDoc.createElement('style');
  style.type = 'text/css';
  style.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Carlito:ital,wght@0,400;0,700;1,400;1,700&display=swap');

    @page {
      size: ${pageSizeRule};
      margin: 2.5cm !important;
    }

    /* Enforce high-fidelity layout for PDF generation */
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: ${targetWidth} !important;
      background-color: #ffffff !important;
      color: #000000 !important;
      font-family: 'Calibri', 'Carlito', 'Candara', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: geometricPrecision;
    }

    .official-pdf-page,
    [data-pdf-page="true"],
    #generic-official-report,
    #official-report-sheet,
    #etika-batuk-official-report,
    #diklat-official-report,
    #hand-hygiene-official-report,
    #apd-official-report,
    .official-report-paper {
      width: ${targetWidth} !important;
      min-width: ${targetWidth} !important;
      max-width: ${targetWidth} !important;
      box-sizing: border-box !important;
      margin: 0 !important;
      padding: 0 !important;
      background-color: #ffffff !important;
      color: #000000 !important;
      box-shadow: none !important;
      border: none !important;
      border-radius: 0 !important;
      font-family: 'Calibri', 'Carlito', 'Candara', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
    }

    .flex-col.sm\\:flex-row, .flex-col.md\\:flex-row, .flex-col.lg\\:flex-row {
      flex-direction: row !important;
    }

    table {
      width: 100% !important;
      border-collapse: collapse !important;
      border-spacing: 0 !important;
      table-layout: auto !important;
    }

    table.table-fixed,
    table[class*="table-fixed"] {
      table-layout: fixed !important;
    }

    img, svg {
      display: inline-block !important;
      vertical-align: middle !important;
    }

    /* Strict vertical and horizontal alignment to ensure text is centered and doesn't drop down into border */
    th, td {
      box-sizing: border-box !important;
      vertical-align: middle !important;
      line-height: 1.25 !important;
    }

    th:not(.align-top):not([class*="align-top"]),
    td:not(.align-top):not([class*="align-top"]) {
      vertical-align: middle !important;
    }

    .align-top, [class*="align-top"], th.align-top, td.align-top {
      vertical-align: top !important;
    }

    .text-center, th.text-center, td.text-center {
      text-align: center !important;
    }

    #apd-official-report table th,
    #apd-official-report table td {
      text-align: center !important;
      vertical-align: middle !important;
    }

    .text-left, th.text-left, td.text-left {
      text-align: left !important;
    }

    .text-right, th.text-right, td.text-right {
      text-align: right !important;
    }

    .whitespace-nowrap, table.whitespace-nowrap, table.whitespace-nowrap th, table.whitespace-nowrap td {
      white-space: nowrap !important;
      word-break: keep-all !important;
      overflow-wrap: normal !important;
    }

    /* Ensure borderless tables (such as signature blocks) do not receive borders */
    table.border-none,
    table.border-none th,
    table.border-none td,
    table[class*="border-none"],
    table[class*="border-none"] th,
    table[class*="border-none"] td {
      border: none !important;
    }
  `;
  clonedDoc.head.appendChild(style);
}

export const injectA4PrintStyles = injectPrintStyles;

export async function exportElementToA4Pdf(
  element: HTMLElement,
  options: ExportPdfOptions = {}
): Promise<PdfExportResult> {
  if (!element || typeof window === 'undefined') {
    throw new Error('Elemen tidak ditemukan untuk diunduh sebagai PDF');
  }

  const {
    filename = `Laporan_Resmi_PPI_${new Date().toISOString().slice(0, 10)}.pdf`,
    margin = 25, // 25mm = 2.5cm standard official margin (atas, bawah, kiri, kanan)
    scale = 2.0, // 2.0 for razor-sharp typography matching screen without memory issues
  } = options;

  const isMobileDevice =
    typeof navigator !== 'undefined' &&
    /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const safeScale = isMobileDevice ? 1.5 : Math.min(scale || 2.0, 2.0);

  const pageImages: string[] = [];

  // Import libraries dynamically on client
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  // Pre-load and guarantee Carlito / Calibri fonts are ready in the browser
  if (typeof document !== 'undefined' && 'fonts' in document) {
    try {
      const fontTimeout = new Promise((resolve) => setTimeout(resolve, 1200));
      await Promise.race([
        Promise.all([
          document.fonts.load('400 11pt Carlito'),
          document.fonts.load('700 11pt Carlito'),
          document.fonts.load('bold 11pt Carlito'),
          document.fonts.load('italic 10.5pt Carlito'),
          document.fonts.load('400 12pt Carlito'),
          document.fonts.load('700 12pt Carlito'),
          document.fonts.load('400 10pt Carlito'),
          document.fonts.load('700 10pt Carlito'),
          document.fonts.load('400 9pt Carlito'),
          document.fonts.load('700 9pt Carlito'),
          document.fonts.ready,
        ]),
        fontTimeout,
      ]);
    } catch {
      // safe fallback
    }
  }

  // Save previous scroll position
  const prevScrollX = window.scrollX;
  const prevScrollY = window.scrollY;

  // Temporarily reset any parent zoom stage transform so capture is 1:1 crisp natural resolution
  const zoomStage = (element.closest('.report-zoom-stage') || element.querySelector('.report-zoom-stage')) as HTMLElement | null;
  const originalStageTransform = zoomStage?.style.transform;
  const originalStageWidth = zoomStage?.style.width;
  const originalStageMinWidth = zoomStage?.style.minWidth;
  const originalStageMaxWidth = zoomStage?.style.maxWidth;
  const originalStageMargin = zoomStage?.style.margin;
  const originalStagePosition = zoomStage?.style.position;

  const scrollWrapper = zoomStage?.parentElement as HTMLElement | null;
  const originalWrapperHeight = scrollWrapper?.style.height;
  const originalWrapperWidth = scrollWrapper?.style.width;
  const originalWrapperPosition = scrollWrapper?.style.position;

  if (scrollWrapper) {
    scrollWrapper.style.height = 'auto';
    scrollWrapper.style.width = 'auto';
    scrollWrapper.style.position = 'static';
  }

  const isF4 = options.paperSize !== 'a4';
  const isLandscape =
    options.orientation === 'landscape' ||
    element.getAttribute('data-orientation') === 'landscape' ||
    element.classList.contains('landscape') ||
    element.id === 'hand-hygiene-official-report' ||
    element.id === 'apd-official-report' ||
    Boolean(element.querySelector?.('#hand-hygiene-official-report, #apd-official-report, [data-orientation="landscape"]'));

  const pdfOrientation: 'portrait' | 'landscape' = isLandscape ? 'landscape' : 'portrait';
  const pdfFormat: string | [number, number] = isF4
    ? (isLandscape ? [330, 215] : [215, 330])
    : 'a4';

  const targetWidthPx = isLandscape
    ? (isF4 ? 1248 : 1123)
    : (isF4 ? 813 : 794);

  if (zoomStage) {
    zoomStage.style.transform = 'none';
    zoomStage.style.width = `${targetWidthPx}px`;
    zoomStage.style.minWidth = `${targetWidthPx}px`;
    zoomStage.style.maxWidth = `${targetWidthPx}px`;
    zoomStage.style.margin = '0 auto';
    zoomStage.style.position = 'relative';
  }

  try {

    // Check if the element contains designated official pages (.official-pdf-page or [data-pdf-page])
    let pageElements = Array.from(
      element.querySelectorAll<HTMLElement>('.official-pdf-page, [data-pdf-page]')
    );

    // If the element itself is designated as official-pdf-page
    if (pageElements.length === 0 && (element.classList.contains('official-pdf-page') || element.hasAttribute('data-pdf-page'))) {
      pageElements = [element];
    }

    // Scroll to top temporarily to prevent html2canvas offset bugs
    window.scrollTo(0, 0);
    
    // Give browser a moment to apply the transform="none" and scroll position
    // If we don't wait, html2canvas will measure elements while they are still scaled, causing a huge downward shift.
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Ensure all fonts are loaded so text width/layout matches exactly
    if ('fonts' in document) {
      await document.fonts.ready;
    }

    // =========================================================================
    // MODE 1: DEDICATED MULTI-PAGE EXPORT
    // Used when explicit page containers are provided
    // =========================================================================
    if (pageElements.length > 1) {
      const pdf = new jsPDF({
        orientation: pdfOrientation,
        unit: 'mm',
        format: pdfFormat,
        compress: true,
      });

      const pageWidthMm = pdf.internal.pageSize.getWidth();
      const pageHeightMm = pdf.internal.pageSize.getHeight();

      // Strict 2.5 cm (25 mm) margins on all 4 sides (atas, bawah, kiri, kanan)
      const marginTopMm = margin ?? 25;
      const marginBottomMm = margin ?? 25;
      const marginLeftMm = margin ?? 25;
      const marginRightMm = margin ?? 25;

      const printableWidthMm = pageWidthMm - marginLeftMm - marginRightMm;
      const runningHeaderHeightMm = 18;

      for (let i = 0; i < pageElements.length; i++) {
        const pageEl = pageElements[i];

        // Ensure all images in this page are loaded (with safety timeout so PDF never hangs)
        const pageImagesInElement = Array.from(pageEl.querySelectorAll('img'));
        await Promise.race([
          Promise.all(
            pageImagesInElement.map(
              (img) =>
                new Promise<void>((resolve) => {
                  if (img.complete) {
                    resolve();
                  } else {
                    img.onload = () => resolve();
                    img.onerror = () => resolve();
                  }
                })
            )
          ),
          new Promise((resolve) => setTimeout(resolve, 1500)),
        ]);

        // Render page with exact coordinates
        const canvas = await html2canvas(pageEl, {
          scale: safeScale,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#ffffff',
          scrollX: 0,
          scrollY: 0,
          windowWidth: targetWidthPx,
          onclone: async (clonedDoc) => {
            injectPrintStyles(clonedDoc, isLandscape, isF4 ? 'f4' : 'a4');
            
            const pageId = pageEl.id;
            let targetClonedPage: HTMLElement | null = pageId ? clonedDoc.getElementById(pageId) : null;
            if (!targetClonedPage) {
              const pages = Array.from(clonedDoc.querySelectorAll<HTMLElement>('.official-pdf-page, [data-pdf-page]'));
              targetClonedPage = pages[i] || null;
            }

            if (targetClonedPage) {
              targetClonedPage.style.width = `${targetWidthPx}px`;
              targetClonedPage.style.minWidth = `${targetWidthPx}px`;
              targetClonedPage.style.maxWidth = `${targetWidthPx}px`;
              targetClonedPage.style.margin = '0 auto';
              targetClonedPage.style.position = 'relative';
              targetClonedPage.style.transform = 'none';
              targetClonedPage.style.boxShadow = 'none';
              targetClonedPage.style.borderRadius = '0';
              targetClonedPage.style.border = 'none';
              targetClonedPage.style.backgroundColor = '#ffffff';
              targetClonedPage.style.color = '#000000';
              targetClonedPage.style.overflow = 'visible';

              // Ensure cells vertical-alignment in table
              const allCells = targetClonedPage.querySelectorAll('th, td');
              allCells.forEach((cell) => {
                const c = cell as HTMLElement;
                c.style.boxSizing = 'border-box';
                c.style.lineHeight = '1.25';
                if (!c.classList.contains('align-top') && !c.getAttribute('class')?.includes('align-top')) {
                  c.style.verticalAlign = 'middle';
                }
              });

              // Ensure images inside cloned page are displayed properly and signatures are pure black
              const imgs = targetClonedPage.querySelectorAll('img');
              for (const imgEl of Array.from(imgs)) {
                const img = imgEl as HTMLImageElement;
                img.style.maxWidth = '100%';
                img.style.display = 'inline-block';
                img.style.verticalAlign = 'middle';

                const isSignature =
                  img.closest('.signature-block, [data-pdf-signature], [data-pdf-block="signature"]') !== null ||
                  img.hasAttribute('data-pdf-signature-img') ||
                  (img.alt && (img.alt.includes('TTD') || img.alt.includes('Tanda Tangan'))) ||
                  img.className.includes('brightness-0');

                if (isSignature) {
                  img.style.filter = 'none';
                  img.removeAttribute('crossorigin');
                  try {
                    if (img.src) {
                      const blackUrl = await ensureBlackSignature(img.src);
                      if (blackUrl) {
                        img.src = blackUrl;
                      }
                    }
                  } catch (e) {
                    console.warn('Error blackening Mode 1 signature:', e);
                  }
                }
              }
            }

            if (clonedDoc.fonts && clonedDoc.fonts.ready) {
              await clonedDoc.fonts.ready;
            }
          },
          ignoreElements: (el) => {
            return (
              el.getAttribute('data-html2canvas-ignore') === 'true' ||
              el.classList.contains('no-print') ||
              el.classList.contains('pdf-ignore')
            );
          },
        });

        const hasKopSurat = i === 0 || pageEl.querySelector('#kop-surat, .kop-surat, [data-kop-surat]') !== null;
        if (i > 0) {
          pdf.addPage();
          if (!hasKopSurat) {
            drawHospitalRunningHeader(
              pdf,
              i + 1,
              pageWidthMm,
              marginLeftMm,
              marginRightMm,
              marginTopMm,
              isLandscape
            );
          }
        }

        const imgData = canvas.toDataURL('image/png');
        const runningHeaderOffsetMm = hasKopSurat ? 0 : runningHeaderHeightMm;
        const posY = marginTopMm + runningHeaderOffsetMm;
        const availableHeightMm = pageHeightMm - marginBottomMm - posY;
        const naturalHeightMm = (canvas.height / canvas.width) * printableWidthMm;
        const renderHeightMm = Math.min(naturalHeightMm, availableHeightMm);
        pdf.addImage(imgData, 'PNG', marginLeftMm, posY, printableWidthMm, renderHeightMm, undefined, 'FAST');

        const previewImg = createFullPagePreviewCanvas(
          canvas,
          hasKopSurat ? 0 : i,
          pageWidthMm,
          pageHeightMm,
          marginLeftMm,
          marginRightMm,
          marginTopMm,
          runningHeaderOffsetMm
        );
        pageImages.push(previewImg);
      }

      const blob = pdf.output('blob');
      const base64 = pdf.output('datauristring');
      const file = new File([blob], filename, { type: 'application/pdf' });
      const exportResult: PdfExportResult = {
        pdf,
        blob,
        file,
        dataUri: base64,
        base64,
        filename,
        pageImages,
      };

      if (options.onGenerated) {
        options.onGenerated(exportResult);
      }

      await deliverPdf(exportResult, options.action || 'auto');
      return exportResult;
    }

    // =========================================================================
    // MODE 2: SMART A4 EXPORT FOR SINGLE-CONTAINER OR CONTINUOUS DOCUMENTS
    // Automatically adapts to A4 width with zero row-cutting
    // =========================================================================
    const targetElement = pageElements.length === 1 ? pageElements[0] : element;

    // Find all images to ensure loaded, and pre-process signatures to pure black ink (with timeout protection)
    const images = Array.from(targetElement.querySelectorAll('img'));
    await Promise.race([
      Promise.all(
        images.map(
          async (img) => {
            const isSignature =
              img.closest('.signature-block, [data-pdf-signature], [data-pdf-block="signature"]') !== null ||
              img.hasAttribute('data-pdf-signature-img') ||
              (img.alt && (img.alt.includes('TTD') || img.alt.includes('Tanda Tangan'))) ||
              img.className.includes('brightness-0');

            if (isSignature && img.src) {
              try {
                const blackUrl = await ensureBlackSignature(img.src);
                if (blackUrl && blackUrl !== img.src) {
                  img.src = blackUrl;
                }
              } catch {}
            }

            return new Promise<void>((resolve) => {
              if (img.complete) {
                resolve();
              } else {
                img.onload = () => resolve();
                img.onerror = () => resolve();
              }
            });
          }
        )
      ),
      new Promise((resolve) => setTimeout(resolve, 1500)),
    ]);

    // Bounds of atomic elements (e.g. table rows, paragraphs, headings, list items, signature blocks)
    interface AtomicElementBounds {
      selector: string;
      top: number;
      bottom: number;
    }

    const atomicBounds: AtomicElementBounds[] = [];
    const explicitBreaksPx: number[] = [];

    // Capture element to canvas at crisp resolution with guaranteed A4 layout
    const canvas = await html2canvas(targetElement, {
      scale: safeScale,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      windowWidth: targetWidthPx,
      onclone: async (clonedDoc, clonedEl) => {
        // Inject high-fidelity F4/A4 global stylesheet overrides to the cloned document
        injectPrintStyles(clonedDoc, isLandscape, isF4 ? 'f4' : 'a4');

        if (clonedEl) {
          clonedEl.style.width = `${targetWidthPx}px`;
          clonedEl.style.minWidth = `${targetWidthPx}px`;
          clonedEl.style.maxWidth = `${targetWidthPx}px`;
          clonedEl.style.boxSizing = 'border-box';
          clonedEl.style.margin = '0 auto';
          clonedEl.style.position = 'relative';
          clonedEl.style.transform = 'none';
          clonedEl.style.boxShadow = 'none';
          clonedEl.style.borderRadius = '0';
          clonedEl.style.border = 'none';
          clonedEl.style.backgroundColor = '#ffffff';
          clonedEl.style.color = '#000000';
          clonedEl.style.overflow = 'visible';
        }

        // Ensure all tables inside the cloned document maintain crisp borders and alignments
        const tables = clonedEl.querySelectorAll('table');
        tables.forEach((tbl) => {
          const tableEl = tbl as HTMLElement;
          tableEl.style.width = '100%';
          tableEl.style.borderCollapse = 'collapse';
        });

        // Ensure table cells maintain vertical alignment & prevent line wrapping/dropping
        const allCells = clonedEl.querySelectorAll('th, td');
        allCells.forEach((cell) => {
          const c = cell as HTMLElement;
          c.style.boxSizing = 'border-box';
          c.style.lineHeight = '1.25';
          if (!c.classList.contains('align-top') && !c.getAttribute('class')?.includes('align-top')) {
            c.style.verticalAlign = 'middle';
          }
        });

        // Ensure images inside cloned element are displayed properly and signatures are pure black
        const imgs = clonedEl.querySelectorAll('img');
        for (const imgEl of Array.from(imgs)) {
          const img = imgEl as HTMLImageElement;
          img.style.maxWidth = '100%';
          img.style.display = 'inline-block';
          img.style.verticalAlign = 'middle';

          const isSignature =
            img.closest('.signature-block, [data-pdf-signature], [data-pdf-block="signature"]') !== null ||
            img.hasAttribute('data-pdf-signature-img') ||
            (img.alt && (img.alt.includes('TTD') || img.alt.includes('Tanda Tangan'))) ||
            img.className.includes('brightness-0');

          if (isSignature) {
            img.style.filter = 'none';
            img.removeAttribute('crossorigin');
            try {
              if (img.src) {
                const blackUrl = await ensureBlackSignature(img.src);
                if (blackUrl) {
                  img.src = blackUrl;
                }
              }
            } catch (e) {
              console.warn('Error blackening cloned signature in Mode 2:', e);
            }
          }
        }

        if (clonedDoc.fonts && clonedDoc.fonts.ready) {
          try {
            await clonedDoc.fonts.ready;
          } catch (e) {
            console.warn('Fonts ready failed in cloned document:', e);
          }
        }

        const targetRect = clonedEl ? clonedEl.getBoundingClientRect() : clonedDoc.body.getBoundingClientRect();

        // Collect explicit breaks (.break-before-page)
        const explicitBreakEls = Array.from(
          clonedEl.querySelectorAll('.break-before-page, [class*="break-before-page"], [data-pdf-break]')
        );
        explicitBreakEls.forEach((el) => {
          const rect = el.getBoundingClientRect();
          const topCanvasPx = Math.round((rect.top - targetRect.top) * safeScale);
          if (topCanvasPx > 0) {
            explicitBreaksPx.push(topCanvasPx);
          }
        });

        // Collect boundaries of atomic elements for non-cutting calculations
        const atomicSelector = 'tr, p, li, h1, h2, h3, h4, h5, h6, img, .signature-block, [data-pdf-block], [data-pdf-signature], [data-pdf-photo], [data-pdf-findings], [data-pdf-perbaikan], [data-pdf-summary], .photo-documentation-block, .perbaikan-block, .findings-block, .summary-score-block, .break-inside-avoid, [class*="break-inside-avoid"], .aspect-video';
        const atomicEls = Array.from(clonedEl.querySelectorAll(atomicSelector));
        
        atomicEls.forEach((el) => {
          const rect = el.getBoundingClientRect();
          const top = Math.round((rect.top - targetRect.top) * safeScale);
          const bottom = Math.round((rect.bottom - targetRect.top) * safeScale);
          
          if (bottom > top) {
            const tagName = el.tagName.toLowerCase();
            const className = typeof el.className === 'string' ? el.className : '';
            const pdfBlock = el.getAttribute('data-pdf-block') || '';
            let selector = tagName;
            
            if (pdfBlock) {
              selector = `block-${pdfBlock}`;
            } else if (className.includes('signature-block') || el.hasAttribute('data-pdf-signature')) {
              selector = 'signature-block';
            } else if (className.includes('photo-documentation-block') || el.hasAttribute('data-pdf-photo')) {
              selector = 'photo-block';
            } else if (className.includes('findings-block') || el.hasAttribute('data-pdf-findings')) {
              selector = 'findings-block';
            } else if (className.includes('perbaikan-block') || el.hasAttribute('data-pdf-perbaikan')) {
              selector = 'perbaikan-block';
            } else if (className.includes('summary-score-block') || el.hasAttribute('data-pdf-summary')) {
              selector = 'summary-block';
            } else if (className.includes('break-inside-avoid')) {
              selector = 'break-inside-avoid';
            }
            
            atomicBounds.push({ selector, top, bottom });
          }
        });
      },
      ignoreElements: (el) => {
        return (
          el.getAttribute('data-html2canvas-ignore') === 'true' ||
          el.classList.contains('no-print') ||
          el.classList.contains('pdf-ignore')
        );
      },
    });

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // F4 / A4 dimensions in mm
    const pdf = new jsPDF({
      orientation: pdfOrientation,
      unit: 'mm',
      format: pdfFormat,
      compress: true,
    });

    const pageWidthMm = pdf.internal.pageSize.getWidth();
    const pageHeightMm = pdf.internal.pageSize.getHeight();

    // Strict 2.5 cm (25 mm) margins on all 4 sides as explicitly required
    const marginTopMm = margin ?? 25;
    const marginBottomMm = margin ?? 25;
    const marginLeftMm = margin ?? 25;
    const marginRightMm = margin ?? 25;

    const printableWidthMm = pageWidthMm - marginLeftMm - marginRightMm;
    const page1PrintableHeightMm = pageHeightMm - marginTopMm - marginBottomMm;

    // Running header height + clean breathing room on page 2 and subsequent pages
    const runningHeaderHeightMm = 18;
    const nextPagesPrintableHeightMm = pageHeightMm - marginTopMm - marginBottomMm - runningHeaderHeightMm;

    const mmPerPx = printableWidthMm / canvasWidth;
    const page1HeightInCanvasPx = Math.floor(page1PrintableHeightMm / mmPerPx);
    const nextPagesHeightInCanvasPx = Math.floor(nextPagesPrintableHeightMm / mmPerPx);

    // If content fits comfortably on a single page naturally
    if (canvasHeight <= page1HeightInCanvasPx * 1.02) {
      const renderWidthMm = printableWidthMm;
      const renderHeightMm = canvasHeight * mmPerPx;
      const posX = marginLeftMm;
      const posY = marginTopMm;
      pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        posX,
        posY,
        renderWidthMm,
        renderHeightMm,
        undefined,
        'FAST'
      );

      const previewImg = createFullPagePreviewCanvas(
        canvas,
        0,
        pageWidthMm,
        pageHeightMm,
        marginLeftMm,
        marginRightMm,
        marginTopMm,
        0
      );
      pageImages.push(previewImg);

      const blob = pdf.output('blob');
      const base64 = pdf.output('datauristring');
      const file = new File([blob], filename, { type: 'application/pdf' });
      const exportResult: PdfExportResult = {
        pdf,
        blob,
        file,
        dataUri: base64,
        base64,
        filename,
        pageImages,
      };

      if (options.onGenerated) {
        options.onGenerated(exportResult);
      }

      await deliverPdf(exportResult, options.action || 'auto');
      return exportResult;
    }

    // Fallback populated if cloned document bounds collection failed
    if (atomicBounds.length === 0) {
      const elementRect = targetElement.getBoundingClientRect();
      const atomicSelector = 'tr, p, li, h1, h2, h3, h4, h5, h6, img, .signature-block, [data-pdf-block], [data-pdf-signature], [data-pdf-photo], [data-pdf-findings], [data-pdf-perbaikan], [data-pdf-summary], .photo-documentation-block, .perbaikan-block, .findings-block, .summary-score-block, .break-inside-avoid, [class*="break-inside-avoid"], .aspect-video';
      const atomicEls = Array.from(targetElement.querySelectorAll(atomicSelector));
      
      atomicEls.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const top = Math.round((rect.top - elementRect.top) * (canvasWidth / targetElement.offsetWidth));
        const bottom = Math.round((rect.bottom - elementRect.top) * (canvasWidth / targetElement.offsetWidth));
        if (bottom > top) {
          const tagName = el.tagName.toLowerCase();
          const className = typeof el.className === 'string' ? el.className : '';
          const pdfBlock = el.getAttribute('data-pdf-block') || '';
          let selector = tagName;
          if (pdfBlock) selector = `block-${pdfBlock}`;
          else if (className.includes('signature-block') || el.hasAttribute('data-pdf-signature')) selector = 'signature-block';
          else if (className.includes('photo-documentation-block') || el.hasAttribute('data-pdf-photo')) selector = 'photo-block';
          else if (className.includes('findings-block') || el.hasAttribute('data-pdf-findings')) selector = 'findings-block';
          else if (className.includes('perbaikan-block') || el.hasAttribute('data-pdf-perbaikan')) selector = 'perbaikan-block';
          else if (className.includes('summary-score-block') || el.hasAttribute('data-pdf-summary')) selector = 'summary-block';
          else if (className.includes('break-inside-avoid')) selector = 'break-inside-avoid';
          atomicBounds.push({ selector, top, bottom });
        }
      });
    }

    // Sort and deduplicate explicit break points
    explicitBreaksPx.sort((a, b) => a - b);

    let currentY = 0;
    let pageIndex = 0;

    // Minimum content before we allow breaking (at least 20% of page height)
    const minPageContentPx = Math.floor(page1HeightInCanvasPx * 0.20);
    // Bottom safety buffer: any element starting within 18mm of the bottom line is "mepet/nanggung"
    const bottomSafetyBufferPx = Math.round(18 / mmPerPx);

    while (currentY < canvasHeight) {
      const isFirstPage = pageIndex === 0;
      const availablePageHeightMm = isFirstPage ? page1PrintableHeightMm : nextPagesPrintableHeightMm;
      const availablePageHeightPx = Math.floor(availablePageHeightMm / mmPerPx);
      const remainingHeight = canvasHeight - currentY;

      if (remainingHeight <= availablePageHeightPx * 1.02) {
        // Last chunk fits naturally on this page without cutting
        const chunkCanvas = document.createElement('canvas');
        chunkCanvas.width = canvasWidth;
        chunkCanvas.height = remainingHeight;
        const ctx = chunkCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvasWidth, remainingHeight);
          ctx.drawImage(
            canvas,
            0, currentY, canvasWidth, remainingHeight,
            0, 0, canvasWidth, remainingHeight
          );
        }

        if (pageIndex > 0) {
          pdf.addPage();
          drawHospitalRunningHeader(
            pdf,
            pageIndex + 1,
            pageWidthMm,
            marginLeftMm,
            marginRightMm,
            marginTopMm,
            isLandscape
          );
        }

        const chunkImg = chunkCanvas.toDataURL('image/png');
        const contentPosY = isFirstPage ? marginTopMm : marginTopMm + runningHeaderHeightMm;
        pdf.addImage(
          chunkImg,
          'PNG',
          marginLeftMm,
          contentPosY,
          printableWidthMm,
          remainingHeight * mmPerPx,
          undefined,
          'FAST'
        );

        const previewImg = createFullPagePreviewCanvas(
          chunkCanvas,
          pageIndex,
          pageWidthMm,
          pageHeightMm,
          marginLeftMm,
          marginRightMm,
          marginTopMm,
          runningHeaderHeightMm
        );
        pageImages.push(previewImg);
        break;
      }

      // Ideal cutoff point for standard F4 printable area
      const idealCutY = currentY + availablePageHeightPx;
      let chosenBreakY = idealCutY;

      // 1. Check if there is an explicit page break point in this page range
      const nextExplicitBreak = explicitBreaksPx.find((bp) => bp > currentY + minPageContentPx && bp <= idealCutY);
      if (nextExplicitBreak !== undefined) {
        chosenBreakY = nextExplicitBreak;
      } else {
        // 2. Identify elements that would be cut or are "nanggung / mepet" near the bottom
        // A. Strict blocks: signature, photos, findings, perbaikan, summary score, headings, break-inside-avoid
        // These blocks MUST NEVER be cut in half or crammed into the bottom margin.
        const strictBlocks = atomicBounds.filter((el) => {
          const isStrict =
            el.selector === 'signature-block' ||
            el.selector === 'block-signature' ||
            el.selector === 'photo-block' ||
            el.selector === 'block-photo' ||
            el.selector === 'findings-block' ||
            el.selector === 'block-findings' ||
            el.selector === 'perbaikan-block' ||
            el.selector === 'block-perbaikan' ||
            el.selector === 'summary-block' ||
            el.selector === 'block-summary' ||
            el.selector === 'break-inside-avoid' ||
            el.selector === 'img' ||
            el.selector === 'h1' ||
            el.selector === 'h2' ||
            el.selector === 'h3' ||
            el.selector === 'h4' ||
            el.selector === 'h5' ||
            el.selector === 'h6';

          if (!isStrict) return false;

          // If the element starts after current page start:
          if (el.top <= currentY) return false;

          // Does it cross idealCutY?
          const crosses = el.top < idealCutY && el.bottom > idealCutY;

          // Or is its start mepet / nanggung near the bottom (cannot finish before the bottom buffer)?
          const isMepet = el.top >= idealCutY - bottomSafetyBufferPx;
          const overflowsBuffer = el.bottom > idealCutY - Math.round(8 / mmPerPx);

          // Headings should never be orphaned at the bottom of the page
          const isHeadingOrphan = (el.selector.startsWith('h') || el.selector === 'h1' || el.selector === 'h2' || el.selector === 'h3' || el.selector === 'h4') &&
            el.top >= idealCutY - Math.round(35 / mmPerPx);

          return crosses || isMepet || overflowsBuffer || isHeadingOrphan;
        });

        // B. Table rows ('tr') and list items ('li', 'p'):
        // Any row that crosses idealCutY or starts within bottomSafetyBufferPx is mepet/cut!
        const awkwardRows = atomicBounds.filter((el) => {
          if (el.selector !== 'tr' && el.selector !== 'li' && el.selector !== 'p') return false;
          if (el.top <= currentY) return false;

          const crosses = el.top < idealCutY && el.bottom > idealCutY;
          const isMepet = el.top >= idealCutY - bottomSafetyBufferPx;
          const overflowsBuffer = el.bottom > idealCutY - Math.round(6 / mmPerPx);

          return crosses || isMepet || overflowsBuffer;
        });

        // Combine all awkward / crossing elements
        const awkwardElements = [...strictBlocks, ...awkwardRows];

        // Filter those whose top starts after minPageContentPx on the current page
        const candidateBreaks = awkwardElements
          .filter((el) => el.top >= currentY + minPageContentPx && el.top < idealCutY)
          .map((el) => el.top);

        if (candidateBreaks.length > 0) {
          // Push the earliest awkward element to the next page!
          chosenBreakY = Math.min(...candidateBreaks);
        } else {
          // If no awkward elements found or pushing them leaves page too empty,
          // look for the cleanest complete element boundary ending before the bottom buffer
          const cleanFitting = atomicBounds.filter(
            (b) =>
              b.bottom <= idealCutY - bottomSafetyBufferPx &&
              b.bottom >= currentY + minPageContentPx
          );

          if (cleanFitting.length > 0) {
            chosenBreakY = Math.max(...cleanFitting.map((b) => b.bottom));
          } else {
            chosenBreakY = idealCutY;
          }
        }
      }

      // Safety guard against infinite loops (if chosenBreakY doesn't advance)
      if (chosenBreakY <= currentY) {
        chosenBreakY = idealCutY;
      }

      const chunkHeight = chosenBreakY - currentY;

      const chunkCanvas = document.createElement('canvas');
      chunkCanvas.width = canvasWidth;
      chunkCanvas.height = chunkHeight;
      const ctx = chunkCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvasWidth, chunkHeight);
        ctx.drawImage(
          canvas,
          0, currentY, canvasWidth, chunkHeight,
          0, 0, canvasWidth, chunkHeight
        );
      }

      if (pageIndex > 0) {
        pdf.addPage();
        drawHospitalRunningHeader(
          pdf,
          pageIndex + 1,
          pageWidthMm,
          marginLeftMm,
          marginRightMm,
          marginTopMm,
          isLandscape
        );
      }

      const chunkImg = chunkCanvas.toDataURL('image/png');
      const contentPosY = isFirstPage ? marginTopMm : marginTopMm + runningHeaderHeightMm;
      pdf.addImage(
        chunkImg,
        'PNG',
        marginLeftMm,
        contentPosY,
        printableWidthMm,
        chunkHeight * mmPerPx,
        undefined,
        'FAST'
      );

      const previewImg = createFullPagePreviewCanvas(
        chunkCanvas,
        pageIndex,
        pageWidthMm,
        pageHeightMm,
        marginLeftMm,
        marginRightMm,
        marginTopMm,
        runningHeaderHeightMm
      );
      pageImages.push(previewImg);

      currentY = chosenBreakY;
      pageIndex++;
    }

    const blob = pdf.output('blob');
    const base64 = pdf.output('datauristring');
    const file = new File([blob], filename, { type: 'application/pdf' });
    const exportResult: PdfExportResult = {
      pdf,
      blob,
      file,
      dataUri: base64,
      base64,
      filename,
      pageImages,
    };

    if (options.onGenerated) {
      options.onGenerated(exportResult);
    }

    await deliverPdf(exportResult, options.action || 'auto');
    return exportResult;
  } finally {
    // Restore scroll wrapper styling if modified
    if (scrollWrapper) {
      if (originalWrapperHeight !== undefined) scrollWrapper.style.height = originalWrapperHeight;
      if (originalWrapperWidth !== undefined) scrollWrapper.style.width = originalWrapperWidth;
      if (originalWrapperPosition !== undefined) scrollWrapper.style.position = originalWrapperPosition;
    }

    // Restore zoom stage styling
    if (zoomStage) {
      zoomStage.style.transform = originalStageTransform || '';
      zoomStage.style.width = originalStageWidth || '';
      zoomStage.style.minWidth = originalStageMinWidth || '';
      if (originalStageMaxWidth !== undefined) zoomStage.style.maxWidth = originalStageMaxWidth;
      zoomStage.style.margin = originalStageMargin || '';
      if (originalStagePosition !== undefined) zoomStage.style.position = originalStagePosition;
    }
    // Restore user's scroll position
    window.scrollTo(prevScrollX, prevScrollY);
  }
}

export const exportElementToF4Pdf = exportElementToA4Pdf;

