import crypto from 'crypto';

// MOCKED — in-memory SQLite replacement (native sqlite3 stripped for container compatibility)
export const db = {
  prepare: () => ({
    get: () => null,
    all: () => [],
    run: () => ({ changes: 0 }),
  }),
};

const globalStore = globalThis as unknown as {
  __smartPpiMemoryDb?: Map<string, Record<string, any>[]>;
};

function getTablesMap(): Map<string, Record<string, any>[]> {
  if (!globalStore.__smartPpiMemoryDb) {
    globalStore.__smartPpiMemoryDb = new Map<string, Record<string, any>[]>();
  }
  return globalStore.__smartPpiMemoryDb;
}

function getTableRows(table: string): Record<string, any>[] {
  const map = getTablesMap();
  if (!map.has(table)) {
    map.set(table, []);
  }
  return map.get(table)!;
}

export function clearQueryCache(_table?: string) {
  // No-op for in-memory store
}

export function getDb() {
  return db;
}

export function serializeValue(val: any): any {
  if (val === undefined || val === null) return null;
  if (typeof val === 'object') {
    return JSON.stringify(val);
  }
  if (typeof val === 'boolean') {
    return val ? 1 : 0;
  }
  return String(val);
}

export function deserializeRow(row: any): any {
  if (!row || typeof row !== 'object') return row;
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(row)) {
    if (v === null || v === undefined) {
      out[k] = null;
      continue;
    }
    if (typeof v === 'string') {
      const len = v.length;
      if (len > 1 && ((v[0] === '{' && v[len - 1] === '}') || (v[0] === '[' && v[len - 1] === ']'))) {
        try {
          out[k] = JSON.parse(v);
          continue;
        } catch {
          // keep as string
        }
      }
    }
    out[k] = v;
  }
  return out;
}

export async function getTableColumns(table: string): Promise<Set<string>> {
  const rows = getTableRows(table);
  const cols = new Set<string>(['id', 'created_at']);
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      cols.add(key);
    }
  }
  return cols;
}

export async function ensureTableAndColumns(table: string, sampleRow?: Record<string, any>): Promise<Set<string>> {
  const cols = await getTableColumns(table);
  if (sampleRow && typeof sampleRow === 'object') {
    for (const key of Object.keys(sampleRow)) {
      cols.add(key);
    }
  }
  return cols;
}

export interface FilterCondition {
  column: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'contains';
  value: any;
}

export interface SelectOptions {
  columns?: string;
  filters?: FilterCondition[];
  order?: { column: string; ascending?: boolean };
  limit?: number;
  offset?: number;
  count?: 'exact' | null;
  head?: boolean;
}

function likeToRegex(pattern: string): RegExp {
  const escaped = String(pattern)
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/%/g, '.*')
    .replace(/_/g, '.');
  return new RegExp(`^${escaped}$`, 'i');
}

function matchesFilter(row: Record<string, any>, f: FilterCondition): boolean {
  const rawVal = row[f.column];
  const valStr = rawVal === null || rawVal === undefined ? null : String(rawVal);

  switch (f.operator) {
    case 'eq':
      if (f.value === null) return rawVal === null || rawVal === undefined;
      return valStr === String(serializeValue(f.value));
    case 'neq':
      if (f.value === null) return rawVal !== null && rawVal !== undefined;
      return valStr !== String(serializeValue(f.value));
    case 'gt':
      return rawVal !== null && rawVal !== undefined && String(rawVal) > String(serializeValue(f.value));
    case 'gte':
      return rawVal !== null && rawVal !== undefined && String(rawVal) >= String(serializeValue(f.value));
    case 'lt':
      return rawVal !== null && rawVal !== undefined && String(rawVal) < String(serializeValue(f.value));
    case 'lte':
      return rawVal !== null && rawVal !== undefined && String(rawVal) <= String(serializeValue(f.value));
    case 'like':
    case 'ilike':
      return valStr !== null && likeToRegex(String(f.value)).test(valStr);
    case 'in':
      if (!Array.isArray(f.value) || f.value.length === 0) return false;
      return f.value.some((v: any) => valStr === String(serializeValue(v)));
    case 'contains':
      return valStr !== null && valStr.toLowerCase().includes(String(f.value).toLowerCase());
    default:
      return true;
  }
}

