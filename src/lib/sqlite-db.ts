import path from 'path';
import fs from 'fs';
import sqlite3 from 'sqlite3';

const dbPath = path.resolve(process.cwd(), 'data/smart_ppi.db');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Singleton database connection
let dbInstance: sqlite3.Database | null = null;

// In-Memory Caches for Extreme Performance
const tableColumnsCache = new Map<string, Set<string>>();

interface QueryCacheEntry {
  timestamp: number;
  data: { data: any[]; count: number | null };
}
const queryCache = new Map<string, QueryCacheEntry>();
const QUERY_CACHE_TTL_MS = 20000; // 20 seconds cache for identical SELECT queries

export function clearQueryCache(table?: string) {
  if (!table) {
    queryCache.clear();
    return;
  }
  const prefix = `${table}:`;
  for (const key of queryCache.keys()) {
    if (key.startsWith(prefix)) {
      queryCache.delete(key);
    }
  }
}

export function getDb(): sqlite3.Database {
  if (!dbInstance) {
    dbInstance = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Failed to connect to local SQLite database:', err);
      }
    });
    dbInstance.serialize(() => {
      dbInstance?.run('PRAGMA journal_mode = WAL;');
      dbInstance?.run('PRAGMA synchronous = NORMAL;');
      dbInstance?.run('PRAGMA cache_size = -64000;'); // 64MB memory cache
      dbInstance?.run('PRAGMA temp_store = MEMORY;');
      dbInstance?.run('PRAGMA foreign_keys = OFF;');
    });
  }
  return dbInstance;
}

export function runSql(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

export function allSql<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve((rows || []) as T[]);
    });
  });
}

export function getSql<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve((row as T) || null);
    });
  });
}

export async function getTableColumns(table: string): Promise<Set<string>> {
  if (tableColumnsCache.has(table)) {
    return tableColumnsCache.get(table)!;
  }
  try {
    const info = await allSql<{ name: string }>(`PRAGMA table_info("${table}")`);
    const cols = new Set(info.map(c => c.name));
    if (cols.size > 0) {
      tableColumnsCache.set(table, cols);
    }
    return cols;
  } catch (e) {
    return new Set();
  }
}

export async function ensureTableAndColumns(table: string, sampleRow?: Record<string, any>): Promise<Set<string>> {
  const existingCols = await getTableColumns(table);
  if (existingCols.size === 0) {
    await runSql(`CREATE TABLE IF NOT EXISTS "${table}" (id TEXT PRIMARY KEY, created_at TEXT)`);
    existingCols.add('id');
    existingCols.add('created_at');
    tableColumnsCache.set(table, existingCols);
  }

  if (sampleRow && typeof sampleRow === 'object') {
    for (const key of Object.keys(sampleRow)) {
      if (!existingCols.has(key)) {
        try {
          await runSql(`ALTER TABLE "${table}" ADD COLUMN "${key}" TEXT`);
          existingCols.add(key);
          tableColumnsCache.set(table, existingCols);
        } catch (e) {
          // column might have been added concurrently
        }
      }
    }
  }
  return existingCols;
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
        } catch (e) {
          // not valid json, treat as string
        }
      }
    }
    out[k] = v;
  }
  return out;
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

