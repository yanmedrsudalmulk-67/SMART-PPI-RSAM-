/**
 * fix_hasbox_forms.js
 * Fix the 7 hasBox forms by finding the exact "Temuan dan Rekomendasi" div
 * and replacing ONLY that div with <TemuanRekomendasiSection>
 * Does NOT touch the outer container or anything else.
 */
const fs = require('fs');
const path = require('path');

const inputDir = path.join(__dirname, '..', 'src', 'pages', 'dashboard', 'input');

const IMPORT_LINE = `import TemuanRekomendasiSection from "@/components/TemuanRekomendasiSection";`;

const hasBoxForms = [
  'dekontaminasi-alat.tsx',
  'penatalaksanaan-linen.tsx',
  'penempatan-pasien.tsx',
  'pengelolaan-limbah-medis.tsx',
  'pengelolaan-limbah-tajam.tsx',
  'pengendalian-lingkungan.tsx',
  'penyuntikan-aman.tsx',
];

function addImportIfMissing(content) {
  if (content.includes('TemuanRekomendasiSection')) return content;
  const lastImportMatch = [...content.matchAll(/^import .+;$/gm)];
  if (lastImportMatch.length > 0) {
    const last = lastImportMatch[lastImportMatch.length - 1];
    const pos = last.index + last[0].length;
    return content.slice(0, pos) + '\n' + IMPORT_LINE + content.slice(pos);
  }
  return content;
}

// Find the outer <div> that:
// 1. Contains "Temuan dan Rekomendasi" text
// 2. Contains both value={temuan} and value={rekomendasi} textareas
// Returns { start, end } or null
function findTemuanDiv(content) {
  // Find "Temuan dan Rekomendasi" text position
  const textIdx = content.indexOf('Temuan dan Rekomendasi');
  if (textIdx === -1) {
    // Try alternative headings
    const altIdx = content.indexOf('TEMUAN DAN REKOMENDASI');
    if (altIdx === -1) return null;
  }
  
  const headingPos = content.indexOf('Temuan dan Rekomendasi') !== -1
    ? content.indexOf('Temuan dan Rekomendasi')
    : content.indexOf('TEMUAN DAN REKOMENDASI');
  
  // Walk backwards to find the opening <div that contains this heading
  // We need to scan backwards through the JSX
  const beforeHeading = content.slice(0, headingPos);
  
  // Find opening divs before the heading - look for the last one that opens the section
  // We want the div that starts with class="bg-white/5..." containing the whole section
  
  // Search backwards for the div tag
  let searchFrom = headingPos;
  
  // Try to find the outer container by looking for the div before h2/h3 that has the heading
  // The pattern is: <div className="bg-white/5 ..."> <h2>Temuan dan Rekomendasi</h2>
  
  // Simple approach: find last <div before the heading text
  let divStart = beforeHeading.lastIndexOf('<div ');
  if (divStart === -1) divStart = beforeHeading.lastIndexOf('<div>');
  if (divStart === -1) return null;
  
  // Go up one more level to get the outer containing div
  const beforeDiv = content.slice(0, divStart);
  let outerDivStart = beforeDiv.lastIndexOf('<div ');
  if (outerDivStart === -1) outerDivStart = beforeDiv.lastIndexOf('<div>');
  
  // Try the outer div first - check if it contains both textareas
  if (outerDivStart !== -1) {
    const outerEnd = findMatchingClose(content, outerDivStart);
    if (outerEnd !== -1) {
      const block = content.slice(outerDivStart, outerEnd);
      if (block.includes('value={temuan}') && block.includes('value={rekomendasi}')
          && block.includes('DocumentationUploader') === false) {
        // This is the section block (without documentation uploader)
        return { start: outerDivStart, end: outerEnd };
      }
    }
  }
  
  // Fall back: use the div we found initially
  const divEnd = findMatchingClose(content, divStart);
  if (divEnd !== -1) {
    const block = content.slice(divStart, divEnd);
    if (block.includes('value={temuan}') && block.includes('value={rekomendasi}')) {
      return { start: divStart, end: divEnd };
    }
  }
  
  // Last resort: search for the div that wraps the entire temuan+rekomendasi section
  // by finding value={temuan} and working outward
  const temuanTA = content.indexOf('value={temuan}');
  if (temuanTA === -1) return null;
  
  const beforeTA = content.slice(0, temuanTA);
  // Walk back finding div tags
  for (let i = 0; i < 5; i++) {
    const dIdx = beforeTA.lastIndexOf('<div', beforeTA.length - 1);
    if (dIdx === -1) break;
    const dEnd = findMatchingClose(content, dIdx);
    if (dEnd !== -1) {
      const dBlock = content.slice(dIdx, dEnd);
      if (dBlock.includes('value={temuan}') && dBlock.includes('value={rekomendasi}')
          && !dBlock.includes('DocumentationUploader')) {
        return { start: dIdx, end: dEnd };
      }
    }
  }
  
  return null;
}

