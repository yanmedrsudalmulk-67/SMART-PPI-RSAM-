import { supabase } from '@/lib/supabase';

export interface ReportDocumentEdits {
  blocks: Record<string, string>;
  frontMatter: Record<string, string>;
  breaksBefore: Record<string, boolean>;
  cover?: string;
  updatedAt: string;
}

const LOCAL_PREFIX = 'smart_ppi_report_edits_v1:';
const TABLE_NAME = 'report_custom_edits';

export function createEmptyReportEdits(): ReportDocumentEdits {
  return {
    blocks: {},
    frontMatter: {},
    breaksBefore: {},
    updatedAt: '',
  };
}

export function normalizeReportEdits(raw: any): ReportDocumentEdits {
  if (!raw || typeof raw !== 'object') return createEmptyReportEdits();
  return {
    blocks: raw.blocks && typeof raw.blocks === 'object' ? { ...raw.blocks } : {},
    frontMatter:
      raw.frontMatter && typeof raw.frontMatter === 'object' ? { ...raw.frontMatter } : {},
    breaksBefore:
      raw.breaksBefore && typeof raw.breaksBefore === 'object' ? { ...raw.breaksBefore } : {},
    cover: typeof raw.cover === 'string' ? raw.cover : undefined,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : '',
  };
}

export function hasAnyReportEdits(edits?: ReportDocumentEdits | null): boolean {
  if (!edits) return false;
  if (typeof edits.cover === 'string') return true;
  if (Object.keys(edits.blocks || {}).length > 0) return true;
  if (Object.keys(edits.frontMatter || {}).length > 0) return true;
  if (Object.values(edits.breaksBefore || {}).some(Boolean)) return true;
  return false;
}

export function loadLocalReportEdits(docKey: string): ReportDocumentEdits | null {
  if (typeof window === 'undefined' || !docKey) return null;
  try {
    const raw = window.localStorage.getItem(`${LOCAL_PREFIX}${docKey}`);
    if (!raw) return null;
    return normalizeReportEdits(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveLocalReportEdits(docKey: string, edits: ReportDocumentEdits): void {
  if (typeof window === 'undefined' || !docKey) return;
  try {
    if (!hasAnyReportEdits(edits)) {
      window.localStorage.removeItem(`${LOCAL_PREFIX}${docKey}`);
      return;
    }
    window.localStorage.setItem(`${LOCAL_PREFIX}${docKey}`, JSON.stringify(edits));
  } catch {
    // Ignore storage quota errors silently
  }
}

export async function fetchRemoteReportEdits(
  docKey: string
): Promise<ReportDocumentEdits | null> {
  if (!docKey) return null;
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('id, payload_json, updated_at')
      .eq('id', docKey)
      .maybeSingle();

    if (error || !data) return null;

    const rawPayload =
      typeof data.payload_json === 'string'
        ? JSON.parse(data.payload_json)
        : data.payload_json;
    const normalized = normalizeReportEdits(rawPayload);
    if (!normalized.updatedAt && typeof data.updated_at === 'string') {
      normalized.updatedAt = data.updated_at;
    }
    return normalized;
  } catch {
    return null;
  }
}

export async function persistRemoteReportEdits(
  docKey: string,
  edits: ReportDocumentEdits
): Promise<void> {
  if (!docKey) return;
  try {
    if (!hasAnyReportEdits(edits)) {
      await supabase.from(TABLE_NAME).delete().eq('id', docKey);
      return;
    }

    await supabase.from(TABLE_NAME).upsert(
      {
        id: docKey,
        payload_json: JSON.stringify(edits),
        updated_at: edits.updatedAt || new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
  } catch {
    // LocalStorage backup already persists edits across refreshes
  }
}

export function flushRemoteReportEditsKeepalive(
  docKey: string,
  edits: ReportDocumentEdits
): void {
  if (typeof window === 'undefined' || !docKey) return;
  try {
    const hasEdits = hasAnyReportEdits(edits);
    const body = JSON.stringify(
      hasEdits
        ? {
            action: 'upsert',
            table: TABLE_NAME,
            onConflict: 'id',
            rows: [
              {
                id: docKey,
                payload_json: JSON.stringify(edits),
                updated_at: edits.updatedAt || new Date().toISOString(),
              },
            ],
          }
        : {
            action: 'delete',
            table: TABLE_NAME,
            filters: [{ column: 'id', operator: 'eq', value: docKey }],
          }
    );

    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon('/api/db', blob);
      return;
    }

    fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Ignore errors during unload
  }
}

export async function clearReportEdits(docKey: string): Promise<void> {
  saveLocalReportEdits(docKey, createEmptyReportEdits());
  await persistRemoteReportEdits(docKey, createEmptyReportEdits());
}
