const fs = require('fs');
let code = fs.readFileSync('src/context/AppProvider.jsx', 'utf8');
if (!code.includes('selectedClient')) {
    code = code.replace(
        /const \[clients, setClients\] = useState\(initialClients\);/,
        "const [clients, setClients] = useState(initialClients);\n  const [selectedClient, setSelectedClient] = useState(null);"
    );
    code = code.replace(
        /updateClientDetails,/,
        "updateClientDetails,\n      selectedClient,\n      setSelectedClient,"
    );
    fs.writeFileSync('src/context/AppProvider.jsx', code);
    console.log('AppProvider updated');
} else {
    console.log('AppProvider already has selectedClient');
}
