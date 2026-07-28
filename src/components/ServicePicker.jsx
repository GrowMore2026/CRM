import React, { useState } from 'react';
import { Search } from 'lucide-react';

export const ALL_SERVICES = ['Private Limited Company', 'One Person Company', 'LLP Registration', 'Section 8 / NGO', 'Partnership Firm', 'ISO Certification', 'FSSAI License', 'IEC / Import-Export', 'GeM Registration', 'Udyam Registration', 'Startup India', 'PMEGP Loan', 'CGTMSE Loan', 'Mudra Loan', 'Stand-Up India', 'Startup India Seed Fund', 'Working Capital Loans', 'Term Loans', 'Grants', 'Loan', 'Venture Capital', 'Invoice Financing', 'NBFC Tie-ups', 'Website Development', 'SEO & Digital Marketing', 'CRM Solutions', 'Social Media', 'Logo & Branding', 'ROC Compliance', 'GST Filing', 'Income Tax Returns', 'Annual Filings', 'Audit Support', 'Trademark Registration', 'Patent Filing', 'Copyright Protection', 'Shram Suvidha', 'Legal Compliance', 'Other'];

const ServicePicker = ({ value = [], onChange, compact = false }) => {
  const [search, setSearch] = useState('');

  const filtered = ALL_SERVICES.filter(s => s.toLowerCase().includes(search.toLowerCase()));

  const handleToggle = (service) => {
    if (value.includes(service)) {
      onChange(value.filter(s => s !== service));
    } else {
      onChange([...value, service]);
    }
  };

  return (
    <div>
      <div style={{ position: 'relative', marginBottom: '1rem' }}>
        <input 
          type="text" 
          className="form-control" 
          placeholder="Search services..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          style={{ paddingLeft: '2.5rem' }} 
        />
        <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', maxHeight: '250px', overflowY: 'auto', padding: '0.5rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
        {filtered.map(s => (
          <label key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
            <input 
              type="checkbox" 
              checked={value.includes(s)} 
              onChange={() => handleToggle(s)} 
              style={{ accentColor: 'var(--accent-primary)', width: '1.2rem', height: '1.2rem' }} 
            />
            {s}
          </label>
        ))}
      </div>
    </div>
  );
};

export default ServicePicker;
