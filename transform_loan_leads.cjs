const fs = require('fs');
let code = fs.readFileSync('src/pages/LoanRawLeads.jsx', 'utf8');

// Replace standard variables with loan variables
code = code.replace(/RawLeads/g, 'LoanRawLeads');
code = code.replace(/rawLeads/g, 'loanRawLeads');
code = code.replace(/rawLead/g, 'loanRawLead');
code = code.replace(/Raw Leads/g, 'Loan Raw Leads');
code = code.replace(/campaigns/g, 'loanCampaigns');
code = code.replace(/campaign/g, 'loanCampaign');
code = code.replace(/Campaigns/g, 'LoanCampaigns');
code = code.replace(/addCampaign/g, 'addLoanCampaign');
code = code.replace(/updateCampaign/g, 'updateLoanCampaign');
code = code.replace(/deleteCampaign/g, 'deleteLoanCampaign');
code = code.replace(/addRawLeads/g, 'addLoanRawLeads');
code = code.replace(/claimNextRawLead/g, 'claimNextLoanRawLead');
code = code.replace(/submitRawLeadStatus/g, 'submitLoanRawLeadStatus');

// Update Role Checks
code = code.replace(/isSuperAdmin/g, 'isLoanAdmin');
code = code.replace(/currentUser\?\.role === 'superadmin'/g, "currentUser?.role === 'loan_admin'");
code = code.replace(/isSales/g, 'isLoanEmployee');
code = code.replace(/currentUser\?\.role === 'sales'/g, "currentUser?.role === 'loan_employee'");
code = code.replace(/isDigitalMarketing/g, 'isDigitalMarketing'); // doesn't matter, unused here mostly

// Fix up variables
code = code.replace(/const { currentUser, loanRawLeads, users, loanCampaigns, addLoanRawLeads, addLoanCampaign, updateLoanCampaign, deleteLoanCampaign, claimNextLoanRawLead, submitLoanRawLeadStatus } = useApp\(\);/g, 
  "const { currentUser, loanRawLeads, users, loanCampaigns, addLoanRawLeads, addLoanCampaign, updateLoanCampaign, deleteLoanCampaign, claimNextLoanRawLead, submitLoanRawLeadStatus } = useApp();");

// Replace CSV mapping
code = code.replace(/company_name: row\.company_name \|\| row\.Company \|\| '',[\s\S]*?incorporation_date: row\.incorporation_date \|\| row\.\['Inc\. Date'\] \|\| null,/g, 
`first_name: row.first_name || row['First Name'] || '',
          last_name: row.last_name || row['Last Name'] || '',
          number: row.number || row['Number'] || '',
          payment_date: row.payment_date || row['PAYMENT DATE'] || null,
          amount: parseFloat(row.amount || row['AMOUNT']) || 0,
          payment_mode: row.payment_mode || row['PAYMENT MODE'] || '',`);

// Replace table headers
code = code.replace(/<th style={{ padding: '1rem', color: 'var\(--text-muted\)' }}>Company<\/th>[\s\S]*?<th style={{ padding: '1rem', color: 'var\(--text-muted\)' }}>Inc\. Date<\/th>/g, 
`<th style={{ padding: '1rem', color: 'var(--text-muted)' }}>First Name</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Last Name</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Number</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Payment Date</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Amount</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Payment Mode</th>`);

// Replace table cells
code = code.replace(/<td style={{ padding: '1rem', color: 'var\(--text-primary\)', fontWeight: '600' }}>{l\.company_name \|\| '-'\}<\/td>[\s\S]*?<td style={{ padding: '1rem', color: 'var\(--text-primary\)' }}>{l\.incorporation_date \|\| '-'\}<\/td>/g, 
`<td style={{ padding: '1rem', color: 'var(--text-primary)', fontWeight: '600' }}>{l.first_name || '-'}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{l.last_name || '-'}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{l.number || '-'}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{l.payment_date || '-'}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{l.amount || '-'}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{l.payment_mode || '-'}</td>`);

// Replace Current Lead Card details
code = code.replace(/<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>[\s\S]*?<\/div>\s*<\/div>\s*<div style={{ padding: '1\.5rem/g, 
`<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div><p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>First Name</p><p style={{ margin: '0.25rem 0 0 0', fontWeight: '600' }}>{currentLead.first_name || '-'}</p></div>
                <div><p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Last Name</p><p style={{ margin: '0.25rem 0 0 0', fontWeight: '600' }}>{currentLead.last_name || '-'}</p></div>
                <div><p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Number</p><p style={{ margin: '0.25rem 0 0 0', fontWeight: '600' }}>{currentLead.number || '-'}</p></div>
                <div><p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Payment Date</p><p style={{ margin: '0.25rem 0 0 0', fontWeight: '600' }}>{currentLead.payment_date || '-'}</p></div>
                <div><p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Amount</p><p style={{ margin: '0.25rem 0 0 0', fontWeight: '600' }}>{currentLead.amount || '-'}</p></div>
                <div><p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Payment Mode</p><p style={{ margin: '0.25rem 0 0 0', fontWeight: '600' }}>{currentLead.payment_mode || '-'}</p></div>
              </div>
            </div>
            <div style={{ padding: '1.5rem`);

fs.writeFileSync('src/pages/LoanRawLeads.jsx', code, 'utf8');
console.log('Transform complete');
