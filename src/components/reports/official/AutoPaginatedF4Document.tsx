import React, { useLayoutEffect, useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import F4Page from './F4Page';

export interface ElementFlowBlock {
  type: 'element';
  key: string;
  node: React.ReactNode;
  gapAfter?: number;
  keepWithNext?: boolean;
  chapterAnchor?: string;
}

export interface PageBreakFlowBlock {
  type: 'pageBreak';
  key: string;
}

export interface StandalonePageFlowBlock {
  type: 'standalonePage';
  key: string;
  orientation?: 'portrait' | 'landscape';
  padding?: string;
  chapterAnchor?: string;
  node: React.ReactNode;
}

export type FlowBlock = ElementFlowBlock | PageBreakFlowBlock | StandalonePageFlowBlock;

export interface FrontMatterPageSpec {
  key: string;
  label: string;
  node: React.ReactNode;
}

interface ResolvedPage {
  kind: 'flow' | 'standalone';
  key: string;
  pageNumber: number;
  orientation?: 'portrait' | 'landscape';
  padding?: string;
  items?: ElementFlowBlock[];
  standaloneNode?: React.ReactNode;
}

interface AutoPaginatedF4DocumentProps {
  id: string;
  coverPage?: React.ReactNode;
  frontMatterPages?: FrontMatterPageSpec[];
  blocks: FlowBlock[];
  /**
   * 'inclusive': Cover is page 1, first body page is page 2 (Monthly, Quarterly, Semester).
   * 'bodyStartsAtOne': Cover + frontMatterPages ('i', 'ii') precede body page 1 (Annual).
   */
  numberingMode?: 'inclusive' | 'bodyStartsAtOne';
  showFooterTotalPages?: boolean;
  onChaptersResolved?: (chapterPages: Record<string, number>) => void;
}

function buildFallbackPages(
  blocks: FlowBlock[],
  startPageNum: number
): ResolvedPage[] {
  const pages: ResolvedPage[] = [];
  let currentItems: ElementFlowBlock[] = [];
  let pageNum = startPageNum;

  const flushCurrent = () => {
    if (currentItems.length > 0) {
      pages.push({
        kind: 'flow',
        key: `fallback-page-${pageNum}`,
        pageNumber: pageNum,
        items: currentItems,
      });
      pageNum++;
      currentItems = [];
    }
  };

  for (const b of blocks) {
    if (b.type === 'pageBreak') {
      flushCurrent();
    } else if (b.type === 'standalonePage') {
      flushCurrent();
      pages.push({
        kind: 'standalone',
        key: b.key,
        pageNumber: pageNum,
        orientation: b.orientation || 'portrait',
        padding: b.padding,
        standaloneNode: b.node,
      });
      pageNum++;
    } else {
      currentItems.push(b);
      if (currentItems.length >= 6) {
        flushCurrent();
      }
    }
  }
  flushCurrent();
  return pages;
}

export default function AutoPaginatedF4Document({
  id,
  coverPage,
  frontMatterPages = [],
  blocks,
  numberingMode = 'inclusive',
  showFooterTotalPages = false,
  onChaptersResolved,
}: AutoPaginatedF4DocumentProps) {
  const startBodyPageNumber =
    numberingMode === 'bodyStartsAtOne'
      ? 1
      : (coverPage ? 1 : 0) + frontMatterPages.length + 1;

  const measureContainerRef = useRef<HTMLDivElement | null>(null);
  const printableRefBox = useRef<HTMLDivElement | null>(null);
  const oneLineRefBox = useRef<HTMLDivElement | null>(null);
  const prevChaptersJsonRef = useRef<string>('');

  const [resolvedPages, setResolvedPages] = useState<ResolvedPage[]>(() =>
    buildFallbackPages(blocks, startBodyPageNumber)
  );

  const elementBlocks = blocks.filter((b): b is ElementFlowBlock => b.type === 'element');

  const computePagination = useCallback(() => {
    const measureRoot = measureContainerRef.current;
    const refBox = printableRefBox.current;
    const oneLineBox = oneLineRefBox.current;
    if (!measureRoot || !refBox) return;

    const printableHeightPx = refBox.offsetHeight;
    if (!printableHeightPx || printableHeightPx < 200) return;

    // 1 full line height before the 2.5cm (25mm) bottom margin
    const oneLinePx = Math.max(oneLineBox?.offsetHeight || 24, 22);
    const maxContentHeight = printableHeightPx - oneLinePx;

    // Map each element block key -> measured height in unscaled layout px
    const heightMap = new Map<string, number>();
    const measuredNodes = measureRoot.querySelectorAll<HTMLElement>('[data-measure-block-key]');
    measuredNodes.forEach((node) => {
      const k = node.getAttribute('data-measure-block-key');
      if (k) {
        heightMap.set(k, node.offsetHeight);
      }
    });

    const pages: ResolvedPage[] = [];
    const chapterMap: Record<string, number> = {};
    let currentItems: ElementFlowBlock[] = [];
    let usedHeight = 0;
    let pageNum = startBodyPageNumber;

    const flushPage = () => {
      if (currentItems.length > 0) {
        pages.push({
          kind: 'flow',
          key: `f4-auto-page-${pageNum}-${currentItems[0].key}`,
          pageNumber: pageNum,
          items: currentItems,
        });
        pageNum++;
        currentItems = [];
        usedHeight = 0;
      }
    };

    // Helper: compute height required for a keepWithNext chain starting at index idx
    const getChainHeight = (startIdx: number): number => {
      let total = 0;
      let idx = startIdx;
      while (idx < blocks.length) {
        const blk = blocks[idx];
        if (blk.type !== 'element') break;
        const h = heightMap.get(blk.key) ?? 32;
        total += h;
        if (!blk.keepWithNext) {
          break;
        }
        // Only add gap between chained elements if continuing to next element
        const nextBlk = blocks[idx + 1];
        if (nextBlk && nextBlk.type === 'element') {
          total += blk.gapAfter ?? 8;
        }
        idx++;
      }
      return total;
    };

    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];

      if (b.type === 'pageBreak') {
        flushPage();
        continue;
      }

      if (b.type === 'standalonePage') {
        flushPage();
        if (b.chapterAnchor && chapterMap[b.chapterAnchor] === undefined) {
          chapterMap[b.chapterAnchor] = pageNum;
        }
        pages.push({
          kind: 'standalone',
          key: b.key,
          pageNumber: pageNum,
          orientation: b.orientation || 'portrait',
          padding: b.padding,
          standaloneNode: b.node,
        });
        pageNum++;
        continue;
      }

      // ElementFlowBlock
      const rawH = heightMap.get(b.key) ?? 32;
      const gap = b.gapAfter ?? 8;
      const neededHeight = b.keepWithNext ? getChainHeight(i) : rawH;

      if (currentItems.length > 0 && usedHeight + neededHeight > maxContentHeight) {
        flushPage();
      }

      if (b.chapterAnchor && chapterMap[b.chapterAnchor] === undefined) {
        chapterMap[b.chapterAnchor] = pageNum;
      }

      currentItems.push(b);
      usedHeight += rawH + gap;
    }

    flushPage();

    setResolvedPages(pages);

    if (onChaptersResolved) {
      const nextJson = JSON.stringify(chapterMap);
      if (nextJson !== prevChaptersJsonRef.current) {
        prevChaptersJsonRef.current = nextJson;
        onChaptersResolved(chapterMap);
      }
    }
  }, [blocks, startBodyPageNumber, onChaptersResolved]);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (isMounted) {
      computePagination();
    }
  }, [isMounted, computePagination]);

  useEffect(() => {
    if (!isMounted) return;
    let cancelled = false;

    if (typeof document !== 'undefined' && 'fonts' in document) {
      document.fonts.ready.then(() => {
        if (!cancelled) computePagination();
      });
    }

    const measureRoot = measureContainerRef.current;
    if (!measureRoot || typeof ResizeObserver === 'undefined') {
      return () => {
        cancelled = true;
      };
    }

    let rafId: number | null = null;
    const ro = new ResizeObserver(() => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (!cancelled) computePagination();
      });
    });

    ro.observe(measureRoot);

    return () => {
      cancelled = true;
      if (rafId !== null) cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [isMounted, computePagination]);

  const totalInclusivePages =
    (coverPage ? 1 : 0) + frontMatterPages.length + resolvedPages.length;

  const measurementSandbox = isMounted && typeof document !== 'undefined'
    ? createPortal(
        <div
          aria-hidden="true"
          data-html2canvas-ignore="true"
          className="no-print pdf-ignore pointer-events-none select-none"
          style={{
            position: 'fixed',
            left: '-99999px',
            top: 0,
            width: 0,
            height: 0,
            overflow: 'hidden',
            visibility: 'hidden',
            zIndex: -1,
          }}
        >
          {/* Offscreen Measurement Sandbox (exact F4 Portrait printable width: 215mm - 50mm = 165mm) */}
          <div
            style={{
              width: '215mm',
              paddingLeft: '25mm',
              paddingRight: '25mm',
              borderLeft: '1px solid transparent',
              borderRight: '1px solid transparent',
              boxSizing: 'border-box',
              backgroundColor: '#ffffff',
              color: '#000000',
              fontFamily: 'Arial, Helvetica, sans-serif',
            }}
          >
            {/* Exact 280mm printable height reference (330mm F4 height - 25mm top - 25mm bottom - 2px border) */}
            <div
              ref={printableRefBox}
              style={{ width: '100%', height: 'calc(280mm - 2px)', boxSizing: 'border-box' }}
            />
            {/* Exact 1-line height reference in Arial 12pt leading 1.5 */}
            <div
              ref={oneLineRefBox}
              className="text-[12pt] leading-[1.5]"
              style={{ fontFamily: 'Arial, Helvetica, sans-serif', lineHeight: '1.5' }}
            >
              Ag
            </div>
            {/* Atomic element blocks measured at exact 165mm width */}
            <div
              ref={measureContainerRef}
              className="w-full flex flex-col justify-start text-[12pt] leading-[1.5] text-justify text-black"
              style={{ fontFamily: 'Arial, Helvetica, sans-serif', lineHeight: '1.5' }}
            >
              {elementBlocks.map((b) => (
                <div key={b.key} data-measure-block-key={b.key} className="w-full">
                  {b.node}
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <div
      id={id}
      className="w-full flex flex-col items-center official-pages-container transition-all relative"
      style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
    >
      {measurementSandbox}

      {/* 1. Cover Page */}
      {coverPage && (
        <F4Page
          pageNumber={1}
          totalPages={showFooterTotalPages ? totalInclusivePages : undefined}
          isCover
        >
          {coverPage}
        </F4Page>
      )}

      {/* 2. Optional Front Matter Pages (e.g. Kata Pengantar 'i', Daftar Isi 'ii') */}
      {frontMatterPages.map((fm) => (
        <F4Page key={fm.key} customPageNumber={fm.label}>
          {fm.node}
        </F4Page>
      ))}

      {/* 3. Auto-Paginated F4 Content Pages */}
      {resolvedPages.map((p) => {
        if (p.kind === 'standalone') {
          return (
            <F4Page
              key={p.key}
              pageNumber={p.pageNumber}
              totalPages={showFooterTotalPages ? totalInclusivePages : undefined}
              orientation={p.orientation || 'portrait'}
              padding={p.padding}
            >
              {p.standaloneNode}
            </F4Page>
          );
        }

        const items = p.items || [];
        return (
          <F4Page
            key={p.key}
            pageNumber={p.pageNumber}
            totalPages={showFooterTotalPages ? totalInclusivePages : undefined}
          >
            <div
              className="w-full flex flex-col justify-start text-[12pt] leading-[1.5] text-justify text-black"
              style={{ fontFamily: 'Arial, Helvetica, sans-serif', lineHeight: '1.5' }}
            >
              {items.map((item, idx) => {
                const isLast = idx === items.length - 1;
                const padBottom = isLast ? 0 : (item.gapAfter ?? 8);
                return (
                  <div
                    key={item.key}
                    className="w-full"
                    style={{ paddingBottom: `${padBottom}px` }}
                  >
                    {item.node}
                  </div>
                );
              })}
            </div>
          </F4Page>
        );
      })}
    </div>
  );
}