export async function executeSelect(table: string, options: SelectOptions = {}) {
  // Check in-memory query cache for instant responses
  const cacheKey = `${table}:${JSON.stringify(options)}`;
  const cached = queryCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < QUERY_CACHE_TTL_MS)) {
    return cached.data;
  }

  await ensureTableAndColumns(table);

  const existingCols = await getTableColumns(table);
  const whereClauses: string[] = [];
  const params: any[] = [];

  if (options.filters && options.filters.length > 0) {
    for (const f of options.filters) {
      // Ensure column exists to avoid SQL syntax error
      if (!existingCols.has(f.column)) {
        await ensureTableAndColumns(table, { [f.column]: '' });
      }

      switch (f.operator) {
        case 'eq':
          if (f.value === null) {
            whereClauses.push(`"${f.column}" IS NULL`);
          } else {
            whereClauses.push(`"${f.column}" = ?`);
            params.push(serializeValue(f.value));
          }
          break;
        case 'neq':
          if (f.value === null) {
            whereClauses.push(`"${f.column}" IS NOT NULL`);
          } else {
            whereClauses.push(`("${f.column}" != ? OR "${f.column}" IS NULL)`);
            params.push(serializeValue(f.value));
          }
          break;
        case 'gt':
          whereClauses.push(`"${f.column}" > ?`);
          params.push(serializeValue(f.value));
          break;
        case 'gte':
          whereClauses.push(`"${f.column}" >= ?`);
          params.push(serializeValue(f.value));
          break;
        case 'lt':
          whereClauses.push(`"${f.column}" < ?`);
          params.push(serializeValue(f.value));
          break;
        case 'lte':
          whereClauses.push(`"${f.column}" <= ?`);
          params.push(serializeValue(f.value));
          break;
        case 'like':
        case 'ilike':
          whereClauses.push(`"${f.column}" LIKE ?`);
          params.push(f.value);
          break;
        case 'in':
          if (Array.isArray(f.value) && f.value.length > 0) {
            const placeholders = f.value.map(() => '?').join(', ');
            whereClauses.push(`"${f.column}" IN (${placeholders})`);
            f.value.forEach((v: any) => params.push(serializeValue(v)));
          } else {
            whereClauses.push(`1 = 0`);
          }
          break;
        case 'contains':
          whereClauses.push(`"${f.column}" LIKE ?`);
          params.push(`%${f.value}%`);
          break;
      }
    }
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  let totalCount: number | null = null;
  if (options.count === 'exact') {
    const countRes = await getSql<{ c: number }>(`SELECT COUNT(*) as c FROM "${table}" ${whereSql}`, params);
    totalCount = countRes ? countRes.c : 0;
  }

  if (options.head) {
    return { data: [], count: totalCount };
  }

  // Parse columns
  let colSql = '*';
  if (options.columns && options.columns !== '*') {
    const rawCols = options.columns.split(',').map(c => c.trim()).filter(Boolean);
    // ensure all requested cols exist
    for (const c of rawCols) {
      if (!existingCols.has(c)) {
        await ensureTableAndColumns(table, { [c]: '' });
      }
    }
    colSql = rawCols.map(c => `"${c}"`).join(', ');
  }

  let orderSql = '';
  if (options.order) {
    const dir = options.order.ascending ? 'ASC' : 'DESC';
    orderSql = `ORDER BY "${options.order.column}" ${dir}`;
  }

  let limitSql = '';
  if (typeof options.limit === 'number') {
    limitSql = `LIMIT ${options.limit}`;
    if (typeof options.offset === 'number') {
      limitSql += ` OFFSET ${options.offset}`;
    }
  }

  const querySql = `SELECT ${colSql} FROM "${table}" ${whereSql} ${orderSql} ${limitSql}`.trim();
  const rawRows = await allSql(querySql, params);
  const data = rawRows.map(deserializeRow);

  const output = { data, count: totalCount };
  queryCache.set(cacheKey, { timestamp: Date.now(), data: output });
  return output;
}

export async function executeInsert(table: string, rows: Record<string, any>[]) {
  clearQueryCache(table);
  if (!rows || rows.length === 0) return { data: [] };

  // Ensure all columns exist
  for (const r of rows) {
    await ensureTableAndColumns(table, r);
  }

  const insertedRows: any[] = [];
  for (const r of rows) {
    const rowToInsert = { ...r };
    if (!rowToInsert.id) {
      rowToInsert.id = crypto.randomUUID ? crypto.randomUUID() : `loc-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    }
    if (!rowToInsert.created_at) {
      rowToInsert.created_at = new Date().toISOString();
    }

    const keys = Object.keys(rowToInsert);
    const placeholders = keys.map(() => '?').join(', ');
    const values = keys.map(k => serializeValue(rowToInsert[k]));

    await runSql(
      `INSERT INTO "${table}" ("${keys.join('", "')}") VALUES (${placeholders})`,
      values
    );

    insertedRows.push(rowToInsert);
  }

  return { data: insertedRows };
}

export async function executeUpsert(table: string, rows: Record<string, any>[], onConflict: string = 'id') {
  clearQueryCache(table);
  if (!rows || rows.length === 0) return { data: [] };

  for (const r of rows) {
    await ensureTableAndColumns(table, r);
  }

  const upsertedRows: any[] = [];
  await runSql('BEGIN TRANSACTION');
  try {
    for (const r of rows) {
      const rowToInsert = { ...r };
      if (!rowToInsert.id) {
        rowToInsert.id = crypto.randomUUID ? crypto.randomUUID() : `loc-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      }
      if (!rowToInsert.created_at) {
        rowToInsert.created_at = new Date().toISOString();
      }

      const keys = Object.keys(rowToInsert);
      const placeholders = keys.map(() => '?').join(', ');
      const values = keys.map(k => serializeValue(rowToInsert[k]));

      // SQLite INSERT OR REPLACE
      await runSql(
        `INSERT OR REPLACE INTO "${table}" ("${keys.join('", "')}") VALUES (${placeholders})`,
        values
      );

      upsertedRows.push(rowToInsert);
    }
    await runSql('COMMIT');
  } catch (err) {
    await runSql('ROLLBACK').catch(() => {});
    throw err;
  }

  return { data: upsertedRows };
}

