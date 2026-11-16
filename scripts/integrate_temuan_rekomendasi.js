/**
 * Script: integrate_temuan_rekomendasi.js
 * Integrates TemuanRekomendasiSection into all 23 input forms
 */
const fs = require('fs');
const path = require('path');

const inputDir = path.join(__dirname, '..', 'src', 'pages', 'dashboard', 'input');

// Forms to process and their type
const forms = {
  hasBox: [
    'dekontaminasi-alat.tsx',
    'penatalaksanaan-linen.tsx',
    'penempatan-pasien.tsx',
    'pengelolaan-limbah-medis.tsx',
    'pengelolaan-limbah-tajam.tsx',
    'pengendalian-lingkungan.tsx',
    'penyuntikan-aman.tsx',
  ],
  hasGrid: [
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
  ],
};

const IMPORT_LINE = `import TemuanRekomendasiSection from "@/components/TemuanRekomendasiSection";`;

function addImport(content) {
  // Don't add if already present
  if (content.includes('TemuanRekomendasiSection')) return { content, changed: false };
  
  // Find the last import line
  const importRegex = /^import .+;$/m;
  const lastImportMatch = [...content.matchAll(/^import .+;$/gm)];
  if (lastImportMatch.length > 0) {
    const lastImport = lastImportMatch[lastImportMatch.length - 1];
    const insertPos = lastImport.index + lastImport[0].length;
    content = content.slice(0, insertPos) + '\n' + IMPORT_LINE + content.slice(insertPos);
    return { content, changed: true };
  }
  return { content, changed: false };
}

// Pattern: "hasBox" - stacked textarea layout
// Finds the section with "Temuan dan Rekomendasi" heading and two textareas
function replaceHasBox(content, fileName) {
  // Try multiple patterns for the box layout
  
  // Pattern 1: Full section with header div
  const pattern1 = /(<div[^>]*className[^>]*(?:bg-white\/5|rounded-\[24px\])[^>]*>\s*<h2[^>]*>[\s\S]{0,50}[Tt]emuan[\s\S]{0,30}[Rr]ekomendasi[\s\S]*?<\/h2>[\s\S]*?<div[\s\S]*?<textarea[^>]*value=\{temuan\}[\s\S]*?<\/textarea>[\s\S]*?<\/div>[\s\S]*?<div[\s\S]*?<textarea[^>]*value=\{rekomendasi\}[\s\S]*?<\/textarea>[\s\S]*?<\/div>[\s\S]*?<\/div>)/;
  
  // Try a more targeted approach: find the temuan textarea and surrounding section
  // Look for the block containing BOTH temuan and rekomendasi textareas
  
  // Simple approach: find from "Temuan dan Rekomendasi" heading to the closing of the outer div
  const sections = findTemuanRekomendasiBlock(content);
  if (sections) {
    const replacement = `<TemuanRekomendasiSection
              temuan={temuan}
              setTemuan={setTemuan}
              rekomendasi={rekomendasi}
              setRekomendasi={setRekomendasi}
            />`;
    return { 
      content: content.slice(0, sections.start) + replacement + content.slice(sections.end),
      changed: true
    };
  }
  
  return { content, changed: false };
}

function findTemuanRekomendasiBlock(content) {
  // Strategy: find the div that contains both temuan and rekomendasi textareas
  // Start from the h2 heading "Temuan dan Rekomendasi"
  
  // Try pattern: outer div containing the section header and both textareas
  // Look for opening of the container section
  const headerPattern = /Temuan dan Rekomendasi/;
  const headerMatch = content.search(headerPattern);
  if (headerMatch === -1) {
    // Try grid pattern
    return findGridTemuanBlock(content);
  }
  
  // Walk backward to find the opening div
  let pos = headerMatch;
  let searchContent = content.slice(0, headerMatch);
  
  // Find the last <div that opens before this header
  const divMatches = [...searchContent.matchAll(/<div\s/g)];
  if (divMatches.length === 0) return null;
  
  // Start from a few divs back
  const startDivMatch = divMatches[divMatches.length - 2] || divMatches[divMatches.length - 1];
  const blockStart = startDivMatch.index;
  
  // Now find the matching closing div
  const blockEnd = findMatchingClose(content, blockStart);
  if (blockEnd === -1) return null;
  
  return { start: blockStart, end: blockEnd };
}

function findGridTemuanBlock(content) {
  // For grid layout: look for the grid div containing both columns
  // Pattern: <div className="grid grid-cols-1 md:grid-cols-2 ...">
  // With two children containing temuan and rekomendasi
  
  const gridPattern = /grid grid-cols-1 md:grid-cols-2[^>]*>\s*[\s\S]*?value=\{temuan\}[\s\S]*?value=\{rekomendasi\}/;
  const match = gridPattern.exec(content);
  if (!match) return null;
  
  // Find where the grid div starts
  const gridDivEnd = match.index;
  const beforeGrid = content.slice(0, gridDivEnd);
  const lastGridDiv = beforeGrid.lastIndexOf('<div');
  if (lastGridDiv === -1) return null;
  
  const blockEnd = findMatchingClose(content, lastGridDiv);
  if (blockEnd === -1) return null;
  
  return { start: lastGridDiv, end: blockEnd };
}

function findMatchingClose(content, openTagStart) {
  let depth = 0;
  let i = openTagStart;
  while (i < content.length) {
    if (content.slice(i, i+5) === '<div ' || content.slice(i, i+4) === '<div>') {
      depth++;
      i += 4;
    } else if (content.slice(i, i+6) === '</div>') {
      depth--;
      if (depth === 0) {
        return i + 6; // end position (exclusive)
      }
      i += 6;
    } else {
      i++;
    }
  }
  return -1;
}

function processFile(fileName, type) {
  const filePath = path.join(inputDir, fileName);
  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠️  File not found: ${fileName}`);
    return false;
  }
  
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Skip if already integrated
  if (content.includes('TemuanRekomendasiSection')) {
    console.log(`  ⏭️  Already integrated: ${fileName}`);
    return false;
  }
  
  // Check if file has temuan/rekomendasi
  if (!content.includes('temuan') || !content.includes('rekomendasi')) {
    console.log(`  ⚠️  No temuan/rekomendasi found: ${fileName}`);
    return false;
  }
  
  let changed = false;
  
  // Add import
  const importResult = addImport(content);
  content = importResult.content;
  changed = importResult.changed;
  
  // Replace the block
  const replaceResult = replaceHasBox(content, fileName);
  if (replaceResult.changed) {
    content = replaceResult.content;
    changed = true;
  } else {
    console.log(`  ⚠️  Could not find temuan/rekomendasi block to replace in: ${fileName}`);
    // Still save with just the import
  }
  
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`  ✅ ${fileName} ${replaceResult.changed ? '(import + block replaced)' : '(import only)'}`);
    return true;
  }
  
  return false;
}

// Process all forms
const allForms = [...forms.hasBox, ...forms.hasGrid];
let successCount = 0;
let failCount = 0;

console.log('=== Integrating TemuanRekomendasiSection ===\n');
for (const fileName of allForms) {
  const result = processFile(fileName, forms.hasBox.includes(fileName) ? 'hasBox' : 'hasGrid');
  if (result) successCount++;
  else failCount++;
}

console.log(`\n=== Done: ${successCount} updated, ${failCount} skipped/failed ===`);
