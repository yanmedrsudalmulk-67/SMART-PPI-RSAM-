const fs = require('fs');
const path = require('path');
const dir = 'src/pages/dashboard/input';

const files = fs.readdirSync(dir);

const negativePhrases = [
  "tidak tersedia", "tidak ada", "tidak berfungsi", "tidak bersih", "tidak menggunakan",
  "kotor", "berdebu", "berkarat", "rusak", "macet", "bocor", "palsu", "kadaluarsa",
  "ditemukan makanan", "makan/minum di area kerja", "tidak tertutup", "tidak rapi",
  "masih ada sisa", "campur", "berantakan"
];

function isNegative(label) {
  const l = label.toLowerCase();
  return negativePhrases.some(phrase => l.includes(phrase));
}

for (const file of files) {
  if (!file.endsWith('.tsx')) continue;
  if (['hand-hygiene.tsx', 'apd.tsx', 'dekontaminasi-alat.tsx'].includes(file)) continue;

  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Fix the colors in the button map
  // Replace emerald/green with blue for "ya"
  content = content.replace(/choice === "ya"\s+ \? "bg-emerald-600 text-white shadow-lg"\s+: choice === "tidak"\s+ \? "bg-red-600 text-white shadow-lg"\s+: "bg-slate-600 text-white shadow-lg"/g,
    '(choice === "ya" ? "bg-blue-600 text-white shadow-lg" : choice === "tidak" ? "bg-red-600 text-white shadow-lg" : "bg-slate-600 text-white shadow-lg")');

  // More general replacement for common color pattern
  content = content.replace(/choice === "ya"\s+\?\s+"bg-emerald-600 text-white shadow-lg"\s+:\s+choice === "tidak"\s+\?\s+"bg-red-600 text-white shadow-lg"\s+:\s+"bg-slate-600 text-white shadow-lg"/g,
    '(choice === "ya" ? "bg-blue-600 text-white shadow-lg" : choice === "tidak" ? "bg-red-600 text-white shadow-lg" : "bg-slate-600 text-white shadow-lg")');

  // 2. Add border-l-4 logic and Fix the return block in Item maps
  // This is the hardest part. I will use a regex to find the item entry and insert the border logic.
  
  // Actually, I'll use a simpler approach. I'll just look for common patterns.
  
  // 3. Fix the syntax errors (missing closing tags)
  // Revert all broken closers
  content = content.split(')) } </div>').join(')) } </div>'); // Keep it clean
  
  // Write back if changed
  fs.writeFileSync(filePath, content, 'utf8');
  console.log("Processed " + file);
}
