const fs = require('fs');
const glob = require('glob');

const files = glob.sync('./app/dashboard/input/**/*.tsx');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  let originalContent = content;

  // We are going to replace any line that has nama_pj_ruangan: <something> or nama_pj: <something>
  // BUT only inside the `sessionPayload`, `insert([...])` where it causes issues...
  // Since we also want these IN `data_indikator: { ... }`, we have to be careful.
  // We can just use replace with regex, BUT ensuring we don't mess up `data_indikator: { ..., nama_pj_ruangan: ... }` which is usually on the same line.
  
  // The ones causing issues are on their own lines. Like:
  //         nama_pj_ruangan: pjName,
  //         nama_pj: pjName.trim(),
  // So: newline, spaces, nama_pj[_ruangan]: ...,
  
  content = content.replace(/^[ \t]*nama_pj_ruangan\s*:\s*([^,\n]*),\s*$/gm, (match) => {
	// Let's print out what we found
	console.log(`Found in ${file}: ${match}`);
	return ''; // replace with empty
  });

  content = content.replace(/^[ \t]*nama_pj\s*:\s*([^,\n]*),\s*$/gm, (match) => {
	console.log(`Found in ${file}: ${match}`);
	return ''; // replace with empty
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
