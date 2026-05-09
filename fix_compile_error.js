const fs = require('fs');
const glob = require('glob');

const files = glob.sync('./app/dashboard/input/**/*.tsx');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  let hasPjName = content.includes('const [pjName') || content.includes('function') && content.match(/\bpjName\b/);
  let hasNamaPj = content.includes('const [namaPj') || content.includes('function') && content.match(/\bnamaPj\b/);
  
  // if both are somehow present, pjName is usually the one, or whichever.
  // Actually, I can just use regex to replace the complex ternary with the actual variable.
  
  let varName = 'null';
  if (hasPjName) varName = 'pjName';
  else if (hasNamaPj) varName = 'namaPj';
  
  content = content.replace(/\(typeof pjName !== 'undefined' \? pjName : \(typeof namaPj !== 'undefined' \? namaPj : null\)\)/g, 
    varName
  );

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file} with ${varName}`);
  }
});
