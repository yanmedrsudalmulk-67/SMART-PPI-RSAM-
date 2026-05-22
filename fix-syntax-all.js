const fs = require('fs');
const path = require('path');
const dir = 'src/pages/dashboard/input';

const files = fs.readdirSync(dir);
for (const file of files) {
  if (!file.endsWith('.tsx')) continue;
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  let replaced = content;
  
  // Fix the => ({ { mistake
  replaced = replaced.replace(/=>\s*\(\s*{\s*const selected/g, "=> { const selected");
  
  // Fix the end if it has an extra )
  // If we changed (args) => ( ... ) to (args) => { const ... return ( ... ) }
  // Then the end should be ) ) }
  
  // The current updated files have:
  // </div>
  //               )
  //             })}
  
  // But wait, if they start with `=> {`, they should end with `})}`.
  
  if (content !== replaced) {
       fs.writeFileSync(filePath, replaced, 'utf8');
       console.log("Fixed syntax in " + file);
  }
}
