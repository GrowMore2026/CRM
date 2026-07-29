import React, { useRef, useState } from 'react';
import { useApp } from '../context/AppProvider';
import { Upload, FileText, Search } from 'lucide-react';

const RawLeads = () => {
  const { currentUser, rawLeads, addRawLeads } = useApp();
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQ, setSearchQ] = useState('');

  const canUpload = currentUser?.role === 'superadmin' || currentUser?.role === 'digital_marketing';

  const parseCSV = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        // Simple CSV parser ignoring quotes handling for simplicity,
        // but let's handle basic quoted commas
        const lines = text.split('\n').filter(l => l.trim() !== '');
        if (lines.length < 2) return resolve([]);
        
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
          // split by comma not inside quotes
          const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
          let row = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          data.push(row);
        }
        resolve(data);
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const parsedData = await parseCSV(file);
      const leadsToInsert = [];

      for (const row of parsedData) {
        // Map columns to the exact 6 fields the user requested
        // "Company name, Director Name, Phone Number, Email Address, incorporation date, state"
        const rowKeys = Object.keys(row);
        
        const companyKey = rowKeys.find(k => k.includes('company'));
        const directorKey = rowKeys.find(k => k.includes('director') || k.includes('name'));
        const phoneKey = rowKeys.find(k => k.includes('phone') || k.includes('mobile'));
        const emailKey = rowKeys.find(k => k.includes('email'));
        const incDateKey = rowKeys.find(k => k.includes('incorporation') || k.includes('date'));
        const stateKey = rowKeys.find(k => k === 'state' || k.includes('state'));

        const company_name = companyKey ? row[companyKey] : '';
        const director_name = directorKey ? row[directorKey] : '';
        const phone = phoneKey ? row[phoneKey] : '';
        const email = emailKey ? row[emailKey] : '';
        const incorporation_date = incDateKey ? row[incDateKey] : '';
        const state = stateKey ? row[stateKey] : '';

        // Only insert if at least one meaningful field exists
        if (company_name || director_name || phone || email) {
          leadsToInsert.push({
            company_name,
            director_name,
            phone,
            email,
            incorporation_date,
            state
          });
        }
      }

      if (leadsToInsert.length > 0) {
        await addRawLeads(leadsToInsert);
        alert(`Successfully uploaded ${leadsToInsert.length} raw leads!`);
      } else {
        alert("No valid leads found in the CSV.");
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading CSV: " + err.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const filteredLeads = (rawLeads || []).filter(lead => {
    const q = searchQ.toLowerCase();
    return (
      (lead.company_name || '').toLowerCase().includes(q) ||
      (lead.director_name || '').toLowerCase().includes(q) ||
      (lead.phone || '').toLowerCase().includes(q) ||
      (lead.email || '').toLowerCase().includes(q) ||
      (lead.state || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FileText size={28} color="var(--accent-primary)" />
            Raw Leads
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>View and manage unassigned raw leads across the organization.</p>
        </div>

        {canUpload && (
          <div>
            <input 
              type="file" 
              accept=".csv" 
              style={{ display: 'none' }} 
              ref={fileInputRef} 
              onChange={handleFileChange} 
            />
            <button 
              onClick={handleUploadClick}
              disabled={isUploading}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--accent-primary)', color: 'white', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '8px', fontWeight: '600', cursor: isUploading ? 'not-allowed' : 'pointer', transition: '0.2s', opacity: isUploading ? 0.7 : 1 }}
              onMouseEnter={e => { if(!isUploading) e.currentTarget.style.filter = 'brightness(1.1)'; }}
              onMouseLeave={e => { if(!isUploading) e.currentTarget.style.filter = 'brightness(1)'; }}
            >
              <Upload size={18} />
              {isUploading ? 'Uploading...' : 'Upload CSV'}
            </button>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '1rem', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-primary)', padding: '0.75rem 1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <Search size={20} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search raw leads by company, name, phone, email or state..."
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, color: 'var(--text-primary)', fontSize: '0.95rem' }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '1rem', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: 'var(--bg-tertiary)', borderBottom: '2px solid var(--border-color)' }}>
              <tr>
                <th style={{ padding: '1rem 1.2rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Company Name</th>
                <th style={{ padding: '1rem 1.2rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Director Name</th>
                <th style={{ padding: '1rem 1.2rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone Number</th>
                <th style={{ padding: '1rem 1.2rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</th>
                <th style={{ padding: '1rem 1.2rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Inc. Date</th>
                <th style={{ padding: '1rem 1.2rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>State</th>
                <th style={{ padding: '1rem 1.2rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date Added</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No raw leads found. {canUpload ? 'Upload a CSV to get started.' : ''}
                  </td>
                </tr>
              ) : (
                filteredLeads.map(lead => (
                  <tr key={lead.id} style={{ borderBottom: '1px solid var(--border-color)', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '1rem 1.2rem', color: 'var(--text-primary)', fontWeight: '600' }}>{lead.company_name || '-'}</td>
                    <td style={{ padding: '1rem 1.2rem', color: 'var(--text-secondary)' }}>{lead.director_name || '-'}</td>
                    <td style={{ padding: '1rem 1.2rem', color: 'var(--text-secondary)' }}>{lead.phone || '-'}</td>
                    <td style={{ padding: '1rem 1.2rem', color: 'var(--text-secondary)' }}>{lead.email || '-'}</td>
                    <td style={{ padding: '1rem 1.2rem', color: 'var(--text-secondary)' }}>{lead.incorporation_date || '-'}</td>
                    <td style={{ padding: '1rem 1.2rem', color: 'var(--text-secondary)' }}>
                      {lead.state ? (
                        <span style={{ padding: '0.2rem 0.6rem', background: 'var(--bg-tertiary)', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600', border: '1px solid var(--border-color)' }}>
                          {lead.state}
                        </span>
                      ) : '-'}
                    </td>
                    <td style={{ padding: '1rem 1.2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RawLeads;
