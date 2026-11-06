import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

const isCloudMode = process.env.NEXT_PUBLIC_DATABASE_MODE === 'supabase';

// Supabase cloud credentials fallback
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fkycaekjwdcbfyengmco.supabase.co';
let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZreWNhZWtqd2RjYmZ5ZW5nbWNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MTA2NjksImV4cCI6MjA5MTk4NjY2OX0.WIhgqt4XhidUZFOT31P7Jiwlf6P40ubpBczJL_usLC8';

const cloudClient: SupabaseClient | null = isCloudMode
  ? createSupabaseClient(supabaseUrl, supabaseAnonKey)
  : null;

// =========================================================================
// LOCAL SQLITE COMPATIBILITY LAYER
// =========================================================================

// Global Real-time Event Hub
type RealtimeCallback = (payload: any) => void;
const channelListeners = new Map<string, Set<RealtimeCallback>>();

function notifyLocalChange(table: string, eventType: 'INSERT' | 'UPDATE' | 'DELETE', newRecord: any, oldRecord: any = null) {
  if (typeof window !== 'undefined') {
    // 1. Dispatch custom DOM event
    window.dispatchEvent(
      new CustomEvent('smart_ppi_realtime', {
        detail: { table, eventType, newRecord, oldRecord },
      })
    );

    // 2. BroadcastChannel for cross-tab synchronization
    try {
      if ('BroadcastChannel' in window) {
        const bc = new BroadcastChannel('smart_ppi_channel');
        bc.postMessage({ table, eventType, newRecord, oldRecord });
        bc.close();
      }
    } catch (e) {
      // ignore
    }
  }

  // 3. Notify in-memory listeners
  channelListeners.forEach((callbacks, channelKey) => {
    callbacks.forEach((cb) => {
      try {
        cb({
          eventType,
          table,
          new: newRecord,
          old: oldRecord || (newRecord?.id ? { id: newRecord.id } : {}),
        });
      } catch (err) {
        console.error('Channel callback error:', err);
      }
    });
  });
}

// Listen to cross-tab BroadcastChannel
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    const bc = new BroadcastChannel('smart_ppi_channel');
    bc.onmessage = (event) => {
      const { table, eventType, newRecord, oldRecord } = event.data || {};
      if (table) {
        channelListeners.forEach((callbacks) => {
          callbacks.forEach((cb) => {
            try {
              cb({
                eventType,
                table,
                new: newRecord,
                old: oldRecord,
              });
            } catch (err) {
              console.error(err);
            }
          });
        });
      }
    };
  } catch (e) {
    // ignore
  }
}

// Convert File / Blob to Base64
async function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

class LocalQueryBuilder {
  private table: string;
  private action: 'select' | 'insert' | 'update' | 'upsert' | 'delete' = 'select';
  private hasExplicitAction: boolean = false;
  private selectColumns: string = '*';
  private selectCount: 'exact' | null = null;
  private selectHead: boolean = false;
  private filters: Array<{ column: string; operator: any; value: any }> = [];
  private orderConfig?: { column: string; ascending?: boolean };
  private limitCount?: number;
  private offsetCount?: number;
  private payloadRows: any[] = [];
  private payloadUpdates: Record<string, any> = {};
  private onConflictCol: string = 'id';
  private isSingle: boolean = false;
  private isMaybeSingle: boolean = false;

  constructor(table: string) {
    this.table = table;
  }

  select(columns: string = '*', options?: { count?: 'exact'; head?: boolean }) {
    if (!this.hasExplicitAction) {
      this.action = 'select';
    }
    this.selectColumns = columns;
    if (options?.count) this.selectCount = options.count;
    if (options?.head) this.selectHead = options.head;
    return this;
  }

  insert(rows: any | any[]) {
    this.action = 'insert';
    this.hasExplicitAction = true;
    this.payloadRows = Array.isArray(rows) ? rows : [rows];
    return this;
  }

