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
