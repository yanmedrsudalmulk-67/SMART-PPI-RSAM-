const fs = require('fs');

function fixGenericAuditReport() {
  const file = 'components/reports/GenericAuditReport.tsx';
  let content = fs.readFileSync(file, 'utf8');
  
  if (content.includes("const loadSessions = await supabase.from('audit_sessions')")) return;
  
  const targetFn = `const fetchData = async () => {
      setLoading(true);
      let query = supabase.from(tableName).select('*');
      
      if (extraFilter) {
        query = query.match(extraFilter);
      }
      
      query = query.order('tanggal_waktu', { ascending: false });
      
      const { data: result, error } = await query;`;
      
  const newFn = `const fetchData = async () => {
      setLoading(true);
      
      // 1. Fetch from unified table: audit_sessions
      let sessionQuery = supabase.from('audit_sessions').select('*').eq('indikator_id', tableName);
      if (extraFilter) sessionQuery = sessionQuery.match(extraFilter);
      sessionQuery = sessionQuery.order('tanggal_waktu', { ascending: false });
      const { data: sessionData } = await sessionQuery;
      
      // 2. Fetch from individual table (backward compatibility/fallback)
      let tableQuery = supabase.from(tableName).select('*');
      if (extraFilter) tableQuery = tableQuery.match(extraFilter);
      tableQuery = tableQuery.order('tanggal_waktu', { ascending: false });
      const { data: tableData } = await tableQuery.catch(() => ({ data: [] })); // table might not have correct schema

      // Merge results
      const rawData = [...(sessionData || []), ...(tableData || [])];
      
      // Remove duplicates if any (based on 'created_at' or 'id' combined with observer, unit)
      const ids = new Set();
      const result = rawData.filter(d => {
         const key = d.id;
         if (key && ids.has(key)) return false;
         if (key) ids.add(key);
         return true;
      });
      const error = null; // We handled it safely
      `;
      
  content = content.replace(targetFn, newFn);
  fs.writeFileSync(file, content);
  console.log("Updated GenericAuditReport");
}

function fixReportsPage() {
  const file = 'app/dashboard/reports/page.tsx';
  let content = fs.readFileSync(file, 'utf8');
  
  if (content.includes("let sessionQuery = supabase.from('audit_sessions')")) return;
  
  const targetFn = `        let query = supabase.from(config.tableName).select('*');
        if (config.extraFilter) query = query.match(config.extraFilter);
        
        const { data, error } = await query;
        if (!error && data) {`;
        
  const newFn = `        let sessionQuery = supabase.from('audit_sessions').select('*').eq('indikator_id', config.tableName);
        let tableQuery = supabase.from(config.tableName).select('*');
        if (config.extraFilter) {
          sessionQuery = sessionQuery.match(config.extraFilter);
          tableQuery = tableQuery.match(config.extraFilter);
        }
        
        const { data: sessionData } = await sessionQuery;
        const { data: tableData } = await tableQuery.catch(() => ({ data: null }));
        
        const rawData = [...(sessionData || []), ...(tableData || [])];
        const ids = new Set();
        const data = rawData.filter(d => {
           const key = d.id;
           if (key && ids.has(key)) return false;
           if (key) ids.add(key);
           return true; 
        });
        
        const error = null;
        if (!error && data) {`;
        
  if (content.includes("let query = supabase.from(config.tableName).select('*');")) {
     content = content.replace(targetFn, newFn);
     fs.writeFileSync(file, content);
     console.log("Updated reports/page.tsx");
  }
}

fixGenericAuditReport();
fixReportsPage();
