const fs = require('fs');

let code = fs.readFileSync('src/components/Layout.jsx', 'utf8');

// Replace all occurrences of the Raw Leads submenu
code = code.replace(/\s*\{\s*path: '\/raw-leads',[\s\S]*?\{\s*path: '\/called-leads', label: 'Called Leads'\s*\}\s*\]\s*\},/g, '');

fs.writeFileSync('src/components/Layout.jsx', code);
console.log('Replaced');
