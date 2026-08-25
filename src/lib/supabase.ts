import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
  supabaseUrl = 'https://fkycaekjwdcbfyengmco.supabase.co';
}

let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseAnonKey || supabaseAnonKey.trim() === '') {
  supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZreWNhZWtqd2RjYmZ5ZW5nbWNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MTA2NjksImV4cCI6MjA5MTk4NjY2OX0.WIhgqt4XhidUZFOT31P7Jiwlf6P40ubpBczJL_usLC8';
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function getSupabase(): SupabaseClient {
  return supabase;
}

/**
 * Broadcast a real-time event explicitly using httpSend (Supabase REST delivery)
 * to prevent the 'Realtime send() is automatically falling back to REST API' deprecation warning.
 */
export async function broadcastChannelMessage(
  channelName: string,
  event: string,
  payload: Record<string, any>
): Promise<void> {
  try {
    const ch: any = supabase.channel(channelName);
    if (typeof ch.httpSend === 'function') {
      await ch.httpSend(event, payload);
    } else {
      await new Promise<void>((resolve) => {
        const timer = setTimeout(() => resolve(), 3000);
        ch.subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            ch.send({
              type: 'broadcast',
              event,
              payload,
            }).finally(() => {
              clearTimeout(timer);
              supabase.removeChannel(ch);
              resolve();
            });
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            clearTimeout(timer);
            resolve();
          }
        });
      });
    }
  } catch (err) {
    console.warn('broadcastChannelMessage notice:', err);
  }
}
