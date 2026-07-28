const fs = require('fs');

function modifyFile(file) {
  let code = fs.readFileSync(file, 'utf8');

  // Add import
  if (!code.includes('ClientDetailsModal')) {
    code = code.replace(
      /import \{.*\} from 'lucide-react';/g,
      match => match + "\nimport ClientDetailsModal from '../components/ClientDetailsModal';"
    );
  }

  // Add state
  if (!code.includes('selectedClient')) {
    if (code.includes('const [editingClient')) {
       code = code.replace(
         /const \[editingClient.*?;/g,
         match => match + "\n  const [selectedClient, setSelectedClient] = useState(null);"
       );
    } else {
       // fallback for others
       code = code.replace(
         /const \{ currentUser /g,
         "const [selectedClient, setSelectedClient] = useState(null);\n  const { currentUser "
       );
    }
  }

  // Render modal
  if (!code.includes('<ClientDetailsModal')) {
     code = code.replace(
       /<\/div>\s*<\/div>\s*\)\s*;\s*}\s*export default/m,
       match => `  {selectedClient && <ClientDetailsModal client={selectedClient} onClose={() => setSelectedClient(null)} />}\n` + match
     );
  }
  
  // To handle the clicks, we add onClick to the card wrapper
  // We'll replace the `<div key={c.id} style={{` with `<div key={c.id} onClick={() => !isEdit && setSelectedClient(c)} style={{ cursor: 'pointer', ...`
  // Wait, `isEdit` might not be defined in all dashboards.
  if (code.includes('const isEdit =')) {
     code = code.replace(
       /<div key=\{c.id\} style=\{\{/g,
       "<div key={c.id} onClick={() => !isEdit && setSelectedClient(c)} style={{ cursor: 'pointer',"
     );
  } else {
     code = code.replace(
       /<div key=\{c.id\} style=\{\{/g,
       "<div key={c.id} onClick={() => setSelectedClient(c)} style={{ cursor: 'pointer',"
     );
  }

  fs.writeFileSync(file, code);
}

modifyFile('src/pages/SalesDashboard.jsx');
modifyFile('src/pages/AdminDashboard.jsx');
modifyFile('src/pages/AccountantDashboard.jsx');
modifyFile('src/pages/DigitalMarketingDashboard.jsx');
console.log('Setup complete');
