const fs = require('fs');
const glob = require('glob');

const files = glob.sync('app/dashboard/input/**/*.tsx');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // 1. type="button" for all modal buttons
  content = content.replace(/<button([^>]*?)onClick=\{\(\) => setIsObserverModalOpen\(false\)\}([^>]*?)>/g, (match, p1, p2) => {
    if (match.includes('type="button"')) return match;
    return `<button type="button"${p1}onClick={() => setIsObserverModalOpen(false)}${p2}>`;
  });
  
  content = content.replace(/<button([^>]*?)onClick=\{\(\) => setShowObserverModal\(false\)\}([^>]*?)>/g, (match, p1, p2) => {
    if (match.includes('type="button"')) return match;
    return `<button type="button"${p1}onClick={() => setShowObserverModal(false)}${p2}>`;
  });
  
  content = content.replace(/<button([^>]*?)onClick=\{\(\) => \{\s*setIsObserverModalOpen\(false\);(.*?)\}\}([^>]*?)>/g, (match, p1, p2, p3) => {
    if (match.includes('type="button"')) return match;
    return `<button type="button"${p1}onClick={() => { setIsObserverModalOpen(false);${p2}}}${p3}>`;
  });

  content = content.replace(/<button([^>]*?)onClick=\{\(\) => \{\s*setShowObserverModal\(false\);(.*?)\}\}([^>]*?)>/g, (match, p1, p2, p3) => {
    if (match.includes('type="button"')) return match;
    return `<button type="button"${p1}onClick={() => { setShowObserverModal(false);${p2}}}${p3}>`;
  });

  content = content.replace(/<button([^>]*?)onClick=\{saveObserver\}([^>]*?)>/g, (match, p1, p2) => {
    if (match.includes('type="button"')) return match;
    return `<button type="button"${p1}onClick={saveObserver}${p2}>`;
  });

  content = content.replace(/<button([^>]*?)onClick=\{\(\) => deleteObserver\((.*?)\)\}([^>]*?)>/g, (match, p1, p2, p3) => {
    if (match.includes('type="button"')) return match;
    return `<button type="button"${p1}onClick={() => deleteObserver(${p2})}${p3}>`;
  });

  content = content.replace(/<button([^>]*?)onClick=\{\(\) => \{\s*setNewObserverName\((.*?)\);\s*setEditObserverId\((.*?)\);\s*\}\}([^>]*?)>/g, (match, p1, p2, p3, p4) => {
    if (match.includes('type="button"')) return match;
    return `<button type="button"${p1}onClick={() => { setNewObserverName(${p2}); setEditObserverId(${p3}); }}${p4}>`;
  });
  
  content = content.replace(/<button([^>]*?)onClick=\{\(\) => \{\s*setEditObserverId\((.*?)\);\s*setNewObserverName\((.*?)\);\s*\}\}([^>]*?)>/g, (match, p1, p2, p3, p4) => {
    if (match.includes('type="button"')) return match;
    return `<button type="button"${p1}onClick={() => { setEditObserverId(${p2}); setNewObserverName(${p3}); }}${p4}>`;
  });

  // onKeyDown prevent default
  content = content.replace(/onKeyDown=\{\(e\) => e\.key === 'Enter' && saveObserver\(\)\}/g, "onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); saveObserver(); } }}");
  content = content.replace(/onKeyDown=\{\(e\) => \{\s*if\s*\(\s*e\.key === 'Enter'\s*\)\s*saveObserver\(\);\s*\}\}/g, "onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); saveObserver(); } }}");
  // Some files have: onKeyDown={(e) => { if(e.key === 'Enter') saveObserver(); }} without spaces inside if
  content = content.replace(/onKeyDown=\{\(e\) => \{\s*if\(e\.key === 'Enter'\)\s*saveObserver\(\);\s*\}\}/g, "onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); saveObserver(); } }}");

  // Remove `if (!confirm('Hapus observer ini?')) return;`
  // We replace it instead with window.confirm safely or remove it entirely
  const confirmRegex = /if \(!confirm\('Hapus observer ini\?'\)\) return;/g;
  content = content.replace(confirmRegex, `// confirm bypass
    if (typeof window !== 'undefined' && window.confirm) {
        if (!window.confirm('Hapus observer ini?')) return;
    }
  `);

  // Update observer generic logic
  // if (editObserverId) {
  //   if (!editObserverId.startsWith('local-')) {
  // We use string replacement to inject logic
  let search1 = `if (editObserverId) {
        if (!editObserverId.startsWith('local-')) {`;
  let replace1 = `if (editObserverId) {
        const oldObserver = observers.find(o => o.id === editObserverId);
        if (oldObserver && (typeof observer !== 'undefined' && observer === oldObserver.nama)) {
          setObserver(newObserverName);
        }
        if (!editObserverId.startsWith('local-')) {`;
  
  if (content.includes(search1)) {
    content = content.replace(search1, replace1);
  } else {
    // try removing spacing
    content = content.replace(/if \(editObserverId\) \{\s*if \(\!editObserverId\.startsWith\('local-'\)\) \{/g, replace1);
  }

  // fallback catch
  let search2 = `if (editObserverId) {
        setObservers(prev => prev.map(o => o.id === editObserverId`;
  let replace2 = `if (editObserverId) {
        const oldObserver = observers.find(o => o.id === editObserverId);
        if (oldObserver && (typeof observer !== 'undefined' && observer === oldObserver.nama)) {
          setObserver(newObserverName);
        }
        setObservers(prev => prev.map(o => o.id === editObserverId`;
  
  if (content.includes(search2)) {
    content = content.replace(search2, replace2);
  } else {
    content = content.replace(/if \(editObserverId\) \{\s*setObservers\(prev => prev\.map\(o => o\.id === editObserverId/g, replace2);
  }

  if (original !== content) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed ' + file);
  }
});