export async function executeSelect(table: string, options: SelectOptions = {}) {
  let rows = [...getTableRows(table)];

  if (options.filters && options.filters.length > 0) {
    rows = rows.filter((row) => options.filters!.every((f) => matchesFilter(row, f)));
  }

  const totalCount = options.count === 'exact' ? rows.length : null;
  if (options.head) {
    return { data: [], count: totalCount };
  }

  if (options.order) {
    const { column, ascending = true } = options.order;
    rows.sort((a, b) => {
      const va = a[column] ?? '';
      const vb = b[column] ?? '';
      if (va < vb) return ascending ? -1 : 1;
      if (va > vb) return ascending ? 1 : -1;
      return 0;
    });
  }

  if (typeof options.offset === 'number' && options.offset > 0) {
    rows = rows.slice(options.offset);
  }
  if (typeof options.limit === 'number') {
    rows = rows.slice(0, options.limit);
  }

  let data = rows.map((r) => deserializeRow(r));
  if (options.columns && options.columns !== '*') {
    const requestedCols = options.columns.split(',').map((c) => c.trim()).filter(Boolean);
    data = data.map((r) => {
      const projected: Record<string, any> = {};
      for (const col of requestedCols) {
        projected[col] = r[col] ?? null;
      }
      return projected;
    });
  }

  return { data, count: totalCount };
}

export async function executeInsert(table: string, rows: Record<string, any>[]) {
  if (!rows || rows.length === 0) return { data: [] };
  const tableRows = getTableRows(table);
  const insertedRows: any[] = [];

  for (const r of rows) {
    const rowToInsert: Record<string, any> = { ...r };
    if (!rowToInsert.id) {
      rowToInsert.id = crypto.randomUUID
        ? crypto.randomUUID()
        : `loc-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    }
    if (!rowToInsert.created_at) {
      rowToInsert.created_at = new Date().toISOString();
    }
    const storedRow: Record<string, any> = {};
    for (const [k, v] of Object.entries(rowToInsert)) {
      storedRow[k] = serializeValue(v);
    }
    tableRows.push(storedRow);
    insertedRows.push(deserializeRow(storedRow));
  }

  return { data: insertedRows };
}

export async function executeUpsert(table: string, rows: Record<string, any>[], onConflict: string = 'id') {
  if (!rows || rows.length === 0) return { data: [] };
  const tableRows = getTableRows(table);
  const upsertedRows: any[] = [];

  for (const r of rows) {
    const rowToInsert: Record<string, any> = { ...r };
    if (!rowToInsert.id) {
      rowToInsert.id = crypto.randomUUID
        ? crypto.randomUUID()
        : `loc-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    }
    if (!rowToInsert.created_at) {
      rowToInsert.created_at = new Date().toISOString();
    }
    const storedRow: Record<string, any> = {};
    for (const [k, v] of Object.entries(rowToInsert)) {
      storedRow[k] = serializeValue(v);
    }

    const conflictKey = onConflict || 'id';
    const idx = tableRows.findIndex((existing) => existing[conflictKey] === storedRow[conflictKey]);
    if (idx >= 0) {
      tableRows[idx] = { ...tableRows[idx], ...storedRow };
    } else {
      tableRows.push(storedRow);
    }
    upsertedRows.push(deserializeRow(storedRow));
  }

  return { data: upsertedRows };
}

export async function executeUpdate(table: string, updates: Record<string, any>, filters: FilterCondition[] = []) {
  const tableRows = getTableRows(table);
  const updatedRows: any[] = [];

  for (let i = 0; i < tableRows.length; i++) {
    const row = tableRows[i];
    const matches = filters.length === 0 || filters.every((f) => matchesFilter(row, f));
    if (matches) {
      for (const [k, v] of Object.entries(updates)) {
        row[k] = serializeValue(v);
      }
      updatedRows.push(deserializeRow(row));
    }
  }

  return { data: updatedRows };
}

export async function executeDelete(table: string, filters: FilterCondition[] = []) {
  const map = getTablesMap();
  const tableRows = getTableRows(table);
  if (filters.length === 0) {
    map.set(table, []);
    return { data: null };
  }
  const remaining = tableRows.filter((row) => !filters.every((f) => matchesFilter(row, f)));
  map.set(table, remaining);
  return { data: null };
}

