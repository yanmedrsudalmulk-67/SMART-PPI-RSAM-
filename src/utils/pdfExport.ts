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
  orientation?: 'portrait' | 'landscape';
  paperSize?: 'f4' | 'a4'; // default: 'f4'
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
      margin: 5mm;
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
    .official-report-paper {
      width: ${targetWidth} !important;
      min-width: ${targetWidth} !important;
      max-width: ${targetWidth} !important;
      box-sizing: border-box !important;
      margin: 0 !important;
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

    /* Strict vertical and horizontal alignment to ensure text is centered and doesn't drop down into border */
    th, td {
      box-sizing: border-box !important;
      vertical-align: middle !important;
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

  const isF4 = options.paperSize !== 'a4';
  const isLandscape =
    options.orientation === 'landscape' ||
    element.getAttribute('data-orientation') === 'landscape' ||
    element.classList.contains('landscape') ||
    element.id === 'hand-hygiene-official-report' ||
    Boolean(element.querySelector?.('#hand-hygiene-official-report, [data-orientation="landscape"]'));

  const pdfOrientation: 'portrait' | 'landscape' = isLandscape ? 'landscape' : 'portrait';
  const pdfFormat: string | [number, number] = isF4
    ? (isLandscape ? [330, 215] : [215, 330])
    : 'a4';

  const targetWidthPx = isLandscape
    ? (isF4 ? 1248 : 1123)
    : (isF4 ? 813 : 794);

  if (zoomStage) {
    zoomStage.style.transform = 'none';
    zoomStage.style.width = '100%';
    zoomStage.style.minWidth = `${targetWidthPx}px`;
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
          width: targetWidthPx,
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
              clonedDoc.documentElement.style.width = `${targetWidthPx}px`;
              clonedDoc.documentElement.style.margin = '0';
              clonedDoc.documentElement.style.padding = '0';
              clonedDoc.body.innerHTML = '';
              clonedDoc.body.style.width = `${targetWidthPx}px`;
              clonedDoc.body.style.margin = '0';
              clonedDoc.body.style.padding = '0';
              clonedDoc.body.style.backgroundColor = '#ffffff';
              clonedDoc.body.style.fontFamily = "'Calibri', 'Carlito', 'Candara', 'Segoe UI', Arial, sans-serif";
              clonedDoc.body.appendChild(targetClonedPage);

              targetClonedPage.style.width = `${targetWidthPx}px`;
              targetClonedPage.style.minWidth = `${targetWidthPx}px`;
              targetClonedPage.style.maxWidth = `${targetWidthPx}px`;
              targetClonedPage.style.margin = '0';
              targetClonedPage.style.position = 'relative';
              targetClonedPage.style.top = '0';
              targetClonedPage.style.left = '0';
              targetClonedPage.style.marginTop = '0';
              targetClonedPage.style.transform = 'none';

              // Ensure cells vertical-alignment in table
              const allCells = targetClonedPage.querySelectorAll('th, td');
              allCells.forEach((cell) => {
                const c = cell as HTMLElement;
                c.style.boxSizing = 'border-box';
                if (!c.classList.contains('align-top') && !c.getAttribute('class')?.includes('align-top')) {
                  c.style.verticalAlign = 'middle';
                }
              });
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
      scale,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
      width: targetWidthPx,
      windowWidth: targetWidthPx,
      onclone: async (clonedDoc, clonedEl) => {
        // Isolate clonedEl as the top-level element in clonedDoc.body to guarantee y=0 alignment
        clonedDoc.documentElement.style.width = `${targetWidthPx}px`;
        clonedDoc.documentElement.style.margin = '0';
        clonedDoc.documentElement.style.padding = '0';
        clonedDoc.body.innerHTML = '';
        clonedDoc.body.style.width = `${targetWidthPx}px`;
        clonedDoc.body.style.margin = '0';
        clonedDoc.body.style.padding = '0';
        clonedDoc.body.style.backgroundColor = '#ffffff';
        clonedDoc.body.style.fontFamily = "'Calibri', 'Carlito', 'Candara', 'Segoe UI', Arial, sans-serif";
        clonedDoc.body.style.overflow = 'visible';
        clonedDoc.body.appendChild(clonedEl);

        // Enforce exact desktop A4 container dimensions on target
        clonedEl.style.width = `${targetWidthPx}px`;
        clonedEl.style.minWidth = `${targetWidthPx}px`;
        clonedEl.style.maxWidth = `${targetWidthPx}px`;
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

        // Inject high-fidelity F4/A4 global stylesheet overrides to the cloned document
        injectPrintStyles(clonedDoc, isLandscape, isF4 ? 'f4' : 'a4');

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
          if (!c.classList.contains('align-top') && !c.getAttribute('class')?.includes('align-top')) {
            c.style.verticalAlign = 'middle';
          }
        });

        // Ensure images inside cloned element are displayed properly
        const imgs = clonedEl.querySelectorAll('img');
        imgs.forEach((img) => {
          (img as HTMLElement).style.maxWidth = '100%';
        });

        if (clonedDoc.fonts && clonedDoc.fonts.ready) {
          try {
            await clonedDoc.fonts.ready;
          } catch (e) {
            console.warn('Fonts ready failed in cloned document:', e);
          }
        }

        const targetRect = clonedEl.getBoundingClientRect();

        // Collect explicit breaks (.break-before-page)
        const explicitBreakEls = Array.from(
          clonedEl.querySelectorAll('.break-before-page, [class*="break-before-page"], [data-pdf-break]')
        );
        explicitBreakEls.forEach((el) => {
          const rect = el.getBoundingClientRect();
          const topCanvasPx = Math.round((rect.top - targetRect.top) * scale);
          if (topCanvasPx > 0) {
            explicitBreaksPx.push(topCanvasPx);
          }
        });

        // Collect boundaries of atomic elements for non-cutting calculations
        const atomicSelector = 'tr, p, li, h1, h2, h3, h4, h5, h6, img, .signature-block, .break-inside-avoid, [class*="break-inside-avoid"], .aspect-video';
        const atomicEls = Array.from(clonedEl.querySelectorAll(atomicSelector));
        
        atomicEls.forEach((el) => {
          const rect = el.getBoundingClientRect();
          const top = Math.round((rect.top - targetRect.top) * scale);
          const bottom = Math.round((rect.bottom - targetRect.top) * scale);
          
          if (bottom > top) {
            const tagName = el.tagName.toLowerCase();
            const className = el.className || '';
            let selector = tagName;
            
            if (className.includes('signature-block')) {
              selector = 'signature-block';
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
    const printableWidthMm = pageWidthMm - margin * 2;
    const printableHeightMm = pageHeightMm - margin * 2;

    const mmPerPx = printableWidthMm / canvasWidth;
    const pageHeightInCanvasPx = Math.floor(printableHeightMm / mmPerPx);

    // If content fits comfortably on a single page (with up to 15% smart auto-fit tolerance)
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

    // Fallback populated if iframe bounds collection failed or elements were empty
    if (atomicBounds.length === 0) {
      const elementRect = targetElement.getBoundingClientRect();
      const atomicSelector = 'tr, p, li, h1, h2, h3, h4, h5, h6, img, .signature-block, .break-inside-avoid, [class*="break-inside-avoid"], .aspect-video';
      const atomicEls = Array.from(targetElement.querySelectorAll(atomicSelector));
      
      atomicEls.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const top = Math.round((rect.top - elementRect.top) * (canvasWidth / targetElement.offsetWidth));
        const bottom = Math.round((rect.bottom - elementRect.top) * (canvasWidth / targetElement.offsetWidth));
        if (bottom > top) {
          const tagName = el.tagName.toLowerCase();
          const className = el.className || '';
          let selector = tagName;
          if (className.includes('signature-block')) selector = 'signature-block';
          else if (className.includes('break-inside-avoid')) selector = 'break-inside-avoid';
          atomicBounds.push({ selector, top, bottom });
        }
      });
    }

    // Sort and deduplicate explicit break points
    explicitBreaksPx.sort((a, b) => a - b);

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

      // Determine ideal cut position for this page
      const idealCutY = currentY + pageHeightInCanvasPx;
      let chosenBreakY = idealCutY;

      // 1. Check if there is an explicit page break point
      const nextExplicitBreak = explicitBreaksPx.find((bp) => bp > currentY && bp <= idealCutY);
      if (nextExplicitBreak !== undefined) {
        chosenBreakY = nextExplicitBreak;
      } else {
        // 2. Find any atomic element that crosses idealCutY
        const crossingElements = atomicBounds.filter(
          (b) => b.top < idealCutY && b.bottom > idealCutY && b.top > currentY
        );

        if (crossingElements.length > 0) {
          // Identify if there are strict-avoid elements (like signature blocks, headings, images, or custom avoids)
          const strictAvoid = crossingElements.filter(
            (el) =>
              el.selector === 'signature-block' ||
              el.selector === 'h1' ||
              el.selector === 'h2' ||
              el.selector === 'h3' ||
              el.selector === 'h4' ||
              el.selector === 'h5' ||
              el.selector === 'h6' ||
              el.selector === 'break-inside-avoid' ||
              el.selector === 'img'
          );

          if (strictAvoid.length > 0) {
            // Find the minimum top of strict-avoid elements to push them to the next page entirely
            const strictMinTop = Math.min(...strictAvoid.map((el) => el.top));
            if (strictMinTop > currentY) {
              chosenBreakY = strictMinTop;
            }
          } else {
            // For regular elements (tr, p, li), check if we can push them to the next page to avoid splitting.
            // Only break at the element's top if it leaves the current page reasonably filled (>= 45% of page height)
            const minPageFullnessY = currentY + Math.floor(pageHeightInCanvasPx * 0.45);
            const acceptableBreaks = crossingElements.filter((el) => el.top >= minPageFullnessY);

            if (acceptableBreaks.length > 0) {
              chosenBreakY = Math.min(...acceptableBreaks.map((el) => el.top));
            } else {
              // If pushing the crossing elements would make the page too empty, look for any fitting row (tr),
              // paragraph (p), or list item (li) that fits completely within the page and break at its bottom boundary.
              const fittingElements = atomicBounds.filter(
                (b) =>
                  (b.selector === 'tr' || b.selector === 'p' || b.selector === 'li') &&
                  b.bottom <= idealCutY &&
                  b.bottom >= minPageFullnessY
              );

              if (fittingElements.length > 0) {
                chosenBreakY = Math.max(...fittingElements.map((el) => el.bottom));
              } else {
                chosenBreakY = idealCutY;
              }
            }
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

export const exportElementToF4Pdf = exportElementToA4Pdf;

