const fs = require('fs');
const path = require('path');
const dir = 'src/pages/dashboard/input';

const files = fs.readdirSync(dir);
for (const file of files) {
  if (!file.endsWith('.tsx')) continue;
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  let replaced = content;
  
  // Fix the map endings
  // 1. Indentation 305 for ambulance select
  replaced = replaced.split('                    })}').join('                  )})}');
  replaced = replaced.split('                })}').join('              )})}');
  replaced = replaced.split('              })}').join('            )})}');
  
  // 2. Fix the motion.div map in management sections
  replaced = replaced.split('                </motion.div>\n                  ))}\n                </AnimatePresence>').join('                </motion.div>\n              ))}\n            </AnimatePresence>');

  // 3. Fix the template literals I broke in hand-hygiene and dekontaminasi
  replaced = replaced.split('\\`').join('`');
  replaced = replaced.split('\\${').join('${');

  if (content !== replaced) {
       fs.writeFileSync(filePath, replaced, 'utf8');
       console.log("Improved fix in " + file);
  }
}
