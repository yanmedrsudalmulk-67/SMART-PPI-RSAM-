const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env', 'utf-8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=\s*(.*)/);
const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=\s*(.*)/);
const url = urlMatch ? urlMatch[1].trim() : '';
const key = keyMatch ? keyMatch[1].trim() : '';

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
  }
}
run();
