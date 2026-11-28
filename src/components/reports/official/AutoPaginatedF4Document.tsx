import React, { useLayoutEffect, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import F4Page from './F4Page';
import {
  ReportDocumentEdits,
  createEmptyReportEdits,
  hasAnyReportEdits,
  loadLocalReportEdits,
  saveLocalReportEdits,
  fetchRemoteReportEdits,
  persistRemoteReportEdits,
  flushRemoteReportEditsKeepalive,
  clearReportEdits,
} from '@/utils/reportEditsStore';

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
  bold?: boolean;
  underline?: boolean;
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
      tokens.push({ text: w.replace(/\*/g, ''), italic: true });
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

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function cssEscapeAttr(val: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(val);
  }
  return val.replace(/["\\]/g, '\\$&');
}

const USER_PAGE_BREAK_REGEX = /<div[^>]*data-user-page-break="true"[^>]*>[\s\S]*?<\/div>/gi;

function splitByExplicitPageBreaks(html: string): string[] {
  return html.split(USER_PAGE_BREAK_REGEX);
}

function isOnlyBlankHtml(html: string): boolean {
  if (typeof document === 'undefined') return false;
  const div = document.createElement('div');
  div.innerHTML = html;
  if (div.querySelector('table, svg, canvas, img, hr')) return false;
  return (div.textContent || '').replace(/\u00a0/g, '').trim() === '';
}

function extractBreakablePieces(segHtml: string): string[] {
  if (typeof document === 'undefined') return [segHtml];
  const root = document.createElement('div');
  root.innerHTML = segHtml;

  let container: Element = root;
  if (
    root.children.length === 1 &&
    root.firstElementChild &&
    root.firstElementChild.tagName === 'DIV' &&
    root.firstElementChild.children.length >= 2 &&
    !root.firstElementChild.querySelector(':scope > table, :scope > svg, :scope > canvas') &&
    !/\b(border|grid|flex|bg-|shadow|rounded|table)\b/.test(
      root.firstElementChild.getAttribute('class') || ''
    )
  ) {
    container = root.firstElementChild;
  }

  const pieces: string[] = [];
  container.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const txt = node.textContent || '';
      if (txt.trim().length > 0) {
        pieces.push(`<p>${escapeHtml(txt)}</p>`);
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      pieces.push((node as HTMLElement).outerHTML);
    }
  });

  return pieces.length > 0 ? pieces : [segHtml];
}

function isSimpleSplittableParagraphHtml(pieceHtml: string): boolean {
  if (typeof document === 'undefined') return false;
  const div = document.createElement('div');
  div.innerHTML = pieceHtml;
  if (
    div.querySelector(
      'table, svg, canvas, img, ul, ol, h1, h2, h3, h4, h5, h6, hr, [data-user-page-break="true"]'
    )
  ) {
    return false;
  }
  const el = div.firstElementChild;
  if (!el) return (div.textContent || '').trim().length > 0;
  if (div.children.length > 1) return false;
  const tag = el.tagName;
  if (tag !== 'P' && tag !== 'DIV') return false;
  if (/\b(flex|grid|border|bg-|text-center)\b/.test(el.getAttribute('class') || '')) return false;
  if (el.querySelector('p, div, br')) return false;
  return (el.textContent || '').trim().length > 0;
}

function tokenizeHtmlParagraph(pieceHtml: string): {
  tokens: NarrativeWordToken[];
  className: string;
  styleText: string;
  tagName: 'p' | 'div';
  hasIndent: boolean;
} | null {
  if (typeof document === 'undefined') return null;
  const root = document.createElement('div');
  root.innerHTML = pieceHtml;
  const target = (root.firstElementChild as HTMLElement | null) || root;
  const tagName = target.tagName === 'DIV' && target !== root ? 'div' : 'p';
  const className = target !== root ? target.getAttribute('class') || '' : 'text-[12pt] leading-[1.5] text-justify text-black font-normal';
  const styleText = target !== root ? target.getAttribute('style') || '' : '';
  const hasIndent = /\bindent-/.test(className) || /text-indent/i.test(styleText);

  const tokens: NarrativeWordToken[] = [];
  const walk = (node: Node, state: { italic: boolean; bold: boolean; underline: boolean }) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const parts = (node.textContent || '').split(/\s+/).filter(Boolean);
      for (const p of parts) {
        tokens.push({
          text: p,
          italic: state.italic,
          bold: state.bold,
          underline: state.underline,
        });
      }
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    const tag = el.tagName;
    const nextState = {
      italic: state.italic || tag === 'EM' || tag === 'I' || el.style.fontStyle === 'italic',
      bold:
        state.bold ||
        tag === 'STRONG' ||
        tag === 'B' ||
        Number(el.style.fontWeight || 0) >= 600 ||
        el.style.fontWeight === 'bold',
      underline:
        state.underline || tag === 'U' || el.style.textDecoration.includes('underline'),
    };
    el.childNodes.forEach((child) => walk(child, nextState));
  };

  walk(target, { italic: false, bold: false, underline: false });
  if (tokens.length === 0) return null;
  return { tokens, className, styleText, tagName, hasIndent };
}

