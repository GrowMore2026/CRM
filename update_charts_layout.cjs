const fs = require('fs');

let code = fs.readFileSync('src/pages/AdminDashboard.jsx', 'utf8');

// The goal is to move the grid container wrapper so it only wraps Client Summary and User Breakdown
// Currently we have:
//       {/* ── Charts Grid ── */}
//       {readOnly && (
//         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
// {/* ── Revenue Overview Chart ── */}
//       {readOnly && (

// We will change it to:
//       {/* ── Charts Grid ── */}
//       {readOnly && (
//         <>
// {/* ── Revenue Overview Chart ── */}
//         <div className="card mb-4"... 
// (we remove the duplicate {readOnly && ( )

const oldGridStart = `      {/* ── Charts Grid ── */}
      {readOnly && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
{/* ── Revenue Overview Chart ── */}
      {readOnly && (`;

const newGridStart = `      {/* ── Charts Grid ── */}
      {readOnly && (
        <>
{/* ── Revenue Overview Chart ── */}
        `;
code = code.replace(oldGridStart, newGridStart);


// After Revenue Overview, there is `)}` from the duplicate readOnly block, then `{/* ── Client Summary Donut ── */}`
// It looks like:
//               </AreaChart>
//             </ResponsiveContainer>
//           </div>
//         </div>
//       )}
// 
//           {/* ── Client Summary Donut ── */}
//           <div className="card"  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '1.25rem', padding: '2rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column', maxWidth: '400px' }}>

// We change it to close the revenue block, start the grid block:
//               </AreaChart>
//             </ResponsiveContainer>
//           </div>
//         </div>
//
//         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
//           {/* ── Client Summary Donut ── */}
//           <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '1.25rem', padding: '2rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column' }}>
// (also removing maxWidth: '400px' so it takes full column width in the 2-col layout)

code = code.replace(
  /<\/div>\s*<\/div>\s*\)\}\s*\{\/\* ── Client Summary Donut ── \*\/\}\s*<div className="card"  style=\{\{ background: 'var\(--bg-secondary\)', border: '1px solid var\(--border-color\)', borderRadius: '1\.25rem', padding: '2rem', boxShadow: '0 4px 6px -1px rgba\(0, 0, 0, 0\.05\)', display: 'flex', flexDirection: 'column', maxWidth: '400px' \}\}>/,
  `          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
          {/* ── Client Summary Donut ── */}
          <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '1.25rem', padding: '2rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column' }}>`
);


// Before User Breakdown Chart we have:
//           {/* ── User Breakdown Chart ── */}
//           {readOnly && (
//             <div className="card" ...
// We remove the inner {readOnly && (
code = code.replace(
  /\{\/\* ── User Breakdown Chart ── \*\/\}\s*\{readOnly && \(\s*<div className="card"/,
  `{/* ── User Breakdown Chart ── */}
          <div className="card"`
);

// After User Breakdown Chart we have:
//                   </BarChart>
//                 </ResponsiveContainer>
//               </div>
//             </div>
//           )}
//         </div>
//       )}
//
//       {/* ── 5-Stage Pipeline Board ── */}
// We need to remove the inner `)}` we just took out the `{readOnly && (` for.
// We should have `</div>` closing the User Breakdown card, then `</div>` closing the grid, then `</>` closing the fragment, then `)}` closing the outer readOnly.
code = code.replace(
  /<\/div>\s*<\/div>\s*\)\}\s*<\/div>\s*\)\}\s*\{\/\* ── 5-Stage Pipeline Board ── \*\/\}/,
  `              </div>
            </div>
        </div>
      </>
      )}

      {/* ── 5-Stage Pipeline Board ── */}`
);

fs.writeFileSync('src/pages/AdminDashboard.jsx', code);
console.log('Layout updated');
