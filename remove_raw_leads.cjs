const fs = require('fs');

let code = fs.readFileSync('src/components/Layout.jsx', 'utf8');

const targetStr = `      { 
        path: '/raw-leads', 
        label: 'Raw Leads', 
        icon: <HiOutlineDocumentText size={24} />,
        submenu: [
          { path: '/raw-leads', label: 'Raw Leads' },
          { path: '/called-leads', label: 'Called Leads' }
        ]
      },`;

// Replace first occurrence (loan_employee)
code = code.replace(targetStr, '');

// Replace second occurrence (loan_admin)
code = code.replace(targetStr, '');

fs.writeFileSync('src/components/Layout.jsx', code);
console.log('Replaced');