function buildHtmlFromWordTokens(
  tokens: NarrativeWordToken[],
  meta: {
    className: string;
    styleText: string;
    tagName: 'p' | 'div';
    indent: boolean;
    justifyLast: boolean;
  }
): string {
  let cls = meta.className.replace(/\bindent-\S+/g, '').trim();
  if (meta.indent) {
    cls = `${cls} indent-8`.trim();
  }
  const cleanedStyle = meta.styleText
    .replace(/text-align-last\s*:[^;]+;?/gi, '')
    .replace(/text-indent\s*:[^;]+;?/gi, '')
    .trim();
  const extraStyle = [
    cleanedStyle,
    meta.justifyLast ? 'text-align-last: justify;' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const inner = tokens
    .map((tok, idx) => {
      let piece = escapeHtml(tok.text);
      if (tok.italic) piece = `<em>${piece}</em>`;
      if (tok.bold) piece = `<strong>${piece}</strong>`;
      if (tok.underline) piece = `<u>${piece}</u>`;
      return `${idx > 0 ? ' ' : ''}${piece}`;
    })
    .join('');

  return `<${meta.tagName} class="${escapeHtml(cls)}"${
    extraStyle ? ` style="${escapeHtml(extraStyle)}"` : ''
  }>${inner}</${meta.tagName}>`;
}

function lockNonEditableMedia(root: HTMLElement): void {
  const media = root.querySelectorAll('svg, canvas, img, [data-non-editable="true"]');
  media.forEach((el) => {
    if (el.getAttribute('contenteditable') !== 'false') {
      el.setAttribute('contenteditable', 'false');
    }
  });
}

function isCaretInTableCell(node: Node | null): boolean {
  let cur: Node | null = node;
  while (cur) {
    if (cur.nodeType === Node.ELEMENT_NODE) {
      const tag = (cur as HTMLElement).tagName;
      if (tag === 'TD' || tag === 'TH') return true;
      if ((cur as HTMLElement).hasAttribute('data-edit-block-key')) return false;
    }
    cur = cur.parentNode;
  }
  return false;
}

const BLOCK_TAGS = new Set(['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'TR', 'BLOCKQUOTE']);

function computeLogicalUnitOffset(
  parts: HTMLElement[],
  anchorNode: Node,
  anchorOffset: number
): number {
  let units = 0;
  let found = false;

  const visit = (node: Node, isPartRoot: boolean) => {
    if (found) return;

    if (node === anchorNode && node.nodeType === Node.TEXT_NODE) {
      units += Math.min(anchorOffset, (node.textContent || '').length);
      found = true;
      return;
    }

    if (node === anchorNode && node.nodeType === Node.ELEMENT_NODE) {
      const children = Array.from(node.childNodes);
      for (let i = 0; i < Math.min(anchorOffset, children.length); i++) {
        visit(children[i], false);
        if (found) return;
      }
      found = true;
      return;
    }

    if (node.nodeType === Node.TEXT_NODE) {
      units += (node.textContent || '').length;
      return;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (el.tagName === 'SVG' || el.tagName === 'CANVAS') return;
      if (el.tagName === 'BR') {
        units += 1;
        return;
      }
      if (!isPartRoot && BLOCK_TAGS.has(el.tagName) && units > 0) {
        units += 1;
      }
      const children = Array.from(el.childNodes);
      for (let i = 0; i < children.length; i++) {
        visit(children[i], false);
        if (found) return;
      }
    }
  };

  for (let p = 0; p < parts.length; p++) {
    if (p > 0 && !found && units > 0) {
      const isCont = parts[p].getAttribute('data-split-continuation') === 'true';
      units += isCont ? 1 : 1;
    }
    visit(parts[p], true);
    if (found) break;
  }

  return units;
}

function captureCaretPosition(
  rootContainer: HTMLElement | null
): { editKey: string; unitOffset: number } | null {
  if (!rootContainer || typeof window === 'undefined') return null;
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || !sel.anchorNode) return null;
  if (!rootContainer.contains(sel.anchorNode)) return null;

  let cur: Node | null = sel.anchorNode;
  let editEl: HTMLElement | null = null;
  while (cur && cur !== rootContainer) {
    if (cur.nodeType === Node.ELEMENT_NODE && (cur as HTMLElement).hasAttribute('data-edit-block-key')) {
      editEl = cur as HTMLElement;
      break;
    }
    cur = cur.parentNode;
  }
  if (!editEl) return null;

  const editKey = editEl.getAttribute('data-edit-block-key');
  if (!editKey) return null;

  const parts = Array.from(
    rootContainer.querySelectorAll<HTMLElement>(
      `[data-edit-block-key="${cssEscapeAttr(editKey)}"]`
    )
  ).sort(
    (a, b) =>
      Number(a.getAttribute('data-part-index') || 0) -
      Number(b.getAttribute('data-part-index') || 0)
  );

  const unitOffset = computeLogicalUnitOffset(parts, sel.anchorNode, sel.anchorOffset);
  return { editKey, unitOffset };
}

function restoreCaretPosition(
  rootContainer: HTMLElement | null,
  pending: { editKey: string; unitOffset: number }
): void {
  if (!rootContainer || typeof window === 'undefined') return;
  const parts = Array.from(
    rootContainer.querySelectorAll<HTMLElement>(
      `[data-edit-block-key="${cssEscapeAttr(pending.editKey)}"]`
    )
  ).sort(
    (a, b) =>
      Number(a.getAttribute('data-part-index') || 0) -
      Number(b.getAttribute('data-part-index') || 0)
  );
  if (parts.length === 0) return;

  let remaining = Math.max(0, pending.unitOffset);
  let targetRange: Range | null = null;
  let lastValidEl: HTMLElement = parts[parts.length - 1];

  const seek = (node: Node, isPartRoot: boolean) => {
    if (targetRange) return;

    if (node.nodeType === Node.TEXT_NODE) {
      const len = (node.textContent || '').length;
      if (remaining <= len) {
        const range = document.createRange();
        range.setStart(node, remaining);
        range.collapse(true);
        targetRange = range;
        return;
      }
      remaining -= len;
      return;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (el.tagName === 'SVG' || el.tagName === 'CANVAS') return;
      lastValidEl = el;
      if (el.tagName === 'BR') {
        if (remaining <= 1) {
          const range = document.createRange();
          const parent = el.parentNode;
          if (parent) {
            const idx = Array.from(parent.childNodes).indexOf(el);
            range.setStart(parent, Math.max(0, idx));
          } else {
            range.setStartBefore(el);
          }
          range.collapse(true);
          targetRange = range;
          return;
        }
        remaining -= 1;
        return;
      }

      if (!isPartRoot && BLOCK_TAGS.has(el.tagName) && remaining > 0) {
        remaining -= 1;
        if (remaining === 0 && el.childNodes.length === 0) {
          const range = document.createRange();
          range.setStart(el, 0);
          range.collapse(true);
          targetRange = range;
          return;
        }
      }

      const children = Array.from(el.childNodes);
      for (let i = 0; i < children.length; i++) {
        seek(children[i], false);
        if (targetRange) return;
      }
    }
  };

  for (let p = 0; p < parts.length; p++) {
    if (p > 0 && remaining > 0) {
      remaining = Math.max(0, remaining - 1);
    }
    seek(parts[p], true);
    if (targetRange) break;
  }

  if (!targetRange) {
    const range = document.createRange();
    range.selectNodeContents(lastValidEl);
    range.collapse(false);
    targetRange = range;
  }

  const hostBlock =
    ((targetRange.startContainer.nodeType === Node.ELEMENT_NODE
      ? (targetRange.startContainer as HTMLElement)
      : targetRange.startContainer.parentElement
    )?.closest('[data-edit-block-key]') as HTMLElement | null) || parts[0];

  hostBlock.focus({ preventScroll: true });

  const sel = window.getSelection();
  if (sel) {
    sel.removeAllRanges();
    sel.addRange(targetRange);
  }

  const rect = targetRange.getBoundingClientRect();
  if (rect && rect.height > 0 && (rect.top < 70 || rect.bottom > window.innerHeight - 50)) {
    const anchorEl =
      targetRange.startContainer.nodeType === Node.ELEMENT_NODE
        ? (targetRange.startContainer as HTMLElement)
        : targetRange.startContainer.parentElement;
    anchorEl?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
}

function collectMergedBlockHtml(rootContainer: HTMLElement | null, editKey: string): string | null {
  if (!rootContainer) return null;
  const parts = Array.from(
    rootContainer.querySelectorAll<HTMLElement>(
      `[data-edit-block-key="${cssEscapeAttr(editKey)}"]`
    )
  ).sort(
    (a, b) =>
      Number(a.getAttribute('data-part-index') || 0) -
      Number(b.getAttribute('data-part-index') || 0)
  );
  if (parts.length === 0) return null;
  if (parts.length === 1) return parts[0].innerHTML;

  const merged = document.createElement('div');
  parts[0].childNodes.forEach((n) => merged.appendChild(n.cloneNode(true)));

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    const isCont = part.getAttribute('data-split-continuation') === 'true';

    if (isCont && merged.lastElementChild && part.firstElementChild) {
      const targetLast = merged.lastElementChild;
      const incomingFirst = part.firstElementChild;
      const targetIsInlinePara =
        (targetLast.tagName === 'P' || targetLast.tagName === 'DIV') &&
        !targetLast.querySelector('table, br');
      const incomingIsInlinePara =
        (incomingFirst.tagName === 'P' || incomingFirst.tagName === 'DIV') &&
        !incomingFirst.querySelector('table, br') &&
        (incomingFirst.textContent || '').trim().length > 0;

      if (targetIsInlinePara && incomingIsInlinePara) {
        const lastTxt = targetLast.textContent || '';
        const firstTxt = incomingFirst.textContent || '';
        if (lastTxt && !/\s$/.test(lastTxt) && firstTxt && !/^\s/.test(firstTxt)) {
          targetLast.appendChild(document.createTextNode(' '));
        }
        Array.from(incomingFirst.childNodes).forEach((c) =>
          targetLast.appendChild(c.cloneNode(true))
        );
        Array.from(part.childNodes)
          .slice(1)
          .forEach((c) => merged.appendChild(c.cloneNode(true)));
        continue;
      }
    }

    part.childNodes.forEach((n) => merged.appendChild(n.cloneNode(true)));
  }

  return merged.innerHTML;
}

interface EditableHtmlBlockProps {
  editKey: string;
  partIndex?: number;
  isSplitContinuation?: boolean;
  htmlOverride?: string;
  fallbackNode: React.ReactNode;
  allowPageBreakShortcut?: boolean;
  visibleRootRef: React.RefObject<HTMLDivElement | null>;
  onScheduleCommit: (editKey: string, mergedHtml: string, immediate?: boolean) => void;
  onRequestBreakBefore?: (editKey: string) => void;
  onRequestClearBreakBefore?: (editKey: string) => void;
  hasBreakBefore?: boolean;
}

function EditableHtmlBlock({
  editKey,
  partIndex = 0,
  isSplitContinuation = false,
  htmlOverride,
  fallbackNode,
  allowPageBreakShortcut = true,
  visibleRootRef,
  onScheduleCommit,
  onRequestBreakBefore,
  onRequestClearBreakBefore,
  hasBreakBefore = false,
}: EditableHtmlBlockProps) {
  const uneditedHostRef = useRef<HTMLDivElement | null>(null);
  const editedHostRef = useRef<HTMLDivElement | null>(null);
  const lastLocalHtmlRef = useRef<string | null>(null);

  useEffect(() => {
    const el = htmlOverride !== undefined ? editedHostRef.current : uneditedHostRef.current;
    if (el) {
      lockNonEditableMedia(el);
    }
  }, [htmlOverride, fallbackNode]);

  useLayoutEffect(() => {
    if (htmlOverride === undefined || !editedHostRef.current) return;
    if (lastLocalHtmlRef.current === htmlOverride) return;
    editedHostRef.current.innerHTML = htmlOverride;
    lastLocalHtmlRef.current = htmlOverride;
    lockNonEditableMedia(editedHostRef.current);
  }, [htmlOverride]);

  const emitMergedCommit = useCallback(
    (immediate = false) => {
      const merged = collectMergedBlockHtml(visibleRootRef.current, editKey);
      if (merged === null) return;
      if (editedHostRef.current) {
        lastLocalHtmlRef.current = editedHostRef.current.innerHTML;
      }
      onScheduleCommit(editKey, merged, immediate);
    },
    [editKey, visibleRootRef, onScheduleCommit]
  );

  const handleInput = useCallback(
    (e: React.FormEvent<HTMLDivElement>) => {
      const inputType = (e.nativeEvent as InputEvent | undefined)?.inputType || '';
      const isStructural =
        inputType === 'insertParagraph' ||
        inputType === 'insertLineBreak' ||
        inputType.startsWith('delete') ||
        inputType === 'insertFromPaste';
      emitMergedCommit(isStructural);
    },
    [emitMergedCommit]
  );

  const handleBlur = useCallback(() => {
    const activeEl = editedHostRef.current || uneditedHostRef.current;
    if (!activeEl) return;
    if (htmlOverride !== undefined || activeEl.dataset.dirty === '1') {
      emitMergedCommit(true);
    }
  }, [htmlOverride, emitMergedCommit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      el.dataset.dirty = '1';

      if (allowPageBreakShortcut && (e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        const sel = window.getSelection();
        const anchorNode = sel?.anchorNode || null;
        const unitOffset =
          sel && anchorNode ? computeLogicalUnitOffset([el], anchorNode, sel.anchorOffset) : 0;

        if ((unitOffset === 0 && partIndex === 0) || isCaretInTableCell(anchorNode)) {
          onRequestBreakBefore?.(editKey);
          return;
        }

        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          const marker = document.createElement('div');
          marker.setAttribute('data-user-page-break', 'true');
          marker.setAttribute('contenteditable', 'false');
          marker.style.height = '0px';
          marker.style.overflow = 'hidden';
          range.insertNode(marker);
          const after = document.createRange();
          after.setStartAfter(marker);
          after.collapse(true);
          sel.removeAllRanges();
          sel.addRange(after);
          emitMergedCommit(true);
        }
        return;
      }

      if (e.key === 'Backspace' && hasBreakBefore && partIndex === 0) {
        const sel = window.getSelection();
        if (sel && sel.isCollapsed && sel.anchorNode) {
          const unitOffset = computeLogicalUnitOffset([el], sel.anchorNode, sel.anchorOffset);
          if (unitOffset === 0) {
            e.preventDefault();
            onRequestClearBreakBefore?.(editKey);
            return;
          }
        }
      }
    },
    [
      allowPageBreakShortcut,
      editKey,
      partIndex,
      hasBreakBefore,
      onRequestBreakBefore,
      onRequestClearBreakBefore,
      emitMergedCommit,
    ]
  );

  if (htmlOverride !== undefined) {
    return (
      <div
        key="edited"
        ref={editedHostRef}
        data-edit-block-key={editKey}
        data-part-index={partIndex}
        data-split-continuation={isSplitContinuation ? 'true' : undefined}
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        onInput={handleInput}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="f4-editable-block w-full"
      />
    );
  }

  return (
    <div
      key="unedited"
      ref={uneditedHostRef}
      data-edit-block-key={editKey}
      data-part-index={partIndex}
      data-split-continuation={isSplitContinuation ? 'true' : undefined}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      onInput={handleInput}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className="f4-editable-block w-full"
    >
      {fallbackNode}
    </div>
  );
}

interface CoverEditableHostProps {
  coverHtml?: string;
  onCommitCover: (nextCoverHtml: string) => void;
  children: React.ReactNode;
}

function CoverEditableHost({ coverHtml, onCommitCover, children }: CoverEditableHostProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const lastLocalCoverRef = useRef<string | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const root = hostRef.current;
    if (!root) return;
    const titleBox = (root.querySelector('.cover-title') as HTMLElement | null) || root;

    titleBox.setAttribute('contenteditable', 'true');
    titleBox.setAttribute('spellcheck', 'false');
    titleBox.classList.add('f4-editable-block');
    titleBox.style.pointerEvents = 'auto';
    titleBox.style.userSelect = 'text';
    lockNonEditableMedia(titleBox);

    if (typeof coverHtml === 'string' && lastLocalCoverRef.current !== coverHtml) {
      titleBox.innerHTML = coverHtml;
      lastLocalCoverRef.current = coverHtml;
    }

    const handleInput = () => {
      const html = titleBox.innerHTML;
      lastLocalCoverRef.current = html;
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        onCommitCover(html);
      }, 150);
    };

    const handleBlur = () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      const html = titleBox.innerHTML;
      if (lastLocalCoverRef.current !== null && lastLocalCoverRef.current !== coverHtml) {
        lastLocalCoverRef.current = html;
        onCommitCover(html);
      }
    };

    titleBox.addEventListener('input', handleInput);
    titleBox.addEventListener('blur', handleBlur);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      titleBox.removeEventListener('input', handleInput);
      titleBox.removeEventListener('blur', handleBlur);
    };
  }, [coverHtml, onCommitCover, children]);

  return (
    <div ref={hostRef} className="w-full h-full">
      {children}
    </div>
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

interface ResolvedFlowItem {
  key: string;
  originKey: string;
  partIndex: number;
  isSplitContinuation?: boolean;
  gapAfter?: number;
  htmlOverride?: string;
  node: React.ReactNode;
}

interface ResolvedPage {
  kind: 'flow' | 'standalone';
  key: string;
  pageNumber: number;
  orientation?: 'portrait' | 'landscape';
  padding?: string;
  items?: ResolvedFlowItem[];
  standaloneNode?: React.ReactNode;
  standaloneOriginKey?: string;
  standaloneHtmlOverride?: string;
}

interface QueueWorkItem {
  kind: 'element' | 'editedSegment' | 'pageBreak' | 'standalonePage';
  key: string;
  originKey: string;
  partIndex: number;
  isSplitContinuation?: boolean;
  gapAfter?: number;
  keepWithNext?: boolean;
  chapterAnchor?: string;
  splittableParagraph?: {
    text: string;
    indent?: boolean;
  };
  node?: React.ReactNode;
  html?: string;
  orientation?: 'portrait' | 'landscape';
  padding?: string;
}

interface AutoPaginatedF4DocumentProps {
  id: string;
  documentStorageKey?: string;
  coverPage?: React.ReactNode;
  frontMatterPages?: FrontMatterPageSpec[];
  blocks: FlowBlock[];
  /**
   * 'inclusive': Cover is page 1, first body page is page 2 (Monthly, Quarterly, Semester).
   * 'bodyStartsAtOne': Cover + frontMatterPages ('i', 'ii') precede body page 1 (Annual, ICRA).
   */
  numberingMode?: 'inclusive' | 'bodyStartsAtOne';
  showFooterTotalPages?: boolean;
  onChaptersResolved?: (chapterPages: Record<string, number>) => void;
}

function buildFallbackPages(blocks: FlowBlock[], startPageNum: number): ResolvedPage[] {
  const pages: ResolvedPage[] = [];
  let currentItems: ResolvedFlowItem[] = [];
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
        standaloneOriginKey: b.key,
      });
      pageNum++;
    } else {
      currentItems.push({
        key: b.key,
        originKey: b.key,
        partIndex: 0,
        gapAfter: b.gapAfter,
        node: b.node,
      });
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
  documentStorageKey,
  coverPage,
  frontMatterPages = [],
  blocks,
  numberingMode = 'inclusive',
  showFooterTotalPages = false,
  onChaptersResolved,
}: AutoPaginatedF4DocumentProps) {
  const storageKey = documentStorageKey || id;
  const startBodyPageNumber =
    numberingMode === 'bodyStartsAtOne'
      ? 1
      : (coverPage ? 1 : 0) + frontMatterPages.length + 1;

  const measureContainerRef = useRef<HTMLDivElement | null>(null);
  const splitScratchRef = useRef<HTMLDivElement | null>(null);
  const htmlScratchRef = useRef<HTMLDivElement | null>(null);
  const printableRefBox = useRef<HTMLDivElement | null>(null);
  const oneLineRefBox = useRef<HTMLDivElement | null>(null);
  const visiblePagesRef = useRef<HTMLDivElement | null>(null);
  const prevChaptersJsonRef = useRef<string>('');

  const [edits, setEdits] = useState<ReportDocumentEdits>(() => {
    return loadLocalReportEdits(storageKey) || createEmptyReportEdits();
  });
  const editsRef = useRef<ReportDocumentEdits>(edits);
  editsRef.current = edits;

  const pendingCaretRef = useRef<{ editKey: string; unitOffset: number } | null>(null);
  const commitTimersRef = useRef<Map<string, number>>(new Map());
  const remoteSaveTimerRef = useRef<number | null>(null);
  const dirtyRemoteRef = useRef<boolean>(false);

  // Sync edits state when storageKey switches (e.g. changing month/year/project)
  useEffect(() => {
    let cancelled = false;
    const local = loadLocalReportEdits(storageKey) || createEmptyReportEdits();
    setEdits(local);

    fetchRemoteReportEdits(storageKey).then((remote) => {
      if (cancelled || !remote) return;
      const localTs = local.updatedAt ? Date.parse(local.updatedAt) : 0;
      const remoteTs = remote.updatedAt ? Date.parse(remote.updatedAt) : 0;
      if (remoteTs > localTs && hasAnyReportEdits(remote)) {
        saveLocalReportEdits(storageKey, remote);
        setEdits(remote);
      } else if (hasAnyReportEdits(local) && localTs > remoteTs) {
        persistRemoteReportEdits(storageKey, local);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [storageKey]);

  // Notify ZoomableReportViewer quietly when edits exist & listen for reset event
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
      new CustomEvent('smart_ppi_report_edits_state', {
        detail: { reportId: id, storageKey, hasEdits: hasAnyReportEdits(edits) },
      })
    );
  }, [id, storageKey, edits]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResetReq = async (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (!detail || (detail.reportId !== id && detail.storageKey !== storageKey)) return;
      dirtyRemoteRef.current = false;
      const empty = createEmptyReportEdits();
      setEdits(empty);
      await clearReportEdits(storageKey);
    };
    window.addEventListener('smart_ppi_reset_report_edits', handleResetReq);
    return () => window.removeEventListener('smart_ppi_reset_report_edits', handleResetReq);
  }, [id, storageKey]);

  // Flush unsaved SQLite write safely on unload / tab switch
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const flushIfDirty = () => {
      if (!dirtyRemoteRef.current) return;
      dirtyRemoteRef.current = false;
      flushRemoteReportEditsKeepalive(storageKey, editsRef.current);
    };
    const handleVis = () => {
      if (document.visibilityState === 'hidden') flushIfDirty();
    };
    window.addEventListener('beforeunload', flushIfDirty);
    document.addEventListener('visibilitychange', handleVis);
    return () => {
      flushIfDirty();
      window.removeEventListener('beforeunload', flushIfDirty);
      document.removeEventListener('visibilitychange', handleVis);
    };
  }, [storageKey]);

  const scheduleRemoteSave = useCallback(
    (nextEdits: ReportDocumentEdits) => {
      saveLocalReportEdits(storageKey, nextEdits);
      dirtyRemoteRef.current = true;
      if (remoteSaveTimerRef.current) {
        window.clearTimeout(remoteSaveTimerRef.current);
      }
      remoteSaveTimerRef.current = window.setTimeout(() => {
        dirtyRemoteRef.current = false;
        persistRemoteReportEdits(storageKey, nextEdits);
      }, 650);
    },
    [storageKey]
  );

  const commitEditsWithCaret = useCallback(
    (updater: (prev: ReportDocumentEdits) => ReportDocumentEdits) => {
      const caret = captureCaretPosition(visiblePagesRef.current);
      if (caret) {
        pendingCaretRef.current = caret;
      }
      setEdits((prev) => {
        const next = updater(prev);
        next.updatedAt = new Date().toISOString();
        scheduleRemoteSave(next);
        return next;
      });
    },
    [scheduleRemoteSave]
  );

  const handleScheduleBlockCommit = useCallback(
    (editKey: string, mergedHtml: string, immediate = false) => {
      const existingTimer = commitTimersRef.current.get(editKey);
      if (existingTimer) window.clearTimeout(existingTimer);

      const applyCommit = () => {
        commitTimersRef.current.delete(editKey);
        commitEditsWithCaret((prev) => {
          if (prev.blocks[editKey] === mergedHtml) return prev;
          return {
            ...prev,
            blocks: {
              ...prev.blocks,
              [editKey]: mergedHtml,
            },
          };
        });
      };

      if (immediate) {
        applyCommit();
      } else {
        const tid = window.setTimeout(applyCommit, 160);
        commitTimersRef.current.set(editKey, tid);
      }
    },
    [commitEditsWithCaret]
  );

  const handleScheduleFrontMatterCommit = useCallback(
    (editKey: string, html: string, immediate = false) => {
      const fmKey = editKey.startsWith('fm:') ? editKey.slice(3) : editKey;
      const existingTimer = commitTimersRef.current.get(editKey);
      if (existingTimer) window.clearTimeout(existingTimer);

      const applyCommit = () => {
        commitTimersRef.current.delete(editKey);
        setEdits((prev) => {
          if (prev.frontMatter[fmKey] === html) return prev;
          const next: ReportDocumentEdits = {
            ...prev,
            frontMatter: { ...prev.frontMatter, [fmKey]: html },
            updatedAt: new Date().toISOString(),
          };
          scheduleRemoteSave(next);
          return next;
        });
      };

      if (immediate) {
        applyCommit();
      } else {
        const tid = window.setTimeout(applyCommit, 180);
        commitTimersRef.current.set(editKey, tid);
      }
    },
    [scheduleRemoteSave]
  );

  const handleCommitCover = useCallback(
    (coverHtml: string) => {
      setEdits((prev) => {
        if (prev.cover === coverHtml) return prev;
        const next: ReportDocumentEdits = {
          ...prev,
          cover: coverHtml,
          updatedAt: new Date().toISOString(),
        };
        scheduleRemoteSave(next);
        return next;
      });
    },
    [scheduleRemoteSave]
  );

  const handleRequestBreakBefore = useCallback(
    (editKey: string) => {
      commitEditsWithCaret((prev) => ({
        ...prev,
        breaksBefore: {
          ...prev.breaksBefore,
          [editKey]: !prev.breaksBefore[editKey],
        },
      }));
    },
    [commitEditsWithCaret]
  );

  const handleRequestClearBreakBefore = useCallback(
    (editKey: string) => {
      commitEditsWithCaret((prev) => {
        if (!prev.breaksBefore[editKey]) return prev;
        const nextBreaks = { ...prev.breaksBefore };
        delete nextBreaks[editKey];
        return {
          ...prev,
          breaksBefore: nextBreaks,
        };
      });
    },
    [commitEditsWithCaret]
  );

  const [resolvedPages, setResolvedPages] = useState<ResolvedPage[]>(() =>
    buildFallbackPages(blocks, startBodyPageNumber)
  );

  const elementBlocks = useMemo(
    () => blocks.filter((b): b is ElementFlowBlock => b.type === 'element'),
    [blocks]
  );

  const computePagination = useCallback(() => {
    const measureRoot = measureContainerRef.current;
    const refBox = printableRefBox.current;
    const oneLineBox = oneLineRefBox.current;
    const htmlScratch = htmlScratchRef.current;
    if (!measureRoot || !refBox) return;

    const printableHeightPx = refBox.offsetHeight;
    if (!printableHeightPx || printableHeightPx < 200) return;

    const oneLinePx = Math.max(oneLineBox?.offsetHeight || 24, 22);
    const maxContentHeight = printableHeightPx - oneLinePx;

    const heightMap = new Map<string, number>();
    const measuredNodes = measureRoot.querySelectorAll<HTMLElement>('[data-measure-block-key]');
    measuredNodes.forEach((node) => {
      const k = node.getAttribute('data-measure-block-key');
      if (k) {
        const rectH = node.getBoundingClientRect().height;
        heightMap.set(k, Math.ceil(rectH > 0 ? rectH : node.offsetHeight));
      }
    });

    const measureTokensHeight = (tokens: NarrativeWordToken[], indent: boolean): number => {
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

    const measureHtmlHeight = (html: string): number => {
      if (!htmlScratch) return oneLinePx * 2;
      htmlScratch.innerHTML = html;
      const h = htmlScratch.getBoundingClientRect().height;
      return Math.ceil(h > 0 ? h : htmlScratch.offsetHeight);
    };

    const queue: QueueWorkItem[] = [];
    for (const b of blocks) {
      if (b.type === 'pageBreak') {
        queue.push({
          kind: 'pageBreak',
          key: b.key,
          originKey: b.key,
          partIndex: 0,
        });
      } else if (b.type === 'standalonePage') {
        queue.push({
          kind: 'standalonePage',
          key: b.key,
          originKey: b.key,
          partIndex: 0,
          orientation: b.orientation,
          padding: b.padding,
          chapterAnchor: b.chapterAnchor,
          node: b.node,
          html: edits.blocks[b.key],
        });
      } else {
        if (edits.breaksBefore?.[b.key]) {
          queue.push({
            kind: 'pageBreak',
            key: `user-pb-${b.key}`,
            originKey: b.key,
            partIndex: 0,
          });
        }
        const editedHtml = edits.blocks[b.key];
        if (typeof editedHtml === 'string') {
          const segments = splitByExplicitPageBreaks(editedHtml);
          segments.forEach((seg, sIdx) => {
            if (sIdx > 0) {
              queue.push({
                kind: 'pageBreak',
                key: `user-inline-pb-${b.key}-${sIdx}`,
                originKey: b.key,
                partIndex: sIdx,
              });
            }
            queue.push({
              kind: 'editedSegment',
              key: `${b.key}__ed_${sIdx}`,
              originKey: b.key,
              partIndex: sIdx,
              gapAfter: sIdx === segments.length - 1 ? b.gapAfter : 0,
              keepWithNext: sIdx === segments.length - 1 ? b.keepWithNext : false,
              chapterAnchor: sIdx === 0 ? b.chapterAnchor : undefined,
              html: seg,
            });
          });
        } else {
          queue.push({
            kind: 'element',
            key: b.key,
            originKey: b.key,
            partIndex: 0,
            gapAfter: b.gapAfter,
            keepWithNext: b.keepWithNext,
            chapterAnchor: b.chapterAnchor,
            splittableParagraph: b.splittableParagraph,
            node: b.node,
          });
        }
      }
    }

    const pages: ResolvedPage[] = [];
    const chapterMap: Record<string, number> = {};
    let currentItems: ResolvedFlowItem[] = [];
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

    const getWorkItemHeight = (item: QueueWorkItem): number => {
      if (item.kind === 'editedSegment') {
        return measureHtmlHeight(item.html || '');
      }
      if (item.kind === 'element') {
        if (item.splittableParagraph) {
          return measureTokensHeight(
            tokenizeNarrativeText(item.splittableParagraph.text),
            Boolean(item.splittableParagraph.indent)
          );
        }
        return heightMap.get(item.key) ?? 32;
      }
      return 0;
    };

    const getChainHeight = (startIdx: number): number => {
      let total = 0;
      let idx = startIdx;
      while (idx < queue.length) {
        const blk = queue[idx];
        if (blk.kind !== 'element' && blk.kind !== 'editedSegment') break;
        total += getWorkItemHeight(blk);
        if (!blk.keepWithNext) break;
        const nextBlk = queue[idx + 1];
        if (nextBlk && (nextBlk.kind === 'element' || nextBlk.kind === 'editedSegment')) {
          total += blk.gapAfter ?? 8;
        }
        idx++;
      }
      return total;
    };

    for (let i = 0; i < queue.length; i++) {
      const b = queue[i];

      if (b.kind === 'pageBreak') {
        flushPage();
        continue;
      }

      if (b.kind === 'standalonePage') {
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
          standaloneOriginKey: b.originKey,
          standaloneHtmlOverride: b.html,
        });
        pageNum++;
        continue;
      }

      const rawH = getWorkItemHeight(b);
      const gap = b.gapAfter ?? 8;
      const neededHeight = b.keepWithNext ? getChainHeight(i) : rawH;

      // Branch 1: Edited HTML block handling (multi-line Enter flow + paragraph word splitting)
      if (b.kind === 'editedSegment') {
        const segHtml = b.html || '';
        if (currentItems.length > 0 && usedHeight + neededHeight > maxContentHeight) {
          const avail = maxContentHeight - usedHeight;
          const pieces = extractBreakablePieces(segHtml);

          if (pieces.length >= 2 && avail >= oneLinePx) {
            let fitCount = 0;
            for (let p = 1; p < pieces.length; p++) {
              const candH = measureHtmlHeight(pieces.slice(0, p).join(''));
              if (candH <= avail) {
                fitCount = p;
              } else {
                break;
              }
            }

            if (fitCount >= 1) {
              const headHtml = pieces.slice(0, fitCount).join('');
              const tailHtml = pieces.slice(fitCount).join('');
              const headBlankOnly = isOnlyBlankHtml(headHtml);

              if (!headBlankOnly && b.chapterAnchor && chapterMap[b.chapterAnchor] === undefined) {
                chapterMap[b.chapterAnchor] = pageNum;
              }

              currentItems.push({
                key: `${b.key}__ep1_${i}`,
                originKey: b.originKey,
                partIndex: b.partIndex,
                isSplitContinuation: b.isSplitContinuation,
                gapAfter: 0,
                htmlOverride: headHtml,
                node: null,
              });
              flushPage();

              queue.splice(i + 1, 0, {
                kind: 'editedSegment',
                key: `${b.key}__ep2_${i}`,
                originKey: b.originKey,
                partIndex: b.partIndex + 1,
                isSplitContinuation: false,
                gapAfter: b.gapAfter,
                keepWithNext: b.keepWithNext,
                chapterAnchor: headBlankOnly ? b.chapterAnchor : undefined,
                html: tailHtml,
              });
              continue;
            }
          }

          // Try word-level split if a single long edited text paragraph overflows
          if (
            pieces.length >= 1 &&
            isSimpleSplittableParagraphHtml(pieces[0]) &&
            avail >= oneLinePx * 2
          ) {
            const parsed = tokenizeHtmlParagraph(pieces[0]);
            if (parsed && parsed.tokens.length >= 10) {
              let lo = 1;
              let hi = parsed.tokens.length - 1;
              let best = 0;
              while (lo <= hi) {
                const mid = (lo + hi) >> 1;
                const candHtml = buildHtmlFromWordTokens(parsed.tokens.slice(0, mid), {
                  className: parsed.className,
                  styleText: parsed.styleText,
                  tagName: parsed.tagName,
                  indent: parsed.hasIndent,
                  justifyLast: false,
                });
                if (measureHtmlHeight(candHtml) <= avail) {
                  best = mid;
                  lo = mid + 1;
                } else {
                  hi = mid - 1;
                }
              }

              if (best > 0 && best < parsed.tokens.length) {
                const headHtml = buildHtmlFromWordTokens(parsed.tokens.slice(0, best), {
                  className: parsed.className,
                  styleText: parsed.styleText,
                  tagName: parsed.tagName,
                  indent: parsed.hasIndent,
                  justifyLast: true,
                });
                const tailFirstHtml = buildHtmlFromWordTokens(parsed.tokens.slice(best), {
                  className: parsed.className,
                  styleText: parsed.styleText,
                  tagName: parsed.tagName,
                  indent: false,
                  justifyLast: false,
                });
                const tailRest = pieces.slice(1).join('');

                if (
                  measureHtmlHeight(headHtml) >= oneLinePx * 1.8 &&
                  measureHtmlHeight(tailFirstHtml) >= oneLinePx * 1.8
                ) {
                  if (b.chapterAnchor && chapterMap[b.chapterAnchor] === undefined) {
                    chapterMap[b.chapterAnchor] = pageNum;
                  }
                  currentItems.push({
                    key: `${b.key}__ew1_${i}`,
                    originKey: b.originKey,
                    partIndex: b.partIndex,
                    isSplitContinuation: b.isSplitContinuation,
                    gapAfter: 0,
                    htmlOverride: headHtml,
                    node: null,
                  });
                  flushPage();

                  queue.splice(i + 1, 0, {
                    kind: 'editedSegment',
                    key: `${b.key}__ew2_${i}`,
                    originKey: b.originKey,
                    partIndex: b.partIndex + 1,
                    isSplitContinuation: true,
                    gapAfter: b.gapAfter,
                    keepWithNext: b.keepWithNext,
                    html: `${tailFirstHtml}${tailRest}`,
                  });
                  continue;
                }
              }
            }
          }

          flushPage();
        }

        // Handle oversized edited block even at top of fresh page (when pieces >= 2 or single long paragraph > 1 page)
        if (currentItems.length === 0 && rawH > maxContentHeight) {
          const pieces = extractBreakablePieces(segHtml);
          if (pieces.length >= 2) {
            let fitCount = 0;
            for (let p = 1; p < pieces.length; p++) {
              if (measureHtmlHeight(pieces.slice(0, p).join('')) <= maxContentHeight) {
                fitCount = p;
              } else {
                break;
              }
            }
            if (fitCount >= 1) {
              const headHtml = pieces.slice(0, fitCount).join('');
              const tailHtml = pieces.slice(fitCount).join('');
              const headBlankOnly = isOnlyBlankHtml(headHtml);

              if (!headBlankOnly && b.chapterAnchor && chapterMap[b.chapterAnchor] === undefined) {
                chapterMap[b.chapterAnchor] = pageNum;
              }

              currentItems.push({
                key: `${b.key}__ep1_${i}`,
                originKey: b.originKey,
                partIndex: b.partIndex,
                isSplitContinuation: b.isSplitContinuation,
                gapAfter: 0,
                htmlOverride: headHtml,
                node: null,
              });
              flushPage();

              queue.splice(i + 1, 0, {
                kind: 'editedSegment',
                key: `${b.key}__ep2_${i}`,
                originKey: b.originKey,
                partIndex: b.partIndex + 1,
                isSplitContinuation: false,
                gapAfter: b.gapAfter,
                keepWithNext: b.keepWithNext,
                chapterAnchor: headBlankOnly ? b.chapterAnchor : undefined,
                html: tailHtml,
              });
              continue;
            }
          }
        }

        if (b.chapterAnchor && chapterMap[b.chapterAnchor] === undefined) {
          chapterMap[b.chapterAnchor] = pageNum;
        }

        currentItems.push({
          key: b.key,
          originKey: b.originKey,
          partIndex: b.partIndex,
          isSplitContinuation: b.isSplitContinuation,
          gapAfter: b.gapAfter,
          htmlOverride: segHtml,
          node: null,
        });
        usedHeight += rawH + gap;
        continue;
      }

      // Branch 2: Unedited standard ElementFlowBlock
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
                  key: `${b.key}__part1_${i}`,
                  originKey: b.originKey,
                  partIndex: b.partIndex,
                  isSplitContinuation: b.isSplitContinuation,
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
                  kind: 'element',
                  key: `${b.key}__part2_${i}`,
                  originKey: b.originKey,
                  partIndex: b.partIndex + 1,
                  isSplitContinuation: true,
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

      currentItems.push({
        key: b.key,
        originKey: b.originKey,
        partIndex: b.partIndex,
        isSplitContinuation: b.isSplitContinuation,
        gapAfter: b.gapAfter,
        node: b.node,
      });
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
  }, [blocks, edits.blocks, edits.breaksBefore, startBodyPageNumber, onChaptersResolved]);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (isMounted) {
      computePagination();
    }
  }, [isMounted, computePagination]);

  // Restore caret synchronously after repagination moves or splits an edited block
  useLayoutEffect(() => {
    if (!pendingCaretRef.current || !visiblePagesRef.current) return;
    const pending = pendingCaretRef.current;
    pendingCaretRef.current = null;
    restoreCaretPosition(visiblePagesRef.current, pending);
  }, [resolvedPages]);

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

  const measurementSandbox =
    isMounted && typeof document !== 'undefined'
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
              <div
                ref={printableRefBox}
                style={{ width: '100%', height: 'calc(280mm - 2px)', boxSizing: 'border-box' }}
              />
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
              <div
                ref={htmlScratchRef}
                className="w-full text-[12pt] leading-[1.5] text-justify text-black font-normal"
                style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '12pt', lineHeight: '1.5' }}
              />
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
      ref={visiblePagesRef}
      className="w-full flex flex-col items-center official-pages-container transition-all relative"
      style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
    >
      {measurementSandbox}

      {/* 1. Cover Page (directly editable title & subtitle text) */}
      {coverPage && (
        <F4Page
          pageNumber={1}
          totalPages={showFooterTotalPages ? totalInclusivePages : undefined}
          isCover
        >
          <CoverEditableHost coverHtml={edits.cover} onCommitCover={handleCommitCover}>
            {coverPage}
          </CoverEditableHost>
        </F4Page>
      )}

      {/* 2. Optional Front Matter Pages (e.g. Kata Pengantar 'i', Daftar Isi 'ii') */}
      {frontMatterPages.map((fm) => (
        <F4Page key={fm.key} customPageNumber={fm.label}>
          <EditableHtmlBlock
            editKey={`fm:${fm.key}`}
            htmlOverride={edits.frontMatter[fm.key]}
            fallbackNode={fm.node}
            allowPageBreakShortcut={false}
            visibleRootRef={visiblePagesRef}
            onScheduleCommit={handleScheduleFrontMatterCommit}
          />
        </F4Page>
      ))}

      {/* 3. Auto-Paginated F4 Content Pages (Inline Word-like Editable) */}
      {resolvedPages.map((p) => {
        if (p.kind === 'standalone') {
          const originKey = p.standaloneOriginKey || p.key;
          return (
            <F4Page
              key={p.key}
              pageNumber={p.pageNumber}
              totalPages={showFooterTotalPages ? totalInclusivePages : undefined}
              orientation={p.orientation || 'portrait'}
              padding={p.padding}
            >
              <EditableHtmlBlock
                editKey={originKey}
                htmlOverride={p.standaloneHtmlOverride ?? edits.blocks[originKey]}
                fallbackNode={p.standaloneNode}
                allowPageBreakShortcut={false}
                visibleRootRef={visiblePagesRef}
                onScheduleCommit={handleScheduleBlockCommit}
              />
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
                    <EditableHtmlBlock
                      editKey={item.originKey}
                      partIndex={item.partIndex}
                      isSplitContinuation={item.isSplitContinuation}
                      htmlOverride={item.htmlOverride}
                      fallbackNode={item.node}
                      allowPageBreakShortcut
                      hasBreakBefore={Boolean(edits.breaksBefore?.[item.originKey])}
                      visibleRootRef={visiblePagesRef}
                      onScheduleCommit={handleScheduleBlockCommit}
                      onRequestBreakBefore={handleRequestBreakBefore}
                      onRequestClearBreakBefore={handleRequestClearBreakBefore}
                    />
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