  upsert(rows: any | any[], options?: { onConflict?: string }) {
    this.action = 'upsert';
    this.hasExplicitAction = true;
    this.payloadRows = Array.isArray(rows) ? rows : [rows];
    if (options?.onConflict) this.onConflictCol = options.onConflict;
    return this;
  }

  update(updates: Record<string, any>) {
    this.action = 'update';
    this.hasExplicitAction = true;
    this.payloadUpdates = updates;
    return this;
  }

  delete() {
    this.action = 'delete';
    this.hasExplicitAction = true;
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push({ column, operator: 'eq', value });
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push({ column, operator: 'neq', value });
    return this;
  }

  gt(column: string, value: any) {
    this.filters.push({ column, operator: 'gt', value });
    return this;
  }

  gte(column: string, value: any) {
    this.filters.push({ column, operator: 'gte', value });
    return this;
  }

  lt(column: string, value: any) {
    this.filters.push({ column, operator: 'lt', value });
    return this;
  }

  lte(column: string, value: any) {
    this.filters.push({ column, operator: 'lte', value });
    return this;
  }

  like(column: string, value: any) {
    this.filters.push({ column, operator: 'like', value });
    return this;
  }

  ilike(column: string, value: any) {
    this.filters.push({ column, operator: 'ilike', value });
    return this;
  }

  in(column: string, values: any[]) {
    this.filters.push({ column, operator: 'in', value: values });
    return this;
  }

  contains(column: string, value: any) {
    this.filters.push({ column, operator: 'contains', value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderConfig = { column, ascending: options?.ascending ?? true };
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  range(from: number, to: number) {
    this.offsetCount = from;
    this.limitCount = Math.max(0, to - from + 1);
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  private async execute(): Promise<{ data: any; error: any; count?: number | null }> {
    // If executing in Node.js server environment (SSR or API)
    if (typeof window === 'undefined') {
      try {
        const {
          executeSelect,
          executeInsert,
          executeUpdate,
          executeUpsert,
          executeDelete,
        } = await import('./sqlite-db');

        let res: any;
        if (this.action === 'select') {
          res = await executeSelect(this.table, {
            columns: this.selectColumns,
            filters: this.filters,
            order: this.orderConfig,
            limit: this.limitCount,
            offset: this.offsetCount,
            count: this.selectCount,
            head: this.selectHead,
          });
        } else if (this.action === 'insert') {
          res = await executeInsert(this.table, this.payloadRows);
          if (res.data?.length) {
            res.data.forEach((r: any) => notifyLocalChange(this.table, 'INSERT', r));
          }
        } else if (this.action === 'upsert') {
          res = await executeUpsert(this.table, this.payloadRows, this.onConflictCol);
          if (res.data?.length) {
            res.data.forEach((r: any) => notifyLocalChange(this.table, 'INSERT', r));
          }
        } else if (this.action === 'update') {
          res = await executeUpdate(this.table, this.payloadUpdates, this.filters);
          if (res.data?.length) {
            res.data.forEach((r: any) => notifyLocalChange(this.table, 'UPDATE', r));
          }
        } else if (this.action === 'delete') {
          res = await executeDelete(this.table, this.filters);
          notifyLocalChange(this.table, 'DELETE', null);
        }

        let data = res?.data;
        if (this.isSingle) {
          if (!data || data.length === 0) {
            return { data: null, error: { message: 'Row not found' }, count: res?.count };
          }
          data = data[0];
        } else if (this.isMaybeSingle) {
          data = data && data.length > 0 ? data[0] : null;
        }

        return { data, error: null, count: res?.count };
      } catch (err: any) {
        console.error('Server-side query error:', err);
        return { data: null, error: { message: err.message } };
      }
    }

    // In Browser client environment: call /api/db
    try {
      const response = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: this.action,
          table: this.table,
          options: {
            columns: this.selectColumns,
            filters: this.filters,
            order: this.orderConfig,
            limit: this.limitCount,
            offset: this.offsetCount,
            count: this.selectCount,
            head: this.selectHead,
          },
          rows: this.payloadRows,
          updates: this.payloadUpdates,
          filters: this.filters,
          onConflict: this.onConflictCol,
        }),
      });

      const json = await response.json();
      if (!response.ok || json.error) {
        return { data: null, error: json.error || { message: 'Request failed' } };
      }

      let data = json.data;
      if (this.isSingle) {
        if (!data || data.length === 0) {
          return { data: null, error: { message: 'Row not found' }, count: json.count };
        }
        data = data[0];
      } else if (this.isMaybeSingle) {
        data = data && data.length > 0 ? data[0] : null;
      }

      const rawRows = Array.isArray(data)
        ? data
        : (data ? [data] : (Array.isArray(json.data) ? json.data : []));

      if (this.action === 'insert' || this.action === 'upsert') {
        rawRows.forEach((r: any) => notifyLocalChange(this.table, 'INSERT', r));
      } else if (this.action === 'update') {
        notifyLocalChange(this.table, 'UPDATE', data);
      } else if (this.action === 'delete') {
        notifyLocalChange(this.table, 'DELETE', null);
      }

      return { data, error: null, count: json.count };
    } catch (err: any) {
      console.error('Client query fetch error:', err);
      return { data: null, error: { message: err.message } };
    }
  }

