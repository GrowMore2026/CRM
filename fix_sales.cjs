const fs = require('fs');
let code = fs.readFileSync('src/components/Layout.jsx', 'utf8');

const lines = code.split('\n');
const salesStart = lines.findIndex(l => l.includes('sales: ['));
if (salesStart !== -1) {
  const holidaysIdx = lines.findIndex((l, i) => i > salesStart && l.includes('path: \'/holidays\''));
  if (holidaysIdx !== -1 && holidaysIdx < salesStart + 20) {
    lines.splice(holidaysIdx + 1, 0, 
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
    console.log('Fixed sales array');
  } else {
    console.log('Could not find holidays inside sales array');
  }
} else {
  console.log('Could not find sales array');
}
