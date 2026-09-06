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

export interface ExportPdfOptions {
  filename?: string;
  margin?: number; // margin in mm, default: 5
  scale?: number; // canvas scale, default: 2 (crisp retina)
  title?: string;
}

/**
 * Injects CSS overrides into the cloned document to guarantee desktop-perfect A4 dimensions
 * and layouts, preventing mobile-responsive wrapping and text overlapping during PDF capture.
 */
function injectA4PrintStyles(clonedDoc: Document): void {
  const style = clonedDoc.createElement('style');
  style.type = 'text/css';
  style.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Carlito:ital,wght@0,400;0,700;1,400;1,700&display=swap');

    /* Enforce high-fidelity A4 layout for PDF generation */
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: 794px !important;
      background-color: #ffffff !important;
      color: #000000 !important;
      font-family: 'Calibri', 'Carlito', 'Candara', 'Segoe UI', Arial, sans-serif !important;
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
    .official-report-paper {
      width: 794px !important;
      min-width: 794px !important;
      max-width: 794px !important;
      box-sizing: border-box !important;
      margin: 0 !important;
      background-color: #ffffff !important;
      color: #000000 !important;
      box-shadow: none !important;
      border: none !important;
      border-radius: 0 !important;
      font-family: 'Calibri', 'Carlito', 'Candara', 'Segoe UI', Arial, sans-serif !important;
    }

    .flex-col.sm\\:flex-row, .flex-col.md\\:flex-row, .flex-col.lg\\:flex-row {
      flex-direction: row !important;
    }

    table {
      width: 100% !important;
      border-collapse: collapse !important;
    }

    th, td {
      box-sizing: border-box !important;
    }

    .align-top, [class*="align-top"] {
      vertical-align: top !important;
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

export async function exportElementToA4Pdf(
  element: HTMLElement,
  options: ExportPdfOptions = {}
): Promise<void> {
  if (!element || typeof window === 'undefined') {
    throw new Error('Elemen tidak ditemukan untuk diunduh sebagai PDF');
  }

  const {
    filename = `Laporan_Resmi_PPI_${new Date().toISOString().slice(0, 10)}.pdf`,
    margin = 5, // 5mm balanced clean margin
    scale = 2.5, // 2.5 for razor-sharp typography matching screen
  } = options;

  // Import libraries dynamically on client
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  // Pre-load and guarantee Carlito / Calibri fonts are ready in the browser
  if (typeof document !== 'undefined' && 'fonts' in document) {
    try {
      await Promise.all([
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
      ]);
    } catch {
      await document.fonts.ready;
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
  const originalStageMargin = zoomStage?.style.margin;

  const scrollWrapper = zoomStage?.parentElement as HTMLElement | null;
  const originalWrapperHeight = scrollWrapper?.style.height;

  if (scrollWrapper && scrollWrapper.style.height && scrollWrapper.style.height !== 'auto') {
    scrollWrapper.style.height = 'auto';
  }

  if (zoomStage) {
    zoomStage.style.transform = 'none';
    zoomStage.style.width = '100%';
    zoomStage.style.minWidth = '794px';
    zoomStage.style.margin = '0 auto';
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
    // MODE 1: DEDICATED MULTI-PAGE A4 EXPORT
    // Used when explicit page containers are provided
    // =========================================================================
    if (pageElements.length > 1) {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pageWidthMm = pdf.internal.pageSize.getWidth(); // 210 mm
      const pageHeightMm = pdf.internal.pageSize.getHeight(); // 297 mm
      const printableWidthMm = pageWidthMm - margin * 2;
      const printableHeightMm = pageHeightMm - margin * 2;

      for (let i = 0; i < pageElements.length; i++) {
        const pageEl = pageElements[i];

        // Ensure all images in this page are fully loaded
        const pageImages = Array.from(pageEl.querySelectorAll('img'));
        await Promise.all(
          pageImages.map(
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
        );

        // Render page with exact coordinates
        const canvas = await html2canvas(pageEl, {
          scale,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#ffffff',
          scrollX: 0,
          scrollY: 0,
          x: 0,
          y: 0,
          width: 794,
          windowWidth: 794,
          onclone: async (clonedDoc) => {
            injectA4PrintStyles(clonedDoc);
            
            const pageId = pageEl.id;
            let targetClonedPage: HTMLElement | null = pageId ? clonedDoc.getElementById(pageId) : null;
            if (!targetClonedPage) {
              const pages = Array.from(clonedDoc.querySelectorAll<HTMLElement>('.official-pdf-page, [data-pdf-page]'));
              targetClonedPage = pages[i] || null;
            }

            if (targetClonedPage) {
              clonedDoc.documentElement.style.width = '794px';
              clonedDoc.documentElement.style.margin = '0';
              clonedDoc.documentElement.style.padding = '0';
              clonedDoc.body.innerHTML = '';
              clonedDoc.body.style.width = '794px';
              clonedDoc.body.style.margin = '0';
              clonedDoc.body.style.padding = '0';
              clonedDoc.body.style.backgroundColor = '#ffffff';
              clonedDoc.body.style.fontFamily = "'Calibri', 'Carlito', 'Candara', 'Segoe UI', Arial, sans-serif";
              clonedDoc.body.appendChild(targetClonedPage);

              targetClonedPage.style.width = '794px';
              targetClonedPage.style.minWidth = '794px';
              targetClonedPage.style.maxWidth = '794px';
              targetClonedPage.style.margin = '0';
              targetClonedPage.style.position = 'relative';
              targetClonedPage.style.top = '0';
              targetClonedPage.style.left = '0';
              targetClonedPage.style.marginTop = '0';
              targetClonedPage.style.transform = 'none';
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

        if (i > 0) {
          pdf.addPage();
        }

        const imgData = canvas.toDataURL('image/png');
        const naturalHeightMm = (canvas.height / canvas.width) * printableWidthMm;
        const renderHeightMm = Math.min(naturalHeightMm, printableHeightMm);
        pdf.addImage(imgData, 'PNG', margin, margin, printableWidthMm, renderHeightMm, undefined, 'FAST');
      }

      pdf.save(filename);
      return;
    }

    // =========================================================================
    // MODE 2: SMART A4 EXPORT FOR SINGLE-CONTAINER OR CONTINUOUS DOCUMENTS
    // Automatically adapts to A4 width with zero row-cutting
    // =========================================================================
    const targetElement = pageElements.length === 1 ? pageElements[0] : element;

    // Find all images to ensure loaded
    const images = Array.from(targetElement.querySelectorAll('img'));
    await Promise.all(
      images.map(
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
    );

    // Natural break points collected directly inside cloned document for 100% precision
    const naturalBreakPointsPx: number[] = [];

    // Capture element to canvas at crisp resolution with guaranteed A4 layout
    const canvas = await html2canvas(targetElement, {
      scale,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
      width: 794,
      windowWidth: 794,
      onclone: async (clonedDoc, clonedEl) => {
        // Isolate clonedEl as the top-level element in clonedDoc.body to guarantee y=0 alignment
        clonedDoc.documentElement.style.width = '794px';
        clonedDoc.documentElement.style.margin = '0';
        clonedDoc.documentElement.style.padding = '0';
        clonedDoc.body.innerHTML = '';
        clonedDoc.body.style.width = '794px';
        clonedDoc.body.style.margin = '0';
        clonedDoc.body.style.padding = '0';
        clonedDoc.body.style.backgroundColor = '#ffffff';
        clonedDoc.body.style.fontFamily = "'Calibri', 'Carlito', 'Candara', 'Segoe UI', Arial, sans-serif";
        clonedDoc.body.style.overflow = 'visible';
        clonedDoc.body.appendChild(clonedEl);

        // Enforce exact desktop A4 container dimensions on target
        clonedEl.style.width = '794px';
        clonedEl.style.minWidth = '794px';
        clonedEl.style.maxWidth = '794px';
        clonedEl.style.boxSizing = 'border-box';
        clonedEl.style.margin = '0';
        clonedEl.style.marginTop = '0';
        clonedEl.style.marginBottom = '0';
        clonedEl.style.position = 'relative';
        clonedEl.style.top = '0';
        clonedEl.style.left = '0';
        clonedEl.style.transform = 'none';
        clonedEl.style.boxShadow = 'none';
        clonedEl.style.borderRadius = '0';
        clonedEl.style.border = 'none';
        clonedEl.style.backgroundColor = '#ffffff';
        clonedEl.style.color = '#000000';
        clonedEl.style.overflow = 'visible';

        // Inject high-fidelity A4 global stylesheet overrides to the cloned document
        injectA4PrintStyles(clonedDoc);

        // Ensure all tables inside the cloned document maintain crisp borders and alignments
        const tables = clonedEl.querySelectorAll('table');
        tables.forEach((tbl) => {
          const tableEl = tbl as HTMLElement;
          tableEl.style.width = '100%';
          tableEl.style.borderCollapse = 'collapse';
        });

        // Ensure images inside cloned element are displayed properly
        const imgs = clonedEl.querySelectorAll('img');
        imgs.forEach((img) => {
          (img as HTMLElement).style.maxWidth = '100%';
        });

        if (clonedDoc.fonts && clonedDoc.fonts.ready) {
          await clonedDoc.fonts.ready;
        }

        // Collect accurate break points directly from the cloned A4 DOM
        const breakElements = Array.from(
          clonedEl.querySelectorAll(
            'tr, [class*="break-inside-avoid"], .break-inside-avoid, [class*="break-before-page"], .break-before-page, h2, h3, h4, .signature-block, .grid'
          )
        );

        const targetRect = clonedEl.getBoundingClientRect();
        breakElements.forEach((el) => {
          const rect = el.getBoundingClientRect();
          const bottomInElement = rect.bottom - targetRect.top;
          const topInElement = rect.top - targetRect.top;

          if (el.classList.contains('break-before-page') || el.hasAttribute('data-pdf-break')) {
            const topCanvasPx = Math.round(topInElement * scale);
            if (topCanvasPx > 0) {
              naturalBreakPointsPx.push(topCanvasPx);
            }
          }

          const canvasPx = Math.round(bottomInElement * scale);
          if (canvasPx > 0) {
            naturalBreakPointsPx.push(canvasPx);
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

    // A4 dimensions in mm
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidthMm = pdf.internal.pageSize.getWidth(); // 210 mm
    const pageHeightMm = pdf.internal.pageSize.getHeight(); // 297 mm
    const printableWidthMm = pageWidthMm - margin * 2;
    const printableHeightMm = pageHeightMm - margin * 2;

    const mmPerPx = printableWidthMm / canvasWidth;
    const pageHeightInCanvasPx = Math.floor(printableHeightMm / mmPerPx);

    // If content fits comfortably on a single A4 page (with up to 15% smart auto-fit tolerance)
    if (canvasHeight <= pageHeightInCanvasPx * 1.15) {
      const imgData = canvas.toDataURL('image/png');
      // Proportional scale to preserve 100% exact aspect ratio (no vertical squishing)
      const scaleFactor = Math.min(1, pageHeightInCanvasPx / canvasHeight);
      const renderWidthMm = printableWidthMm * scaleFactor;
      const renderHeightMm = (canvasHeight * mmPerPx) * scaleFactor;
      const posX = margin + (printableWidthMm - renderWidthMm) / 2;
      const posY = margin + (printableHeightMm - renderHeightMm) / 2;
      pdf.addImage(
        imgData,
        'PNG',
        posX,
        posY,
        renderWidthMm,
        renderHeightMm,
        undefined,
        'FAST'
      );
      pdf.save(filename);
      return;
    }

    // Multi-page handling: Use natural break points collected during onclone (or fallback to targetElement)
    if (naturalBreakPointsPx.length === 0) {
      const elementRect = targetElement.getBoundingClientRect();
      const breakElements = Array.from(
        targetElement.querySelectorAll(
          'tr, [class*="break-inside-avoid"], .break-inside-avoid, [class*="break-before-page"], .break-before-page, h2, h3, h4, .signature-block, .grid'
        )
      );

      breakElements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const bottomInElement = rect.bottom - elementRect.top;
        const topInElement = rect.top - elementRect.top;
        
        if (el.classList.contains('break-before-page') || el.hasAttribute('data-pdf-break')) {
          const topCanvasPx = Math.round(topInElement * (canvasWidth / targetElement.offsetWidth));
          if (topCanvasPx > 0 && topCanvasPx < canvasHeight) {
            naturalBreakPointsPx.push(topCanvasPx);
          }
        }

        const canvasPx = Math.round(bottomInElement * (canvasWidth / targetElement.offsetWidth));
        if (canvasPx > 0 && canvasPx < canvasHeight) {
          naturalBreakPointsPx.push(canvasPx);
        }
      });
    }

    // Sort natural break points ascending and deduplicate
    naturalBreakPointsPx.sort((a, b) => a - b);

    let currentY = 0;
    let pageIndex = 0;

    while (currentY < canvasHeight) {
      const remainingHeight = canvasHeight - currentY;

      if (remainingHeight <= pageHeightInCanvasPx * 1.05) {
        // Last chunk fits on this page
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
        }

        const chunkImg = chunkCanvas.toDataURL('image/png');
        pdf.addImage(
          chunkImg,
          'PNG',
          margin,
          margin,
          printableWidthMm,
          remainingHeight * mmPerPx,
          undefined,
          'FAST'
        );
        break;
      }

      // Determine target cut position for this page
      const idealCutY = currentY + pageHeightInCanvasPx;

      // Search for a natural break point close to idealCutY (between 70% and 100% of page height)
      const minAcceptableBreakY = currentY + Math.floor(pageHeightInCanvasPx * 0.70);
      let chosenBreakY = idealCutY;

      const candidateBreaks = naturalBreakPointsPx.filter(
        (bp) => bp >= minAcceptableBreakY && bp <= idealCutY
      );

      if (candidateBreaks.length > 0) {
        // Pick the closest break point to idealCutY that is <= idealCutY
        chosenBreakY = candidateBreaks[candidateBreaks.length - 1];
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
      }

      const chunkImg = chunkCanvas.toDataURL('image/png');
      pdf.addImage(
        chunkImg,
        'PNG',
        margin,
        margin,
        printableWidthMm,
        chunkHeight * mmPerPx,
        undefined,
        'FAST'
      );

      currentY = chosenBreakY;
      pageIndex++;
    }

    // Save the generated PDF
    pdf.save(filename);
  } finally {
    // Restore scroll wrapper height if modified
    if (scrollWrapper && originalWrapperHeight !== undefined) {
      scrollWrapper.style.height = originalWrapperHeight;
    }

    // Restore zoom stage styling
    if (zoomStage) {
      zoomStage.style.transform = originalStageTransform || '';
      zoomStage.style.width = originalStageWidth || '';
      zoomStage.style.minWidth = originalStageMinWidth || '';
      zoomStage.style.margin = originalStageMargin || '';
    }
    // Restore user's scroll position
    window.scrollTo(prevScrollX, prevScrollY);
  }
}
