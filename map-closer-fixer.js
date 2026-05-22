const fs = require('fs');
const path = require('path');
const dir = 'src/pages/dashboard/input';

const files = fs.readdirSync(dir);
for (const file of files) {
  if (!file.endsWith('.tsx')) continue;
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  let replaced = content;
  
  // Fix the specific maps that use ( instead of {
  // We can detect this by looking for map((...) => (
  // But a simpler way is to just target the broken lines in the linter output
  
  replaced = replaced.split('})} </select>').join('))}</select>');
  replaced = replaced.split('})}">').join('))}">');
  replaced = replaced.split('}) } <button').join(')) } <button');
  replaced = replaced.split('})}{" "}').join(')) }{" "}');
  replaced = replaced.split('})} </div>').join(')) } </div>');
  replaced = replaced.split('})} </form>').join(')) }</form>');
  
  // Hand hygiene specific
  if (file === 'hand-hygiene.tsx') {
      replaced = replaced.split('})}').join(')) }');
  }

  if (content !== replaced) {
       fs.writeFileSync(filePath, replaced, 'utf8');
       console.log("Map Closer Fixer in " + file);
  }
}
