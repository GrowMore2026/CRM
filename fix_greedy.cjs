const fs = require('fs');
const pages = [
  'src/pages/AdminDashboard.jsx',
  'src/pages/AccountantDashboard.jsx',
  'src/pages/DigitalMarketingDashboard.jsx',
  'src/pages/SalesDashboard.jsx',
  'src/components/AllClientsAdmin.jsx',
  'src/components/AllTasksAdmin.jsx'
];

pages.forEach(f => {
  if (fs.existsSync(f)) {
     let code = fs.readFileSync(f, 'utf8');
     // Revert the greedy replace
     code = code.replace(/const \{ setSelectedClient, /g, 'const { ');
     
     // Remove any existing `setSelectedClient` from useApp destructuring just in case it got messed up
     code = code.replace(/, setSelectedClient \} = useApp\(\);/g, '} = useApp();');
     
     // Now only replace `} = useApp()` with `, setSelectedClient } = useApp()` if it has `useApp()`
     code = code.replace(/\} = useApp\(\);/g, ', setSelectedClient } = useApp();');
     
     // But wait, there might be duplicate `, setSelectedClient, setSelectedClient` if it was already there. 
     // Let's just do a clean replace:
     code = code.replace(/, setSelectedClient, setSelectedClient \} = useApp\(\);/g, ', setSelectedClient } = useApp();');
     
     fs.writeFileSync(f, code);
  }
});
console.log('Fixed greedy replacement');
