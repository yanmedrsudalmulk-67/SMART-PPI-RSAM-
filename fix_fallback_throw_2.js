const fs = require('fs');
const glob = require('glob');

const files = glob.sync('app/dashboard/input/**/page.tsx');

files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  let changed = false;

  // Match:
  // if (error) { console.warn(...) }
  // ;
  // if (error) throw error;
  // or variations like:
  // if (error) { console.error(...); throw error; }

  // Clean out any throw error; immediately following the fallback warn block.
  
  // Find index of fallback comment.
  const fallbackComment = "// Jika terjadi error pada table lama";
  let idx = c.indexOf(fallbackComment);
  while (idx !== -1) {
    // find the end of the block...
    const endOfWarn = c.indexOf('}', idx);
    if (endOfWarn !== -1) {
      // look ahead for `if (error) throw error;` or `if (error) { ... throw error; ... }`
      const nextCatch = c.indexOf('if (error)', endOfWarn);
      if (nextCatch !== -1 && nextCatch - endOfWarn < 50) {
        // It's close by! Let's just comment out `throw error;` where we see it, or replace the block.
        // Let's replace the whole `if (error)` block that contains throw error.
        
        // Let's extract from endOfWarn to end of the whole throw error block.
        const throwMatch = c.substring(endOfWarn, endOfWarn + 200).match(/if\s*\(error\)\s*(?:\{[^}]*throw\s*error;[^}]*\}|throw\s*error;)/s);
        if (throwMatch) {
            c = c.slice(0, endOfWarn + throwMatch.index) + c.slice(endOfWarn + throwMatch.index + throwMatch[0].length);
            changed = true;
        }
      }
    }
    idx = c.indexOf(fallbackComment, idx + 1);
  }

  if (changed) {
    fs.writeFileSync(f, c);
    console.log('Fixed throw on fallback in', f);
  }
});
