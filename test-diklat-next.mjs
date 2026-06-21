import { loadEnvConfig } from '@next/env';
import { createClient } from '@supabase/supabase-js';

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase.from('audit_sessions').select('*').eq('indikator_id', 'diklat_ppi');
  console.log("Error:", error);
  console.log("Data count:", data?.length);
  if(data && data.length > 0) {
    console.log("First item sample:");
    console.log("id:", data[0].id);
    console.log("waktu:", data[0].tanggal_waktu);
    console.log("unit:", data[0].unit);
    console.log("judul:", data[0].data_indikator?.judul);
  } else {
    console.log("NO DATA RETURNED FROM SUPABASE FOR diklat_ppi.");
  }
}
run();