export async function executeUpdate(table: string, updates: Record<string, any>, filters: FilterCondition[] = []) {
  clearQueryCache(table);
  await ensureTableAndColumns(table, updates);

  const setClauses: string[] = [];
  const params: any[] = [];

  for (const [k, v] of Object.entries(updates)) {
    setClauses.push(`"${k}" = ?`);
    params.push(serializeValue(v));
  }

  const whereClauses: string[] = [];
  if (filters.length > 0) {
    for (const f of filters) {
      if (f.operator === 'eq') {
        whereClauses.push(`"${f.column}" = ?`);
        params.push(serializeValue(f.value));
      }
    }
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
  const sql = `UPDATE "${table}" SET ${setClauses.join(', ')} ${whereSql}`;

  await runSql(sql, params);

  // Return updated rows if possible
  const updated = await allSql(`SELECT * FROM "${table}" ${whereSql}`, whereClauses.length > 0 ? params.slice(Object.keys(updates).length) : []);
  return { data: updated.map(deserializeRow) };
}

export async function executeDelete(table: string, filters: FilterCondition[] = []) {
  clearQueryCache(table);
  await ensureTableAndColumns(table);

  const whereClauses: string[] = [];
  const params: any[] = [];

  if (filters.length > 0) {
    for (const f of filters) {
      switch (f.operator) {
        case 'eq':
          if (f.value === null) {
            whereClauses.push(`"${f.column}" IS NULL`);
          } else {
            whereClauses.push(`"${f.column}" = ?`);
            params.push(serializeValue(f.value));
          }
          break;
        case 'neq':
          if (f.value === null) {
            whereClauses.push(`"${f.column}" IS NOT NULL`);
          } else {
            whereClauses.push(`("${f.column}" != ? OR "${f.column}" IS NULL)`);
            params.push(serializeValue(f.value));
          }
          break;
        case 'gt':
          whereClauses.push(`"${f.column}" > ?`);
          params.push(serializeValue(f.value));
          break;
        case 'gte':
          whereClauses.push(`"${f.column}" >= ?`);
          params.push(serializeValue(f.value));
          break;
        case 'lt':
          whereClauses.push(`"${f.column}" < ?`);
          params.push(serializeValue(f.value));
          break;
        case 'lte':
          whereClauses.push(`"${f.column}" <= ?`);
          params.push(serializeValue(f.value));
          break;
        case 'like':
        case 'ilike':
          whereClauses.push(`"${f.column}" LIKE ?`);
          params.push(f.value);
          break;
        case 'in':
          if (Array.isArray(f.value) && f.value.length > 0) {
            const placeholders = f.value.map(() => '?').join(', ');
            whereClauses.push(`"${f.column}" IN (${placeholders})`);
            f.value.forEach((v: any) => params.push(serializeValue(v)));
          } else {
            whereClauses.push(`1 = 0`);
          }
          break;
        case 'contains':
          whereClauses.push(`"${f.column}" LIKE ?`);
          params.push(`%${f.value}%`);
          break;
      }
    }
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
  const sql = `DELETE FROM "${table}" ${whereSql}`;

  await runSql(sql, params);
  return { data: null };
}
