const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.jsx', 'utf8');

const dailyStartIdx = code.indexOf('{/* ── Daily Payment Chart ── */}');
const endFragIdx = code.indexOf('</>', dailyStartIdx);

let dailyBlock = code.substring(dailyStartIdx, endFragIdx);
code = code.substring(0, dailyStartIdx) + '\n      ' + code.substring(endFragIdx);

const revenueStartIdx = code.indexOf('{/* ── Revenue Overview Chart ── */}');
const nextGridIdx = code.indexOf('<div style={{ display: \'grid\', gridTemplateColumns: \'repeat(auto-fit, minmax(350px, 1fr))\'', revenueStartIdx);

let revenueBlock = code.substring(revenueStartIdx, nextGridIdx);

const newGrid = `        {/* ROW 1: Revenue and Daily Payments */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
          ${revenueBlock.replace(/className="card mb-4"/, 'className="card"').trimEnd()}
          
          ${dailyBlock.replace(/className="card mb-4"/, 'className="card"').trimEnd()}
        </div>
`;

code = code.substring(0, revenueStartIdx) + newGrid + '\n        ' + code.substring(nextGridIdx);

fs.writeFileSync('src/pages/AdminDashboard.jsx', code);
console.log('Reordered successfully.');
