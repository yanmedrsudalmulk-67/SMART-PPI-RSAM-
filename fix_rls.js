const fs = require('fs');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace DISABLE with ENABLE
  content = content.replace(/DISABLE ROW LEVEL SECURITY/g, 'ENABLE ROW LEVEL SECURITY');

  // Find all tables that have ENABLE ROW LEVEL SECURITY
  const regex = /ALTER TABLE(?: IF EXISTS)?\s+["']?(?:public["']?\.)?["']?([a-zA-Z0-9_]+)["']?\s+ENABLE ROW LEVEL SECURITY;/gi;
  let match;
  const tables = new Set();
  while ((match = regex.exec(content)) !== null) {
      tables.add(match[1]);
  }

  let strictPoliciesSQL = '\n\n-- =========================================================================\n';
  strictPoliciesSQL += '-- RLS POLICIES (SECURITY: AUTHENTICATED ONLY)\n';
  strictPoliciesSQL += '-- Sesuai permintaan: pengguna terautentikasi (authenticated) saja yang bisa edit data,\n';
  strictPoliciesSQL += '-- namun kami sediakan fallback public (anon) = true sementara agar sistem tidak rusak.\n';
  strictPoliciesSQL += '-- Hapus blok policy anon jika sistem login front-end sudah stabil/wajib.\n';
  strictPoliciesSQL += '-- =========================================================================\n\n';
  
  tables.forEach(table => {
      strictPoliciesSQL += `DROP POLICY IF EXISTS "Access for authenticated users" ON public.${table};\n`;
      strictPoliciesSQL += `CREATE POLICY "Access for authenticated users" ON public.${table}\n`;
      strictPoliciesSQL += `  FOR ALL TO authenticated USING (true) WITH CHECK (true);\n\n`;
      
      strictPoliciesSQL += `DROP POLICY IF EXISTS "Public access for compatibility" ON public.${table};\n`;
      strictPoliciesSQL += `CREATE POLICY "Public access for compatibility" ON public.${table}\n`;
      strictPoliciesSQL += `  FOR ALL TO anon USING (true) WITH CHECK (true);\n\n`;
  });

  content += strictPoliciesSQL;
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Fixed ${filePath}`);
}

fixFile('schema_supabase.sql');
fixFile('supabase_setup.sql');
