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
  splittableParagraph?: {
    text: string;
    indent?: boolean;
  };
}

interface NarrativeWordToken {
  text: string;
  italic: boolean;
}

function tokenizeNarrativeText(text: string): NarrativeWordToken[] {
  const tokens: NarrativeWordToken[] = [];
  const rawWords = text.trim().split(/\s+/);
  let inItalic = false;

  for (const w of rawWords) {
    if (!w) continue;
    const starCount = (w.match(/\*/g) || []).length;
    if (starCount === 0) {
      tokens.push({ text: w, italic: inItalic });
    } else if (starCount === 2 && w.startsWith('*')) {
      const endStar = w.indexOf('*', 1);
      tokens.push({ text: w.replace(/\*/g, ''), italic: true });
      void endStar;
    } else if (w.startsWith('*') && !inItalic) {
      inItalic = true;
      tokens.push({ text: w.slice(1).replace(/\*/g, ''), italic: true });
      if (starCount % 2 === 0) inItalic = false;
    } else if (inItalic && w.includes('*')) {
      tokens.push({ text: w.replace(/\*/g, ''), italic: true });
      inItalic = false;
    } else {
      tokens.push({ text: w.replace(/\*/g, ''), italic: inItalic });
    }
  }
  return tokens;
}

function renderNarrativeTokenNodes(
  tokens: NarrativeWordToken[],
  options: { indent?: boolean; justifyLast?: boolean }
): React.ReactNode {
  const { indent = true, justifyLast = false } = options;
  return (
    <p
      className={`text-[12pt] leading-[1.5] text-justify text-black font-normal ${indent ? 'indent-8' : ''}`}
      style={{
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '12pt',
        lineHeight: '1.5',
        fontWeight: 400,
        color: '#000000',
        textAlign: 'justify',
        ...(justifyLast ? { textAlignLast: 'justify' as const } : {}),
      }}
    >
      {tokens.map((tok, i) => (
        <React.Fragment key={i}>
          {i > 0 ? ' ' : null}
          {tok.italic ? <em>{tok.text}</em> : tok.text}
        </React.Fragment>
      ))}
    </p>
  );
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
  const splitScratchRef = useRef<HTMLDivElement | null>(null);
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
        const rectH = node.getBoundingClientRect().height;
        heightMap.set(k, Math.ceil(rectH > 0 ? rectH : node.offsetHeight));
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

    const measureTokensHeight = (
      tokens: NarrativeWordToken[],
      indent: boolean
    ): number => {
      const scratch = splitScratchRef.current;
      if (!scratch) return oneLinePx * 10;
      scratch.className = `w-full text-[12pt] leading-[1.5] text-justify text-black font-normal ${
        indent ? 'indent-8' : ''
      }`;
      scratch.textContent = '';
      tokens.forEach((tok, idx) => {
        if (idx > 0) scratch.appendChild(document.createTextNode(' '));
        if (tok.italic) {
          const em = document.createElement('em');
          em.textContent = tok.text;
          scratch.appendChild(em);
        } else {
          scratch.appendChild(document.createTextNode(tok.text));
        }
      });
      const h = scratch.getBoundingClientRect().height;
      return Math.ceil(h > 0 ? h : scratch.offsetHeight);
    };

    const queue: FlowBlock[] = [...blocks];

    for (let i = 0; i < queue.length; i++) {
      const b = queue[i];

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
      const rawH = b.splittableParagraph
        ? measureTokensHeight(
            tokenizeNarrativeText(b.splittableParagraph.text),
            Boolean(b.splittableParagraph.indent)
          )
        : (heightMap.get(b.key) ?? 32);
      const gap = b.gapAfter ?? 8;
      const neededHeight = b.keepWithNext ? getChainHeight(i) : rawH;

      if (currentItems.length > 0 && usedHeight + neededHeight > maxContentHeight) {
        const avail = maxContentHeight - usedHeight;
        if (b.splittableParagraph && splitScratchRef.current && avail >= oneLinePx * 2) {
          const tokens = tokenizeNarrativeText(b.splittableParagraph.text);
          const indent = Boolean(b.splittableParagraph.indent);
          if (tokens.length >= 10) {
            let lo = 1;
            let hi = tokens.length - 1;
            let best = 0;
            while (lo <= hi) {
              const mid = (lo + hi) >> 1;
              const h = measureTokensHeight(tokens.slice(0, mid), indent);
              if (h <= avail) {
                best = mid;
                lo = mid + 1;
              } else {
                hi = mid - 1;
              }
            }
            if (best > 0 && best < tokens.length) {
              const headTokens = tokens.slice(0, best);
              const tailTokens = tokens.slice(best);
              const headH = measureTokensHeight(headTokens, indent);
              const tailH = measureTokensHeight(tailTokens, false);
              if (headH >= oneLinePx * 1.8 && tailH >= oneLinePx * 1.8) {
                if (b.chapterAnchor && chapterMap[b.chapterAnchor] === undefined) {
                  chapterMap[b.chapterAnchor] = pageNum;
                }
                currentItems.push({
                  type: 'element',
                  key: `${b.key}__part1_${i}`,
                  gapAfter: 0,
                  node: renderNarrativeTokenNodes(headTokens, {
                    indent,
                    justifyLast: true,
                  }),
                });
                flushPage();

                const tailText = tailTokens
                  .map((t) => (t.italic ? `*${t.text}*` : t.text))
                  .join(' ');
                queue.splice(i + 1, 0, {
                  type: 'element',
                  key: `${b.key}__part2_${i}`,
                  gapAfter: b.gapAfter,
                  splittableParagraph: { text: tailText, indent: false },
                  node: renderNarrativeTokenNodes(tailTokens, {
                    indent: false,
                    justifyLast: false,
                  }),
                });
                continue;
              }
            }
          }
        }
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
    const scheduleMeasure = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (!cancelled) computePagination();
      });
    };

    const ro = new ResizeObserver(scheduleMeasure);
    ro.observe(measureRoot);
    measureRoot.addEventListener('load', scheduleMeasure, true);

    return () => {
      cancelled = true;
      if (rafId !== null) cancelAnimationFrame(rafId);
      measureRoot.removeEventListener('load', scheduleMeasure, true);
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
            data-pdf-page="true"
            className="f4-page official-pdf-page"
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
            <div
              ref={splitScratchRef}
              className="w-full text-[12pt] leading-[1.5] text-justify text-black font-normal"
              style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '12pt', lineHeight: '1.5' }}
            />
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
