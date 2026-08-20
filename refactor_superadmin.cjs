const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'pages', 'AdminDashboard.jsx');
let content = fs.readFileSync(file, 'utf8');

// Replace standard cards with bento cards for the metrics & charts
// First, the main flex grid layouts
content = content.replace(/<div style=\{\{ display: 'grid', gridTemplateColumns: 'repeat\(auto-fit, minmax\((\d+px), 1fr\)\)', gap: '1\.5rem', marginBottom: '1\.5rem' \}\}>/g, 
  '<div className="bento-grid" style={{ gridTemplateColumns: \'repeat(auto-fit, minmax($1, 1fr))\' }}>');

content = content.replace(/<div style=\{\{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '1\.5rem', marginBottom: '1\.5rem' \}\}>/g,
  '<div className="bento-grid" style={{ gridTemplateColumns: \'1fr 1fr 2fr\' }}>');

content = content.replace(/<div style=\{\{ display: 'grid', gridTemplateColumns: '1\.5fr 1fr 1fr', gap: '1\.5rem', marginBottom: '2rem' \}\}>/g,
  '<div className="bento-grid" style={{ gridTemplateColumns: \'1.5fr 1fr 1fr\', marginBottom: \'2rem\' }}>');

content = content.replace(/<div style=\{\{ display: 'grid', gridTemplateColumns: '1\.5fr 1fr', gap: '1\.5rem', marginBottom: '2rem' \}\}>/g,
  '<div className="bento-grid" style={{ gridTemplateColumns: \'1.5fr 1fr\', marginBottom: \'2rem\' }}>');

// Replace card classes that have hardcoded inline styles for charts/tables with bento-card
content = content.replace(/className="card" style=\{\{ padding: '1\.5rem', background: 'var\(--bg-secondary\)', borderRadius: '1\.25rem', border: '1px solid var\(--border-color\)', boxShadow: 'var\(--shadow-sm\)'(?:, minWidth: 0)? \}\}/g, 'className="bento-card" style={{ minWidth: 0 }}');

content = content.replace(/className="card" style=\{\{ padding: '2rem', background: 'var\(--bg-secondary\)', borderRadius: '1\.5rem', border: '1px solid var\(--border-color\)', boxShadow: 'var\(--shadow-sm\)'(?:, overflow: 'hidden')? \}\}/g, 'className="bento-card"');

content = content.replace(/className="card" style=\{\{ padding: '1\.5rem', background: 'var\(--bg-secondary\)', border: '1px solid var\(--border-color\)', borderRadius: 'var\(--radius-xl\)', marginBottom: '2rem'(?:, marginTop: '1\.5rem')? \}\}/g, 'className="bento-card" style={{ marginBottom: \'2rem\' }}');

content = content.replace(/className="card" style=\{\{ background: 'var\(--bg-secondary\)', border: '1px solid var\(--border-color\)', borderRadius: '1\.25rem', padding: '2rem', boxShadow: '0 4px 6px -1px rgba\(0, 0, 0, 0\.05\)', display: 'flex', flexDirection: 'column', minWidth: 0 \}\}/g, 'className="bento-card" style={{ display: \'flex\', flexDirection: \'column\', minWidth: 0 }}');

content = content.replace(/className="card" style=\{\{ padding: '1\.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'var\(--bg-secondary\)', border: '1px solid var\(--border-color\)', borderRadius: '12px' \}\}/g, 'className="bento-card" style={{ padding: \'1.5rem\', display: \'flex\', alignItems: \'center\', gap: \'1rem\' }}');

// Save the file
fs.writeFileSync(file, content);
console.log('Refactor script executed successfully.');