// Find matching closing </div> for a <div> opened at openTagStart
function findMatchingClose(content, openTagStart) {
  let depth = 0;
  let i = openTagStart;
  
  while (i < content.length) {
    if (content[i] === '<') {
      // Check for opening div
      if (content.slice(i, i+5) === '<div ' || content.slice(i, i+4) === '<div>') {
        // Skip to end of opening tag to check if self-closing
        let j = i + 1;
        while (j < content.length && content[j] !== '>') j++;
        if (j < content.length && content[j-1] !== '/') {
          depth++;
        }
        i = j + 1;
        continue;
      }
      // Check for closing div
      if (content.slice(i, i+6) === '</div>') {
        depth--;
        if (depth === 0) return i + 6;
        i += 6;
        continue;
      }
    }
    i++;
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
  
  // Skip if already has component and no old textarea
  const hasOldTA = content.includes('value={temuan}');
  const hasComp = content.includes('TemuanRekomendasiSection');
  if (hasComp && !hasOldTA) {
    console.log(`  ⏭️  Already done: ${fileName}`);
    return false;
  }
  
  // Find the target block
  const block = findTemuanDiv(content);
  if (!block) {
    console.log(`  ❌ Could not locate Temuan div in: ${fileName}`);
    // Print surrounding context
    const idx = content.indexOf('Temuan dan Rekomendasi');
    if (idx !== -1) {
      console.log(`     Context: "${content.slice(Math.max(0,idx-50), idx+100).replace(/\n/g, ' ')}"`);
    }
    return false;
  }
  
  // Verify the block contains both textareas
  const targetBlock = content.slice(block.start, block.end);
  if (!targetBlock.includes('value={temuan}') || !targetBlock.includes('value={rekomendasi}')) {
    console.log(`  ❌ Block found but doesn't contain both textareas in: ${fileName}`);
    console.log(`     Block preview: "${targetBlock.slice(0, 200).replace(/\n/g, ' ')}"`);
    return false;
  }
  
  // Replace the block
  const REPLACEMENT = `<TemuanRekomendasiSection
          temuan={temuan}
          setTemuan={setTemuan}
          rekomendasi={rekomendasi}
          setRekomendasi={setRekomendasi}
        />`;
  
  content = content.slice(0, block.start) + REPLACEMENT + content.slice(block.end);
  
  // Add import
  content = addImportIfMissing(content);
  
  fs.writeFileSync(filePath, content, 'utf-8');
  
  // Verify
  const remaining = (content.match(/value=\{temuan\}/g) || []).length;
  const compCount = (content.match(/TemuanRekomendasiSection/g) || []).length;
  console.log(`  ✅ ${fileName} — comp: ${compCount}, raw textareas: ${remaining}`);
  return true;
}

console.log('=== Fixing hasBox forms properly ===\n');
let ok = 0, fail = 0;
for (const f of hasBoxForms) {
  const r = processFile(f);
  if (r) ok++; else fail++;
}
console.log(`\n=== Done: ${ok} fixed, ${fail} skipped/failed ===`);
