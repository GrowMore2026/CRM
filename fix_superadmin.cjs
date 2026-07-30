const fs = require('fs');
let code = fs.readFileSync('src/components/Layout.jsx', 'utf8');

const replacement = `      { path: '/holidays', label: 'Holiday List', icon: <HiOutlineCalendarDays size={24} /> },
      { 
        path: '/raw-leads', 
        label: 'Raw Leads', 
        icon: <HiOutlineDocumentText size={24} />,
        submenu: [
          { path: '/raw-leads', label: 'Raw Leads' },
          { path: '/called-leads', label: 'Called Leads' }
        ]
      },
      { 
        path: '/loan-raw-leads', 
        label: 'Loan Raw Leads', `;

// Find the last index of holidays (which is in superadmin)
const target = `      { path: '/holidays', label: 'Holiday List', icon: <HiOutlineCalendarDays size={24} /> },
      { 
        path: '/loan-raw-leads', 
        label: 'Loan Raw Leads', `;

const lastIndex = code.lastIndexOf(target);
if (lastIndex !== -1) {
  code = code.substring(0, lastIndex) + replacement + code.substring(lastIndex + target.length);
  fs.writeFileSync('src/components/Layout.jsx', code);
  console.log('Fixed superadmin');
} else {
  // Let's try replacing line by line
  const lines = code.split('\n');
  const superadminStart = lines.findIndex(l => l.includes('superadmin: ['));
  if (superadminStart !== -1) {
    const loanRawLeadsIdx = lines.findIndex((l, i) => i > superadminStart && l.includes('path: \'/loan-raw-leads\''));
    if (loanRawLeadsIdx !== -1) {
      lines.splice(loanRawLeadsIdx - 1, 0, 
        `      { `,
        `        path: '/raw-leads', `,
        `        label: 'Raw Leads', `,
        `        icon: <HiOutlineDocumentText size={24} />,`,
        `        submenu: [`,
        `          { path: '/raw-leads', label: 'Raw Leads' },`,
        `          { path: '/called-leads', label: 'Called Leads' }`,
        `        ]`,
        `      },`
      );
      fs.writeFileSync('src/components/Layout.jsx', lines.join('\n'));
      console.log('Fixed using array splice');
    }
  }
}