// Lightweight SQL compatibility handlers for routes that invoke runSql / allSql / getSql directly
export async function runSql(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
  const normalized = sql.trim();

  // CREATE TABLE
  if (/^CREATE\s+TABLE/i.test(normalized)) {
    const match = normalized.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["`]?(\w+)["`]?/i);
    if (match) getTableRows(match[1]);
    return { lastID: 0, changes: 0 };
  }

  // INSERT INTO "table" (col1, col2, ...) VALUES (?, ?, ...)
  const insertMatch = normalized.match(
    /^INSERT\s+(?:OR\s+REPLACE\s+)?INTO\s+["`]?(\w+)["`]?\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i
  );
  if (insertMatch) {
    const table = insertMatch[1];
    const cols = insertMatch[2].split(',').map((c) => c.trim().replace(/^["`]|["`]$/g, ''));
    const row: Record<string, any> = {};
    cols.forEach((col, i) => {
      row[col] = params[i] ?? null;
    });
    if (/OR\s+REPLACE/i.test(normalized)) {
      await executeUpsert(table, [row], 'id');
    } else {
      await executeInsert(table, [row]);
    }
    return { lastID: 1, changes: 1 };
  }

  // DELETE FROM "table" ...
  const deleteMatch = normalized.match(/^DELETE\s+FROM\s+["`]?(\w+)["`]?/i);
  if (deleteMatch) {
    const table = deleteMatch[1];
    const tableRows = getTableRows(table);
    if (table === 'audit_sessions' && params.length >= 4 && normalized.includes('substr("tanggal_waktu"')) {
      const [room, indId, , ym] = params;
      const filtered = tableRows.filter(
        (r) =>
          !(
            r.kategori === 'Surveilans HAIs' &&
            r.unit === room &&
            (r.indikator_id === indId || String(r.nama_indikator || '').toLowerCase().includes(String(indId).toLowerCase())) &&
            String(r.tanggal_waktu || '').slice(0, 7) === String(ym)
          )
      );
      getTablesMap().set(table, filtered);
      return { lastID: 0, changes: tableRows.length - filtered.length };
    }
    if (table === 'audit_sessions' && normalized.includes('"id" LIKE \'simrs-%\'') && params.length >= 2) {
      const [startIso, endIso] = params;
      const filtered = tableRows.filter(
        (r) =>
          !(
            r.kategori === 'Surveilans HAIs' &&
            String(r.id || '').startsWith('simrs-') &&
            String(r.tanggal_waktu || '') >= String(startIso) &&
            String(r.tanggal_waktu || '') <= String(endIso)
          )
      );
      getTablesMap().set(table, filtered);
      return { lastID: 0, changes: tableRows.length - filtered.length };
    }
    if (table === 'simrs_hais_patients' && params.length >= 2) {
      const [startDate, endDate] = params;
      const filtered = tableRows.filter(
        (r) => !(String(r.tanggal || '') >= String(startDate) && String(r.tanggal || '') <= String(endDate))
      );
      getTablesMap().set(table, filtered);
      return { lastID: 0, changes: tableRows.length - filtered.length };
    }
    return { lastID: 0, changes: 0 };
  }

  return { lastID: 0, changes: 0 };
}

export async function allSql<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const normalized = sql.trim();
  const fromMatch = normalized.match(/FROM\s+["`]?(\w+)["`]?/i);
  if (!fromMatch) return [];
  const table = fromMatch[1];
  const rows = getTableRows(table);

  if (table === 'simrs_hais_patients' && params.length >= 2) {
    const [startDate, endDate] = params;
    return rows
      .filter((r) => String(r.tanggal || '') >= String(startDate) && String(r.tanggal || '') <= String(endDate))
      .map((r) => deserializeRow(r)) as T[];
  }

  if (table === 'audit_sessions') {
    if (normalized.includes('SELECT DISTINCT substr(tanggal_waktu, 1, 7) as ym')) {
      const seen = new Set<string>();
      const out: any[] = [];
      for (const r of rows) {
        if (
          r.kategori === 'Surveilans HAIs' &&
          (String(r.id || '').startsWith('manual-hais') || String(r.id || '').startsWith('excel-hais'))
        ) {
          const ym = String(r.tanggal_waktu || '').slice(0, 7);
          const ind_id = String(r.indikator_id || '').toLowerCase();
          const key = `${ym}|${r.unit}|${ind_id}`;
          if (!seen.has(key)) {
            seen.add(key);
            out.push({ ym, unit: r.unit, ind_id });
          }
        }
      }
      return out as T[];
    }
    if (params.length >= 2) {
      const [startDate, endDate] = params;
      return rows
        .filter((r) => {
          const d = String(r.tanggal_waktu || '').slice(0, 10);
          return r.kategori === 'Surveilans HAIs' && d >= String(startDate) && d <= String(endDate);
        })
        .map((r) => deserializeRow(r)) as T[];
    }
  }

  return rows.map((r) => deserializeRow(r)) as T[];
}

export async function getSql<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const normalized = sql.trim();
  const fromMatch = normalized.match(/FROM\s+["`]?(\w+)["`]?/i);
  if (!fromMatch) return null;
  const table = fromMatch[1];
  const rows = getTableRows(table);

  if (table === 'ipcln_accounts' && params.length >= 1) {
    const targetUsername = String(params[0]).toLowerCase();
    const found = rows.find((r) => String(r.username || '').toLowerCase() === targetUsername);
    return (found ? deserializeRow(found) : null) as T | null;
  }

  return (rows.length > 0 ? deserializeRow(rows[0]) : null) as T | null;
}
