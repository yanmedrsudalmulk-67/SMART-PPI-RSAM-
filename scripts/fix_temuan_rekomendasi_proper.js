/**
 * Script: fix_temuan_rekomendasi_proper.js
 * Properly replaces old temuan/rekomendasi textarea blocks with TemuanRekomendasiSection
 * Strategy: Find the OUTER div containing "Temuan dan Rekomendasi" heading + two textareas and replace it
 */
const fs = require('fs');
const path = require('path');

const inputDir = path.join(__dirname, '..', 'src', 'pages', 'dashboard', 'input');

const IMPORT_LINE = `import TemuanRekomendasiSection from "@/components/TemuanRekomendasiSection";`;
const COMPONENT_REPLACEMENT = `<TemuanRekomendasiSection
          temuan={temuan}
          setTemuan={setTemuan}
          rekomendasi={rekomendasi}
          setRekomendasi={setRekomendasi}
        />`;

// Also remove the stray TemuanRekomendasiSection that was inserted inside checklist loop
function removeStrayInsertions(content) {
  // The stray insertion looks like:
  // <TemuanRekomendasiSection\n               temuan={temuan}\n...
  // inside a checklist items loop - before </div> </div> );})
  // We need to find and remove any TemuanRekomendasiSection that's inside a .map() callback
  
  // Pattern: finds TemuanRekomendasiSection that appears inside a .map() (detected by looking at context)
  // A simpler approach: remove ALL existing TemuanRekomendasiSection occurrences, then add it back in the right place
  const compRe = /<TemuanRekomendasiSection[\s\S]*?\/>/g;
  const stripped = content.replace(compRe, '').replace(/\n{3,}/g, '\n\n');
  return stripped;
}

function addImport(content) {
  if (content.includes('TemuanRekomendasiSection')) return content;
  const lastImportMatch = [...content.matchAll(/^import .+;$/gm)];
  if (lastImportMatch.length > 0) {
    const last = lastImportMatch[lastImportMatch.length - 1];
    const pos = last.index + last[0].length;
    return content.slice(0, pos) + '\n' + IMPORT_LINE + content.slice(pos);
  }
  return content;
}

// Find the outer div that wraps "Temuan dan Rekomendasi" header + textareas
// and replace the entire thing with <TemuanRekomendasiSection>
function replaceTemuanBlock(content) {
  // Strategy 1: Find div with heading "Temuan dan Rekomendasi" - hasBox style
  // Pattern: <div className="..."> <h2...>Temuan dan Rekomendasi</h2> ... textarea temuan ... textarea rekomendasi ... </div>
  
  // Find the position of "Temuan dan Rekomendasi" text
  const headingIdx = content.indexOf('Temuan dan Rekomendasi');
  
  if (headingIdx !== -1) {
    return replaceBlockAtHeading(content, headingIdx, 'Temuan dan Rekomendasi');
  }
  
  // Strategy 2: Find div containing "📝 Temuan Audit" and "💡 Rekomendasi" headings (hasGrid style)
  const gridIdx = content.indexOf('Temuan Audit');
  if (gridIdx !== -1 && content.includes('value={temuan}')) {
    return replaceGridBlock(content, gridIdx);
  }
  
  return { content, changed: false };
}

function replaceBlockAtHeading(content, headingIdx, headingText) {
  // Walk backward from heading to find the opening <div
  const before = content.slice(0, headingIdx);
  
  // Find the last <div that opens before this heading
  let divPos = -1;
  let searchPos = before.length - 1;
  while (searchPos >= 0) {
    const idx = before.lastIndexOf('<div', searchPos);
    if (idx === -1) break;
    // Check it's not a self-closing
    divPos = idx;
    break;
  }
  
  if (divPos === -1) return { content, changed: false };
  
  // Find matching closing </div>
  const blockEnd = findMatchingClose(content, divPos);
  if (blockEnd === -1) return { content, changed: false };
  
  // Verify this block actually contains both textareas
  const block = content.slice(divPos, blockEnd);
  if (!block.includes('value={temuan}') || !block.includes('value={rekomendasi}')) {
    // Try going one more level up
    const before2 = content.slice(0, divPos);
    const outerDivPos = before2.lastIndexOf('<div');
    if (outerDivPos === -1) return { content, changed: false };
    const outerEnd = findMatchingClose(content, outerDivPos);
    const outerBlock = content.slice(outerDivPos, outerEnd);
    if (outerBlock.includes('value={temuan}') && outerBlock.includes('value={rekomendasi}')) {
      const result = content.slice(0, outerDivPos) + COMPONENT_REPLACEMENT + content.slice(outerEnd);
      return { content: result, changed: true };
    }
    return { content, changed: false };
  }
  
  const result = content.slice(0, divPos) + COMPONENT_REPLACEMENT + content.slice(blockEnd);
  return { content: result, changed: true };
}

