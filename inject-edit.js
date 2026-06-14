const fs = require('fs');
const path = require('path');

const inputDir = path.join(__dirname, 'src', 'pages', 'dashboard', 'input');
const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.tsx') && !f.includes('index') && !['apd.tsx', 'hand-hygiene.tsx', 'surveilans.tsx', 'penempatan-pasien.tsx', 'dekontaminasi-alat.tsx', 'diklat.tsx', 'etika-batuk.tsx'].includes(f));

// Only do this for monitoring-*.tsx and pengelolaan-*.tsx etc which use `const [data, setData] = useState`

for (const file of files) {
  const filePath = path.join(inputDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  if (content.includes('isEditMode')) continue;

  // Find the useEffect that sets startTime
  const useEffectRegex = /useEffect\(\(\) => \{\s*setStartTime\(new Date\(\)\);\s*\}, \[\]\);/g;
  
  const replacement = `const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [preloadedPjSignature, setPreloadedPjSignature] = useState<string | null>(null);
  const [preloadedIpcnSignature, setPreloadedIpcnSignature] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id");
      const mode = params.get("mode");
      if (id && mode === "edit") {
        setIsEditMode(true);
        setEditId(id);

        const loadEditData = async () => {
          const { data: ed, error } = await supabase
            .from("audit_sessions")
            .select("*")
            .eq("id", id)
            .single();

          if (ed && !error) {
            if (ed.tanggal_waktu) setStartTime(new Date(ed.tanggal_waktu));
            if (ed.observer && typeof setObserver !== 'undefined') setObserver(ed.observer);
            if (ed.unit && typeof setUnit !== 'undefined') setUnit(ed.unit);
            if (ed.temuan && typeof setTemuan !== 'undefined') setTemuan(ed.temuan);
            if (ed.rekomendasi && typeof setRekomendasi !== 'undefined') setRekomendasi(ed.rekomendasi);
            if (ed.nama_pj_ruangan && typeof setPjName !== 'undefined') setPjName(ed.nama_pj_ruangan);
            if (ed.ttd_pj_ruangan && typeof setPreloadedPjSignature !== 'undefined') setPreloadedPjSignature(ed.ttd_pj_ruangan);
            if (ed.ttd_ipcn && typeof setPreloadedIpcnSignature !== 'undefined') setPreloadedIpcnSignature(ed.ttd_ipcn);

            const indicatorsData = ed.data_indikator || ed.checklist_json || {};
            if (typeof setData !== 'undefined') {
              setData((prev: any) => {
                const updated = { ...prev };
                Object.keys(updated).forEach((key) => {
                  if (indicatorsData[key] !== undefined) {
                    updated[key] = indicatorsData[key];
                  }
                });
                return updated;
              });
            }
          }
        };
        loadEditData();
      } else {
        setStartTime(new Date());
      }
    } else {
      setStartTime(new Date());
    }
  }, []);`;

  content = content.replace(useEffectRegex, replacement);

  // Update save button text
  content = content.replace(/<span>Simpan Data Audit<\/span>/g, "<span>{isEditMode ? 'Update Data Audit' : 'Simpan Data Audit'}</span>");
  
  // Update submit handler logic to use .update()
  const submitRegex = /const \{ error \} = await supabase.from\("audit_sessions"\).insert\(\[payload\]\);/;
  const submitReplacement = `
      if (isEditMode && editId) {
        const { error } = await supabase.from("audit_sessions").update({
          ...payload,
          id: undefined // prevent id update
        }).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("audit_sessions").insert([payload]);
        if (error) throw error;
      }
  `;
  content = content.replace(submitRegex, submitReplacement);

  const submit2Regex = /const \{ data: sessionData, error \} = await supabase\s*\n\s*\.from\("audit_sessions"\)\s*\n\s*\.insert\(\[payload\]\)\s*\n\s*\.select\("id"\)\s*\n\s*\.single\(\);/m;
  const submit2Replacement = `
      let sessionData = { id: editId };
      if (isEditMode && editId) {
        const { error: errUpdate } = await supabase.from("audit_sessions").update({
          ...payload,
          id: undefined
        }).eq("id", editId);
        if (errUpdate) throw errUpdate;
      } else {
        const { data: newSession, error: errInsert } = await supabase
          .from("audit_sessions")
          .insert([payload])
          .select("id")
          .single();
        if (errInsert) throw errInsert;
        sessionData = newSession;
      }
  `;

  content = content.replace(submit2Regex, submit2Replacement);

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Patched:', file);
}
