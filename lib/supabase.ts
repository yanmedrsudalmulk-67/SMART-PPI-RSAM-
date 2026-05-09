import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseUrl.startsWith('http') || supabaseUrl.includes('dummy')) {
      throw new Error('Konfigurasi URL Supabase (NEXT_PUBLIC_SUPABASE_URL) belum diatur di Environment Variables/Secrets Vercel.');
    }

    if (!supabaseAnonKey || supabaseAnonKey === 'placeholder_anon_key' || supabaseAnonKey.includes('dummy')) {
      throw new Error('Konfigurasi Kunci Anon Supabase (NEXT_PUBLIC_SUPABASE_ANON_KEY) belum diatur di Environment Variables/Secrets Vercel.');
    }

    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseClient;
}