function replaceGridBlock(content, gridIdx) {
  // For hasGrid layout, find the outer grid div
  const before = content.slice(0, gridIdx);
  
  // Look for the grid container div
  const gridDivIdx = before.lastIndexOf('<div');
  if (gridDivIdx === -1) return { content, changed: false };
  
  // Find the grid div that contains the entire temuan+rekomendasi section
  // Go up 1-2 levels until we find one containing both textareas
  let checkPos = gridDivIdx;
  for (let attempts = 0; attempts < 5; attempts++) {
    const end = findMatchingClose(content, checkPos);
    if (end === -1) break;
    const block = content.slice(checkPos, end);
    if (block.includes('value={temuan}') && block.includes('value={rekomendasi}')) {
      const result = content.slice(0, checkPos) + COMPONENT_REPLACEMENT + content.slice(end);
      return { content: result, changed: true };
    }
    // Go one level up
    const prevDivIdx = content.slice(0, checkPos).lastIndexOf('<div');
    if (prevDivIdx === -1 || prevDivIdx === checkPos) break;
    checkPos = prevDivIdx;
  }
  
  return { content, changed: false };
}

function findMatchingClose(content, openTagStart) {
  let depth = 0;
  let i = openTagStart;
  while (i < content.length) {
    if (content.slice(i, i+5) === '<div ' || content.slice(i, i+4) === '<div>') {
      // Check it's not a self-closing
      const nextClose = content.indexOf('>', i);
      if (nextClose !== -1 && content[nextClose - 1] !== '/') {
        depth++;
      }
      i = (nextClose !== -1 ? nextClose : i) + 1;
    } else if (content.slice(i, i+6) === '</div>') {
      depth--;
      if (depth === 0) {
        return i + 6;
      }
      i += 6;
    } else {
      i++;
    }
  }
  return -1;
}

function processFile(fileName) {
  const filePath = path.join(inputDir, fileName);
  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠️  Not found: ${fileName}`);
    return false;
  }
  
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Skip if no temuan/rekomendasi
  if (!content.includes('value={temuan}') && !content.includes('Temuan dan Rekomendasi')) {
    console.log(`  ⏭️  No temuan block: ${fileName}`);
    return false;
  }
  
  // Step 1: Remove ALL existing TemuanRekomendasiSection insertions (stray ones from previous script)
  const hadComponent = content.includes('TemuanRekomendasiSection');
  content = removeStrayInsertions(content);
  
  // Step 2: Remove import (will re-add it properly)
  content = content.replace(IMPORT_LINE + '\n', '');
  content = content.replace(IMPORT_LINE, '');
  
  // Step 3: Replace the actual old block
  const replaceResult = replaceTemuanBlock(content);
  if (!replaceResult.changed) {
    console.log(`  ⚠️  Could not find block to replace in: ${fileName}`);
    // Try manual approach for specific files
    return false;
  }
  content = replaceResult.content;
  
  // Step 4: Add import at the end of imports
  content = addImport(content);
  
  // Verify: no more raw textareas with value={temuan}
  const remaining = (content.match(/value=\{temuan\}/g) || []).length;
  const compCount = (content.match(/TemuanRekomendasiSection/g) || []).length;
  
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`  ✅ ${fileName} — component instances: ${compCount}, raw temuan textareas remaining: ${remaining}`);
  return true;
}

// All 23 input forms
const allForms = [
  'dekontaminasi-alat.tsx',
  'penatalaksanaan-linen.tsx',
  'penempatan-pasien.tsx',
  'pengelolaan-limbah-medis.tsx',
  'pengelolaan-limbah-tajam.tsx',
  'pengendalian-lingkungan.tsx',
  'penyuntikan-aman.tsx',
  'monitoring-airborne.tsx',
  'monitoring-ambulance.tsx',
  'monitoring-cssd.tsx',
  'monitoring-farmasi.tsx',
  'monitoring-fasilitas_apd.tsx',
  'monitoring-fasilitas_hh.tsx',
  'monitoring-gizi.tsx',
  'monitoring-ibs.tsx',
  'monitoring-immuno.tsx',
  'monitoring-jenazah.tsx',
  'monitoring-laboratorium.tsx',
  'monitoring-radiologi.tsx',
  'monitoring-ruang_isolasi.tsx',
  'monitoring-tps.tsx',
  'monitoring-tunggu.tsx',
  'ppi-ruang-isolasi.tsx',
];

console.log('=== Fixing TemuanRekomendasiSection Integration (Proper) ===\n');
let ok = 0, fail = 0;
for (const f of allForms) {
  const r = processFile(f);
  if (r) ok++; else fail++;
}
console.log(`\n=== Done: ${ok} fixed, ${fail} skipped/failed ===`);
