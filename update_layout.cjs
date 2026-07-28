const fs = require('fs');

// 1. Update Layout.jsx to render the modal globally
let layout = fs.readFileSync('src/components/Layout.jsx', 'utf8');
if (!layout.includes('ClientDetailsModal')) {
    layout = layout.replace(
        /import \{ useApp \} from '\.\.\/context\/AppProvider';/,
        "import { useApp } from '../context/AppProvider';\nimport ClientDetailsModal from './ClientDetailsModal';"
    );
    layout = layout.replace(
        /const \{ currentUser, users \} = useApp\(\);/,
        "const { currentUser, users, selectedClient, setSelectedClient } = useApp();"
    );
    layout = layout.replace(
        /<\/div>\s*<\/div>\s*\)\s*;\s*\}/,
        "    {selectedClient && <ClientDetailsModal client={selectedClient} onClose={() => setSelectedClient(null)} />}\n      </div>\n    </div>\n  );\n}"
    );
    fs.writeFileSync('src/components/Layout.jsx', layout);
    console.log('Layout updated');
}

// 2. Remove local selectedClient from all dashboards and components
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
     // Remove local state
     code = code.replace(/const \[selectedClient, setSelectedClient\] = useState\(null\);\s*/g, '');
     
     // Remove imports of ClientDetailsModal from dashboards
     code = code.replace(/import ClientDetailsModal from '\.\.\/components\/ClientDetailsModal';\s*/g, '');
     
     // Remove the local render of ClientDetailsModal
     code = code.replace(/\{selectedClient && <ClientDetailsModal client=\{selectedClient\} onClose=\{\(\) => setSelectedClient\(null\)\} \/>\}\s*/g, '');
     
     // Make sure setSelectedClient is pulled from useApp() if it is not already
     // Usually it's `const { currentUser, ... } = useApp();`
     if (code.includes('useApp();') && code.includes('setSelectedClient(')) {
        if (!code.includes('setSelectedClient,')) {
           // We just inject it at the beginning of the destructuring
           code = code.replace(/const \{ /g, "const { setSelectedClient, ");
        }
     }
     
     fs.writeFileSync(f, code);
  }
});
console.log('Pages cleaned up');
