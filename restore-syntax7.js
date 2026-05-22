const fs = require('fs');
const path = require('path');
const dirs = ['src/pages/dashboard/input'];

for (const dir of dirs) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (!file.endsWith('.tsx')) continue;
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    let replaced = content;
    
    // Find how the map starts
    const mapMatch = /(checklistItems|auditItems)\.map\([^=>]+=>\s*([{(])/g.exec(content);
    if (mapMatch) {
        const expectedClosing = mapMatch[2] === '{' ? '})}' : '))}';
        // Now find the place where it closes. It's usually preceding `<div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm">` for the next section, or `<LiveStatisticsCard`
        // Or immediately after the inner `</div>`s
        
        replaced = replaced.replace(/<\/div>\s*<\/div>\s*[})\]\s]+\s*<\/div>\s*<\/div>\s*<LiveStatisticsCard/g, "</div>\n                </div>\n              " + expectedClosing + "\n          </div>\n        </div>\n\n        <LiveStatisticsCard");
        
        replaced = replaced.replace(/<\/div>\s*<\/div>\s*[})\]\s]+\s*<\/div>\s*<\/div>\s*<(div|Live)/g, "</div>\n                </div>\n              " + expectedClosing + "\n          </div>\n        </div>\n\n        <$1");
    }

    if (content !== replaced) {
       fs.writeFileSync(filePath, replaced, 'utf8');
       console.log("Fixed " + file);
    }
  }
}