  // Promise interface implementation
  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: any; count?: number | null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null
  ): Promise<any | TResult> {
    return this.execute().catch(onrejected);
  }
}

// Storage compatibility
class LocalStorageBucket {
  private bucket: string;

  constructor(bucket: string) {
    this.bucket = bucket;
  }

  async upload(
    filePath: string,
    file: File | Blob | string,
    options?: { contentType?: string; upsert?: boolean; cacheControl?: string }
  ) {
    try {
      let base64 = '';
      let contentType = options?.contentType || 'application/octet-stream';

      if (typeof file === 'string') {
        base64 = file;
      } else if (file instanceof File || file instanceof Blob) {
        contentType = file.type || contentType;
        base64 = await fileToBase64(file);
      }

      const res = await fetch('/api/storage/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bucket: this.bucket,
          path: filePath,
          base64,
          contentType,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        return { data: null, error: json.error || { message: 'Upload failed' } };
      }

      return { data: json.data, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err.message } };
    }
  }

  getPublicUrl(filePath: string) {
    const cleanPath = filePath.replace(/^\//, '');
    const publicUrl = `/uploads/${this.bucket}/${cleanPath}`;
    return { data: { publicUrl } };
  }

  async remove(paths: string[]) {
    return { data: paths, error: null };
  }
}

// Local Supabase-compatible client implementation
export const localClient = {
  from(table: string) {
    return new LocalQueryBuilder(table);
  },

  storage: {
    from(bucket: string) {
      return new LocalStorageBucket(bucket);
    },
  },

  channel(name: string) {
    const channelObj = {
      name,
      on(event: string, filter: any, callback: RealtimeCallback) {
        if (!channelListeners.has(name)) {
          channelListeners.set(name, new Set());
        }
        channelListeners.get(name)!.add(callback);
        return channelObj;
      },
      subscribe(statusCb?: (status: string) => void) {
        if (typeof statusCb === 'function') {
          setTimeout(() => statusCb('SUBSCRIBED'), 0);
        }
        return channelObj;
      },
    };
    return channelObj;
  },

  removeChannel(channel: any) {
    if (channel && channel.name) {
      channelListeners.delete(channel.name);
    }
  },
};

// Export unified supabase client
export const supabase = isCloudMode && cloudClient ? cloudClient : (localClient as any);

export function getSupabase(): any {
  return supabase;
}

/**
 * Broadcast a real-time event explicitly
 */
export async function broadcastChannelMessage(
  channelName: string,
  event: string,
  payload: Record<string, any>
): Promise<void> {
  notifyLocalChange(channelName, 'UPDATE', payload);
}
