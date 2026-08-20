const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'pages', 'AdminDashboard.jsx');
let content = fs.readFileSync(file, 'utf8');

// Replace table inline styles with class
content = content.replace(/<table style=\{\{ width: '100%', borderCollapse: 'collapse', fontSize: '0\.85rem' \}\}>/g, '<table className="table">');
content = content.replace(/<table style=\{\{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0\.85rem' \}\}>/g, '<table className="table">');

// Remove tr styles that override global hover
content = content.replace(/<tr([^>]*)style=\{\{[^}]*borderBottom[^}]*\}\}/g, '<tr$1');
content = content.replace(/className="table-row-hover"/g, '');

// Clean up any empty style={{}} or stray classNames left over from replacements
content = content.replace(/style=\{\{\s*\}\}/g, '');
content = content.replace(/className=""/g, '');

fs.writeFileSync(file, content);
console.log('Tables refactored successfully.');
